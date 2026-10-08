import { test, expect } from '@playwright/test';

test('student comparison is prominent, explains its score and persists in the itinerary dialog', async ({ page }) => {
  await page.goto('/');
  const illustration = page.getByLabel('Illustrative student flight comparison');
  await expect(illustration.getByText('33', { exact: false }).first()).toBeVisible();
  await expect(illustration.getByText(/Fictional airlines and benefits/)).toBeVisible();
  await page.getByRole('button', { name: 'Search flights', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Student value/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(6);
  const qatar = page.locator('.flight-card').filter({ has: page.getByRole('heading', { name: 'Qatar Airways', exact: true }) });
  await expect(qatar.getByLabel('Student baggage comparison for Qatar Airways')).toContainText('33');
  await expect(qatar.getByText(/not Qatar Airways policy/)).toBeVisible();
  await page.getByRole('button', { name: 'How student value works' }).click();
  const guide = page.getByRole('dialog', { name: 'How student value works' });
  await expect(guide.getByText('40%', { exact: true })).toBeVisible();
  await expect(guide.getByText('45%', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'View Qatar Airways itinerary', exact: true }).click();
  await expect(page.getByRole('dialog').getByLabel('Student baggage comparison for Qatar Airways')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('link', { name: /Search on Qatar Airways/ })).toHaveAttribute('href', 'https://www.qatarairways.com/');
});

test('live flights never display fictional extras or scores, even if a response includes example fields', async ({ page, request }) => {
  const query = new URLSearchParams({ origin: 'CDG', destination: 'DEL', departureDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) });
  const samples = await (await request.get('/api/flights?' + query)).json();
  await page.route('**/api/flights?**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ...samples, mode: 'live', offers: samples.offers.map((o: object) => ({ ...o, mode: 'live' })) }) }));
  await page.goto('/flights?' + query);
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(6);
  await expect(page.locator('.comparison-bonus')).toHaveCount(0);
  await expect(page.locator('.value-score')).toHaveCount(0);
  await expect(page.locator('.example-policy-note')).toHaveCount(0);
  await expect(page.getByRole('table').getByText('Unverified', { exact: true })).toHaveCount(6);
  await expect(page.getByRole('table').getByText('Pending', { exact: true })).toHaveCount(6);
});

test('student comparison works on narrow screens and can be turned off for a regular traveler', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Search flights', exact: true }).click();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(6);
  const region = page.getByRole('region', { name: 'Scrollable student comparison table' });
  expect(await region.evaluate(e => e.scrollWidth > e.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('Student traveler', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Search flights', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Select flight', exact: true })).toHaveCount(6);
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.locator('.student-baggage-panel')).toHaveCount(0);
});
