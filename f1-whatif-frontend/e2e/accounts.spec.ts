import { Page, Route, expect, test } from '@playwright/test';
import { json, mockBackend } from './mock-backend';

const EMAIL = 'asad@example.com';
const PASSWORD = 'secret-password';
const TOKEN = 'test-token';

interface StoredScenario {
  id: number;
  name: string;
  seasonYear: number;
  rulesetCode: string;
  includeSprints: boolean;
  countBest: number | null;
  excludedDriverIds: number[];
  excludedRounds: number[];
  publicId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * A made-up backend for accounts and scenarios that remembers what the test saved.
 * Pages that are given the same list see the same scenarios, like two visitors of one server.
 */
async function mockAccounts(page: Page, scenarios: StoredScenario[]) {
  let nextId = scenarios.length + 1;
  const authorized = (route: Route) =>
    route.request().headers()['authorization'] === `Bearer ${TOKEN}`;
  const unauthorized = (route: Route) => json(route, {}, 401);
  const now = () => new Date().toISOString();

  await page.route('**/api/auth/login', (route) => {
    const body = route.request().postDataJSON() as { email: string; password: string };
    return body.email === EMAIL && body.password === PASSWORD
      ? json(route, { accessToken: TOKEN, tokenType: 'Bearer', expiresInSeconds: 3600 })
      : json(route, {}, 401);
  });
  await page.route('**/api/auth/register', (route) => {
    const body = route.request().postDataJSON() as { email: string };
    return body.email === 'taken@example.com'
      ? json(route, {}, 409)
      : json(route, { id: 2, email: body.email, role: 'USER' }, 201);
  });
  await page.route('**/api/auth/me', (route) =>
    authorized(route) ? json(route, { id: 1, email: EMAIL, role: 'USER' }) : unauthorized(route),
  );

  await page.route('**/api/scenarios', (route) => {
    if (!authorized(route)) {
      return unauthorized(route);
    }
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as Omit<
        StoredScenario,
        'id' | 'publicId' | 'createdAt' | 'updatedAt'
      >;
      const created: StoredScenario = {
        ...body,
        id: nextId++,
        publicId: null,
        createdAt: now(),
        updatedAt: now(),
      };
      scenarios.unshift(created);
      return json(route, created, 201);
    }
    return json(route, scenarios);
  });
  await page.route('**/api/scenarios/*', (route) => {
    if (!authorized(route)) {
      return unauthorized(route);
    }
    const id = Number(route.request().url().split('/').pop());
    const index = scenarios.findIndex((scenario) => scenario.id === id);
    if (route.request().method() === 'DELETE') {
      scenarios.splice(index, 1);
      return route.fulfill({ status: 204 });
    }
    const body = route.request().postDataJSON() as Partial<StoredScenario>;
    scenarios[index] = { ...scenarios[index], ...body, updatedAt: now() };
    return json(route, scenarios[index]);
  });
  await page.route('**/api/scenarios/*/share', (route) => {
    if (!authorized(route)) {
      return unauthorized(route);
    }
    const id = Number(route.request().url().split('/').slice(-2)[0]);
    const scenario = scenarios.find((item) => item.id === id)!;
    scenario.publicId = route.request().method() === 'POST' ? 'public-id-1' : null;
    return json(route, scenario);
  });

  await page.route('**/api/shared/*/standings', (route) =>
    json(route, {
      season: 1984,
      ruleset: 'classic-1961',
      standings: [
        {
          rank: 1,
          driverId: 1,
          driver: 'Niki Lauda',
          points: 72,
          actualRank: 1,
          positionChange: 0,
        },
      ],
    }),
  );
  await page.route('**/api/shared/*', (route) => {
    const shared = scenarios.find(
      (item) => item.publicId === route.request().url().split('/').pop(),
    );
    return shared ? json(route, shared) : json(route, {}, 404);
  });
}

async function logIn(page: Page) {
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
}

test.describe('accounts and scenarios', () => {
  let scenarios: StoredScenario[];

  test.beforeEach(async ({ page }) => {
    scenarios = [];
    await mockBackend(page);
    await mockAccounts(page, scenarios);
  });

  test('rejects a wrong password and accepts the right one', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill(EMAIL);
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('alert')).toContainText('Invalid email or password.');

    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL(/\/explorer$/);
    await expect(page.getByTestId('user-email')).toHaveText(EMAIL);
  });

  test('validates the form before sending it', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('Email').fill('not-an-email');
    await page.getByLabel('Password').fill('short');
    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(page.getByText('Enter a valid email address.')).toBeVisible();
    await expect(page.getByText('Use 8 to 72 characters.')).toBeVisible();
  });

  test('explains an email address that is already registered', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('Email').fill('taken@example.com');
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(page.getByRole('alert')).toContainText('already registered');
  });

  test('sends a visitor to the login page and back to the page they wanted', async ({ page }) => {
    await page.goto('/scenarios');

    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fscenarios$/);
    await logIn(page);

    await expect(page).toHaveURL(/\/scenarios$/);
    await expect(page.getByRole('heading', { name: 'My scenarios' })).toBeVisible();
  });

  test('stays logged in after a reload and logs out on request', async ({ page }) => {
    await page.goto('/login');
    await logIn(page);
    await expect(page.getByTestId('user-email')).toBeVisible();

    await page.reload();
    await expect(page.getByTestId('user-email')).toHaveText(EMAIL);

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(
      page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Log in' }),
    ).toBeVisible();
    await page.goto('/scenarios');
    await expect(page).toHaveURL(/\/login/);
  });

  test('saves a scenario from the explorer, finds it in the list and opens it again', async ({
    page,
  }) => {
    await page.goto('/login');
    await logIn(page);
    await page.getByRole('checkbox', { name: /Ayrton Senna/ }).check();
    await expect(page.getByRole('table')).not.toContainText('Ayrton Senna');

    await page.getByRole('button', { name: 'Save scenario…' }).click();
    await page.getByLabel('Name').fill('Without Senna');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Saved.');

    await page.getByRole('link', { name: 'My scenarios' }).click();
    await expect(page.getByRole('heading', { name: 'Without Senna' })).toBeVisible();
    await expect(page.getByText('1 exclusion')).toBeVisible();

    await page.getByRole('button', { name: 'Open', exact: true }).click();
    await expect(page).toHaveURL(/\/explorer$/);
    await expect(page.getByText('Scenario:')).toContainText('Without Senna');
    await expect(page.getByRole('checkbox', { name: /Ayrton Senna/ })).toBeChecked();
  });

  test('shares a scenario with a link that works without logging in, and stops sharing again', async ({
    page,
    browser,
  }) => {
    await page.goto('/login');
    await logIn(page);
    await page.getByRole('button', { name: 'Save scenario…' }).click();
    await page.getByLabel('Name').fill('Shared one');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('link', { name: 'My scenarios' }).click();

    await page.getByRole('button', { name: 'Share', exact: true }).click();
    const link = await page.getByRole('textbox', { name: 'Link' }).inputValue();
    expect(link).toContain('/shared/public-id-1');

    const visitorContext = await browser.newContext();
    const visitor = await visitorContext.newPage();
    await mockBackend(visitor);
    await mockAccounts(visitor, scenarios);
    await visitor.goto(link);
    await expect(visitor.getByRole('heading', { name: 'Shared one' })).toBeVisible();
    await expect(visitor.getByRole('table')).toContainText('Niki Lauda');
    await expect(visitor.getByRole('link', { name: 'Log in' })).toBeVisible();
    await visitorContext.close();

    await page.getByRole('button', { name: 'Stop sharing' }).click();
    await expect(page.getByRole('textbox', { name: 'Link' })).toHaveCount(0);
  });

  test('deletes a scenario after confirmation', async ({ page }) => {
    await page.goto('/login');
    await logIn(page);
    await page.getByRole('button', { name: 'Save scenario…' }).click();
    await page.getByLabel('Name').fill('Temporary');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('link', { name: 'My scenarios' }).click();

    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('button', { name: 'Delete for good' }).click();

    await expect(page.getByText('You have not saved any scenarios yet.')).toBeVisible();
  });

  test('asks the user to log in again when the session has run out', async ({ page }) => {
    await page.goto('/login');
    await logIn(page);
    await page.getByRole('link', { name: 'My scenarios' }).click();
    await expect(page.getByRole('heading', { name: 'My scenarios' })).toBeVisible();

    await page.route('**/api/scenarios', (route) => json(route, {}, 401));
    await page.getByRole('link', { name: 'Explorer', exact: true }).click();
    await page.getByRole('link', { name: 'My scenarios' }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('status')).toContainText('session has expired');
  });
});
