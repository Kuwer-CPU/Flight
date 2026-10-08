import { createHash } from 'node:crypto';
import type { BaggageAllowance, DataMode, FlightOffer, SearchQuery, SearchResponse } from './types';
import { airline } from './airlines';
import { demoFlights } from './demo';
import { getFlightConfig } from './flight-config';

export class FlightProviderError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}
type ProviderBag = { quantity?: number; weight?: number; weightUnit?: string };
type ProviderSettings = { mode: 'test' | 'live'; host: string; key: string; secret: string; identity: string };
type RecordValue = Record<string, unknown>;
function record(value: unknown): value is RecordValue {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function nonempty(value: unknown): value is string { return typeof value === 'string' && !!value.trim(); }
function localTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})?$/.test(value)) return false;
  const date = new Date(value.slice(0, 10) + 'T12:00:00Z');
  return !Number.isNaN(Date.parse(value)) && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value.slice(0, 10);
}
export function isoDuration(value: unknown) {
  if (typeof value !== 'string') return 0;
  const match = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value);
  if (!match) return 0;
  return Number(match[1] ?? 0) * 1440 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0) + Math.round(Number(match[4] ?? 0) / 60);
}
function conservativeBaggage(offer: RecordValue, adults: number, segmentIds: unknown[]): BaggageAllowance {
  if (!Array.isArray(offer.travelerPricings) || offer.travelerPricings.length !== adults ||
    segmentIds.some(id => !nonempty(id)) || new Set(segmentIds).size !== segmentIds.length) return {};
  const entries: ProviderBag[] = [];
  const travelerIds = new Set<string>();
  for (const traveler of offer.travelerPricings) {
    if (!record(traveler) || !nonempty(traveler.travelerId) || travelerIds.has(traveler.travelerId) || !Array.isArray(traveler.fareDetailsBySegment)) return {};
    travelerIds.add(traveler.travelerId);
    const details = new Map<string, RecordValue>();
    for (const detail of traveler.fareDetailsBySegment) {
      if (!record(detail) || !nonempty(detail.segmentId) || details.has(detail.segmentId)) return {};
      details.set(detail.segmentId, detail);
    }
    for (const id of segmentIds as string[]) {
      const bag = details.get(id)?.includedCheckedBags;
      if (!record(bag)) return {};
      entries.push({
        weight: typeof bag.weight === 'number' && Number.isFinite(bag.weight) && bag.weight >= 0 ? bag.weight : undefined,
        weightUnit: typeof bag.weightUnit === 'string' ? bag.weightUnit.toUpperCase() : undefined,
        quantity: typeof bag.quantity === 'number' && Number.isInteger(bag.quantity) && bag.quantity >= 0 ? bag.quantity : undefined,
      });
    }
  }
  // Check every traveler and segment, and never infer a weight from pieces.
  if (entries.length && entries.every(b => b.weight !== undefined && ['KG', 'LB'].includes(b.weightUnit ?? '') && b.weightUnit === entries[0].weightUnit)) {
    return { weight: Math.min(...entries.map(b => b.weight!)), unit: entries[0].weightUnit };
  }
  if (entries.length && entries.every(b => b.quantity !== undefined)) return { pieces: Math.min(...entries.map(b => b.quantity!)) };
  return {};
}
export function normalizeOffers(data: unknown[], query: SearchQuery, mode: DataMode, carriers: unknown = {}): FlightOffer[] {
  return data.flatMap(offer => {
    if (!record(offer) || !nonempty(offer.id) || !record(offer.price)) return [];
    const rawPrice = offer.price.grandTotal ?? offer.price.total;
    const price = typeof rawPrice === 'string' && rawPrice.trim() ? Number(rawPrice) : NaN;
    const currency = offer.price.currency;
    if (!Number.isFinite(price) || price <= 0 || typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency) ||
      !Array.isArray(offer.itineraries) || offer.itineraries.length !== (query.returnDate ? 2 : 1)) return [];
    const itineraries: FlightOffer['itineraries'] = [];
    const segmentIds: unknown[] = [];
    for (const itinerary of offer.itineraries) {
      if (!record(itinerary) || !Array.isArray(itinerary.segments) || !itinerary.segments.length) return [];
      const duration = isoDuration(itinerary.duration);
      if (!Number.isFinite(duration) || duration <= 0) return [];
      const segments: FlightOffer['itineraries'][number]['segments'] = [];
      for (const segment of itinerary.segments) {
        if (!record(segment) || !record(segment.departure) || !record(segment.arrival) ||
          typeof segment.departure.iataCode !== 'string' || !/^[A-Z]{3}$/.test(segment.departure.iataCode) ||
          typeof segment.arrival.iataCode !== 'string' || !/^[A-Z]{3}$/.test(segment.arrival.iataCode) ||
          !localTimestamp(segment.departure.at) || !localTimestamp(segment.arrival.at) ||
          !nonempty(segment.carrierCode) || !nonempty(segment.number)) return [];
        segmentIds.push(segment.id);
        segments.push({
          from: segment.departure.iataCode, to: segment.arrival.iataCode,
          departure: segment.departure.at, arrival: segment.arrival.at,
          duration: isoDuration(segment.duration), carrier: segment.carrierCode, flightNumber: segment.number,
          operatingCarrier: record(segment.operating) && nonempty(segment.operating.carrierCode) ? segment.operating.carrierCode : undefined,
        });
      }
      itineraries.push({ duration, segments });
    }
    const validatingCode = Array.isArray(offer.validatingAirlineCodes) ? offer.validatingAirlineCodes.find(nonempty) : undefined;
    const code = validatingCode ?? itineraries[0].segments[0].carrier;
    const providerName = record(carriers) && nonempty(carriers[code]) ? carriers[code] : undefined;
    return [{
      id: 'amadeus-' + mode + '-' + offer.id + '-' + query.origin + query.destination + query.departureDate + (query.returnDate ?? '') + '-' + query.adults + '-' + query.cabin + '-' + code + '-' + itineraries[0].segments[0].departure + '-' + price,
      airlineCode: code, airlineName: airline(code)?.name ?? providerName ?? code, price, currency,
      passengers: query.adults, cabin: query.cabin, baggage: conservativeBaggage(offer, query.adults, segmentIds), itineraries, mode,
    }];
  });
}
export function dataMode(): DataMode { return getFlightConfig().mode; }

const tokens = new Map<string, { value: string; expires: number }>();
const tokenPending = new Map<string, Promise<string>>();
const cache = new Map<string, { expires: number; response: SearchResponse }>();
const searchPending = new Map<string, Promise<SearchResponse>>();
function providerSettings(mode: 'test' | 'live'): ProviderSettings {
  const host = mode === 'live' ? 'https://api.amadeus.com' : 'https://test.api.amadeus.com';
  const key = process.env.AMADEUS_API_KEY!.trim();
  const secret = process.env.AMADEUS_API_SECRET!.trim();
  // Cache identity includes rotated secrets without storing them in cache keys.
  const identity = createHash('sha256').update(JSON.stringify([host, key, secret])).digest('hex');
  return { mode, host, key, secret, identity };
}
async function accessToken(settings: ProviderSettings) {
  const token = tokens.get(settings.identity);
  if (token && token.expires > Date.now()) return token.value;
  const pending = tokenPending.get(settings.identity);
  if (pending) return pending;
  const request = (async () => {
    const response = await fetch(settings.host + '/v1/security/oauth2/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: settings.key, client_secret: settings.secret }),
      signal: AbortSignal.timeout(15_000), cache: 'no-store',
    });
    if (response.status === 429) throw new FlightProviderError('Flight search is busy. Please try again in a minute.', 429);
    if (!response.ok) throw new FlightProviderError('The flight provider could not authenticate. The site owner should check the credentials and Amadeus environment.', 503);
    const payload: unknown = await response.json();
    if (!record(payload) || !nonempty(payload.access_token) || typeof payload.expires_in !== 'number' || !Number.isFinite(payload.expires_in) || payload.expires_in <= 0) {
      throw new FlightProviderError('The flight provider returned an invalid authentication response.');
    }
    if (tokens.size >= 10) tokens.delete(tokens.keys().next().value!);
    tokens.set(settings.identity, { value: payload.access_token, expires: Date.now() + Math.max(0, payload.expires_in - 60) * 1000 });
    return payload.access_token;
  })();
  tokenPending.set(settings.identity, request);
  try { return await request; } finally { tokenPending.delete(settings.identity); }
}
async function requestOffers(query: SearchQuery, settings: ProviderSettings): Promise<SearchResponse> {
  let bearer = await accessToken(settings);
  const params = new URLSearchParams({
    originLocationCode: query.origin, destinationLocationCode: query.destination, departureDate: query.departureDate,
    adults: String(query.adults), travelClass: query.cabin, currencyCode: 'EUR', max: '40',
  });
  if (query.returnDate) params.set('returnDate', query.returnDate);
  const request = () => fetch(settings.host + '/v2/shopping/flight-offers?' + params.toString(), {
    headers: { Authorization: 'Bearer ' + bearer }, cache: 'no-store', signal: AbortSignal.timeout(20_000),
  });
  let response = await request();
  if (response.status === 401) {
    // A provider can expire a token early. Refresh once; never turn failures into demos.
    if (tokens.get(settings.identity)?.value === bearer) tokens.delete(settings.identity);
    bearer = await accessToken(settings);
    response = await request();
  }
  if (!response.ok) {
    if (response.status === 401) {
      if (tokens.get(settings.identity)?.value === bearer) tokens.delete(settings.identity);
      throw new FlightProviderError('The flight provider could not authenticate this search. The site owner should check Amadeus access.', 503);
    }
    if (response.status === 429) throw new FlightProviderError('Flight search is busy. Please try again in a minute.', 429);
    if (response.status === 403) throw new FlightProviderError('Flight search access was denied. The site owner should check Amadeus production access and application permissions.', 503);
    if (response.status === 400) throw new FlightProviderError('The flight provider could not search these details. Try different airports, dates or a cabin class.', 400);
    throw new FlightProviderError('The flight provider is temporarily unavailable. Please try again.');
  }
  const payload: unknown = await response.json();
  if (!record(payload) || !Array.isArray(payload.data)) throw new FlightProviderError('The flight provider returned an invalid search response.');
  const offers = normalizeOffers(payload.data, query, settings.mode, record(payload.dictionaries) ? payload.dictionaries.carriers : undefined);
  if (payload.data.length && !offers.length) throw new FlightProviderError('The flight provider returned an invalid search response.');
  return { offers, mode: settings.mode, searchedAt: new Date().toISOString() };
}
export async function searchFlights(query: SearchQuery): Promise<SearchResponse> {
  const config = getFlightConfig();
  if (config.status === 'invalid-configuration' || config.status === 'missing-credentials') throw new FlightProviderError(config.message, 503);
  if (config.mode === 'demo') return { offers: demoFlights(query), mode: 'demo', searchedAt: new Date().toISOString() };
  const settings = providerSettings(config.mode);
  // Student profile fields are local comparison inputs, not distinct provider requests.
  const cacheKey = settings.identity + JSON.stringify([query.origin, query.destination, query.departureDate, query.returnDate, query.adults, query.cabin]);
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.response;
  const pending = searchPending.get(cacheKey);
  if (pending) return pending;
  const request = (async () => {
    try {
      const result = await requestOffers(query, settings);
      if (cache.size >= 50) cache.delete(cache.keys().next().value!);
      cache.set(cacheKey, { expires: Date.now() + 120_000, response: result });
      return result;
    } catch (error) {
      if (error instanceof FlightProviderError) throw error;
      throw new FlightProviderError('Flight search took too long or could not connect. Please try again.');
    }
  })();
  searchPending.set(cacheKey, request);
  try { return await request; } finally { searchPending.delete(cacheKey); }
}
