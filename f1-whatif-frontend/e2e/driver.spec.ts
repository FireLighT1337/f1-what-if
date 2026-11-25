import { expect, test } from '@playwright/test';
import { mockBackend } from './mock-backend';

test.describe('driver page', () => {
  test('opens from the standings and shows the season race by race', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/');

    await page.getByRole('link', { name: 'Niki Lauda' }).click();

    // The link carries the explorer's settings, so the page opens under that scenario; this test is about the real results.
    await expect(page).toHaveURL(/\/seasons\/1984\/drivers\/1(\?|$)/);
    await expect(page.getByRole('heading', { level: 1, name: 'Niki Lauda' })).toBeVisible();
    await page.getByRole('button', { name: 'Real results' }).click();
    const rows = page.getByRole('table').getByRole('row');
    await expect(rows).toHaveCount(4); // header + three races
    await expect(rows.nth(1)).toContainText('Brazilian Grand Prix');
    await expect(rows.nth(2)).toContainText('Did not take part');
    await expect(rows.nth(3)).toContainText('Ret');
    await expect(rows.nth(3)).toContainText('Shortened');
  });

  test('shows the photo with its credit', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/seasons/1984/drivers/1');

    await expect(page.getByRole('img', { name: 'Photo of Niki Lauda' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Photo: Wikimedia Commons' })).toHaveAttribute(
      'href',
      'https://commons.wikimedia.org/wiki/File:Niki_Lauda.jpg',
    );
  });

  test('shows initials when the driver has no photo', async ({ page }) => {
    await mockBackend(page);
    await page.route('**/api/drivers/*/photo', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ photoUrl: null, sourceUrl: null, articleUrl: null, width: null, height: null }),
      }),
    );
    await page.goto('/seasons/1984/drivers/1');

    await expect(page.getByRole('heading', { level: 1, name: 'Niki Lauda' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Photo of Niki Lauda' })).toHaveCount(0);
    await expect(page.getByText('NL')).toBeVisible();
  });

  test('goes back to the standings with the same selection', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/');
    await page.getByRole('checkbox', { name: /Ayrton Senna/ }).check();
    await expect(page.getByRole('table')).not.toContainText('Ayrton Senna');

    await page.getByRole('link', { name: 'Niki Lauda' }).click();
    await page.getByRole('link', { name: /Back to standings/ }).click();

    await expect(page.getByRole('heading', { name: '1984 standings' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /Ayrton Senna/ })).toBeChecked();
  });

  test('explains when the driver did not race in that season', async ({ page }) => {
    await mockBackend(page);
    await page.route('**/api/seasons/*/drivers/*/results', (route) => route.fulfill({ status: 404, body: '{}' }));
    await page.goto('/seasons/1984/drivers/99');

    await expect(page.getByRole('alert')).toContainText('did not take part in that season');
  });

  test('shows the driver under the scenario that was selected in the explorer', async ({ page }) => {
    await mockBackend(page);
    const scenarioRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/scenario-results')) {
        scenarioRequests.push(request.url());
      }
    });
    await page.goto('/');
    await page.getByRole('checkbox', { name: /Round 6/ }).check();

    await page.getByRole('link', { name: 'Niki Lauda' }).click();

    await expect(page).toHaveURL(/\/seasons\/1984\/drivers\/1\?.*excludeRounds=6/);
    await expect(page.getByTestId('scenario-banner')).toContainText('1 exclusion');
    const rows = page.getByTestId('scenario-table').getByRole('row');
    await expect(rows).toHaveCount(4); // header + three races
    await expect(rows.nth(3)).toContainText('Excluded');
    expect(scenarioRequests.some((url) => url.includes('excludeRounds=6'))).toBe(true);

    await page.getByRole('button', { name: 'Real results' }).click();

    await expect(page.getByTestId('scenario-table')).toHaveCount(0);
    await expect(page.getByRole('table').getByRole('row').nth(3)).toContainText('Ret');
  });
});
