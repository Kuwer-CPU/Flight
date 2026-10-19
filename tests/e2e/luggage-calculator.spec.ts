import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const confirmation = 'These terms match my route, cabin, fare and operating airline.';
const pieceHelp = 'Each bag must fit its individual weight limit. Weight pooling is not assumed.';
const weightHelp = 'Check the total permitted weight across your bags and any separate per-bag maximum.';
const unconfirmedTicket = 'Illustrative / unconfirmed ticket details. Confirm your route, cabin, fare and operating airline before relying on this comparison.';
const confirmedTicket = 'Based on ticket details you confirmed. This is not independent airline approval.';

function ticket(page: Page, airline: string) {
  return page.getByRole('group', { name: `${airline} ticket allowance`, exact: true });
}

function comparison(page: Page, airline: string) {
  return page.getByRole('article', { name: `${airline} baggage comparison`, exact: true });
}

async function openCalculator(page: Page) {
  await page.goto('/luggage-calculator');
  await expect(page.getByRole('heading', { name: 'Your journey', exact: true })).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Student age', exact: true }).fill('22');
  await page.getByRole('spinbutton', { name: /^Checked bag 1\b/ }).fill('23');
  await page.getByRole('spinbutton', { name: /^Checked bag 2\b/ }).fill('23');
}

async function pieceTicket(group: Locator, pieces = '2', kg = '23', confirm = true) {
  await group.getByRole('combobox', { name: 'Checked baggage system', exact: true }).selectOption('pieces');
  await group.getByLabel('Included checked bags', { exact: true }).fill(pieces);
  await group.getByLabel('Maximum per checked bag (kg)', { exact: true }).fill(kg);
  if (confirm) await group.getByRole('checkbox', { name: confirmation, exact: true }).check();
}

async function weightTicket(group: Locator, total = '30', kg = '32', confirm = true) {
  await group.getByRole('combobox', { name: 'Checked baggage system', exact: true }).selectOption('weight');
  await group.getByLabel('Total checked allowance (kg)', { exact: true }).fill(total);
  await group.getByLabel('Maximum per checked bag (kg)', { exact: true }).fill(kg);
  if (confirm) await group.getByRole('checkbox', { name: confirmation, exact: true }).check();
}

async function compare(page: Page) {
  await page.getByRole('button', { name: 'Compare baggage & benefits', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your airline comparison', exact: true })).toBeVisible();
}

test('India-first defaults compare two 23 kg bags without inventing a ticket or student allowance', async ({ page }) => {
  await openCalculator(page);
  await expect(page.getByRole('combobox', { name: 'Departure country', exact: true })).toHaveValue('IN');
  await expect(page.getByRole('combobox', { name: 'Destination country', exact: true })).toHaveValue('GB');
  await compare(page);
  await expect(page.getByText('46 kg checked · 2 bags · 2 airlines · one traveler', { exact: true })).toBeVisible();
  await expect(page.locator('.baggage-result-card')).toHaveCount(2);
  for (const airline of ['Qatar Airways', 'Emirates']) {
    const card = comparison(page, airline);
    await expect(card.locator('.baggage-outcome')).toHaveText('Needs airline confirmation');
    await expect(card.locator('dl').getByText('Check with airline', { exact: true }).first()).toBeVisible();
    await expect(card.getByRole('link', { name: 'Check baggage policy', exact: true })).toHaveAttribute('href', /^https:\/\//);
  }
  await expect(page.getByText('Optional accessories. Purchases do not increase your allowance or resolve excess-baggage charges.', { exact: true })).toBeVisible();
});

test('help text follows each ticket’s allowance system without piece guidance under weight allowances', async ({ page }) => {
  await openCalculator(page);
  const qatar = ticket(page, 'Qatar Airways');
  const emirates = ticket(page, 'Emirates');
  await pieceTicket(qatar);
  await weightTicket(emirates);
  await expect(qatar.getByText(pieceHelp)).toBeVisible();
  await expect(qatar.getByText(weightHelp)).toHaveCount(0);
  await expect(emirates.getByText(weightHelp)).toBeVisible();
  await expect(emirates.getByText(pieceHelp)).toHaveCount(0);
  await expect(emirates.getByText(/pooling|piece-based/i)).toHaveCount(0);
  await qatar.getByRole('combobox', { name: 'Checked baggage system', exact: true }).selectOption('weight');
  await expect(qatar.getByText(weightHelp)).toBeVisible();
  await expect(qatar.getByText(/pooling|piece-based/i)).toHaveCount(0);
  await qatar.getByRole('combobox', { name: 'Checked baggage system', exact: true }).selectOption('pieces');
  await expect(qatar.getByText(pieceHelp)).toBeVisible();
  await expect(qatar.getByText(weightHelp)).toHaveCount(0);
});

test('ticket confirmation requires an active opt-in and unconfirmed results stay illustrative', async ({ page }) => {
  await openCalculator(page);
  const qatarTicket = ticket(page, 'Qatar Airways');
  const emiratesTicket = ticket(page, 'Emirates');
  const qatarConfirmation = qatarTicket.getByRole('checkbox', { name: confirmation, exact: true });
  const emiratesConfirmation = emiratesTicket.getByRole('checkbox', { name: confirmation, exact: true });
  await expect(qatarConfirmation).not.toBeChecked();
  await expect(emiratesConfirmation).not.toBeChecked();
  await pieceTicket(qatarTicket, '2', '23', false);
  await weightTicket(emiratesTicket, '46', '23', false);
  await expect(qatarConfirmation).not.toBeChecked();
  await expect(emiratesConfirmation).not.toBeChecked();
  await compare(page);
  const qatar = comparison(page, 'Qatar Airways');
  const emirates = comparison(page, 'Emirates');
  for (const card of [qatar, emirates]) {
    await expect(card.locator('.baggage-outcome')).toHaveText('Needs airline confirmation');
    await expect(card.locator('.baggage-ticket-status')).toHaveText(unconfirmedTicket);
    await expect(card.getByText('Fits your entered allowance', { exact: true })).toHaveCount(0);
    await expect(card.getByText('Fits your entered ticket allowance. Flyora has not independently verified airline approval.', { exact: true })).toHaveCount(0);
  }
  await qatarConfirmation.check();
  await expect(qatar.locator('.baggage-outcome')).toHaveText('Fits your entered allowance');
  await expect(qatar.locator('.baggage-ticket-status')).toHaveText(confirmedTicket);
  await expect(qatar.getByText('Fits your entered ticket allowance. Flyora has not independently verified airline approval.', { exact: true })).toBeVisible();
  await expect(emirates.locator('.baggage-ticket-status')).toHaveText(unconfirmedTicket);
  await expect(emiratesConfirmation).not.toBeChecked();
  await qatarConfirmation.uncheck();
  await expect(qatar.locator('.baggage-outcome')).toHaveText('Needs airline confirmation');
  await expect(qatar.locator('.baggage-ticket-status')).toHaveText(unconfirmedTicket);
  await qatarConfirmation.check();
  await qatarTicket.getByLabel('Maximum per checked bag (kg)', { exact: true }).fill('24');
  await expect(qatarConfirmation).not.toBeChecked();
  await expect(qatar.locator('.baggage-outcome')).toHaveText('Needs airline confirmation');
  await expect(qatar.locator('.baggage-ticket-status')).toHaveText(unconfirmedTicket);
  await qatarConfirmation.check();
  await page.reload();
  await expect(qatarConfirmation).not.toBeChecked();
  await expect(emiratesConfirmation).not.toBeChecked();
  await page.getByRole('region', { name: 'Choose airlines to compare', exact: true }).getByRole('checkbox', { name: 'Air India', exact: true }).check();
  await expect(ticket(page, 'Air India').getByRole('checkbox', { name: confirmation, exact: true })).not.toBeChecked();
});

test('compares entered piece and weight allowances side by side and updates weights without restarting', async ({ page }) => {
  await openCalculator(page);
  await pieceTicket(ticket(page, 'Qatar Airways'));
  await weightTicket(ticket(page, 'Emirates'));
  await compare(page);
  const qatar = comparison(page, 'Qatar Airways');
  const emirates = comparison(page, 'Emirates');
  await expect(qatar.locator('.baggage-outcome')).toHaveText('Fits your entered allowance');
  await expect(qatar.getByText(/^2 bags × 23 kg · no weight pooling/)).toBeVisible();
  await expect(emirates.getByText(/^30 kg total · 32 kg per bag/)).toBeVisible();
  await expect(emirates.getByText('Total is 16 kg over the entered allowance.', { exact: true })).toBeVisible();
  await expect(emirates.getByText('Exceeds the entered standard allowance.', { exact: true })).toBeVisible();
  await page.getByRole('spinbutton', { name: /^Checked bag 2\b/ }).fill('7');
  await expect(page.getByText('30 kg checked · 2 bags · 2 airlines · one traveler', { exact: true })).toBeVisible();
  await expect(qatar.locator('.baggage-outcome')).toHaveText('Fits your entered allowance');
  await expect(emirates.locator('.baggage-outcome')).toHaveText('Fits your entered allowance');
  await expect(emirates.getByText('Total is 16 kg over the entered allowance.', { exact: true })).toHaveCount(0);
});

test('piece allowances reject pooling and excess bag counts even when total weight looks acceptable', async ({ page }) => {
  await openCalculator(page);
  await pieceTicket(ticket(page, 'Qatar Airways'));
  await weightTicket(ticket(page, 'Emirates'), '50');
  await compare(page);
  const qatar = comparison(page, 'Qatar Airways');
  await page.getByRole('spinbutton', { name: /^Checked bag 1\b/ }).fill('24');
  await page.getByRole('spinbutton', { name: /^Checked bag 2\b/ }).fill('22');
  await expect(page.getByText('46 kg checked · 2 bags · 2 airlines · one traveler', { exact: true })).toBeVisible();
  await expect(qatar.getByText(/^Bag 1 exceeds the 23 kg per-bag limit/)).toBeVisible();
  await expect(qatar.locator('.baggage-outcome')).not.toHaveText('Fits your entered allowance');
  await expect(comparison(page, 'Emirates').locator('.baggage-outcome')).toHaveText('Fits your entered allowance');
  await page.getByRole('button', { name: 'Add checked bag', exact: true }).click();
  await page.getByRole('spinbutton', { name: /^Checked bag 3\b/ }).fill('1');
  await expect(qatar.getByText('3 bags exceed the 2-bag limit.', { exact: true })).toBeVisible();
});

test('route, cabin and fare edits invalidate confirmed ticket allowances', async ({ page }) => {
  await openCalculator(page);
  const qatarTicket = ticket(page, 'Qatar Airways');
  await pieceTicket(qatarTicket);
  await compare(page);
  const qatar = comparison(page, 'Qatar Airways');
  await expect(qatar.locator('.baggage-outcome')).toHaveText('Fits your entered allowance');
  await page.getByRole('combobox', { name: 'Destination country', exact: true }).selectOption('CA');
  await expect(qatarTicket.getByRole('checkbox', { name: confirmation, exact: true })).not.toBeChecked();
  await expect(qatar.locator('.baggage-outcome')).toHaveText('Needs airline confirmation');
  await qatarTicket.getByRole('checkbox', { name: confirmation, exact: true }).check();
  await expect(qatar.locator('.baggage-outcome')).toHaveText('Fits your entered allowance');
  await page.getByRole('combobox', { name: 'Cabin class', exact: true }).selectOption('business');
  await expect(qatarTicket.getByRole('checkbox', { name: confirmation, exact: true })).not.toBeChecked();
  await expect(qatar.locator('.baggage-outcome')).toHaveText('Needs airline confirmation');
  await qatarTicket.getByRole('checkbox', { name: confirmation, exact: true }).check();
  await qatarTicket.getByRole('textbox', { name: /^Fare or ticket name \(optional\)/ }).fill('Example ticket quote');
  await expect(qatarTicket.getByRole('checkbox', { name: confirmation, exact: true })).not.toBeChecked();
  await expect(qatar.locator('.baggage-outcome')).toHaveText('Needs airline confirmation');
});

test('optional cabin baggage is checked separately from checked bags', async ({ page }) => {
  await openCalculator(page);
  await pieceTicket(ticket(page, 'Qatar Airways'));
  await page.getByText('Optional cabin baggage', { exact: true }).click();
  await page.getByRole('button', { name: 'Add cabin bag', exact: true }).click();
  await page.getByRole('spinbutton', { name: /^Cabin bag 1\b/ }).fill('9');
  const qatarTicket = ticket(page, 'Qatar Airways');
  await qatarTicket.getByLabel('Included cabin bags', { exact: true }).fill('1');
  await qatarTicket.getByLabel('Maximum per cabin bag (kg)', { exact: true }).fill('7');
  await qatarTicket.getByRole('checkbox', { name: confirmation, exact: true }).check();
  await compare(page);
  const qatar = comparison(page, 'Qatar Airways');
  await expect(qatar.getByText('Fits your entered ticket allowance. Flyora has not independently verified airline approval.', { exact: true })).toBeVisible();
  await expect(qatar.getByText('Exceeds entered cabin limits', { exact: true })).toBeVisible();
  await expect(qatar.getByText(/^Cabin: Bag 1 exceeds the 7 kg per-bag limit/)).toBeVisible();
  await expect(qatar.locator('.baggage-outcome')).toHaveText('Exceeds allowance');
  await expect(page.getByText('46 kg checked · 2 bags · 2 airlines · one traveler', { exact: true })).toBeVisible();
});

test('desktop comparison and form have no detected WCAG A/AA violations', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openCalculator(page);
  await pieceTicket(ticket(page, 'Qatar Airways'));
  await weightTicket(ticket(page, 'Emirates'));
  await compare(page);
  await page.evaluate(() => document.fonts.ready);
  const violations = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(violations.violations.map(result => ({ id: result.id, targets: result.nodes.map(node => node.target) }))).toEqual([]);
  const qatar = await comparison(page, 'Qatar Airways').boundingBox();
  const emirates = await comparison(page, 'Emirates').boundingBox();
  expect(qatar).not.toBeNull();
  expect(emirates).not.toBeNull();
  expect(Math.abs(qatar!.y - emirates!.y)).toBeLessThan(2);
  expect(emirates!.x).toBeGreaterThan(qatar!.x + qatar!.width);
});

for (const width of [390, 360]) {
  test(`calculator remains usable without horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await openCalculator(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await pieceTicket(ticket(page, 'Qatar Airways'));
    await compare(page);
    await expect(comparison(page, 'Qatar Airways').locator('.baggage-outcome')).toHaveText('Fits your entered allowance');
    await expect(comparison(page, 'Emirates').locator('.baggage-outcome')).toHaveText('Needs airline confirmation');
    await page.getByRole('spinbutton', { name: /^Checked bag 2\b/ }).fill('22');
    await expect(page.getByText('45 kg checked · 2 bags · 2 airlines · one traveler', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const qatar = await comparison(page, 'Qatar Airways').boundingBox();
    const emirates = await comparison(page, 'Emirates').boundingBox();
    expect(qatar).not.toBeNull();
    expect(emirates).not.toBeNull();
    expect(emirates!.y).toBeGreaterThan(qatar!.y + qatar!.height);
    await page.getByRole('button', { name: 'Remove checked bag 2', exact: true }).click();
    await expect(page.getByRole('spinbutton', { name: /^Checked bag 2\b/ })).toHaveCount(0);
    await expect(page.getByText(/^23 kg checked · 1 bags? · 2 airlines · one traveler$/)).toBeVisible();
  });
}

test('Indian airport shortcuts and worldwide routes retain four-airline comparison without granting student benefits', async ({ page }) => {
  await openCalculator(page);
  await page.getByRole('button', { name: 'DEL', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Departure airport (optional)', exact: true })).toHaveValue('DEL');
  await page.getByRole('combobox', { name: 'Destination country', exact: true }).selectOption('CA');
  await page.getByRole('combobox', { name: 'Destination airport (optional)', exact: true }).selectOption('YYZ');
  await page.getByRole('combobox', { name: 'Student verification status', exact: true }).selectOption('airline-verified');
  const selection = page.getByRole('region', { name: 'Choose airlines to compare', exact: true });
  await selection.getByRole('checkbox', { name: 'Air India', exact: true }).check();
  await selection.getByRole('checkbox', { name: 'Singapore Airlines', exact: true }).check();
  await expect(selection.getByRole('checkbox', { name: 'Lufthansa', exact: true })).toBeDisabled();
  await compare(page);
  await expect(page.locator('.baggage-result-card')).toHaveCount(4);
  await expect(page.locator('.baggage-outcome')).toHaveText(Array(4).fill('Needs airline confirmation'));
  await page.getByRole('combobox', { name: 'Departure country', exact: true }).selectOption('ZA');
  await expect(page.getByRole('combobox', { name: 'Departure airport (optional)', exact: true })).toHaveValue('');
  await page.getByRole('combobox', { name: 'Departure airport (optional)', exact: true }).selectOption('JNB');
  await expect(page.getByRole('combobox', { name: 'Departure airport (optional)', exact: true })).toHaveValue('JNB');
});
