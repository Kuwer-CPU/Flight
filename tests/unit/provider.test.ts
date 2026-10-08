import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isoDuration, normalizeOffers } from '../../src/lib/amadeus';
import { defaults } from '../../src/lib/search';

function rawOffer(adults = 1, roundTrip = true) {
  const segments = [
    { id: '1', departure: { iataCode: 'CDG', at: '2026-10-28T09:00:00' }, arrival: { iataCode: 'DOH', at: '2026-10-28T16:00:00' }, duration: 'PT6H', carrierCode: 'QR', number: '40' },
    { id: '2', departure: { iataCode: 'DOH', at: '2026-10-28T17:00:00' }, arrival: { iataCode: 'DEL', at: '2026-10-28T22:00:00' }, duration: 'PT3H30M', carrierCode: 'QR', number: '90' },
  ];
  const returns = [
    { id: '3', departure: { iataCode: 'DEL', at: '2026-11-11T02:00:00' }, arrival: { iataCode: 'DOH', at: '2026-11-11T04:00:00' }, duration: 'PT4H30M', carrierCode: 'QR', number: '91' },
    { id: '4', departure: { iataCode: 'DOH', at: '2026-11-11T05:00:00' }, arrival: { iataCode: 'CDG', at: '2026-11-11T09:00:00' }, duration: 'PT6H', carrierCode: 'QR', number: '41' },
  ];
  return {
    id: '1', price: { total: '870.00', grandTotal: '900.00', currency: 'EUR' }, validatingAirlineCodes: ['QR'],
    itineraries: [{ duration: 'PT10H30M', segments }, ...(roundTrip ? [{ duration: 'PT11H30M', segments: returns }] : [])],
    travelerPricings: Array.from({ length: adults }, (_, i) => ({
      travelerId: String(i + 1),
      fareDetailsBySegment: [...segments, ...(roundTrip ? returns : [])].map((s, n) => ({
        segmentId: s.id, cabin: 'ECONOMY', includedCheckedBags: { weight: n === 1 ? 25 : 30, weightUnit: 'KG' },
      })),
    })),
  };
}
function tokenResponse(value = 'provider-token') {
  return new Response(JSON.stringify({ access_token: value, expires_in: 1800 }), { status: 200 });
}
function offersResponse(data: unknown[] = [rawOffer()]) {
  return new Response(JSON.stringify({ data }), { status: 200 });
}
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('FLIGHT_DATA_MODE', 'live'); vi.stubEnv('AMADEUS_ENVIRONMENT', 'test');
  vi.stubEnv('AMADEUS_API_KEY', 'test-key'); vi.stubEnv('AMADEUS_API_SECRET', 'test-secret');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('provider normalization', () => {
  it('uses the complete group fare and the minimum allowance across all travelers and both journeys', () => {
    const offer = rawOffer(2);
    offer.travelerPricings[1].fareDetailsBySegment[3].includedCheckedBags.weight = 20;
    const result = normalizeOffers([offer], { ...defaults(), adults: 2 }, 'test')[0];
    expect(result.price).toBe(900);
    expect(result.passengers).toBe(2);
    expect(result.baggage).toEqual({ weight: 20, unit: 'KG' });
    expect(result.itineraries[0].duration).toBe(630);
    expect(result.itineraries).toHaveLength(2);
    expect(result.mode).toBe('test');
  });
  it('preserves uncertainty when any segment has no baggage information', () => {
    const offer = rawOffer();
    offer.travelerPricings[0].fareDetailsBySegment[1] = { segmentId: '2', cabin: 'ECONOMY' } as never;
    expect(normalizeOffers([offer], defaults(), 'live')[0].baggage).toEqual({});
  });
  it('preserves an offer but keeps baggage unknown when any traveler or segment mapping is missing', () => {
    const missingTraveler = rawOffer();
    expect(normalizeOffers([missingTraveler], { ...defaults(), adults: 2 }, 'live')[0].baggage).toEqual({});
    const missingSegment = rawOffer();
    missingSegment.travelerPricings[0].fareDetailsBySegment.pop();
    expect(normalizeOffers([missingSegment], defaults(), 'live')[0].baggage).toEqual({});
    const malformedDetails = rawOffer();
    malformedDetails.travelerPricings[0].fareDetailsBySegment = undefined as never;
    expect(normalizeOffers([malformedDetails], defaults(), 'live')[0].baggage).toEqual({});
  });
  it('rejects duplicate mappings instead of treating incomplete coverage as confirmed baggage', () => {
    const offer = rawOffer();
    offer.travelerPricings[0].fareDetailsBySegment[3].segmentId = '1';
    expect(normalizeOffers([offer], defaults(), 'live')[0].baggage).toEqual({});
  });
  it('checks all travelers and keeps piece-based allowances as pieces', () => {
    const offer = rawOffer(2);
    for (const traveler of offer.travelerPricings) {
      for (const detail of traveler.fareDetailsBySegment) detail.includedCheckedBags = { quantity: traveler.travelerId === '1' ? 2 : 1 } as never;
    }
    expect(normalizeOffers([offer], { ...defaults(), adults: 2 }, 'live')[0].baggage).toEqual({ pieces: 1 });
  });
  it('does not invent weights for mixed units or malformed baggage values', () => {
    const mixed = rawOffer();
    mixed.travelerPricings[0].fareDetailsBySegment[1].includedCheckedBags.weightUnit = 'LB';
    expect(normalizeOffers([mixed], defaults(), 'live')[0].baggage).toEqual({});
    const negative = rawOffer();
    negative.travelerPricings[0].fareDetailsBySegment[1].includedCheckedBags.weight = -1;
    expect(normalizeOffers([negative], defaults(), 'live')[0].baggage).toEqual({});
  });
  it('drops individual malformed rows without discarding valid fares', () => {
    const badPrice = rawOffer(); badPrice.price.grandTotal = 'bad';
    const badCurrency = rawOffer(); badCurrency.price.currency = 'not-currency';
    const badSegment = rawOffer(); badSegment.itineraries[0].segments[0].departure = undefined as never;
    const badDate = rawOffer(); badDate.itineraries[0].segments[0].arrival.at = '2026-02-30T12:00:00';
    const results = normalizeOffers([null, {}, badPrice, badCurrency, badSegment, badDate, rawOffer()], defaults(), 'live');
    expect(results).toHaveLength(1);
    expect(results[0].price).toBe(900);
  });
  it('retains valid one-way fares and refuses a missing return itinerary for a round-trip search', () => {
    expect(normalizeOffers([rawOffer(1, false)], { ...defaults(), returnDate: undefined }, 'live')).toHaveLength(1);
    expect(normalizeOffers([rawOffer(1, false)], defaults(), 'live')).toEqual([]);
  });
  it('ignores any student example fields in provider responses', () => {
    const offer = { ...rawOffer(), studentExample: { extraKg: 50, verificationRequired: false, registrationRequired: false } };
    expect(normalizeOffers([offer], defaults(), 'live')[0].studentExample).toBeUndefined();
    expect(normalizeOffers([offer], defaults(), 'test')[0].studentExample).toBeUndefined();
  });
  it('uses provider carrier dictionaries for worldwide airlines outside the local directory', () => {
    const offer = rawOffer(); offer.validatingAirlineCodes = ['ZZ'];
    expect(normalizeOffers([offer], defaults(), 'live', { ZZ: 'Provider Airline' })[0].airlineName).toBe('Provider Airline');
  });
  it('handles multi-day durations and malformed duration values', () => {
    expect(isoDuration('P1DT2H15M')).toBe(1575);
    expect(isoDuration('garbage')).toBe(0);
    expect(isoDuration(undefined)).toBe(0);
  });
});

describe('Amadeus integration', () => {
  it.each([['GRU', 'CPT'], ['JFK', 'HND'], ['SYD', 'SIN']])('sends worldwide airport codes for %s → %s and preserves a provider empty result', async (origin, destination) => {
    const fetchMock = vi.fn().mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(offersResponse([]));
    vi.stubGlobal('fetch', fetchMock);
    const { searchFlights } = await import('../../src/lib/amadeus');
    const result = await searchFlights({ ...defaults(), origin, destination });
    const request = new URL(fetchMock.mock.calls[1][0] as string);
    expect(request.searchParams.get('originLocationCode')).toBe(origin);
    expect(request.searchParams.get('destinationLocationCode')).toBe(destination);
    expect(result).toMatchObject({ mode: 'test', offers: [] });
  });
  it('authenticates server-side, sends the search parameters, and reuses fares across local profile changes', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(offersResponse([rawOffer(2)]));
    vi.stubGlobal('fetch', fetchMock);
    const { searchFlights } = await import('../../src/lib/amadeus');
    const query = { ...defaults(), adults: 2 };
    const first = await searchFlights(query);
    expect(first.mode).toBe('test');
    expect(first.offers[0].price).toBe(900);
    const authBody = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(authBody.get('client_secret')).toBe('test-secret');
    const searchURL = new URL(fetchMock.mock.calls[1][0] as string);
    expect(searchURL.hostname).toBe('test.api.amadeus.com');
    expect(searchURL.searchParams.get('adults')).toBe('2');
    expect(searchURL.searchParams.get('returnDate')).toBe(query.returnDate);
    expect(searchURL.searchParams.get('currencyCode')).toBe('EUR');
    expect(searchURL.searchParams.has('age')).toBe(false);
    expect(searchURL.searchParams.has('baggage')).toBe(false);
    await searchFlights({ ...query, baggage: 40, age: 23, student: false });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('uses the production endpoint by default and labels successful provider fares live', async () => {
    vi.stubEnv('FLIGHT_DATA_MODE', ''); vi.stubEnv('AMADEUS_ENVIRONMENT', '');
    const fetchMock = vi.fn().mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(offersResponse());
    vi.stubGlobal('fetch', fetchMock);
    const { searchFlights } = await import('../../src/lib/amadeus');
    const result = await searchFlights(defaults());
    expect(result.mode).toBe('live');
    expect(result.offers[0].mode).toBe('live');
    expect(new URL(fetchMock.mock.calls[0][0] as string).hostname).toBe('api.amadeus.com');
    expect(new URL(fetchMock.mock.calls[1][0] as string).hostname).toBe('api.amadeus.com');
  });
  it('coalesces simultaneous equivalent searches and token authentication', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(offersResponse());
    vi.stubGlobal('fetch', fetchMock);
    const { searchFlights } = await import('../../src/lib/amadeus');
    const [first, second] = await Promise.all([searchFlights(defaults()), searchFlights({ ...defaults(), baggage: 40 })]);
    expect(first).toEqual(second);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('isolates caches when credentials rotate or the provider environment changes', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(tokenResponse('first')).mockResolvedValueOnce(offersResponse())
      .mockResolvedValueOnce(tokenResponse('rotated')).mockResolvedValueOnce(offersResponse())
      .mockResolvedValueOnce(tokenResponse('production')).mockResolvedValueOnce(offersResponse());
    vi.stubGlobal('fetch', fetchMock);
    const { searchFlights } = await import('../../src/lib/amadeus');
    await searchFlights(defaults());
    vi.stubEnv('AMADEUS_API_SECRET', 'rotated-secret');
    await searchFlights(defaults());
    vi.stubEnv('AMADEUS_ENVIRONMENT', 'production');
    const production = await searchFlights(defaults());
    expect(production.mode).toBe('live');
    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(new URL(fetchMock.mock.calls[4][0] as string).hostname).toBe('api.amadeus.com');
  });
  it('refreshes an expired provider token once and retries the real search', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(tokenResponse('expired'))
      .mockResolvedValueOnce(new Response('expired', { status: 401 }))
      .mockResolvedValueOnce(tokenResponse('fresh')).mockResolvedValueOnce(offersResponse());
    vi.stubGlobal('fetch', fetchMock);
    const { searchFlights } = await import('../../src/lib/amadeus');
    const result = await searchFlights(defaults());
    expect(result.mode).toBe('test');
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[3][1].headers.Authorization).toBe('Bearer fresh');
  });
  it('stops after one token refresh when provider searches remain unauthorized', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(tokenResponse('first'))
      .mockResolvedValueOnce(new Response('denied', { status: 401 }))
      .mockResolvedValueOnce(tokenResponse('second')).mockResolvedValueOnce(new Response('denied', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);
    const { searchFlights } = await import('../../src/lib/amadeus');
    await expect(searchFlights(defaults())).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
  it('surfaces authentication failures without exposing provider bodies or credentials', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('secret provider detail', { status: 401 })));
    const { searchFlights } = await import('../../src/lib/amadeus');
    const error = await searchFlights(defaults()).catch(e => e);
    expect(error).toMatchObject({ status: 503 });
    expect(error.message).toContain('authenticate');
    expect(error.message).not.toMatch(/secret provider detail|test-key|test-secret/);
  });
  it.each([['AMADEUS_API_KEY'], ['AMADEUS_API_SECRET']])('requires nonempty %s before any outbound request', async variable => {
    vi.stubEnv(variable, '   ');
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    const { searchFlights } = await import('../../src/lib/amadeus');
    await expect(searchFlights(defaults())).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([['FLIGHT_DATA_MODE', 'demoo'], ['AMADEUS_ENVIRONMENT', 'prod']])('rejects invalid %s before any outbound request', async (variable, value) => {
    vi.stubEnv(variable, value);
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    const { searchFlights } = await import('../../src/lib/amadeus');
    await expect(searchFlights(defaults())).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([400, 403, 429, 500])('surfaces provider HTTP %s without substituting demos', async status => {
    const fetchMock = vi.fn().mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(new Response('provider private error', { status }));
    vi.stubGlobal('fetch', fetchMock);
    const { searchFlights } = await import('../../src/lib/amadeus');
    await expect(searchFlights(defaults())).rejects.toMatchObject({ status: status === 403 ? 503 : status === 500 ? 502 : status });
  });
  it.each([null, { data: 'invalid' }, { data: [null, {}] }])('refuses malformed provider responses instead of claiming no availability', async payload => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(new Response(JSON.stringify(payload))));
    const { searchFlights } = await import('../../src/lib/amadeus');
    await expect(searchFlights(defaults())).rejects.toThrow('invalid search response');
  });
  it('surfaces network failures without a demo fallback or raw provider errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('private network detail')));
    const { searchFlights } = await import('../../src/lib/amadeus');
    await expect(searchFlights(defaults())).rejects.toThrow('could not connect');
  });
  it('only generates sample offers after an explicit demo setting', async () => {
    vi.stubEnv('FLIGHT_DATA_MODE', 'demo'); vi.stubEnv('AMADEUS_API_KEY', ''); vi.stubEnv('AMADEUS_API_SECRET', '');
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    const { searchFlights, dataMode } = await import('../../src/lib/amadeus');
    const result = await searchFlights(defaults());
    expect(dataMode()).toBe('demo');
    expect(result.mode).toBe('demo');
    expect(result.offers.length).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
