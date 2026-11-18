import { expect, test } from '@playwright/test';
import { json, mockBackend, seasons } from './mock-backend';

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
