import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { FlightOffer } from '../../src/lib/types';

test('production demo pages stay out of search indexing and return the configured response headers', async ({ page, request }) => {
  const homepage = await request.get('/');
  expect(homepage.status()).toBe(200);
  const headers = homepage.headers();
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('no-referrer');
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['content-security-policy']).toMatch(/frame-ancestors\s+'none'/);
  expect(headers['permissions-policy']).toContain('camera=()');
  expect(headers['x-powered-by']).toBeUndefined();
  const status = await request.get('/api/status');
  expect(status.status()).toBe(200);
  expect((await status.json()).mode).toBe('demo');
  expect(status.headers()['cache-control']).toContain('no-store');

  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toMatch(/^Disallow:\s*\/\s*$/im);
  expect(await robots.text()).not.toMatch(/^Sitemap:/im);
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toMatch(/<url(?:\s|>)/);
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  // No search parameters means validation fails before a provider is called.
  const invalidSearch = await request.get('/api/flights');
  expect(invalidSearch.status()).toBe(400);
  expect(invalidSearch.headers()['x-robots-tag']).toContain('noindex');
});

test('the contact page discloses missing support details before a public launch', async ({ page }) => {
  await page.goto('/');
  await page.locator('footer').getByRole('link', { name: /Contact/ }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Contact');
  await expect(page.getByRole('main')).toContainText(/before (?:the )?public launch/);
  await expect(page.getByRole('main').locator('a[href^="mailto:"]')).toHaveCount(0);
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations.map(violation => ({ id: violation.id, targets: violation.nodes.map(node => node.target) }))).toEqual([]);
});

test('corrupt nested saved rows do not discard valid flights and clear-all persists after reload', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  const departureDate = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const saved: FlightOffer = {
    id: 'launch-saved-qr', airlineCode: 'QR', airlineName: 'Qatar Airways', price: 650,
    currency: 'EUR', passengers: 1, cabin: 'ECONOMY', baggage: { weight: 23, unit: 'KG' }, mode: 'demo',
    itineraries: [{ duration: 360, segments: [{ from: 'CDG', to: 'DOH', departure: departureDate + 'T09:00:00', arrival: departureDate + 'T17:00:00', duration: 360, carrier: 'QR', flightNumber: '42' }] }],
  };
  const rows = [
    { ...saved, id: 'broken-itinerary', itineraries: [null] },
    { ...saved, id: 'broken-segment', itineraries: [{ duration: 360, segments: [null] }] },
    { ...saved, id: 'non-iso-departure', itineraries: [{ duration: 360, segments: [{ ...saved.itineraries[0].segments[0], departure: 'October 30, 2026 09:00:00' }] }] },
    saved,
    { ...saved, id: 'launch-saved-ek', airlineCode: 'EK', airlineName: 'Emirates', price: 680 },
  ];
  await page.goto('/');
  await page.getByRole('button', { name: 'Saved flights', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Your saved flights', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('flyora:saved:v1'))).toBeNull();
  await page.evaluate(value => localStorage.setItem('flyora:saved:v1', JSON.stringify(value)), rows);
  await page.reload();
  await page.getByRole('button', { name: 'Saved flights, 2 saved', exact: true }).click();
  const shortlist = page.getByRole('dialog', { name: 'Your saved flights', exact: true });
  await expect(shortlist.locator('.saved-card')).toHaveCount(2);
  await expect(shortlist.getByRole('button', { name: 'View saved Qatar Airways flight', exact: true })).toBeVisible();
  await expect(shortlist.getByRole('button', { name: 'View saved Emirates flight', exact: true })).toBeVisible();
  await shortlist.getByRole('button', { name: /Clear all saved flights/ }).click();
  await expect(shortlist.getByText('A little inspiration, saved.', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('flyora:saved:v1') || '[]'))).toEqual([]);
  await page.reload();
  await page.getByRole('button', { name: 'Saved flights', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Your saved flights', exact: true }).getByText('A little inspiration, saved.', { exact: true })).toBeVisible();
  expect(browserErrors).toEqual([]);
});
