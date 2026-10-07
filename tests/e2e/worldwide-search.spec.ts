import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ hasTouch: true });

test('searches between South America and Africa by city and code using keyboard airport selection', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/5,332 airports across 235/)).toBeVisible();
  const origin = page.getByRole('combobox', { name: 'Departure airport' });
  await origin.fill('Sao Paulo');
  await expect(page.getByRole('option', { name: /^GRU\b/ })).toBeVisible();
  await origin.press('ArrowDown');
  await origin.press('Enter');
  await expect(origin).toHaveValue('São Paulo (GRU)');
  const destination = page.getByRole('combobox', { name: 'Arrival airport' });
  await destination.fill('cpt');
  await destination.press('Enter');
  await expect(destination).toHaveValue('Cape Town (CPT)');
  await page.getByRole('button', { name: 'Search flights', exact: true }).click();
  await expect(page).toHaveURL(/origin=GRU&destination=CPT/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('São PauloCape Town');
  await expect(page.getByRole('button', { name: 'Select flight', exact: true })).toHaveCount(6);
  await expect(page.getByLabel('Compare student flight value')).toBeVisible();
});

test('country suggestions, unknown inputs and swapping never submit a stale airport', async ({ page }) => {
  await page.goto('/');
  const origin = page.getByRole('combobox', { name: 'Departure airport' });
  await origin.fill('Japan');
  await expect(page.getByRole('option', { name: /^HND\b/ })).toBeVisible();
  await page.getByRole('option', { name: /^HND\b/ }).click();
  await page.getByRole('combobox', { name: 'Arrival airport' }).fill('SYD');
  await page.getByRole('option', { name: /^SYD\b/ }).click();
  await page.getByRole('button', { name: 'Swap departure and arrival' }).click();
  await expect(origin).toHaveValue('Sydney (SYD)');
  await expect(page.getByRole('combobox', { name: 'Arrival airport' })).toHaveValue('Tokyo (HND)');
  await origin.fill('no-such-airport-12345');
  await expect(page.getByText('No airports found. Try a city, country or three-letter airport code.')).toBeVisible();
  await origin.press('Escape');
  await expect(origin).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Search flights', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Choose an airport from the suggestions' })).toBeVisible();
  await expect(page).not.toHaveURL(/\/flights/);
});

test('airport suggestions fit mobile screens, accept touch selection and meet accessibility checks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const destination = page.getByRole('combobox', { name: 'Arrival airport' });
  await destination.fill('Mexico');
  await expect(page.getByRole('option', { name: /^MEX\b/ })).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('option', { name: /^MEX\b/ }).tap();
  await expect(destination).toHaveValue('Mexico City (MEX)');
  await page.getByRole('combobox', { name: 'Departure airport' }).fill('JFK');
  await page.getByRole('option', { name: /^JFK\b/ }).click();
  await page.getByRole('button', { name: 'Search flights', exact: true }).click();
  await expect(page).toHaveURL(/origin=JFK&destination=MEX/);
  await expect(page.getByRole('button', { name: 'Select flight', exact: true })).toHaveCount(6);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('international destination cards open working route searches', async ({ page }) => {
  await page.goto('/');
  await page.locator('.destination-card').filter({ hasText: 'New York' }).click();
  await expect(page).toHaveURL(/origin=JFK&destination=HND/);
  await expect(page.getByRole('button', { name: 'Select flight', exact: true })).toHaveCount(6);
});
