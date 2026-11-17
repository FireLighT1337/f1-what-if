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
- `src/app/core/`: API client, response models, error messages
- `src/app/state/reference/`: seasons, points systems, and races and drivers per season (loaded once, then cached)
- `src/app/state/explorer/`: the user's selection and the calculated standings
- `src/app/features/explorer/`: the explorer page, settings panel and standings table
- `e2e/`: Playwright tests

## How the explorer works
Every change to the selection dispatches an action. An effect waits 250 ms for further
changes, then asks the backend for standings; a newer request cancels an older one, so a slow
response can never replace a newer result. Races are chosen by round number; the standings
endpoint wants database ids, so a selector translates rounds into ids.
