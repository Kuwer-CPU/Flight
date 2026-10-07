import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isoDuration, normalizeOffers } from '../../src/lib/amadeus';
import { defaults } from '../../src/lib/search';

function rawOffer() {
  return {
    id: '1', price: { total: '870.00', grandTotal: '900.00', currency: 'EUR' }, validatingAirlineCodes: ['QR'],
    itineraries: [{ duration: 'PT10H30M', segments: [
      { departure: { iataCode: 'CDG', at: '2026-10-28T09:00:00' }, arrival: { iataCode: 'DOH', at: '2026-10-28T16:00:00' }, duration: 'PT6H', carrierCode: 'QR', number: '40' },
      { departure: { iataCode: 'DOH', at: '2026-10-28T17:00:00' }, arrival: { iataCode: 'DEL', at: '2026-10-28T22:00:00' }, duration: 'PT3H30M', carrierCode: 'QR', number: '90' },
    ] }],
    travelerPricings: [{ fareDetailsBySegment: [{ includedCheckedBags: { weight: 30, weightUnit: 'KG' } }, { includedCheckedBags: { weight: 25, weightUnit: 'KG' } }] }],
  };
}
beforeEach(() => { vi.resetModules(); vi.stubEnv('FLIGHT_DATA_MODE', 'live'); vi.stubEnv('AMADEUS_ENVIRONMENT', 'test'); vi.stubEnv('AMADEUS_API_KEY', 'test-key'); vi.stubEnv('AMADEUS_API_SECRET', 'test-secret'); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe('provider normalization', () => {
  it('uses the complete group fare and the minimum allowance across segments', () => {
    const result = normalizeOffers([rawOffer()], { ...defaults(), adults: 2 }, 'test')[0];
    expect(result.price).toBe(900);
    expect(result.passengers).toBe(2);
    expect(result.baggage).toEqual({ weight: 25, unit: 'KG' });
    expect(result.itineraries[0].duration).toBe(630);
    expect(result.mode).toBe('test');
  });
  it('preserves uncertainty when any segment has no baggage information', () => {
    const offer = rawOffer();
    offer.travelerPricings[0].fareDetailsBySegment[1] = {} as never;
    expect(normalizeOffers([offer], defaults(), 'live')[0].baggage).toEqual({});
  });
  it('checks all travelers and keeps piece-based allowances as pieces', () => {
    const offer = rawOffer();
    offer.travelerPricings = [
      { fareDetailsBySegment: [{ includedCheckedBags: { quantity: 2 } }, { includedCheckedBags: { quantity: 2 } }] },
      { fareDetailsBySegment: [{ includedCheckedBags: { quantity: 1 } }, { includedCheckedBags: { quantity: 2 } }] },
    ] as never;
    expect(normalizeOffers([offer], { ...defaults(), adults: 2 }, 'live')[0].baggage).toEqual({ pieces: 1 });
  });
  it('drops malformed prices and handles multi-day durations', () => {
    const offer = rawOffer(); offer.price.total = 'bad'; offer.price.grandTotal = 'bad';
    expect(normalizeOffers([offer], defaults(), 'live')).toEqual([]);
    expect(isoDuration('P1DT2H15M')).toBe(1575);
    expect(isoDuration('garbage')).toBe(0);
  });
});
describe('Amadeus integration', () => {
  it.each([['GRU', 'CPT'], ['JFK', 'HND'], ['SYD', 'SIN']])('sends worldwide airport codes for %s → %s and preserves a provider empty result', async (origin, destination) => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'provider-token', expires_in: 1800 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { searchFlights } = await import('../../src/lib/amadeus');
    const result = await searchFlights({ ...defaults(), origin, destination });
    const request = new URL(fetchMock.mock.calls[1][0] as string);
    expect(request.searchParams.get('originLocationCode')).toBe(origin);
    expect(request.searchParams.get('destinationLocationCode')).toBe(destination);
    expect(result).toMatchObject({ mode: 'test', offers: [] });
  });
  it('authenticates server-side, sends the search parameters, and reuses cached results', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'provider-token', expires_in: 1800 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [rawOffer()] }), { status: 200 }));
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
    expect(searchURL.searchParams.has('age')).toBe(false);
    await searchFlights(query);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('surfaces provider failures without silently substituting sample offers', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('denied', { status: 401 })));
    const { searchFlights } = await import('../../src/lib/amadeus');
    await expect(searchFlights(defaults())).rejects.toThrow('authenticate');
  });
  it('requires both credentials in live mode', async () => {
    vi.stubEnv('AMADEUS_API_SECRET', '');
    const { searchFlights } = await import('../../src/lib/amadeus');
    await expect(searchFlights(defaults())).rejects.toThrow('credentials');
  });
  it('keeps sandbox and production modes distinct', async () => {
    const { dataMode } = await import('../../src/lib/amadeus');
    expect(dataMode()).toBe('test');
    vi.stubEnv('AMADEUS_ENVIRONMENT', 'production');
    expect(dataMode()).toBe('live');
    vi.stubEnv('FLIGHT_DATA_MODE', 'demo');
    expect(dataMode()).toBe('demo');
  });
});
