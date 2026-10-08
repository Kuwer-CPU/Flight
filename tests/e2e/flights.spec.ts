import { test, expect } from '@playwright/test';

test('searches round trips, compares bags, sorts flights and hands off to the airline', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Same flight/ })).toBeVisible();
  await expect(page.getByRole('main').getByText('Preview mode', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Search flights', exact: true }).click();
  await expect(page).toHaveURL(/\/flights\?/);
  await expect(page.getByRole('button', { name: 'Select flight', exact: true })).toHaveCount(6);
  await page.getByLabel('At least 30 kg included').check();
  await expect(page.getByRole('button', { name: 'Select flight', exact: true })).toHaveCount(1);
  await expect(page.locator('.flight-airline h3')).toHaveText('Emirates');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByRole('button', { name: /^Fastest/ }).click();
  await expect(page.locator('.flight-airline h3').first()).toHaveText('Air France');
  await page.getByRole('button', { name: 'Select flight', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/This sample ticket cannot be booked/)).toBeVisible();
  await expect(dialog.getByRole('link', { name: /Search on Air France/ })).toHaveAttribute('href', 'https://www.airfrance.com/');
  await expect(dialog.locator('.itinerary')).toHaveCount(2);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Select flight', exact: true }).first()).toBeFocused();
  expect(errors).toEqual([]);
});

test('saves a flight across reloads and removes it from the shortlist', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Search flights', exact: true }).click();
  const save = page.getByRole('button', { name: 'Save Qatar Airways flight', exact: true });
  await save.click();
  await expect(page.getByRole('button', { name: 'Saved flights, 1 saved' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Saved flights, 1 saved' }).click();
  await expect(page.getByRole('dialog', { name: 'Your saved flights' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove saved Qatar Airways flight' }).click();
  await expect(page.getByText('A little inspiration, saved.')).toBeVisible();
});

test('one-way and multiple traveler searches preserve the route and group fare', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'One way', exact: true }).click();
  await expect(page.getByLabel('Return date', { exact: true })).toHaveCount(0);
  await page.getByLabel('Number of adult travelers').selectOption('3');
  await page.getByRole('button', { name: 'Swap departure and arrival' }).click();
  await expect(page.getByLabel('Departure airport')).toHaveValue('Delhi (DEL)');
  await page.getByRole('button', { name: 'Search flights', exact: true }).click();
  await expect(page).toHaveURL(/adults=3/);
  await expect(page.locator('.flight-journey')).toHaveCount(6);
  await page.getByRole('button', { name: 'Select flight', exact: true }).first().click();
  await expect(page.getByRole('dialog').getByText('Total for 3 adults')).toBeVisible();
  await expect(page.getByRole('dialog').locator('.itinerary')).toHaveCount(1);
});

test('mobile navigation, search, filters and booking dialog fit the screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('navigation').getByRole('link', { name: /Student perks/ }).click();
  await expect(page.getByRole('heading', { name: /A little extra/ })).toBeVisible();
  await page.getByLabel('Find an airline student program').fill('Qatar');
  await expect(page.locator('.program-card')).toHaveCount(1);
  await page.goto('/');
  await page.getByRole('button', { name: 'Search flights', exact: true }).click();
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByLabel('Nonstop only', { exact: true }).check();
  await expect(page.getByRole('button', { name: 'Select flight', exact: true })).toHaveCount(2);
  await expect(page.locator('.journey-path small')).toHaveText(['Nonstop', 'Nonstop', 'Nonstop', 'Nonstop']);
  await page.getByRole('button', { name: 'Close filters' }).click();
  await page.getByRole('button', { name: 'Select flight', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test('rejects malformed API searches and renders provider errors without fake fares', async ({ page, request }) => {
  const invalid = await request.get('/api/flights?origin=XYZ');
  expect(invalid.status()).toBe(400);
  await page.route('**/api/flights?**', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'The flight provider could not authenticate. Please try again later.' }) }));
  await page.goto('/flights');
  await expect(page.getByRole('alert').filter({ hasText: 'could not authenticate' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Select flight', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
});

test('offers empty-state recovery and survives corrupt saved browser data', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('flyora:saved:v1', '[{"id":"broken"}]'));
  await page.route('**/api/flights?**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ mode: 'live', offers: [], searchedAt: new Date().toISOString() }) }));
  await page.goto('/flights');
  await expect(page.getByRole('heading', { name: 'No flights found for these dates.' })).toBeVisible();
  await page.getByRole('button', { name: 'Saved flights', exact: true }).click();
  await expect(page.getByText('A little inspiration, saved.')).toBeVisible();
});
