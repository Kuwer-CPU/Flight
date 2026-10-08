import { test, expect } from '@playwright/test';
import type { FlightOffer, SearchQuery, SearchResponse } from '../../src/lib/types';

// These normalized responses simulate the API boundary. They do not exercise
// Amadeus, require credentials, or claim that these fares are actually available.
function futureDate(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

function liveQuery(): SearchQuery {
  return { origin: 'JFK', destination: 'HND', departureDate: futureDate(21), adults: 2, cabin: 'ECONOMY', student: true, age: 22, baggage: 30 };
}

function searchUrl(query: SearchQuery) {
  return '/flights?' + new URLSearchParams(Object.entries(query).map(([key, value]) => [key, String(value)]));
}

function liveOffers(query: SearchQuery, firstPrice = 1598): FlightOffer[] {
  const nextDay = new Date(query.departureDate + 'T12:00:00Z');
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const arrivalDate = nextDay.toISOString().slice(0, 10);
  return [
    {
      id: 'live-provider-qr-1', airlineCode: 'QR', airlineName: 'Qatar Airways',
      price: firstPrice, currency: 'EUR', passengers: query.adults, cabin: query.cabin,
      mode: 'live', baggage: { weight: 23, unit: 'KG' },
      itineraries: [{
        duration: 1535,
        segments: [
          { from: query.origin, to: 'DOH', departure: query.departureDate + 'T01:20:00', arrival: query.departureDate + 'T21:05:00', duration: 765, carrier: 'QR', flightNumber: '704' },
          { from: 'DOH', to: query.destination, departure: query.departureDate + 'T23:05:00', arrival: arrivalDate + 'T15:55:00', duration: 650, carrier: 'QR', flightNumber: '810' },
        ],
      }],
    },
    {
      id: 'live-provider-ek-2', airlineCode: 'EK', airlineName: 'Emirates',
      price: 1750, currency: 'EUR', passengers: query.adults, cabin: query.cabin,
      mode: 'live', baggage: { pieces: 1 },
      itineraries: [{
        duration: 1415,
        segments: [
          { from: query.origin, to: 'DXB', departure: query.departureDate + 'T11:20:00', arrival: arrivalDate + 'T08:05:00', duration: 765, carrier: 'EK', flightNumber: '202' },
          { from: 'DXB', to: query.destination, departure: arrivalDate + 'T10:05:00', arrival: arrivalDate + 'T23:55:00', duration: 530, carrier: 'EK', flightNumber: '312' },
        ],
      }],
    },
  ];
}

function liveResponse(query: SearchQuery, searchedAt: string, price?: number): SearchResponse {
  return { mode: 'live', searchedAt, offers: liveOffers(query, price) };
}

test('simulated live results preserve provider fares and baggage and hand booking to the airline', async ({ page }) => {
  const query = liveQuery();
  const searchedAt = new Date().toISOString();
  await page.route('**/api/flights?**', route => route.fulfill({
    contentType: 'application/json', body: JSON.stringify(liveResponse(query, searchedAt)),
  }));
  await page.goto(searchUrl(query));

  await expect(page.getByText('Live flight prices', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Select flight', exact: true })).toHaveCount(2);
  await expect(page.locator('.fare-freshness time')).toHaveAttribute('datetime', searchedAt);
  await expect(page.locator('.fare-freshness')).toContainText('Confirm the final fare with the airline.');
  await expect(page.getByText('Preview mode', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Provider sandbox', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Sample fare per adult', { exact: true })).toHaveCount(0);

  const qatar = page.locator('.flight-card').filter({ has: page.getByRole('heading', { name: 'Qatar Airways', exact: true }) });
  await expect(qatar.locator('.flight-price')).toContainText('Fare per adult');
  await expect(qatar.locator('.flight-price')).toContainText('€799');
  await expect(qatar.locator('.flight-price')).toContainText('€1,598 total');
  await expect(qatar.locator('.flight-benefits')).toContainText('23 kg checked bag');
  await expect(qatar.getByLabel('Student baggage comparison for Qatar Airways')).toContainText('Check offer');
  await expect(qatar.getByLabel('Student baggage comparison for Qatar Airways')).toContainText('Terms unverified');
  await expect(qatar.locator('.eligible-total')).toContainText('To confirm');
  await expect(qatar.locator('.comparable-cost')).toContainText('Check add-on price');

  const emirates = page.locator('.flight-card').filter({ has: page.getByRole('heading', { name: 'Emirates', exact: true }) });
  await expect(emirates.locator('.flight-benefits')).toContainText('1 checked bag');
  await expect(emirates.getByLabel('Student baggage comparison for Emirates').locator('.baggage-equation')).toContainText('1 checked bag');
  await expect(emirates.getByLabel('Student baggage comparison for Emirates').locator('.baggage-equation')).not.toContainText('23');

  const table = page.getByRole('table');
  await expect(table.locator('tbody tr')).toHaveCount(2);
  await expect(table.getByText('Unverified', { exact: true })).toHaveCount(2);
  await expect(table.getByText('Pending', { exact: true })).toHaveCount(2);
  await expect(page.locator('.comparison-bonus, .value-score, .example-policy-note')).toHaveCount(0);

  await qatar.getByRole('button', { name: 'Select flight', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.booking-summary')).toContainText('Total for 2 adults');
  await expect(dialog.locator('.booking-summary')).toContainText('€1,598');
  await expect(dialog.locator('.booking-note')).toContainText('The airline confirms availability, final price and payment.');
  await expect(dialog.locator('.booking-note')).not.toContainText('sample');
  await expect(dialog.getByRole('link', { name: /Continue to Qatar Airways/ })).toHaveAttribute('href', 'https://www.qatarairways.com/');
  await expect(dialog.getByRole('link', { name: /Continue to Qatar Airways/ })).toHaveAttribute('target', '_blank');
  await expect(dialog.getByText(/No student discount or extra allowance has been added/)).toBeVisible();
});

test('a failed subsequent live search clears old quotes and retry waits for a fresh provider response', async ({ page }) => {
  const query = liveQuery();
  const firstTimestamp = new Date(Date.now() - 60_000).toISOString();
  const freshTimestamp = new Date().toISOString();
  let retryRequested = false;
  let failedRequests = 0;
  let retryRequests = 0;
  let releaseRetry: (() => void) | undefined;
  const retryPending = new Promise<void>(resolve => { releaseRetry = resolve; });
  const expectedDeparture = futureDate(22);
  await page.route('**/api/flights?**', async route => {
    const parameters = new URL(route.request().url()).searchParams;
    // Dev Strict Mode can mount the effect twice and abort its first request.
    // Match the query/explicit retry phase instead of assuming one initial fetch.
    if (parameters.get('departureDate') === query.departureDate) {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(liveResponse(query, firstTimestamp)) });
    } else if (!retryRequested) {
      expect(parameters.get('departureDate')).toBe(expectedDeparture);
      failedRequests += 1;
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'The flight provider is temporarily unavailable. Please try again.' }) });
    } else {
      retryRequests += 1;
      await retryPending;
      expect(parameters.get('departureDate')).toBe(expectedDeparture);
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(liveResponse({ ...query, departureDate: expectedDeparture }, freshTimestamp, 2000)) });
    }
  });
  await page.goto(searchUrl(query));
  await expect(page.getByRole('button', { name: 'Select flight', exact: true })).toHaveCount(2);
  await expect(page.locator('.fare-freshness time')).toHaveAttribute('datetime', firstTimestamp);

  await page.getByLabel('Departure date', { exact: true }).fill(expectedDeparture);
  await page.getByRole('button', { name: 'Search flights', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'The flight provider is temporarily unavailable.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Select flight', exact: true })).toHaveCount(0);
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.locator('.fare-freshness')).toHaveCount(0);
  await expect(page.getByText('Live flight prices', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Preview mode', { exact: true })).toHaveCount(0);

  retryRequested = true;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Searching flights' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Select flight', exact: true })).toHaveCount(0);
  await expect(page.locator('.fare-freshness')).toHaveCount(0);
  releaseRetry!();
  await expect(page.getByRole('button', { name: 'Select flight', exact: true })).toHaveCount(2);
  await expect(page.locator('.fare-freshness time')).toHaveAttribute('datetime', freshTimestamp);
  const qatar = page.locator('.flight-card').filter({ has: page.getByRole('heading', { name: 'Qatar Airways', exact: true }) });
  await expect(qatar.locator('.flight-price')).toContainText('€1,000');
  await expect(qatar.locator('.flight-price')).toContainText('€2,000 total');
  await expect(qatar.locator('.flight-price')).not.toContainText('€799');
  await expect(page.locator('.results-empty[role="alert"]')).toHaveCount(0);
  expect(failedRequests).toBeGreaterThan(0);
  expect(retryRequests).toBeGreaterThan(0);
});
