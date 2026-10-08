import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeSkyscannerOffers } from '../../src/lib/skyscanner';
import { defaults } from '../../src/lib/search';
import type { SearchQuery } from '../../src/lib/types';

const receivedAt = '2026-10-08T12:00:00.000Z';
function query(): SearchQuery { return { ...defaults(), origin: 'JFK', destination: 'LHR', adults: 2, returnDate: undefined }; }
function localDate(value: string, hour: number) { const [year, month, day] = value.split('-').map(Number); return { year, month, day, hour, minute: 0, second: 0 }; }
function rawResults(search = query()) {
  const departure = localDate(search.departureDate, 9), arrival = localDate(search.departureDate, 21);
  return {
    itineraries: { itinerary1: { legIds: ['out'], pricingOptions: [
      { agentIds: ['airline1'], price: { amount: '610000', unit: 'PRICE_UNIT_MILLI' }, items: [{ agentId: 'airline1', price: { amount: '610000', unit: 'PRICE_UNIT_MILLI' }, deepLink: 'https://www.britishairways.com/booking/offer?id=1' }] },
      { agentIds: ['agency1'], price: { amount: '53500', unit: 'PRICE_UNIT_CENTI' }, items: [{ agentId: 'agency1', price: { amount: '53500', unit: 'PRICE_UNIT_CENTI' }, deepLink: 'https://www.example-travel.com/booking/offer?id=1' }] },
    ] } },
    legs: { out: { originPlaceId: 'jfk', destinationPlaceId: 'lhr', departureDateTime: departure, arrivalDateTime: arrival, durationInMinutes: 420, segmentIds: ['segment1'] } },
    segments: { segment1: { originPlaceId: 'jfk', destinationPlaceId: 'lhr', departureDateTime: departure, arrivalDateTime: arrival, durationInMinutes: 420, marketingCarrierId: 'carrier1', operatingCarrierId: 'carrier1', marketingFlightNumber: '178' } },
    places: { jfk: { iata: search.origin, name: 'New York' }, lhr: { iata: search.destination, name: 'London' } },
    carriers: { carrier1: { iata: 'BA', name: 'British Airways' } },
    agents: { airline1: { name: 'British Airways', type: 'AGENT_TYPE_AIRLINE' }, agency1: { name: 'Example Travel', type: 'AGENT_TYPE_TRAVEL_AGENT' } },
  };
}
function envelope(results: unknown = rawResults(), status = 'RESULT_STATUS_COMPLETE', action = 'RESULT_ACTION_REPLACED', token = 'session-token') {
  return { sessionToken: token, status, action, content: { results } };
}
function response(payload: unknown, status = 200) { return new Response(JSON.stringify(payload), { status }); }
async function tick(milliseconds: number) { await vi.advanceTimersByTimeAsync(0); await vi.advanceTimersByTimeAsync(milliseconds); }

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('FLIGHT_PROVIDER', 'skyscanner'); vi.stubEnv('FLIGHT_DATA_MODE', 'live');
  vi.stubEnv('SKYSCANNER_ENVIRONMENT', 'production'); vi.stubEnv('SKYSCANNER_API_KEY', 'private-sky-key');
  vi.stubEnv('SKYSCANNER_PRICE_BASIS', 'group'); vi.stubEnv('SKYSCANNER_MARKET', 'UK'); vi.stubEnv('SKYSCANNER_LOCALE', 'en-GB');
  vi.stubEnv('AMADEUS_API_KEY', ''); vi.stubEnv('AMADEUS_API_SECRET', '');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('Skyscanner seller offer normalization', () => {
  it('shows airline and agency quotes for the same flight, sorted by whole-party price', () => {
    const offer = normalizeSkyscannerOffers(rawResults(), query(), receivedAt, 'group')[0];
    expect(offer).toMatchObject({ price: 535, currency: 'EUR', passengers: 2, mode: 'live', provider: 'skyscanner', airlineCode: 'BA', baggage: {} });
    expect(offer.bookingOffers).toMatchObject([
      { sellerName: 'Example Travel', sellerType: 'agency', price: 535, currency: 'EUR', retrievedAt: receivedAt },
      { sellerName: 'British Airways', sellerType: 'airline', price: 610, currency: 'EUR', retrievedAt: receivedAt },
    ]);
    expect(offer.price / offer.passengers).toBe(267.5);
    expect(offer.bookingOffers![0].bookingUrl).toBe('https://www.example-travel.com/booking/offer?id=1');
    expect(offer.itineraries[0].segments[0]).toMatchObject({ from: 'JFK', to: 'LHR', carrier: 'BA', flightNumber: '178', duration: 420 });
  });
  it('converts a confirmed per-person feed to group totals exactly once', () => {
    const offer = normalizeSkyscannerOffers(rawResults(), query(), receivedAt, 'per-person')[0];
    expect(offer.price).toBe(1070);
    expect(offer.bookingOffers!.map(s => s.price)).toEqual([1070, 1220]);
    expect(offer.price / offer.passengers).toBe(535);
  });
  it.each([['PRICE_UNIT_WHOLE', '610'], ['PRICE_UNIT_CENTI', '61000'], ['PRICE_UNIT_MILLI', '610000'], ['PRICE_UNIT_MICRO', '610000000']])('converts the %s scale without inventing a currency rate', (unit, amount) => {
    const raw = rawResults(); raw.itineraries.itinerary1.pricingOptions = [raw.itineraries.itinerary1.pricingOptions[0]];
    raw.itineraries.itinerary1.pricingOptions[0].price = { unit, amount };
    expect(normalizeSkyscannerOffers(raw, query(), receivedAt, 'group')[0].price).toBe(610);
  });
  it('uses the complete option quote, never a partial item price', () => {
    const raw = rawResults(); raw.itineraries.itinerary1.pricingOptions[0].items[0].price.amount = '1000';
    const offer = normalizeSkyscannerOffers(raw, query(), receivedAt, 'group')[0];
    expect(offer.bookingOffers!.find(s => s.sellerType === 'airline')!.price).toBe(610);
  });
  it('flags only an explicit self-transfer quote and leaves unknown transfer protection unset', () => {
    const raw = rawResults();
    Object.assign(raw.itineraries.itinerary1.pricingOptions[1], { transferType: 'TRANSFER_TYPE_SELF_TRANSFER' });
    const offer = normalizeSkyscannerOffers(raw, query(), receivedAt, 'group')[0];
    expect(offer.bookingOffers!.find(s => s.sellerType === 'agency')!.selfTransfer).toBe(true);
    expect(offer.bookingOffers!.find(s => s.sellerType === 'airline')!.selfTransfer).toBeUndefined();
    Object.assign(raw.itineraries.itinerary1.pricingOptions[1], { transferType: 'TRANSFER_TYPE_UNSPECIFIED' });
    expect(normalizeSkyscannerOffers(raw, query(), receivedAt, 'group')[0].bookingOffers!.every(s => s.selfTransfer === undefined)).toBe(true);
  });
  it('deduplicates an identical seller, link and quote but keeps distinct fare links', () => {
    const raw = rawResults(), option = raw.itineraries.itinerary1.pricingOptions[0];
    raw.itineraries.itinerary1.pricingOptions.push(structuredClone(option));
    const different = structuredClone(option); different.items[0].deepLink += '&fare=flex';
    raw.itineraries.itinerary1.pricingOptions.push(different);
    expect(normalizeSkyscannerOffers(raw, query(), receivedAt, 'group')[0].bookingOffers).toHaveLength(3);
  });
  it('omits split-ticket and mismatched agent options', () => {
    const raw = rawResults(); raw.itineraries.itinerary1.pricingOptions[0].items.push(structuredClone(raw.itineraries.itinerary1.pricingOptions[0].items[0]));
    expect(normalizeSkyscannerOffers(raw, query(), receivedAt, 'group')[0].bookingOffers).toHaveLength(1);
    raw.itineraries.itinerary1.pricingOptions[1].agentIds = ['airline1'];
    expect(normalizeSkyscannerOffers(raw, query(), receivedAt, 'group')).toEqual([]);
  });
  it.each(['PRICE_UNIT_UNSPECIFIED', 'USD', 'unknown'])('rejects the unknown price scale %s', unit => {
    const raw = rawResults(); raw.itineraries.itinerary1.pricingOptions[0].price.unit = unit;
    expect(normalizeSkyscannerOffers(raw, query(), receivedAt, 'group')[0].bookingOffers).toHaveLength(1);
  });
  it.each(['javascript:alert(1)', 'http://seller.example/offer', 'https://user:secret@seller.example/offer', 'https://127.0.0.1/offer', 'https://[::1]/offer', 'https://localhost/offer', 'https://host.internal/offer'])('rejects unsafe seller link %s', url => {
    const raw = rawResults(); raw.itineraries.itinerary1.pricingOptions[0].items[0].deepLink = url;
    expect(normalizeSkyscannerOffers(raw, query(), receivedAt, 'group')[0].bookingOffers).toHaveLength(1);
  });
  it('rejects mismatched quoted currency and malformed prices without discarding other sellers', () => {
    const raw = rawResults(); raw.itineraries.itinerary1.pricingOptions[0].price = { amount: '61000', unit: 'PRICE_UNIT_CENTI', currency: 'USD' } as never;
    expect(normalizeSkyscannerOffers(raw, query(), receivedAt, 'group')[0].bookingOffers).toHaveLength(1);
    raw.itineraries.itinerary1.pricingOptions[1].price.amount = '-53500';
    expect(normalizeSkyscannerOffers(raw, query(), receivedAt, 'group')).toEqual([]);
  });
  it('resolves each seller from the agent dictionary and preserves an unknown seller type', () => {
    const raw = rawResults(); raw.agents.agency1.type = 'AGENT_TYPE_UNSPECIFIED';
    expect(normalizeSkyscannerOffers(raw, query(), receivedAt, 'group')[0].bookingOffers![0].sellerType).toBe('unknown');
    delete (raw.agents as Partial<typeof raw.agents>).airline1;
    expect(normalizeSkyscannerOffers(raw, query(), receivedAt, 'group')[0].bookingOffers).toHaveLength(1);
  });
  it('requires canonical dictionaries, routing, dates and segment references', () => {
    const malformed = rawResults(); malformed.carriers = [] as never;
    expect(normalizeSkyscannerOffers(malformed, query(), receivedAt, 'group')).toEqual([]);
    const wrongRoute = rawResults(); wrongRoute.places.jfk.iata = 'CDG';
    expect(normalizeSkyscannerOffers(wrongRoute, query(), receivedAt, 'group')).toEqual([]);
    const badDate = rawResults(); badDate.legs.out.departureDateTime = { year: 2027, month: 2, day: 30, hour: 9, minute: 0, second: 0 };
    expect(normalizeSkyscannerOffers(badDate, query(), receivedAt, 'group')).toEqual([]);
    const missingSegment = rawResults(); missingSegment.legs.out.segmentIds = ['missing'];
    expect(normalizeSkyscannerOffers(missingSegment, query(), receivedAt, 'group')).toEqual([]);
  });
  it('discards a malformed itinerary while preserving valid quoted flights', () => {
    const raw = rawResults();
    (raw.itineraries as Record<string, unknown>).malformed = { legIds: ['missing'], pricingOptions: [] };
    expect(normalizeSkyscannerOffers(raw, query(), receivedAt, 'group')).toHaveLength(1);
  });
  it('normalizes both directions of a return trip and refuses missing return legs', () => {
    const search = { ...query(), returnDate: defaults().returnDate! };
    const raw = rawResults(search);
    raw.itineraries.itinerary1.legIds.push('back');
    const departure = localDate(search.returnDate, 11), arrival = localDate(search.returnDate, 14);
    (raw.legs as Record<string, unknown>).back = { originPlaceId: 'lhr', destinationPlaceId: 'jfk', departureDateTime: departure, arrivalDateTime: arrival, durationInMinutes: 480, segmentIds: ['segment2'] };
    (raw.segments as Record<string, unknown>).segment2 = { originPlaceId: 'lhr', destinationPlaceId: 'jfk', departureDateTime: departure, arrivalDateTime: arrival, durationInMinutes: 480, marketingCarrierId: 'carrier1', marketingFlightNumber: '179' };
    expect(normalizeSkyscannerOffers(raw, search, receivedAt, 'group')[0].itineraries).toHaveLength(2);
    raw.itineraries.itinerary1.legIds.pop();
    expect(normalizeSkyscannerOffers(raw, search, receivedAt, 'group')).toEqual([]);
  });
  it('does not infer standard bags or student benefits from unrelated provider fields', () => {
    const raw = rawResults();
    Object.assign(raw.itineraries.itinerary1, { baggage: { weight: 30, unit: 'KG' }, studentExample: { extraKg: 10 } });
    const offer = normalizeSkyscannerOffers(raw, query(), receivedAt, 'group')[0];
    expect(offer.baggage).toEqual({}); expect(offer.studentExample).toBeUndefined();
  });
});

describe('Skyscanner create and poll search', () => {
  it('uses a fixed backend endpoint, private key header and canonical create body', async () => {
    vi.stubEnv('SKYSCANNER_BASE_URL', 'https://untrusted.example');
    const fetchMock = vi.fn().mockResolvedValueOnce(response(envelope())); vi.stubGlobal('fetch', fetchMock);
    const { searchSkyscannerFlights } = await import('../../src/lib/skyscanner');
    const result = await searchSkyscannerFlights(query());
    expect(result).toMatchObject({ mode: 'live', coverage: { complete: true, source: 'skyscanner' } });
    expect(fetchMock.mock.calls[0][0]).toBe('https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create');
    const options = fetchMock.mock.calls[0][1];
    expect(options.headers['x-api-key']).toBe('private-sky-key');
    const body = JSON.parse(options.body);
    expect(body.query).toMatchObject({ market: 'UK', locale: 'en-GB', currency: 'EUR', adults: 2, cabinClass: 'CABIN_CLASS_ECONOMY' });
    const [year, month, day] = query().departureDate.split('-').map(Number);
    expect(body.query.queryLegs).toEqual([{ originPlaceId: { iata: 'JFK' }, destinationPlaceId: { iata: 'LHR' }, date: { year, month, day } }]);
    expect(body.query).not.toHaveProperty('age'); expect(body.query).not.toHaveProperty('student'); expect(body.query).not.toHaveProperty('baggage');
    expect(JSON.stringify(result)).not.toContain('private-sky-key');
  });
  it('sends both query legs and the selected cabin for a return-trip search', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response(envelope({}))); vi.stubGlobal('fetch', fetchMock);
    const { searchSkyscannerFlights } = await import('../../src/lib/skyscanner');
    const search = { ...query(), cabin: 'BUSINESS' as const, returnDate: defaults().returnDate };
    await searchSkyscannerFlights(search);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.query.cabinClass).toBe('CABIN_CLASS_BUSINESS');
    expect(body.query.queryLegs).toHaveLength(2);
    expect(body.query.queryLegs[1]).toMatchObject({ originPlaceId: { iata: 'LHR' }, destinationPlaceId: { iata: 'JFK' } });
    const [year, month, day] = search.returnDate!.split('-').map(Number);
    expect(body.query.queryLegs[1].date).toEqual({ year, month, day });
  });
  it('replaces initial prices with completed poll results rather than merging stale sellers', async () => {
    vi.useFakeTimers();
    const fresh = rawResults(); fresh.itineraries.itinerary1.pricingOptions = [fresh.itineraries.itinerary1.pricingOptions[0]];
    fresh.itineraries.itinerary1.pricingOptions[0].price.amount = '700000';
    const fetchMock = vi.fn().mockResolvedValueOnce(response(envelope(rawResults(), 'RESULT_STATUS_INCOMPLETE'))).mockResolvedValueOnce(response(envelope(fresh)));
    vi.stubGlobal('fetch', fetchMock);
    const { searchSkyscannerFlights } = await import('../../src/lib/skyscanner');
    const search = searchSkyscannerFlights(query());
    await tick(1000); const result = await search;
    expect(result.offers[0].price).toBe(700); expect(result.offers[0].bookingOffers).toHaveLength(1);
    expect(fetchMock.mock.calls[1][0]).toContain('/flights/live/search/poll/session-token');
    expect(result.coverage!.complete).toBe(true);
  });
  it.each(['RESULT_ACTION_NOT_MODIFIED', 'RESULT_ACTION_OMITTED'])('retains the previous snapshot for %s instead of merging omitted content', async action => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValueOnce(response(envelope(rawResults(), 'RESULT_STATUS_INCOMPLETE'))).mockResolvedValueOnce(response(envelope({ agents: 'invalid ignored content' }, 'RESULT_STATUS_COMPLETE', action)));
    vi.stubGlobal('fetch', fetchMock);
    const { searchSkyscannerFlights } = await import('../../src/lib/skyscanner');
    const search = searchSkyscannerFlights(query()); await tick(1000);
    const result = await search;
    expect(result.offers[0].price).toBe(535); expect(result.coverage!.complete).toBe(true);
  });
  it('bounds polling and explicitly marks usable received offers as partial', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValueOnce(response(envelope(rawResults(), 'RESULT_STATUS_INCOMPLETE')))
      .mockImplementation(() => Promise.resolve(response(envelope({}, 'RESULT_STATUS_INCOMPLETE', 'RESULT_ACTION_NOT_MODIFIED'))));
    vi.stubGlobal('fetch', fetchMock);
    const { searchSkyscannerFlights } = await import('../../src/lib/skyscanner');
    const search = searchSkyscannerFlights(query()); await tick(8000); const result = await search;
    expect(fetchMock).toHaveBeenCalledTimes(9);
    expect(result.coverage).toMatchObject({ complete: false, source: 'skyscanner' });
    expect(result.coverage!.message).toContain('more offers may be available');
    expect(result.offers[0].bookingOffers).toHaveLength(2);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('uses the newest session token and encodes it as a single poll path component', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValueOnce(response(envelope(rawResults(), 'RESULT_STATUS_INCOMPLETE')))
      .mockResolvedValueOnce(response(envelope({}, 'RESULT_STATUS_INCOMPLETE', 'RESULT_ACTION_NOT_MODIFIED', 'new/token?x=y')))
      .mockResolvedValueOnce(response(envelope({}, 'RESULT_STATUS_COMPLETE', 'RESULT_ACTION_NOT_MODIFIED')));
    vi.stubGlobal('fetch', fetchMock);
    const { searchSkyscannerFlights } = await import('../../src/lib/skyscanner');
    const search = searchSkyscannerFlights(query()); await tick(2000); await search;
    expect(fetchMock.mock.calls[2][0]).toContain('/poll/new%2Ftoken%3Fx%3Dy');
  });
  it('aborts a slow poll at the total 30-second deadline and reports received quotes as partial', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValueOnce(response(envelope(rawResults(), 'RESULT_STATUS_INCOMPLETE')))
      .mockImplementation((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true })));
    vi.stubGlobal('fetch', fetchMock);
    const { searchSkyscannerFlights } = await import('../../src/lib/skyscanner');
    const search = searchSkyscannerFlights(query()); await tick(30_000); const result = await search;
    expect(fetchMock).toHaveBeenCalledTimes(2); expect(result.coverage!.complete).toBe(false);
    expect(result.offers).toHaveLength(1); expect(vi.getTimerCount()).toBe(0);
  });
  it('does not cache partial results as if the search were complete', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(response(envelope(rawResults(), 'RESULT_STATUS_INCOMPLETE'))));
    vi.stubGlobal('fetch', fetchMock);
    const { searchSkyscannerFlights } = await import('../../src/lib/skyscanner');
    const first = searchSkyscannerFlights(query()); await tick(8000); await first;
    const second = searchSkyscannerFlights(query()); await tick(8000); await second;
    expect(fetchMock).toHaveBeenCalledTimes(18);
  });
  it('caches completed equivalent searches briefly and isolates rotated keys and price contracts', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(response(envelope()))); vi.stubGlobal('fetch', fetchMock);
    const { searchSkyscannerFlights } = await import('../../src/lib/skyscanner');
    const first = await searchSkyscannerFlights(query());
    await searchSkyscannerFlights({ ...query(), baggage: 40, age: 24, student: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.stubEnv('SKYSCANNER_PRICE_BASIS', 'per-person');
    const converted = await searchSkyscannerFlights(query()); expect(converted.offers[0].price).toBe(first.offers[0].price * 2);
    vi.stubEnv('SKYSCANNER_API_KEY', 'rotated-key'); await searchSkyscannerFlights(query());
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('coalesces simultaneous equivalent provider requests', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response(envelope())); vi.stubGlobal('fetch', fetchMock);
    const { searchSkyscannerFlights } = await import('../../src/lib/skyscanner');
    const [first, second] = await Promise.all([searchSkyscannerFlights(query()), searchSkyscannerFlights({ ...query(), baggage: 45 })]);
    expect(first).toEqual(second); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it.each([400, 401, 403, 429, 500])('surfaces HTTP %s without another-provider or demo fallback', async status => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response({ message: 'private upstream detail' }, status)); vi.stubGlobal('fetch', fetchMock);
    const { searchFlights } = await import('../../src/lib/flight-search');
    const error = await searchFlights(query()).catch(e => e);
    expect(error.status).toBe(status === 400 || status === 429 ? status : status === 500 ? 502 : 503);
    expect(error.message).not.toMatch(/private upstream detail|private-sky-key/); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it.each([['SKYSCANNER_API_KEY', ''], ['SKYSCANNER_PRICE_BASIS', ''], ['SKYSCANNER_ENVIRONMENT', 'test'], ['SKYSCANNER_MARKET', 'invalid']])('blocks %s configuration before outbound requests', async (variable, value) => {
    vi.stubEnv(variable, value); const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    const { searchFlights } = await import('../../src/lib/flight-search');
    await expect(searchFlights(query())).rejects.toMatchObject({ status: 503 }); expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(['RESULT_ACTION_UNKNOWN', 'RESULT_ACTION_UNSPECIFIED'])('rejects unsupported update action %s', async action => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response(envelope(rawResults(), 'RESULT_STATUS_COMPLETE', action))));
    const { searchSkyscannerFlights } = await import('../../src/lib/skyscanner');
    await expect(searchSkyscannerFlights(query())).rejects.toThrow('unsupported result update');
  });
  it.each(['RESULT_STATUS_FAILED', 'RESULT_STATUS_UNSPECIFIED'])('rejects provider status %s instead of inventing completion', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response(envelope(rawResults(), status))));
    const { searchSkyscannerFlights } = await import('../../src/lib/skyscanner');
    await expect(searchSkyscannerFlights(query())).rejects.toMatchObject({ status: 502 });
  });
  it('requires a session to poll and received quotes before returning an incomplete search', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response(envelope(rawResults(), 'RESULT_STATUS_INCOMPLETE', 'RESULT_ACTION_REPLACED', '')));
    vi.stubGlobal('fetch', fetchMock);
    const { searchSkyscannerFlights } = await import('../../src/lib/skyscanner');
    await expect(searchSkyscannerFlights(query())).rejects.toThrow('did not return a search session');
  });
  it('does not turn incomplete empty searches into a false no-flight result', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(response(envelope({}, 'RESULT_STATUS_INCOMPLETE')))));
    const { searchSkyscannerFlights } = await import('../../src/lib/skyscanner');
    const search = expect(searchSkyscannerFlights(query())).rejects.toThrow('No supported complete-itinerary seller quotes'); await tick(8000); await search;
  });
  it('refuses malformed replacement data rather than preserving a stale initial quote', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response(envelope(rawResults(), 'RESULT_STATUS_INCOMPLETE'))).mockResolvedValueOnce(response(envelope({ itineraries: ['invalid'] }))));
    const { searchSkyscannerFlights } = await import('../../src/lib/skyscanner');
    const search = expect(searchSkyscannerFlights(query())).rejects.toThrow('invalid result dictionaries'); await tick(1000); await search;
  });
  it('accepts an actual complete empty result and refuses unsupported seller-only rows', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response(envelope({}))).mockResolvedValueOnce(response(envelope({ itineraries: { bad: {} }, legs: {}, segments: {}, places: {}, carriers: {}, agents: {} })));
    vi.stubGlobal('fetch', fetchMock);
    const { searchSkyscannerFlights } = await import('../../src/lib/skyscanner');
    expect((await searchSkyscannerFlights(query())).offers).toEqual([]);
    await expect(searchSkyscannerFlights({ ...query(), adults: 1 })).rejects.toThrow('No supported complete-itinerary seller quotes');
  });
  it('retains explicit demo preview when the selected feed has no key or confirmed price basis', async () => {
    vi.stubEnv('FLIGHT_DATA_MODE', 'demo'); vi.stubEnv('SKYSCANNER_API_KEY', ''); vi.stubEnv('SKYSCANNER_PRICE_BASIS', '');
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    const { searchFlights } = await import('../../src/lib/flight-search');
    const result = await searchFlights(query()); expect(result.mode).toBe('demo'); expect(result.offers.length).toBeGreaterThan(0);
    expect(result.offers.every(offer => offer.provider === undefined)).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
