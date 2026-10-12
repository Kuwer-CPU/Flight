import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const sdkUrl = 'https://tpwidg.com/wl_web/main.js?wl_id=23277';
const mockSdk = `
window.__flyoraMockSdkInitializations = (window.__flyoraMockSdkInitializations || 0) + 1;
const searchContainer = document.getElementById('tpwl-search');
const ticketsContainer = document.getElementById('tpwl-tickets');
if (!searchContainer || !ticketsContainer) throw new Error('Widget containers were not mounted before the module.');
const form = document.createElement('form');
form.setAttribute('aria-label', 'Mock partner flight search');
form.style.display = 'grid';
form.style.gap = '8px';
form.style.maxWidth = '100%';
const label = document.createElement('label');
label.textContent = 'Mock destination';
label.style.display = 'grid';
const input = document.createElement('input');
input.name = 'mock-destination';
input.style.minWidth = '0';
input.style.width = '100%';
label.append(input);
const button = document.createElement('button');
button.type = 'submit';
button.textContent = 'Show mock results';
form.append(label, button);
form.addEventListener('submit', event => {
  event.preventDefault();
  ticketsContainer.textContent = 'Mock results area: no provider request or live fares.';
});
searchContainer.append(form);
`;

const scriptResponse = {
  status: 200,
  contentType: 'application/javascript',
  headers: { 'Access-Control-Allow-Origin': '*' },
  body: mockSdk,
};

test.beforeEach(async ({ page, baseURL }) => {
  const applicationOrigin = new URL(baseURL!).origin;
  // Exact SDK mocks are registered after this guard and take precedence. Other
  // external resources are blocked so these checks cannot reach a real provider.
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    return ['http:', 'https:'].includes(url.protocol) && url.origin !== applicationOrigin
      ? route.abort('blockedbyclient') : route.continue();
  });
});

async function expectOneWidget(page: Page) {
  await expect(page.locator('#tpwl-search')).toHaveCount(1);
  await expect(page.locator('#tpwl-tickets')).toHaveCount(1);
  await expect(page.locator('script[src="' + sdkUrl + '"]')).toHaveCount(1);
  await expect(page.locator('script[src="' + sdkUrl + '"]')).toHaveAttribute('type', 'module');
}

// The separate partner server renders the real integration wrapper. The script
// below is a local module mock, not Travelpayouts availability or fare data.
test('the partner module loads after both containers and its DOM survives navigation through every travel tool', async ({ page }) => {
  test.setTimeout(60_000);
  const flightApiRequests: string[] = [];
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/flights') flightApiRequests.push(request.method()); });
  let scriptRequests = 0;
  let releaseSdk: (() => void) | undefined;
  const pendingSdk = new Promise<void>(resolve => { releaseSdk = resolve; });
  await page.route(sdkUrl, async route => {
    scriptRequests += 1;
    await pendingSdk;
    await route.fulfill(scriptResponse);
  });
  await page.goto('/');
  await expect(page.locator('#tpwl-search')).toHaveCount(0);
  await expect(page.locator('#tpwl-tickets')).toHaveCount(0);
  await expect(page.locator('script[src="' + sdkUrl + '"]')).toHaveCount(0);
  expect(scriptRequests).toBe(0);
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Flights', exact: true }).click();
  await expect(page).toHaveURL(/\/flights$/);
  await expect(page.getByText('Preparing partner flight search…', { exact: true })).toBeVisible();
  await expect(page.locator('#tpwl-search')).toHaveCount(1);
  await expect(page.locator('#tpwl-tickets')).toHaveCount(1);
  await expect(page.getByText('Live flight prices', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Select flight', exact: true })).toHaveCount(0);
  await expect(page.getByRole('form', { name: 'Mock partner flight search', exact: true })).toHaveCount(0);
  releaseSdk!();
  await expect(page.getByRole('form', { name: 'Mock partner flight search', exact: true })).toBeVisible();
  await expect(page.getByText('Preparing partner flight search…', { exact: true })).toHaveCount(0);
  await expectOneWidget(page);
  await page.getByLabel('Mock destination', { exact: true }).fill('Tokyo');
  await page.getByRole('button', { name: 'Show mock results', exact: true }).click();
  await expect(page.locator('#tpwl-tickets')).toContainText('no provider request or live fares');
  const tools = [
    ['Student Benefits', '/student-benefits'], ['Travel Calculator', '/travel-calculator'],
    ['Miles Wallet', '/miles-wallet'], ['Travel Checklist', '/travel-checklist'],
  ];
  for (const [name, path] of tools) {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(path + '$'));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('#tpwl-search')).toHaveCount(1);
    await expect(page.locator('#tpwl-tickets')).toHaveCount(1);
    await expect(page.locator('#tpwl-search')).not.toBeVisible();
    await expect(page.locator('#tpwl-tickets')).not.toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/flights$/);
    await expect(page.getByRole('form', { name: 'Mock partner flight search', exact: true })).toBeVisible();
    await expect(page.getByLabel('Mock destination', { exact: true })).toHaveValue('Tokyo');
    await expect(page.locator('#tpwl-tickets')).toContainText('no provider request or live fares');
    await expectOneWidget(page);
  }
  expect(await page.evaluate(() => (window as Window & { __flyoraMockSdkInitializations?: number }).__flyoraMockSdkInitializations)).toBe(1);
  expect(scriptRequests).toBe(1);
  expect(flightApiRequests).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('form', { name: 'Mock partner flight search', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // This checks Flyora's wrapper with the named mock controls. It does not
  // establish accessibility of the actual third-party search interface.
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations.map(violation => ({ id: violation.id, targets: violation.nodes.map(node => node.target) }))).toEqual([]);
});

test('a blocked partner module shows a controlled error and reload retries without native or demo fares', async ({ page }) => {
  const flightApiRequests: string[] = [];
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/flights') flightApiRequests.push(request.method()); });
  let failedRequests = 0;
  let successfulRequests = 0;
  let retryAllowed = false;
  await page.route(sdkUrl, async route => {
    if (!retryAllowed) { failedRequests += 1; await route.abort('blockedbyclient'); }
    else { successfulRequests += 1; await route.fulfill(scriptResponse); }
  });
  await page.goto('/flights');
  await expect(page.getByRole('alert').filter({ hasText: 'Flight search could not load.' })).toBeVisible();
  await expect(page.getByText('Live flight prices', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Preview mode', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Select flight', exact: true })).toHaveCount(0);
  retryAllowed = true;
  await page.getByRole('button', { name: 'Reload flight search', exact: true }).click();
  await expect(page.getByRole('form', { name: 'Mock partner flight search', exact: true })).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'Flight search could not load.' })).toHaveCount(0);
  await expectOneWidget(page);
  expect(await page.evaluate(() => (window as Window & { __flyoraMockSdkInitializations?: number }).__flyoraMockSdkInitializations)).toBe(1);
  expect(failedRequests).toBeGreaterThan(0);
  expect(successfulRequests).toBe(1);
  expect(flightApiRequests).toEqual([]);
});

test('a late successful module without rendered controls does not erase the search timeout', async ({ page }) => {
  await page.clock.install();
  let scriptRequests = 0;
  let releaseSdk: (() => void) | undefined;
  const pendingSdk = new Promise<void>(resolve => { releaseSdk = resolve; });
  await page.route(sdkUrl, async route => {
    scriptRequests += 1;
    await pendingSdk;
    await route.fulfill({ ...scriptResponse, body: 'window.__flyoraMockSdkInitializations = (window.__flyoraMockSdkInitializations || 0) + 1;' });
  });
  await page.goto('/flights', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('status').filter({ hasText: 'Preparing partner flight search…' })).toBeVisible();
  await expectOneWidget(page);
  await expect.poll(() => scriptRequests).toBe(1);
  await page.clock.fastForward(20_001);
  await expect(page.getByRole('alert').filter({ hasText: 'Flight search could not load.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reload flight search', exact: true })).toBeVisible();
  await page.locator('script[src="' + sdkUrl + '"]').evaluate(script => {
    const probe = window as Window & { __flyoraMockSdkLoadObserved?: boolean };
    probe.__flyoraMockSdkLoadObserved = false;
    script.addEventListener('load', () => { probe.__flyoraMockSdkLoadObserved = true; }, { once: true });
  });
  releaseSdk!();
  await expect.poll(() => page.evaluate(() => (window as Window & { __flyoraMockSdkLoadObserved?: boolean }).__flyoraMockSdkLoadObserved)).toBe(true);
  await page.clock.runFor(50);
  await expect(page.locator('[data-widget-phase]')).toHaveAttribute('data-widget-phase', 'timeout');
  await expect(page.getByRole('alert').filter({ hasText: 'Flight search could not load.' })).toBeVisible();
  await expect(page.getByText('Preparing partner flight search…', { exact: true })).toHaveCount(0);
  await expect(page.locator('#tpwl-search').locator('input, select, button, iframe')).toHaveCount(0);
  await expectOneWidget(page);
  expect(await page.evaluate(() => (window as Window & { __flyoraMockSdkInitializations?: number }).__flyoraMockSdkInitializations)).toBe(1);
});
