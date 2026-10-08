import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { BookingOffer, FlightOffer, SearchResponse } from '../../src/lib/types';

// Provider-shaped responses are intercepted locally; no live search, seller
// booking or provider account is exercised by these browser checks.
const sellerLinks = {
  agency: 'https://www.expedia.com/Flights-Search?booking=mock-provider-quote-1',
  airline: 'https://www.qatarairways.com/booking/flight-selection?quote=mock-provider-quote-2',
  unknown: 'https://www.example.com/reservation?quote=mock-provider-quote-3',
};

function fixture() {
  const departureDate = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const searchedAt = new Date().toISOString();
  const query = new URLSearchParams({ origin: 'CDG', destination: 'DOH', departureDate, adults: '2', cabin: 'ECONOMY', student: 'true', age: '22', baggage: '30' });
  const quote = (id: string, sellerName: string, sellerType: BookingOffer['sellerType'], price: number, bookingUrl: string): BookingOffer => ({
    id, sellerId: id, sellerName, sellerType, price, currency: 'EUR', bookingUrl, retrievedAt: searchedAt,
  });
  const offer: FlightOffer = {
    id: 'skyscanner-mocked-itinerary', airlineCode: 'QR', airlineName: 'Qatar Airways',
    price: 1198.50, currency: 'EUR', passengers: 2, cabin: 'ECONOMY', mode: 'live', provider: 'skyscanner', baggage: {},
    itineraries: [{ duration: 380, segments: [{ from: 'CDG', to: 'DOH', departure: departureDate + 'T09:10:00', arrival: departureDate + 'T17:30:00', duration: 380, carrier: 'QR', flightNumber: '42' }] }],
    bookingOffers: [
      quote('qr-direct', 'Qatar Airways', 'airline', 1259.98, sellerLinks.airline),
      { ...quote('unknown-agent', 'Independent booking site', 'unknown', 1214.50, sellerLinks.unknown), selfTransfer: true },
      quote('expedia-agent', 'Expedia', 'agency', 1198.50, sellerLinks.agency),
      quote('unsafe-http', 'Insecure Seller', 'agency', 10, 'http://www.example.com/booking'),
      quote('unsafe-script', 'Invalid Link', 'agency', 1, 'javascript:alert(1)'),
    ],
  };
  const response: SearchResponse = { mode: 'live', searchedAt, offers: [offer], coverage: { complete: false, source: 'skyscanner', message: 'Global best price guaranteed.' } };
  return { url: '/flights?' + query, response };
}

test('compares returned airline and agency quotes with precise group prices and seller-specific links', async ({ page }) => {
  const { url, response } = fixture();
  await page.route('**/api/flights?**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(response) }));
  await page.goto(url);
  await expect(page.getByRole('button', { name: 'Select flight', exact: true })).toHaveCount(1);
  const summary = page.getByLabel('Booking prices for Qatar Airways');
  await expect(summary).toContainText('3 booking sites returned');
  await expect(summary.locator('li').first()).toContainText('Expedia');
  await expect(summary.locator('li').first()).toContainText('€599.25');
  await expect(summary.locator('li').last()).toContainText('€629.99');
  await expect(page.locator('.flight-price')).toContainText('€1,198.50 total');
  await expect(page.getByText('Some sellers are still being checked. Compare the prices returned so far.', { exact: true })).toBeVisible();
  await expect(page.getByText('Global best price guaranteed.', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Select flight', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const comparison = dialog.getByRole('region', { name: 'Compare booking prices', exact: true });
  const rows = comparison.getByRole('table').locator('tbody tr');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('Expedia');
  await expect(rows.nth(0)).toContainText('Travel agency');
  await expect(rows.nth(0)).toContainText('€599.25');
  await expect(rows.nth(0)).toContainText('€1,198.50');
  await expect(rows.nth(0)).toContainText('for 2 adults');
  await expect(rows.nth(0)).toContainText('Lowest returned');
  await expect(rows.nth(1)).toContainText('Independent booking site');
  await expect(rows.nth(1)).toContainText('Seller type unconfirmed');
  await expect(rows.nth(1)).toContainText('€607.25');
  await expect(rows.nth(1)).toContainText('Self-transfer: confirm connection protection');
  await expect(rows.nth(0).getByText('Self-transfer: confirm connection protection', { exact: true })).toHaveCount(0);
  await expect(rows.nth(2)).toContainText('Qatar Airways');
  await expect(rows.nth(2).getByText('Airline', { exact: true })).toBeVisible();
  await expect(rows.nth(2)).toContainText('€629.99');
  await expect(comparison.getByText('Check seller', { exact: true })).toHaveCount(3);
  await expect(comparison.getByText(/kg|checked bag/)).toHaveCount(0);
  await expect(dialog.getByRole('link', { name: 'Book with Expedia', exact: true })).toHaveAttribute('href', sellerLinks.agency);
  await expect(dialog.getByRole('link', { name: 'Book with Qatar Airways', exact: true })).toHaveAttribute('href', sellerLinks.airline);
  await expect(dialog.getByRole('link', { name: 'Book with Independent booking site', exact: true })).toHaveAttribute('href', sellerLinks.unknown);
  await expect(dialog.getByRole('link', { name: 'Book with Expedia', exact: true })).toHaveAttribute('target', '_blank');
  await expect(dialog.getByRole('link', { name: 'Book with Expedia', exact: true })).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(dialog.getByRole('link', { name: /^Continue to/ })).toHaveCount(0);
  await expect(dialog.getByRole('link', { name: /Insecure Seller|Invalid Link/ })).toHaveCount(0);
  await expect(dialog.locator('a[href^="http:"], a[href^="javascript:"], a[href*="skyscanner.net/"]')).toHaveCount(0);
  await expect(dialog.getByText(/Booking and payment take place on its website/)).toBeVisible();
  await expect(dialog.locator('.example-policy-note, .value-score')).toHaveCount(0);
});

test('booking price comparison stays within mobile screens and passes accessibility checks', async ({ page }) => {
  const { url, response } = fixture();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/flights?**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(response) }));
  await page.goto(url);
  await page.getByRole('button', { name: 'Select flight', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Compare booking prices', exact: true })).toBeVisible();
  const tableScroll = dialog.getByRole('region', { name: 'Scrollable booking price comparison' });
  expect(await tableScroll.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(391);
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations.map(violation => ({ id: violation.id, targets: violation.nodes.map(node => node.target) }))).toEqual([]);
});

test('a provider fare without seller quotes uses an honest airline search handoff', async ({ page }) => {
  const { url, response } = fixture();
  const offer = { ...response.offers[0], provider: 'amadeus' as const, bookingOffers: undefined, baggage: { weight: 23, unit: 'KG' } };
  await page.route('**/api/flights?**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ...response, offers: [offer], coverage: undefined }) }));
  await page.goto(url);
  await expect(page.getByLabel('Booking prices for Qatar Airways')).toHaveCount(0);
  await page.getByRole('button', { name: 'Select flight', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('region', { name: 'Compare booking prices', exact: true })).toHaveCount(0);
  await expect(dialog.locator('.booking-note')).toContainText('provider fare, not a confirmed airline website price');
  await expect(dialog.getByRole('link', { name: /Search on Qatar Airways/ })).toHaveAttribute('href', 'https://www.qatarairways.com/');
  await expect(dialog.getByRole('link', { name: /^Book with/ })).toHaveCount(0);
});

test('an unknown airline without seller checkout links returns to flight search', async ({ page }) => {
  const { url, response } = fixture();
  const offer = { ...response.offers[0], airlineCode: 'ZZ', airlineName: 'Unlisted Airline', bookingOffers: undefined };
  await page.route('**/api/flights?**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ...response, offers: [offer], coverage: undefined }) }));
  await page.goto(url);
  await page.getByRole('button', { name: 'Select flight', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('link', { name: 'Return to flight search', exact: true })).toHaveAttribute('href', '/#search');
  await expect(dialog.locator('.booking-note')).toContainText('A seller-specific booking link is not available');
  await expect(dialog.getByRole('link', { name: /^Book with|^Search on/ })).toHaveCount(0);
  await expect(dialog.locator('a[href*="skyscanner"], a[href*="google.com/travel"]')).toHaveCount(0);
});
