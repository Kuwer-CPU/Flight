import type { BaggageAllowance, Cabin, DataMode, FlightOffer, SearchQuery, SearchResponse } from './types';
import { airline } from './airlines';
import { demoFlights } from './demo';

export class FlightProviderError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}
type ProviderBag = { quantity?: number; weight?: number; weightUnit?: string };
type ProviderOffer = {
  id: string;
  price: { grandTotal?: string; total: string; currency: string };
  validatingAirlineCodes?: string[];
  itineraries: {
    duration: string;
    segments: { departure: { iataCode: string; at: string }; arrival: { iataCode: string; at: string }; duration?: string; carrierCode: string; number: string; operating?: { carrierCode: string } }[];
  }[];
  travelerPricings?: { fareDetailsBySegment: { cabin?: string; includedCheckedBags?: ProviderBag }[] }[];
};
export function isoDuration(value: string) {
  const match = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value);
  if (!match) return 0;
  return Number(match[1] ?? 0) * 1440 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0) + Math.round(Number(match[4] ?? 0) / 60);
}
function conservativeBaggage(offer: ProviderOffer): BaggageAllowance {
  const bags = offer.travelerPricings?.flatMap(p => p.fareDetailsBySegment.map(f => f.includedCheckedBags));
  if (!bags?.length || bags.some(b => !b)) return {};
  const entries = bags as ProviderBag[];
  // Do not turn a piece-based allowance into an invented weight allowance.
  if (entries.every(b => b.weight !== undefined && b.weightUnit === entries[0].weightUnit)) {
    return { weight: Math.min(...entries.map(b => b.weight!)), unit: entries[0].weightUnit };
  }
  if (entries.every(b => b.quantity !== undefined)) return { pieces: Math.min(...entries.map(b => b.quantity!)) };
  return {};
}
export function normalizeOffers(data: ProviderOffer[], query: SearchQuery, mode: DataMode, carriers: Record<string, string> = {}): FlightOffer[] {
  return data.flatMap(offer => {
    const price = Number(offer.price?.grandTotal ?? offer.price?.total);
    if (!Number.isFinite(price) || price <= 0 || !offer.itineraries?.length || offer.itineraries.some(i => !i.segments?.length)) return [];
    const code = offer.validatingAirlineCodes?.[0] ?? offer.itineraries[0].segments[0].carrierCode;
    const itineraries = offer.itineraries.map(it => ({
      duration: isoDuration(it.duration),
      segments: it.segments.map(s => ({ from: s.departure.iataCode, to: s.arrival.iataCode, departure: s.departure.at, arrival: s.arrival.at, duration: isoDuration(s.duration ?? ''), carrier: s.carrierCode, flightNumber: s.number, operatingCarrier: s.operating?.carrierCode })),
    }));
    if (itineraries.some(it => it.duration <= 0 || it.segments.some(s => !s.departure || !s.arrival))) return [];
    return [{
      id: 'amadeus-' + mode + '-' + offer.id + '-' + query.origin + query.destination + query.departureDate + (query.returnDate ?? '') + '-' + query.adults + '-' + query.cabin + '-' + code + '-' + itineraries[0].segments[0].departure + '-' + price,
      airlineCode: code, airlineName: airline(code)?.name ?? carriers[code] ?? code, price, currency: offer.price.currency, passengers: query.adults, cabin: query.cabin,
      baggage: conservativeBaggage(offer), itineraries, mode,
    }];
  });
}
export function dataMode(): DataMode {
  if (process.env.FLIGHT_DATA_MODE === 'demo') return 'demo';
  if (process.env.FLIGHT_DATA_MODE === 'live' || process.env.AMADEUS_API_KEY || process.env.AMADEUS_API_SECRET) {
    return process.env.AMADEUS_ENVIRONMENT === 'production' ? 'live' : 'test';
  }
  return 'demo';
}
let token: { value: string; expires: number; key: string } | undefined;
let tokenPending: Promise<string> | undefined;
const cache = new Map<string, { expires: number; response: SearchResponse }>();
function providerHost() {
  return process.env.AMADEUS_ENVIRONMENT === 'production' ? 'https://api.amadeus.com' : 'https://test.api.amadeus.com';
}
async function accessToken() {
  const key = process.env.AMADEUS_API_KEY;
  const secret = process.env.AMADEUS_API_SECRET;
  if (!key || !secret) throw new FlightProviderError('Live search is not connected yet. The site owner needs to add flight-provider credentials.', 503);
  const cacheKey = providerHost() + key;
  if (token && token.expires > Date.now() && token.key === cacheKey) return token.value;
  if (tokenPending) return tokenPending;
  tokenPending = (async () => {
    const response = await fetch(providerHost() + '/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: key, client_secret: secret }),
      signal: AbortSignal.timeout(15_000), cache: 'no-store',
    });
    if (!response.ok) throw new FlightProviderError('The flight provider could not authenticate. Please try again later.', 503);
    const payload = await response.json();
    if (typeof payload.access_token !== 'string' || typeof payload.expires_in !== 'number') throw new FlightProviderError('The flight provider returned an invalid authentication response.');
    token = { value: payload.access_token, expires: Date.now() + Math.max(0, payload.expires_in - 60) * 1000, key: cacheKey };
    return token.value;
  })();
  try { return await tokenPending; } finally { tokenPending = undefined; }
}
export async function searchFlights(query: SearchQuery): Promise<SearchResponse> {
  const mode = dataMode();
  if (mode === 'demo') return { offers: demoFlights(query), mode, searchedAt: new Date().toISOString() };
  const cacheKey = mode + JSON.stringify(query);
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.response;
  try {
    const bearer = await accessToken();
    const params = new URLSearchParams({
      originLocationCode: query.origin, destinationLocationCode: query.destination, departureDate: query.departureDate,
      adults: String(query.adults), travelClass: query.cabin, currencyCode: 'EUR', max: '40',
    });
    if (query.returnDate) params.set('returnDate', query.returnDate);
    const response = await fetch(providerHost() + '/v2/shopping/flight-offers?' + params.toString(), {
      headers: { Authorization: 'Bearer ' + bearer }, cache: 'no-store', signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      if (response.status === 401) token = undefined;
      throw new FlightProviderError(response.status === 429 ? 'Flight search is busy. Please try again in a minute.' : 'The flight provider is temporarily unavailable. Please try again.', response.status === 429 ? 429 : 502);
    }
    const payload = await response.json();
    if (!Array.isArray(payload.data)) throw new FlightProviderError('The flight provider returned an invalid search response.');
    const result: SearchResponse = { offers: normalizeOffers(payload.data, query, mode, payload.dictionaries?.carriers), mode, searchedAt: new Date().toISOString() };
    if (cache.size >= 50) cache.delete(cache.keys().next().value!);
    cache.set(cacheKey, { expires: Date.now() + 120_000, response: result });
    return result;
  } catch (error) {
    if (error instanceof FlightProviderError) throw error;
    throw new FlightProviderError('Flight search took too long or could not connect. Please try again.');
  }
}
