import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const totalItems = 29;
const categoryNames = [
  'In-flight comfort',
  'Baggage accessories',
  'Luggage personalization',
  'Packing & organization',
  'Travel electronics',
  'Passport & document accessories',
  'Bags & luggage',
  'Toiletries & hygiene',
];

async function openEssentials(page: Page) {
  await page.goto('/travel-essentials');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Search travel essentials', exact: true })).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

async function expectAccessible(page: Page, context: string) {
  await page.evaluate(() => document.fonts.ready);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.map(violation => ({ id: violation.id, targets: violation.nodes.map(node => node.target) })), context).toEqual([]);
}

test('India-first essentials disclose retailer searches without claiming affiliate approval or unverified prices', async ({ page }) => {
  await openEssentials(page);
  const cards = page.locator('.essential-card');
  await expect(cards).toHaveCount(totalItems);
  await expect(page.getByText('Affiliate disclosure', { exact: true })).toBeVisible();
  await expect(cards.getByText('Check price with retailer', { exact: true })).toHaveCount(totalItems);
  await expect(cards.locator('.essential-link-kind')).toHaveText(Array(totalItems).fill('External retailer search · Amazon India'));
  for (const card of await cards.all()) {
    const name = await card.getAttribute('aria-label');
    expect(name).toBeTruthy();
    const link = card.getByRole('link', { name: `Search Amazon India for ${name}`, exact: true });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    const url = new URL((await link.getAttribute('href'))!);
    expect(url.protocol).toBe('https:');
    expect(['amazon.in', 'www.amazon.in']).toContain(url.hostname);
    expect(url.pathname).toBe('/s');
    expect(url.searchParams.get('k')).toBeTruthy();
    for (const parameter of ['tag', 'ascsubtag', 'affid', 'aff_id']) expect(url.searchParams.has(parameter)).toBe(false);
    await expect(card).not.toContainText(/₹\s*\d|\d\s*%\s*off|\d(?:\.\d)?\s*(?:out of 5|stars)/i);
  }
  await expect(page.getByRole('button', { name: /add to cart|checkout|buy now|pay now/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /checkout|pay now/i })).toHaveCount(0);
});

test('all eight category filters preserve the full catalog and show their own items', async ({ page }) => {
  await openEssentials(page);
  const categories = page.getByRole('navigation', { name: 'Shop by category', exact: true });
  await expect(categories.getByRole('button')).toHaveCount(8);
  let categoryItems = 0;
  for (const category of categoryNames) {
    const filter = categories.getByRole('button', { name: new RegExp(`^${category}\\b`, 'i') });
    await filter.click();
    const count = await page.locator('.essential-card').count();
    expect(count, category).toBeGreaterThan(0);
    expect(count, category).toBeLessThan(totalItems);
    categoryItems += count;
    await expect(page.locator('.essential-card').getByText(category, { exact: true })).toHaveCount(count);
  }
  expect(categoryItems).toBe(totalItems);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.locator('.essential-card')).toHaveCount(totalItems);
});

test('search, sorting and clear filters support finding items without resetting the page', async ({ page }) => {
  await openEssentials(page);
  const search = page.getByRole('searchbox', { name: 'Search travel essentials', exact: true });
  const sort = page.getByRole('combobox', { name: 'Sort items', exact: true });
  await sort.selectOption('name-asc');
  const ascending = await page.locator('.essential-card').getByRole('heading').allTextContents();
  expect(ascending).toEqual([...ascending].sort((a, b) => a.localeCompare(b)));
  await sort.selectOption('name-desc');
  await expect(page.locator('.essential-card').getByRole('heading')).toHaveText([...ascending].reverse());
  await search.fill('power bank');
  await expect(page.locator('.essential-card')).toHaveCount(1);
  await expect(page.locator('.essential-card')).toContainText(/power bank/i);
  await page.getByRole('navigation', { name: 'Shop by category', exact: true }).getByRole('button', { name: /^Travel electronics\b/i }).click();
  await expect(page.locator('.essential-card')).toHaveCount(1);
  await search.fill('not-a-real-travel-item');
  await expect(page.locator('.essential-card')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /no .*matching|no .*found/i })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(search).toHaveValue('');
  await expect(sort).toHaveValue('curated');
  await expect(page.locator('.essential-card')).toHaveCount(totalItems);
});

test('approved-link and recorded-INR filters do not invent catalog data', async ({ page }) => {
  await openEssentials(page);
  const linkType = page.getByRole('combobox', { name: 'Link type', exact: true });
  await linkType.selectOption('search');
  await expect(page.locator('.essential-card')).toHaveCount(totalItems);
  await linkType.selectOption('affiliate');
  await expect(page.locator('.essential-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Only items with a recorded INR price', exact: true }).check();
  await expect(page.locator('.essential-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(linkType).toHaveValue('all');
  await expect(page.getByRole('checkbox', { name: 'Only items with a recorded INR price', exact: true })).not.toBeChecked();
  await expect(page.locator('.essential-card')).toHaveCount(totalItems);
});

test('homepage and desktop navigation connect to an accessible side-by-side essentials catalog', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('main').getByRole('link', { name: /travel essentials/i })).toBeVisible();
  await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Travel Essentials', exact: true }).click();
  await expect(page).toHaveURL(/\/travel-essentials$/);
  await expect(page.locator('.essential-card')).toHaveCount(totalItems);
  await expectNoHorizontalOverflow(page);
  const first = await page.locator('.essential-card').nth(0).boundingBox();
  const second = await page.locator('.essential-card').nth(1).boundingBox();
  expect(first).not.toBeNull();
  expect(second).not.toBeNull();
  expect(Math.abs(first!.y - second!.y)).toBeLessThan(2);
  expect(second!.x).toBeGreaterThan(first!.x + first!.width);
  await expectAccessible(page, 'Travel Essentials desktop catalog');
});

for (const width of [390, 360]) {
  test(`mobile navigation, filters and catalog work without horizontal overflow at ${width}px`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Travel Essentials', exact: true }).click();
    await expect(page).toHaveURL(/\/travel-essentials$/);
    await expect(page.getByRole('button', { name: 'Open navigation', exact: true })).toBeVisible();
    await expect(page.locator('.essential-card')).toHaveCount(totalItems);
    await expectNoHorizontalOverflow(page);
    const search = page.getByRole('searchbox', { name: 'Search travel essentials', exact: true });
    await page.getByRole('navigation', { name: 'Shop by category', exact: true }).getByRole('button', { name: /^Travel electronics\b/i }).click();
    await search.fill('power bank');
    await page.getByRole('combobox', { name: 'Sort items', exact: true }).selectOption('name-desc');
    await expect(page.locator('.essential-card')).toHaveCount(1);
    await expect(page.locator('.essential-card')).toContainText(/power bank/i);
    await expectNoHorizontalOverflow(page);
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
    await expect(page.locator('.essential-card')).toHaveCount(totalItems);
    await expectNoHorizontalOverflow(page);
    if (width === 390) await expectAccessible(page, 'Travel Essentials mobile catalog');
  });
}
