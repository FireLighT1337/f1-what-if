# F1 What-If: backend

Spring Boot 4.1 on Java 25 (Maven, package `com.f1whatif`). It serves the reference data, re-scores seasons under a chosen points system, and handles accounts, saved scenarios and sharing. The frontend lives in `../f1-whatif-frontend`.

## Run it

Requirements: Java 25 and a local MySQL. No Docker needed.

```
mysql -u root -p < scripts/local-db-setup.sql    # once: creates database f1whatif and user f1
.\mvnw.cmd spring-boot:run                       # Windows; use ./mvnw on macOS / Linux
```

The API runs on http://localhost:8080. Flyway creates the tables on the first start. Interactive API docs (Springdoc) are at `/swagger-ui.html`, and the health probes at `/actuator/health`.

## Import data

The database starts empty. The importer reads from the [Jolpica F1 API](https://github.com/jolpica/jolpica-f1) and only runs with the `import` profile. It starts its web server on a random port, so it can run while the API is up. PowerShell example:

```
$env:SPRING_PROFILES_ACTIVE = "import"
$env:APP_IMPORT_FROM = "2018"
$env:APP_IMPORT_TO = "2024"
$env:APP_IMPORT_SKIP_EXISTING = "true"
.\mvnw spring-boot:run
```

| Setting                             | Meaning                                                    | Default          |
| ----------------------------------- | ---------------------------------------------------------- | ---------------- |
| `app.import.from` / `app.import.to` | Season range                                               | 1961 / this year |
| `app.import.skip-existing`          | Skip seasons already stored, so a stopped run can continue | `false`          |
| `app.import.delay-ms`               | Pause between requests                                     | 1000             |
| `app.import.max-requests-per-hour`  | Stay under the source's hourly limit                       | 450              |

## Test

```
.\mvnw test
```

The tests need no database. The scoring engine is tested as plain Java (countback, `countBest`, exclusions, shortened races, rank ties). Services, the importer and the aspects are covered separately.

## Structure

| Package                | Content                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scoring`              | The scoring engine in plain Java, no Spring: `StandingsCalculator`, policies (`NONE`, `HALF_1980`, `TIERED_2022`), per-round and per-driver breakdowns |
| `service`              | Standings, driver season and scenario results, reference data, scenarios, auth, driver photos                                                          |
| `web`                  | REST controllers                                                                                                                                       |
| `dto`                  | Request and response records                                                                                                                           |
| `entity`, `repository` | JPA entities and Spring Data repositories, plus query repositories for reads                                                                           |
| `importer`             | Import from Jolpica: client, request budget, merging of sprint and race data                                                                           |
| `aspect`               | Rate limiting (`@RateLimited`) and request timing                                                                                                      |
| `config`               | Security, JWT, caches, OpenAPI                                                                                                                         |

Migrations are in `src/main/resources/db/migration` (`V1` schema, `V2`–`V3` rulesets, `V4` shortened races, `V5` users and scenarios, `V6` driver Wikipedia URL, `V7` username instead of email). Flyway owns the schema; Hibernate only validates it.

## API

| Area      | Endpoints                                                                                                                                                                                                 |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reference | `GET /api/seasons`, `/api/seasons/{year}/races`, `/api/seasons/{year}/drivers`, `/api/rulesets`, `/api/rulesets/{code}`                                                                                   |
| Standings | `GET /api/seasons/{year}/standings?ruleset=&includeSprints=&countBest=&excludeDrivers=&excludeRaces=`                                                                                                     |
| Drivers   | `GET /api/seasons/{year}/drivers/{id}/results`, `GET /api/seasons/{year}/drivers/{id}/scenario-results?ruleset=&includeSprints=&countBest=&excludeDrivers=&excludeRounds=`, `GET /api/drivers/{id}/photo` |
| Accounts  | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (token required)                                                                                                                    |
| Scenarios | `/api/scenarios` (token required): create, list, `GET`, `PUT`, `DELETE /{id}`, `GET /{id}/standings`, `POST` and `DELETE /{id}/share`                                                                     |
| Shared    | `GET /api/shared/{publicId}` and `/standings`, no account needed                                                                                                                                          |

Notes:

- The standings endpoint selects races by database id (`excludeRaces`); the driver scenario endpoint and saved scenarios use round numbers (`excludeRounds`), so they survive a re-import.
- `scenario-results` answers 409 for an excluded driver, 404 for an unknown ruleset and 400 for an invalid `countBest`.
- Standings, rulesets and reference data are cached (Caffeine, up to 500 entries, one hour).

## Accounts and security

- Sign up with a username (3–30 characters: letters, digits, `.`, `_`, `-`; stored trimmed and lowercase) and a password of 8–72 characters. There is no email, so no password recovery.
- Login returns a JWT (HS256) valid for 60 minutes, with no refresh. Passwords are hashed with BCrypt.
- An expired token is rejected even on public endpoints, so clients should only send it where it is needed.

## Rate limiting

`@RateLimited` limits calls per visitor address in fixed windows: login 10 per minute, sign up 5 per hour. Over the limit gives `429` with a `Retry-After` header. Counters are in memory, so run a single instance; they reset on restart. Addresses are never logged.

| Variable                             | Meaning                                                                   | Default |
| ------------------------------------ | ------------------------------------------------------------------------- | ------- |
| `APP_RATE_LIMIT_ENABLED`             | Turn the limit on or off                                                  | `true`  |
| `APP_RATE_LIMIT_TRUST_FORWARDED_FOR` | Read the visitor's address from `X-Forwarded-For` (needed behind a proxy) | `false` |
| `APP_RATE_LIMIT_PROXIES_TO_SKIP`     | Entries to skip at the end of that header                                 | `0`     |

Production on Northflank behind the Vercel rewrite: `TRUST_FORWARDED_FOR=true`, `PROXIES_TO_SKIP=0`. Check it with 12 wrong logins in a row: 401 for attempts 1 to 10, then 429.

## Configuration

| Variable                           | Purpose                                                                                | Default                 |
| ---------------------------------- | -------------------------------------------------------------------------------------- | ----------------------- |
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | Database connection                                                                    | local MySQL, user `f1`  |
| `JWT_SECRET`                       | Signing key. The `prod` profile has no default and the app refuses to start without it | dev-only value          |
| `CORS_ALLOWED_ORIGINS`             | Allowed browser origins                                                                | `http://localhost:4200` |
| `WIKIMEDIA_CONTACT`                | Contact sent to Wikimedia with photo requests (URL or email)                           | the GitHub profile URL  |
| `PORT`                             | HTTP port                                                                              | `8080`                  |
| `SPRING_PROFILES_ACTIVE`           | `prod` in the Docker image                                                             | none                    |

## Docker and deployment

The `Dockerfile` builds the jar in one stage and runs a layered image as a non-root user, with JVM settings for a small container (`MaxRAMPercentage=70`, `UseSerialGC`, `TieredStopAtLevel=1`, `-Xss512k`). `SPRING_PROFILES_ACTIVE=prod` is set in the image.

Production runs on Northflank with a TiDB Cloud Starter database. Deploy the backend before the frontend: Flyway runs new migrations on startup and request fields can change between versions.
