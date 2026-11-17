import { Page, Route, expect, test } from '@playwright/test';

/** A small made-up backend: two seasons, three drivers and two races. */
const seasons = [
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

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockBackend(page: Page) {
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
}

test.describe('explorer', () => {
  test('shows the standings for the default selection', async ({ page }) => {
    await mockBackend(page);

    await page.goto('/');

    await expect(page.getByRole('heading', { name: '1984 standings' })).toBeVisible();
    const rows = page.getByRole('table').getByRole('row');
    await expect(rows).toHaveCount(4); // header + three drivers
    await expect(rows.nth(1)).toContainText('Niki Lauda');
    await expect(rows.nth(1)).toContainText('72');
  });

  test('recalculates the standings when a driver is excluded', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/');
    await expect(page.getByRole('table')).toBeVisible();

    const request = page.waitForRequest((r) => r.url().includes('excludeDrivers=2'));
    await page.getByRole('checkbox', { name: /Alain Prost/ }).check();
    await request;

    const table = page.getByRole('table');
    await expect(table).not.toContainText('Alain Prost');
    await expect(table.getByRole('row')).toHaveCount(3); // header + two drivers
  });

  test('sends an excluded race as its id and marks shortened races', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/');
    await expect(page.getByText('Shortened')).toBeVisible();

    const request = page.waitForRequest((r) => r.url().includes('excludeRaces=66'));
    await page.getByRole('checkbox', { name: /Round 6/ }).check();
    await request;
  });

  test('clears the exclusions again', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/');
    await page.getByRole('checkbox', { name: /Alain Prost/ }).check();
    await expect(page.getByRole('table')).not.toContainText('Alain Prost');

    await page.getByRole('button', { name: 'Clear exclusions' }).click();

    await expect(page.getByRole('table')).toContainText('Alain Prost');
    await expect(page.getByRole('checkbox', { name: /Alain Prost/ })).not.toBeChecked();
  });

  test('offers a retry when the lists cannot be loaded', async ({ page }) => {
    let failing = true;
    await mockBackend(page);
    await page.route('**/api/seasons', (route) => (failing ? json(route, {}, 500) : json(route, seasons)));

    await page.goto('/');
    await expect(page.getByRole('alert')).toContainText('Something went wrong');

    failing = false;
    await page.getByRole('button', { name: 'Retry' }).click();

    await expect(page.getByRole('heading', { name: '1984 standings' })).toBeVisible();
  });
});
