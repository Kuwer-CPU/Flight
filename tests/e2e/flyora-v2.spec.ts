import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function futureDate(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

async function expectAccessible(page: Page, context: string) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.map(violation => ({ id: violation.id, targets: violation.nodes.map(node => node.target) })), context).toEqual([]);
}

test('the student travel homepage exposes all five main tools', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Smarter flights for students worldwide.', exact: true })).toBeVisible();
  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(navigation.getByRole('link')).toHaveCount(5);
  for (const route of ['/flights', '/student-benefits', '/travel-calculator', '/miles-wallet', '/travel-checklist']) {
    await expect(navigation.locator('a[href="' + route + '"]')).toHaveCount(1);
  }
});

test('the student directory searches official leads without inventing current policy terms', async ({ page }) => {
  await page.goto('/student-benefits');
  await expect(page.locator('.benefit-card')).toHaveCount(30);
  await expect(page.locator('.benefit-card .benefit-status')).toHaveText(Array(30).fill('Unverified information'));
  await expect(page.locator('.benefit-card .benefit-summary dd')).toHaveText(Array(90).fill('Confirm with airline'));
  await expect(page.locator('.benefit-card time')).toHaveCount(0);
  await expect(page.locator('.benefit-card').getByText('Not verified', { exact: true })).toHaveCount(30);
  await page.getByRole('button', { name: /^Verified current policy 0$/ }).click();
  await expect(page.getByRole('heading', { name: 'No matching airline records.', exact: true })).toBeVisible();
  await expect(page.locator('.benefit-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  const search = page.getByRole('searchbox', { name: 'Search airlines or student programs', exact: true });
  await search.fill('student club');
  const qatar = page.getByRole('article', { name: 'Qatar Airways student benefits', exact: true });
  await expect(page.locator('.benefit-card')).toHaveCount(1);
  await expect(qatar).toBeVisible();
  await qatar.locator('summary').click();
  await expect(qatar.locator('.benefit-details dd')).toHaveText(Array(6).fill('Confirm with airline'));
  await expect(qatar.getByRole('link', { name: 'Official program page', exact: true })).toHaveAttribute('href', 'https://www.qatarairways.com/en/student-club.html');
  await expect(qatar.getByRole('link', { name: 'Official program page', exact: true })).toHaveAttribute('rel', 'noopener noreferrer');
  await search.fill('Air France');
  const airFrance = page.getByRole('article', { name: 'Air France student benefits', exact: true });
  await expect(airFrance.getByText('Student program not identified in our data', { exact: true })).toBeVisible();
  await expect(airFrance.getByRole('link', { name: 'Official airline website', exact: true })).toHaveAttribute('href', 'https://www.airfrance.com/');
});

test('manual travel costs keep unquoted baggage pending and clear monetary values on a currency change', async ({ page }) => {
  await page.goto('/travel-calculator');
  const first = page.getByRole('group', { name: 'Option 1', exact: true });
  const second = page.getByRole('group', { name: 'Option 2', exact: true });
  await expect(first.getByRole('textbox', { name: /^Ticket price/ })).toHaveValue('');
  await first.getByRole('textbox', { name: /^Ticket price/ }).fill('480');
  await first.getByRole('textbox', { name: 'Standard baggage included', exact: true }).fill('20');
  await first.getByRole('textbox', { name: /^Additional baggage needed/ }).fill('10');
  await second.getByRole('textbox', { name: /^Ticket price/ }).fill('530');
  await second.getByRole('textbox', { name: /^Additional baggage needed/ }).fill('0');
  await expect(first.locator('.calculator-option-total')).toContainText('Total pending');
  await expect(first.locator('.calculator-option-total')).not.toContainText('€480');
  await expect(second.locator('.calculator-option-total')).toContainText('€530');
  await expect(page.locator('.calculator-result')).toContainText('Complete another option to compare.');
  await first.getByRole('textbox', { name: /^Quoted extra-bag charge/ }).fill('110');
  await expect(first.locator('.calculator-option-total')).toContainText('€590');
  await expect(page.locator('.calculator-result')).toContainText('Option B has the lowest complete entered cost: €530');
  await expect(first.getByText('Lowest complete entered cost', { exact: true })).toHaveCount(0);
  await expect(second.getByText('Lowest complete entered cost', { exact: true })).toBeVisible();
  await expect(page.getByText('Manual calculator. These are your entered costs, not live flight offers.', { exact: false })).toBeVisible();
  await page.getByLabel(/One currency for every option/).selectOption('USD');
  await expect(first.getByRole('textbox', { name: /^Ticket price/ })).toHaveValue('');
  await expect(first.getByRole('textbox', { name: /^Quoted extra-bag charge/ })).toHaveValue('');
  await expect(first.getByRole('textbox', { name: /^Additional baggage needed/ })).toHaveValue('10');
  await expect(second.getByRole('textbox', { name: /^Ticket price/ })).toHaveValue('');
  await expect(page.getByRole('status').filter({ hasText: 'Currency changed to USD.' })).toContainText('no conversion was applied');
});

test('manual loyalty balances support add, edit, reload and removal, with a separate cash-versus-miles estimate', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/miles-wallet');
  await expect(page.getByLabel(/^Miles or points balance/)).toHaveValue('');
  await expect(page.getByText('No connected airline accounts.', { exact: false })).toBeVisible();
  await page.getByRole('combobox', { name: 'Loyalty program', exact: true }).selectOption({ label: 'Emirates Skywards' });
  await page.getByLabel(/^Miles or points balance/).fill('50000');
  await page.getByLabel(/^Expiration date \(optional\)/).fill(futureDate(180));
  await page.getByLabel(/^Notes \(optional\)/).fill('Checked manually for my university trip.');
  await page.getByRole('button', { name: 'Add program', exact: true }).click();
  await expect(page.locator('.wallet-entry')).toContainText('50,000');
  await page.getByRole('button', { name: 'Edit Emirates Skywards', exact: true }).click();
  await page.getByLabel(/^Miles or points balance/).fill('65000');
  await page.getByRole('button', { name: 'Save program changes', exact: true }).click();
  await page.reload();
  await expect(page.locator('.wallet-entry')).toHaveCount(1);
  await expect(page.locator('.wallet-entry')).toContainText('65,000');
  await expect(page.locator('.wallet-entry')).toContainText('Checked manually for my university trip.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('Comparable cash ticket price', { exact: true }).fill('700');
  await page.getByLabel('Miles required for award', { exact: true }).fill('50000');
  await page.getByLabel('Award taxes and surcharges', { exact: true }).fill('150');
  await page.getByLabel(/^Additional redemption fees \(optional\)/).fill('50');
  await page.getByRole('button', { name: 'Estimate redemption value', exact: true }).click();
  await expect(page.getByRole('heading', { name: '0.0100 EUR per mile', exact: true })).toBeVisible();
  await expect(page.locator('.wallet-valuation')).toContainText('€200.00');
  await expect(page.locator('.wallet-valuation')).toContainText('€500.00');
  await expect(page.locator('.wallet-valuation')).toContainText('not a guaranteed saving or live award offer');
  await page.getByLabel('Comparable cash ticket price', { exact: true }).fill('720');
  await expect(page.getByRole('heading', { name: '0.0100 EUR per mile', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Remove Emirates Skywards', exact: true }).click();
  await expect(page.locator('.wallet-entry')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('flyora:miles:v1'))).toBeNull();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'A little mileage goes a long way.', exact: true })).toBeVisible();
});

test('a generated travel checklist preserves edited, checked and custom reminders and supports confirmed clearing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/travel-checklist');
  await page.getByLabel('Departure country', { exact: true }).fill('India');
  await page.getByLabel('Destination country', { exact: true }).fill('France');
  await page.getByLabel('Expected travel date', { exact: true }).fill(futureDate(30));
  await page.getByLabel(/University start date/).fill(futureDate(35));
  await page.getByRole('combobox', { name: 'Trip purpose', exact: true }).selectOption('study');
  await page.getByRole('button', { name: 'Generate checklist', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your travel checklist', exact: true })).toBeVisible();
  const count = await page.locator('.checklist-item').count();
  expect(count).toBeGreaterThan(5);
  await page.locator('.checklist-item').first().getByRole('button', { name: /^Edit reminder:/ }).click();
  const edited = 'Confirm my passport renewal appointment.';
  await page.getByLabel('Reminder text', { exact: true }).fill(edited);
  await page.getByRole('button', { name: 'Save reminder', exact: true }).click();
  await page.getByRole('checkbox', { name: edited, exact: true }).check();
  await page.getByLabel('New reminder', { exact: true }).fill('Collect my university room keys.');
  await page.getByRole('combobox', { name: 'Reminder category', exact: true }).selectOption('arrival');
  await page.getByRole('button', { name: 'Add reminder', exact: true }).click();
  await expect(page.locator('.checklist-item')).toHaveCount(count + 1);
  await expect.poll(() => page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('flyora:checklist:v1') || 'null');
    return saved?.items.some((item: { text: string; completed: boolean }) => item.text === 'Confirm my passport renewal appointment.' && item.completed) &&
      saved?.items.some((item: { text: string }) => item.text === 'Collect my university room keys.');
  })).toBe(true);
  await page.reload();
  await expect(page.getByRole('checkbox', { name: edited, exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Collect my university room keys.', exact: true })).toBeVisible();
  await expect(page.locator('.checklist-progress')).toContainText('1 of ' + (count + 1) + ' complete');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Remove reminder: Collect my university room keys.', exact: true }).click();
  await expect(page.locator('.checklist-item')).toHaveCount(count);
  await page.getByRole('button', { name: 'Generate checklist', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Replace this checklist?', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Keep current checklist', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: edited, exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Clear checklist', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Clear checklist?', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear checklist from browser', exact: true }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('flyora:checklist:v1'))).toBeNull();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Start with a little direction.', exact: true })).toBeVisible();
});

test('new student travel pages fit mobile screens and have no detected WCAG A/AA violations', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of ['/student-benefits', '/travel-calculator', '/miles-wallet', '/travel-checklist']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile overflow on ' + path).toBe(true);
    await expectAccessible(page, 'Accessibility on ' + path);
  }
});
