import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const sdkUrl = 'https://tpwidg.com/wl_web/main.js?wl_id=23277';
const mockResults = 'Mock results area: no provider request or live fares.';
const mockSdk = `
window.__flyoraMockSdkInitializations = (window.__flyoraMockSdkInitializations || 0) + 1;
window.__flyoraMockSdkSubmissions = 0;
const searchContainer = document.getElementById('tpwl-search');
const ticketsContainer = document.getElementById('tpwl-tickets');
if (!searchContainer || !ticketsContainer) throw new Error('Widget containers were not mounted before the module.');
const searchRoot = searchContainer.attachShadow({ mode: 'open' });
const ticketsRoot = ticketsContainer.attachShadow({ mode: 'open' });
const form = document.createElement('form');
form.setAttribute('aria-label', 'Mock partner flight search');
form.style.display = 'grid';
form.style.gap = '8px';
form.style.maxWidth = '100%';
function addField(name, labelText, type, value = '') {
  const label = document.createElement('label');
  label.textContent = labelText;
  label.style.display = 'grid';
  const input = document.createElement('input');
  input.name = name;
  input.type = type;
  input.value = value;
  input.required = true;
  input.style.minWidth = '0';
  input.style.width = '100%';
  input.style.boxSizing = 'border-box';
  label.append(input);
  form.append(label);
}
addField('mock-departure', 'Mock departure', 'text');
addField('mock-destination', 'Mock destination', 'text', 'NCE');
addField('mock-departure-date', 'Mock departure date', 'date');
addField('mock-return-date', 'Mock return date', 'date');
const travelerLabel = document.createElement('label');
travelerLabel.textContent = 'Mock travelers';
travelerLabel.style.display = 'grid';
const travelers = document.createElement('select');
travelers.name = 'mock-travelers';
travelers.style.minWidth = '0';
for (const value of ['1', '2', '3']) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = value;
  travelers.append(option);
}
travelerLabel.append(travelers);
const button = document.createElement('button');
button.type = 'submit';
button.textContent = 'Show mock results';
form.append(travelerLabel, button);
form.addEventListener('submit', event => {
  event.preventDefault();
  window.__flyoraMockSdkSubmissions += 1;
  const result = document.createElement('p');
  result.textContent = 'Mock results area: no provider request or live fares.';
  ticketsRoot.replaceChildren(result);
});
searchRoot.append(form);
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

async function expectOnlyPartnerFlightForm(page: Page) {
  await expect(page.locator('form:visible')).toHaveCount(1);
  await expect(page.getByRole('form', { name: 'Mock partner flight search', exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Departure airport', exact: true })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Arrival airport', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Search flights', exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Your search plan', exact: true })).toHaveCount(0);
}

function futureDate(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

for (const entryPath of ['/', '/flights']) {
  test('production CSP permits the observed results and collector connections from ' + entryPath, async ({ page, baseURL }) => {
    const observedEndpoints = [
      'https://tickets-api.eu-north-1.apistp.com/search/wl/results',
      'https://avsplow.com/a/j',
    ];
    const intercepted: string[] = [];
    await page.route(sdkUrl, route => route.fulfill(scriptResponse));
    for (const endpoint of observedEndpoints) {
      // A transport-only CSP probe: no actual provider request, result or tracking event.
      await page.route(endpoint, async route => {
        intercepted.push(route.request().url());
        await route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': new URL(baseURL!).origin } });
      });
    }
    const response = await page.goto(entryPath);
    const policy = response!.headers()['content-security-policy'];
    for (const endpoint of observedEndpoints) expect(policy).toContain(new URL(endpoint).origin);
    if (entryPath === '/') {
      await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Flights', exact: true }).click();
    }
    await expectOnlyPartnerFlightForm(page);
    const probe = await page.evaluate(async endpoints => {
      const violations: { directive: string; blockedURI: string }[] = [];
      const blocked = new Promise<void>(resolve => {
        document.addEventListener('securitypolicyviolation', event => {
          violations.push({ directive: event.effectiveDirective, blockedURI: event.blockedURI });
          if (event.blockedURI.startsWith('https://unreviewed-partner.example.test')) resolve();
        });
      });
      const statuses = await Promise.all(endpoints.map(async endpoint => (await fetch(endpoint)).status));
      const unreviewed = 'https://unreviewed-partner.example.test/csp-probe';
      let unreviewedBlocked = false;
      try { await fetch(unreviewed); } catch { unreviewedBlocked = true; }
      // CSP violation events are dispatched after the blocked fetch rejects.
      await blocked;
      return { statuses, violations, unreviewedBlocked };
    }, observedEndpoints);
    expect(probe.statuses).toEqual([204, 204]);
    expect(intercepted.sort()).toEqual([...observedEndpoints].sort());
    expect(probe.unreviewedBlocked).toBe(true);
    expect(probe.violations.some(violation => violation.directive === 'connect-src'
      && new URL(violation.blockedURI).origin === 'https://unreviewed-partner.example.test')).toBe(true);
    for (const endpoint of observedEndpoints) {
      expect(probe.violations.some(violation => violation.blockedURI.startsWith(new URL(endpoint).origin))).toBe(false);
    }
  });
}

// The separate partner server renders the real integration wrapper. The script
// below is a local module mock, not Travelpayouts availability or fare data.
test('the sole partner flight form and separate student notes preserve their state through SPA navigation', async ({ page }) => {
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
  await expect(page.locator('form:visible')).toHaveCount(1);
  await expect(page.locator('#luggage-calculator').getByRole('button', { name: 'Compare baggage & benefits' })).toBeVisible();
  releaseSdk!();
  await expectOnlyPartnerFlightForm(page);
  await expect(page.getByText('Preparing partner flight search…', { exact: true })).toHaveCount(0);
  await expectOneWidget(page);
  await expect(page.getByLabel('Mock departure', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Mock destination', { exact: true })).toHaveValue('NCE');
  await expect(page.getByLabel('Mock departure date', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Mock return date', { exact: true })).toHaveValue('');
  await expect(page.getByRole('combobox', { name: 'Mock travelers', exact: true })).toHaveValue('1');
  const departureDate = futureDate(21);
  const returnDate = futureDate(35);
  await page.getByLabel('Mock departure date', { exact: true }).fill(departureDate);
  await page.getByLabel('Mock return date', { exact: true }).fill(returnDate);
  await page.getByRole('combobox', { name: 'Mock travelers', exact: true }).selectOption('2');
  // This required-field validation belongs to the local HTML fixture; it is
  // not evidence of Travelpayouts field names or validation behavior.
  await page.getByRole('button', { name: 'Show mock results', exact: true }).click();
  expect(await page.getByLabel('Mock departure', { exact: true }).evaluate(input => (input as HTMLInputElement).checkValidity())).toBe(false);
  expect(await page.evaluate(() => (window as Window & { __flyoraMockSdkSubmissions?: number }).__flyoraMockSdkSubmissions)).toBe(0);
  await expect(page.locator('#tpwl-tickets').getByText(mockResults, { exact: true })).toHaveCount(0);
  await page.getByLabel('Mock departure', { exact: true }).fill('HND');
  await page.getByRole('button', { name: 'Show mock results', exact: true }).click();
  await expect(page.locator('#tpwl-tickets').getByText(mockResults, { exact: true })).toBeVisible();
  const studentAge = page.getByRole('spinbutton', { name: /^Student age \(optional\)/ });
  const neededBaggage = page.getByRole('spinbutton', { name: /^Checked baggage needed \(kg\)/ });
  const includedBaggage = page.getByRole('spinbutton', { name: /^Quoted included baggage \(kg\)/ });
  await expect(studentAge).toHaveValue('');
  await expect(neededBaggage).toHaveValue('');
  await expect(includedBaggage).toHaveValue('');
  await studentAge.fill('22');
  await neededBaggage.fill('30');
  await includedBaggage.fill('20');
  await expect(page.getByRole('status').filter({ hasText: '10 kg beyond your entered allowance.' })).toBeVisible();

  async function expectVendorFieldsUnchanged() {
    await expectOnlyPartnerFlightForm(page);
    await expect(page.getByLabel('Mock departure', { exact: true })).toHaveValue('HND');
    await expect(page.getByLabel('Mock destination', { exact: true })).toHaveValue('NCE');
    await expect(page.getByLabel('Mock departure date', { exact: true })).toHaveValue(departureDate);
    await expect(page.getByLabel('Mock return date', { exact: true })).toHaveValue(returnDate);
    await expect(page.getByRole('combobox', { name: 'Mock travelers', exact: true })).toHaveValue('2');
    await expect(page.locator('#tpwl-tickets').getByText(mockResults, { exact: true })).toBeVisible();
    await expect(studentAge).toHaveValue('22');
    await expect(neededBaggage).toHaveValue('30');
    await expect(includedBaggage).toHaveValue('20');
  }

  // Returning to Home must hide the retained partner fields, and the header's
  // SPA link restores the same document and vendor-owned state.
  await page.locator('header').getByRole('link', { name: 'Flyora home', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#tpwl-search')).not.toBeVisible();
  await expect(page.locator('form:visible')).toHaveCount(0);
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Flights', exact: true }).click();
  await expect(page).toHaveURL(/\/flights$/);
  await expectVendorFieldsUnchanged();
  const tools = [
    ['Student Benefits', '/student-benefits'], ['Trip Cost Calculator', '/travel-calculator'],
    ['Travel Essentials', '/travel-essentials'], ['Travel Checklist', '/travel-checklist'],
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
    await expectVendorFieldsUnchanged();
    await expectOneWidget(page);
  }
  expect(await page.evaluate(() => (window as Window & { __flyoraMockSdkInitializations?: number }).__flyoraMockSdkInitializations)).toBe(1);
  expect(await page.evaluate(() => (window as Window & { __flyoraMockSdkSubmissions?: number }).__flyoraMockSdkSubmissions)).toBe(1);
  expect(scriptRequests).toBe(1);
  expect(flightApiRequests).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => document.fonts.ready);
  await expectOnlyPartnerFlightForm(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // This checks Flyora's wrapper with the named mock controls. It does not
  // establish accessibility of the actual third-party search interface.
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations.map(violation => ({ id: violation.id, targets: violation.nodes.map(node => node.target) }))).toEqual([]);
});

test('a legacy Flyora query does not prefill the partner form or advertise a different itinerary', async ({ page }) => {
  const flightApiRequests: string[] = [];
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/flights') flightApiRequests.push(request.method()); });
  let scriptRequests = 0;
  await page.route(sdkUrl, async route => { scriptRequests += 1; await route.fulfill(scriptResponse); });
  const params = new URLSearchParams({
    origin: 'CDG', destination: 'DEL', departureDate: futureDate(72),
    returnDate: futureDate(93), adults: '3', cabin: 'BUSINESS', student: 'true', age: '24', baggage: '40',
  });
  await page.goto('/flights?' + params);
  await expectOnlyPartnerFlightForm(page);
  await expectOneWidget(page);
  await expect(page.getByLabel('Mock departure', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Mock destination', { exact: true })).toHaveValue('NCE');
  await expect(page.getByLabel('Mock departure date', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Mock return date', { exact: true })).toHaveValue('');
  await expect(page.getByRole('combobox', { name: 'Mock travelers', exact: true })).toHaveValue('1');
  await expect(page.getByRole('spinbutton', { name: /^Student age \(optional\)/ })).toHaveValue('');
  await expect(page.getByRole('spinbutton', { name: /^Checked baggage needed \(kg\)/ })).toHaveValue('');
  await expect(page.getByRole('spinbutton', { name: /^Quoted included baggage \(kg\)/ })).toHaveValue('');
  await expect(page.locator('.partner-journey')).toHaveCount(0);
  await expect(page.getByText('Live flight prices', { exact: true })).toHaveCount(0);
  await expect(page.locator('#tpwl-tickets').getByText(mockResults, { exact: true })).toHaveCount(0);
  expect(scriptRequests).toBe(1);
  expect(flightApiRequests).toEqual([]);
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
  await expectOnlyPartnerFlightForm(page);
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

test('a partner error button alone never counts as a rendered flight search', async ({ page }) => {
  await page.clock.install();
  let scriptRequests = 0;
  const flightApiRequests: string[] = [];
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/flights') flightApiRequests.push(request.method()); });
  await page.route(sdkUrl, async route => {
    scriptRequests += 1;
    await route.fulfill({ ...scriptResponse, body: `
      window.__flyoraMockSdkInitializations = (window.__flyoraMockSdkInitializations || 0) + 1;
      const placeholder = document.createElement('div');
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = 'Mock partner retry';
      placeholder.append(retry);
      document.getElementById('tpwl-search').attachShadow({ mode: 'open' }).append(placeholder);
    ` });
  });
  await page.goto('/flights', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Mock partner retry', exact: true })).toBeVisible();
  await expectOneWidget(page);
  await expect(page.locator('[data-widget-phase]')).toHaveAttribute('data-widget-phase', 'script-loaded');
  await expect(page.getByRole('status').filter({ hasText: 'Preparing partner flight search…' })).toBeVisible();
  await expect(page.locator('form:visible')).toHaveCount(0);
  await page.clock.fastForward(20_001);
  await expect(page.locator('[data-widget-phase]')).toHaveAttribute('data-widget-phase', 'timeout');
  await expect(page.getByRole('alert').filter({ hasText: 'Flight search could not load.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reload flight search', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mock partner retry', exact: true })).toBeVisible();
  expect(scriptRequests).toBe(1);
  expect(await page.evaluate(() => (window as Window & { __flyoraMockSdkInitializations?: number }).__flyoraMockSdkInitializations)).toBe(1);
  expect(flightApiRequests).toEqual([]);
});
