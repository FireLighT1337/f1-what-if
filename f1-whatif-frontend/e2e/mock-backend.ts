import { Page, Route } from '@playwright/test';

/** A small made-up backend: two seasons, three drivers and two races. */
export const seasons = [
  { year: 1984, raceCount: 2, sprintRaceCount: 0 },
  { year: 1983, raceCount: 2, sprintRaceCount: 0 },
];

const rulesets = [
  { code: 'current-2025', name: 'Current (2025 onwards)', description: '25-18-15-12-10-8-6-4-2-1' },
  { code: 'classic-1961', name: '1961-1990', description: '9-6-4-3-2-1' },
];

const races = [
  race(61, 1, 'Brazilian Grand Prix', false),
  race(66, 6, 'Monaco Grand Prix', true),
];

const drivers = [
  { id: 1, code: 'LAU', name: 'Niki Lauda', nationality: 'Austrian', teams: ['McLaren'] },
  { id: 2, code: 'PRO', name: 'Alain Prost', nationality: 'French', teams: ['McLaren'] },
  { id: 3, code: 'SEN', name: 'Ayrton Senna', nationality: 'Brazilian', teams: ['Toleman'] },
];


const driverSeason = {
  driver: {
    id: 1,
    name: 'Niki Lauda',
    code: 'LAU',
    nationality: 'Austrian',
    dateOfBirth: '1949-02-22',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Niki_Lauda',
  },
  season: 1984,
  summary: { racesEntered: 2, wins: 1, podiums: 1, points: 9 },
  races: [
    {
      round: 1, raceName: 'Brazilian Grand Prix', date: '1984-03-25', shortened: false, entered: true, team: 'McLaren',
      grid: 2, finishPosition: 1, positionText: '1', status: 'Finished', points: 9, sprint: null,
    },
    {
      round: 2, raceName: 'South African Grand Prix', date: '1984-04-07', shortened: false, entered: false, team: null,
      grid: null, finishPosition: null, positionText: null, status: null, points: null, sprint: null,
    },
    {
      round: 6, raceName: 'Monaco Grand Prix', date: '1984-06-03', shortened: true, entered: true, team: 'McLaren',
      grid: 1, finishPosition: null, positionText: 'R', status: 'Spun off', points: 0, sprint: null,
    },
  ],
};

const driverPhoto = {
  photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Niki_Lauda.jpg/320px-Niki_Lauda.jpg',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:Niki_Lauda.jpg',
  articleUrl: 'https://en.wikipedia.org/wiki/Niki_Lauda',
  width: 320,
  height: 427,
};

function race(id: number, round: number, name: string, shortened: boolean) {
  return {
    id,
    round,
    name,
    date: '1984-01-01',
    circuit: 'Circuit',
    locality: 'Town',
    country: 'Country',
    hasSprint: false,
    shortened,
    shortenedNote: shortened ? 'Half points' : null,
  };
}

function row(rank: number, driverId: number, driver: string, points: number, positionChange: number) {
  return { rank, driverId, driver, points, actualRank: rank, positionChange };
}

function standingsFor(excludedDrivers: string | null) {
  const everyone = [row(1, 1, 'Niki Lauda', 72, 0), row(2, 2, 'Alain Prost', 71.5, 0), row(3, 3, 'Ayrton Senna', 13, 0)];
  const excluded = (excludedDrivers ?? '').split(',').filter(Boolean).map(Number);
  const remaining = everyone.filter((entry) => !excluded.includes(entry.driverId));
  return { season: 1984, ruleset: 'current-2025', standings: remaining.map((entry, index) => ({ ...entry, rank: index + 1 })) };
}

export function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

export async function mockBackend(page: Page) {
  await page.route('**/api/seasons', (route) => json(route, seasons));
  await page.route('**/api/rulesets', (route) => json(route, rulesets));
  await page.route('**/api/rulesets/*', (route) => {
    const code = route.request().url().split('/').pop()!;
    return json(route, {
      code,
      name: code,
      description: '',
      racePoints: { '1': 25, '2': 18, '3': 15 },
      sprintPoints: {},
      fastestLapPoint: 0,
      fastestLapRequiresTopTen: false,
      shortenedPolicy: 'NONE',
    });
  });
  await page.route('**/api/seasons/*/races', (route) => json(route, races));
  await page.route('**/api/seasons/*/drivers', (route) => json(route, drivers));
  await page.route(/\/api\/seasons\/\d+\/standings/, (route) => {
    const url = new URL(route.request().url());
    return json(route, standingsFor(url.searchParams.get('excludeDrivers')));
  });
  await page.route('**/api/seasons/*/drivers/*/results', (route) => json(route, driverSeason));
  await page.route('**/api/drivers/*/photo', (route) => json(route, driverPhoto));
  // The photo itself comes from Wikimedia; answer with a tiny picture so the tests never leave the machine.
  await page.route('https://upload.wikimedia.org/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="gray"/></svg>',
    }),
  );
}
