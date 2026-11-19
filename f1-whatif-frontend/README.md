# F1 What-If: frontend

Angular 22 (standalone, zoneless, signals), NgRx (Store + Effects), RxJS, Tailwind CSS 4,
Vitest for unit tests and Playwright for end-to-end tests.

## Run it
Requires Node.js 22.12 or newer.

```
npm install
npm start
```

The app is served at http://localhost:4200. It expects the Spring Boot backend on
http://localhost:8080; the dev server forwards every `/api` request there (`proxy.conf.json`),
so no CORS setup is needed.

## Test
```
npm test                 # unit tests (Vitest)
npm run e2e:install      # once: downloads the Playwright browser
npm run e2e              # end-to-end tests; the backend is mocked, so only the frontend runs
```

## Structure
- `src/app/core/`: API clients, response models, error messages, the auth interceptor and guard, token storage
- `src/app/state/reference/`: seasons, points systems, and races and drivers per season (loaded once, then cached)
- `src/app/state/explorer/`: the user's selection and the calculated standings
- `src/app/state/driver/`: results and photos of the driver pages (cached per driver and season)
- `src/app/state/auth/`: login state, effects (login, sign up, restoring and ending a session)
- `src/app/state/scenarios/`: saved scenarios, saving, sharing, and shared views
- `src/app/features/explorer/`: the explorer page, settings panel and standings table
- `src/app/features/driver/`: the driver page (`/seasons/:year/drivers/:driverId`)
- `src/app/features/auth/`: login and sign up page
- `src/app/features/scenarios/`: "My scenarios" (needs a login)
- `src/app/features/shared/`: the public page behind a share link (`/shared/:publicId`)
- `e2e/`: Playwright tests

## How the explorer works
Every change to the selection dispatches an action. An effect waits 250 ms for further
changes, then asks the backend for standings; a newer request cancels an older one, so a slow
response can never replace a newer result. Races are chosen by round number; the standings
endpoint wants database ids, so a selector translates rounds into ids.

## Text size
All sizes scale with the root font size set in `src/styles.css` (`html { font-size: 112.5% }`,
where 100% is the browser default). Change that one number to make everything larger or smaller.

## Driver page
Clicking a driver in the standings opens `/seasons/:year/drivers/:driverId`: season totals and
how the driver finished every race. The photo is requested separately, so the results never wait
for it; without one the page shows the driver's initials.

## Accounts and scenarios
- **Login:** the backend returns a token that lives for an hour. It is kept in `localStorage`, so a
  reload does not log the user out, and it is sent as `Authorization: Bearer ...` only on calls that
  need it (`/api/auth/me` and `/api/scenarios/**`). Public calls never carry it, because the backend
  rejects an expired token even on public endpoints.
- **Expired sessions:** a 401 on one of those calls ends the session. On "My scenarios" the user
  is sent to the login page with a notice; on public pages nothing changes.
- **Saving:** the explorer's "Save scenario" stores the season, points system, options and
  exclusions. Races are saved as round numbers. A scenario opened from the list can be updated or
  saved as a copy.
- **Sharing:** "Share" on the scenarios page creates a link (`/shared/<id>`) that works without an
  account; "Stop sharing" disables it. "Open in the explorer" on a shared page copies the settings
  into the explorer, where saving them needs the visitor's own account.
- **Trade-off:** a token in `localStorage` can be read by script injected into the page, so the
  app avoids rendering untrusted HTML, and tokens are short-lived. A cookie-based login would avoid
  that but needs a cross-site cookie setup between the frontend and the API.
