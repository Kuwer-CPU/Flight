import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('key pages and the booking dialog have no detected WCAG A/AA violations', async ({ page }) => {
  test.setTimeout(90_000);
  for (const path of ['/', '/student-perks', '/flights']) {
    await page.goto(path);
    if (path === '/flights') await page.getByRole('button', { name: 'Select flight', exact: true }).first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), 'Accessibility on ' + path).toEqual([]);
  }
  await page.getByRole('button', { name: 'Select flight', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const dialog = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(dialog.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), 'Accessibility in the booking dialog').toEqual([]);
});
