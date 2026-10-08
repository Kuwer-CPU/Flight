import { createHash } from 'node:crypto';
import type { BookingOffer, FlightOffer, FlightSegment, Itinerary, SearchQuery, SearchResponse } from './types';
import { FlightProviderError } from './amadeus';
import { getFlightConfig } from './flight-config';

// Optional partner adapter based on published v3 SDK models. Current official contract
// and live account access have not been verified; the owner must confirm price basis.
const BASE_URL = 'https://partners.api.skyscanner.net/apiservices/v3';
const SEARCH_TIMEOUT = 30_000;
const MAX_POLLS = 8;
const POLL_INTERVAL = 1_000;
type ValueRecord = Record<string, unknown>;
type PriceBasis = 'group' | 'per-person';
type Results = { itineraries: ValueRecord; legs: ValueRecord; segments: ValueRecord; places: ValueRecord; carriers: ValueRecord; agents: ValueRecord };
type Settings = { key: string; market: string; locale: string; basis: PriceBasis };
function record(value: unknown): value is ValueRecord { return !!value && typeof value === 'object' && !Array.isArray(value); }
function nonempty(value: unknown): value is string { return typeof value === 'string' && !!value.trim(); }
function lookup(dictionary: ValueRecord, id: unknown): ValueRecord | undefined {
  if (!nonempty(id) || !Object.hasOwn(dictionary, id)) return undefined;
  return record(dictionary[id]) ? dictionary[id] : undefined;
}
function readResults(value: unknown): Results | undefined {
  if (!record(value)) return undefined;
  const fields = ['itineraries', 'legs', 'segments', 'places', 'carriers', 'agents'] as const;
  if (Object.keys(value).length && !fields.some(field => Object.hasOwn(value, field))) return undefined;
  const itineraries = value.itineraries ?? {};
  if (!record(itineraries)) return undefined;
  const result = { itineraries } as Results;
  for (const field of fields.slice(1)) {
    const dictionary = value[field] ?? {};
    if (!record(dictionary) || (Object.keys(itineraries).length && !Object.hasOwn(value, field))) return undefined;
    result[field] = dictionary;
  }
  return result;
}
function price(value: unknown): number | undefined {
  if (!record(value) || typeof value.amount !== 'string' || !/^\d+(?:\.\d+)?$/.test(value.amount) ||
    (value.currency !== undefined && value.currency !== 'EUR')) return undefined;
  const scales: Record<string, number> = { PRICE_UNIT_WHOLE: 1, PRICE_UNIT_CENTI: 100, PRICE_UNIT_MILLI: 1000, PRICE_UNIT_MICRO: 1_000_000 };
  if (typeof value.unit !== 'string' || !Object.hasOwn(scales, value.unit)) return undefined;
  const amount = Number(value.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > Number.MAX_SAFE_INTEGER) return undefined;
  return amount / scales[value.unit];
}
function bookingUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 8192) return undefined;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') ||
      !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(hostname) || hostname === 'localhost' ||
      /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(hostname)) return undefined;
    return url.href;
  } catch { return undefined; }
}
function timestamp(value: unknown): string | undefined {
  if (!record(value)) return undefined;
  const year = value.year, month = value.month, day = value.day;
  const hour = value.hour ?? 0, minute = value.minute ?? 0, second = value.second ?? 0;
  const parts = [year, month, day, hour, minute, second];
  if (parts.some(p => typeof p !== 'number' || !Number.isInteger(p)) ||
    (year as number) < 1900 || (year as number) > 9999 || (month as number) < 1 || (month as number) > 12 ||
    (day as number) < 1 || (day as number) > 31 || (hour as number) < 0 || (hour as number) > 23 ||
    (minute as number) < 0 || (minute as number) > 59 || (second as number) < 0 || (second as number) > 59) return undefined;
  const padded = (part: number) => String(part).padStart(2, '0');
  const date = year + '-' + padded(month as number) + '-' + padded(day as number);
  if (new Date(date + 'T12:00:00Z').toISOString().slice(0, 10) !== date) return undefined;
  return date + 'T' + padded(hour as number) + ':' + padded(minute as number) + ':' + padded(second as number);
}
function airportCode(value: ValueRecord | undefined): string | undefined {
  return value && typeof value.iata === 'string' && /^[A-Z]{3}$/.test(value.iata) ? value.iata : undefined;
}
function carrierCode(value: ValueRecord | undefined): string | undefined {
  return value && typeof value.iata === 'string' && /^[A-Z0-9]{2}$/.test(value.iata) ? value.iata : undefined;
}
function positiveMinutes(value: unknown): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value > 0; }
function normalizeItineraries(value: ValueRecord, results: Results, query: SearchQuery): Itinerary[] | undefined {
  if (!Array.isArray(value.legIds) || value.legIds.length !== (query.returnDate ? 2 : 1) || new Set(value.legIds).size !== value.legIds.length) return undefined;
  const itineraries: Itinerary[] = [];
  const seenSegments = new Set<string>();
  for (const [index, id] of value.legIds.entries()) {
    const leg = lookup(results.legs, id);
    if (!leg || !positiveMinutes(leg.durationInMinutes) || !Array.isArray(leg.segmentIds) || !leg.segmentIds.length) return undefined;
    const origin = airportCode(lookup(results.places, leg.originPlaceId));
    const destination = airportCode(lookup(results.places, leg.destinationPlaceId));
    const departure = timestamp(leg.departureDateTime), arrival = timestamp(leg.arrivalDateTime);
    if (origin !== (index === 0 ? query.origin : query.destination) || destination !== (index === 0 ? query.destination : query.origin) ||
      !departure || !arrival || departure.slice(0, 10) !== (index === 0 ? query.departureDate : query.returnDate)) return undefined;
    const segments: FlightSegment[] = [];
    for (const segmentId of leg.segmentIds) {
      if (!nonempty(segmentId) || seenSegments.has(segmentId)) return undefined;
      seenSegments.add(segmentId);
      const segment = lookup(results.segments, segmentId);
      if (!segment || !positiveMinutes(segment.durationInMinutes) || !nonempty(segment.marketingFlightNumber)) return undefined;
      const from = airportCode(lookup(results.places, segment.originPlaceId));
      const to = airportCode(lookup(results.places, segment.destinationPlaceId));
      const leaves = timestamp(segment.departureDateTime), arrives = timestamp(segment.arrivalDateTime);
      const carrier = carrierCode(lookup(results.carriers, segment.marketingCarrierId));
      if (!from || !to || !leaves || !arrives || !carrier || (segments.length && segments.at(-1)!.to !== from)) return undefined;
      segments.push({ from, to, departure: leaves, arrival: arrives, duration: segment.durationInMinutes,
        carrier, flightNumber: segment.marketingFlightNumber,
        operatingCarrier: carrierCode(lookup(results.carriers, segment.operatingCarrierId)),
      });
    }
    if (segments[0].from !== origin || segments.at(-1)!.to !== destination || segments[0].departure !== departure || segments.at(-1)!.arrival !== arrival) return undefined;
    itineraries.push({ duration: leg.durationInMinutes, segments });
  }
  return itineraries;
}

/** Both offer and seller prices are group totals after the owner's explicit basis selection. */
export function normalizeSkyscannerOffers(input: unknown, query: SearchQuery, retrievedAt: string, basis: PriceBasis): FlightOffer[] {
  const results = readResults(input);
  if (!results || (basis !== 'group' && basis !== 'per-person')) return [];
  return Object.entries(results.itineraries).flatMap(([itineraryId, value]) => {
    if (!record(value) || !Array.isArray(value.pricingOptions)) return [];
    const itineraries = normalizeItineraries(value, results, query);
    if (!itineraries) return [];
    const sellers: BookingOffer[] = [];
    const seen = new Set<string>();
    for (const option of value.pricingOptions) {
      // Multiple items/agents can be separate-ticket bundles. They are not seller alternatives.
      if (!record(option) || !Array.isArray(option.items) || option.items.length !== 1 ||
        !Array.isArray(option.agentIds) || option.agentIds.length !== 1 || !nonempty(option.agentIds[0])) continue;
      const item = option.items[0];
      if (!record(item) || item.agentId !== option.agentIds[0]) continue;
      const agent = lookup(results.agents, item.agentId);
      const amount = price(option.price);
      const url = bookingUrl(item.deepLink);
      if (!agent || !nonempty(agent.name) || amount === undefined || !url) continue;
      const groupPrice = amount * (basis === 'per-person' ? query.adults : 1);
      if (!Number.isFinite(groupPrice) || groupPrice <= 0 || groupPrice > Number.MAX_SAFE_INTEGER) continue;
      const unique = JSON.stringify([item.agentId, url, groupPrice]);
      if (seen.has(unique)) continue;
      seen.add(unique);
      const sellerType = agent.type === 'AGENT_TYPE_AIRLINE' ? 'airline' : agent.type === 'AGENT_TYPE_TRAVEL_AGENT' ? 'agency' : 'unknown';
      sellers.push({ id: 'skyscanner-seller-' + createHash('sha256').update(unique).digest('hex').slice(0, 20),
        sellerId: item.agentId as string, sellerName: agent.name.trim(), sellerType,
        price: groupPrice, currency: 'EUR', bookingUrl: url, retrievedAt,
        selfTransfer: option.transferType === 'TRANSFER_TYPE_SELF_TRANSFER' ? true : undefined,
      });
    }
    if (!sellers.length) return [];
    sellers.sort((a, b) => a.price - b.price || a.sellerName.localeCompare(b.sellerName));
    const firstSegment = itineraries[0].segments[0];
    const sourceCarrier = Object.values(results.carriers).find(c => record(c) && c.iata === firstSegment.carrier);
    const airlineName = record(sourceCarrier) && nonempty(sourceCarrier.name) ? sourceCarrier.name : firstSegment.carrier;
    return [{ id: 'skyscanner-' + createHash('sha256').update(JSON.stringify([itineraryId, query.origin, query.destination, query.departureDate, query.returnDate, query.adults, query.cabin])).digest('hex').slice(0, 24),
      airlineCode: firstSegment.carrier, airlineName, price: sellers[0].price, currency: 'EUR', passengers: query.adults,
      cabin: query.cabin, itineraries, baggage: {}, mode: 'live' as const, provider: 'skyscanner' as const, bookingOffers: sellers,
    }];
  });
}
function date(value: string) { const [year, month, day] = value.split('-').map(Number); return { year, month, day }; }
function createQuery(query: SearchQuery, settings: Settings) {
  const queryLegs = [{ originPlaceId: { iata: query.origin }, destinationPlaceId: { iata: query.destination }, date: date(query.departureDate) }];
  if (query.returnDate) queryLegs.push({ originPlaceId: { iata: query.destination }, destinationPlaceId: { iata: query.origin }, date: date(query.returnDate) });
  return { query: { market: settings.market, locale: settings.locale, currency: 'EUR', adults: query.adults,
    cabinClass: 'CABIN_CLASS_' + query.cabin, queryLegs } };
}
function pause(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const aborted = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', aborted); resolve(); }, milliseconds);
    if (signal.aborted) aborted(); else signal.addEventListener('abort', aborted, { once: true });
  });
}
async function request(path: string, settings: Settings, signal: AbortSignal, body?: unknown): Promise<ValueRecord> {
  const response = await fetch(BASE_URL + path, {
    method: 'POST', headers: { 'x-api-key': settings.key, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal, cache: 'no-store',
  });
  if (!response.ok) {
    if (response.status === 429) throw new FlightProviderError('Seller flight search is busy. Please try again in a minute.', 429);
    if (response.status === 401 || response.status === 403) throw new FlightProviderError('Seller flight search access was denied. The site owner should check the approved Skyscanner partner key and permissions.', 503);
    if (response.status === 400) throw new FlightProviderError('The seller flight provider could not search these details. Try different airports, dates or a cabin class.', 400);
    throw new FlightProviderError('The seller flight provider is temporarily unavailable. Please try again.');
  }
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new FlightProviderError('The seller flight provider returned an invalid search response.'); }
  if (!record(payload)) throw new FlightProviderError('The seller flight provider returned an invalid search response.');
  return payload;
}
async function runSearch(query: SearchQuery, settings: Settings): Promise<SearchResponse> {
  const controller = new AbortController();
  const deadline = Date.now() + SEARCH_TIMEOUT;
  const timeout = setTimeout(() => controller.abort(new DOMException('Search deadline exceeded.', 'TimeoutError')), SEARCH_TIMEOUT);
  let snapshot: Results | undefined;
  let snapshotAt = '';
  let sessionToken: string | undefined;
  let complete = false;
  try {
    let payload = await request('/flights/live/search/create', settings, controller.signal, createQuery(query, settings));
    for (let polls = 0; ; polls++) {
      if (payload.status === 'RESULT_STATUS_FAILED') throw new FlightProviderError('The seller flight provider could not complete this search. Please try again.');
      if (payload.status !== 'RESULT_STATUS_COMPLETE' && payload.status !== 'RESULT_STATUS_INCOMPLETE') throw new FlightProviderError('The seller flight provider returned an invalid search status.');
      if (nonempty(payload.sessionToken)) sessionToken = payload.sessionToken;
      if (payload.action === 'RESULT_ACTION_REPLACED') {
        snapshot = record(payload.content) ? readResults(payload.content.results) : undefined;
        if (!snapshot) throw new FlightProviderError('The seller flight provider returned invalid result dictionaries.');
        snapshotAt = new Date().toISOString();
      } else if (payload.action !== 'RESULT_ACTION_NOT_MODIFIED' && payload.action !== 'RESULT_ACTION_OMITTED') {
        throw new FlightProviderError('The seller flight provider returned an unsupported result update.');
      }
      if (payload.status === 'RESULT_STATUS_COMPLETE') { complete = true; break; }
      if (polls >= MAX_POLLS || Date.now() >= deadline) break;
      if (!sessionToken) throw new FlightProviderError('The seller flight provider did not return a search session.');
      await pause(Math.min(POLL_INTERVAL, Math.max(0, deadline - Date.now())), controller.signal);
      if (Date.now() >= deadline) break;
      payload = await request('/flights/live/search/poll/' + encodeURIComponent(sessionToken), settings, controller.signal);
    }
  } catch (error) {
    if (error instanceof FlightProviderError) throw error;
    // Only the bounded search deadline may yield explicitly partial received results.
    if (!controller.signal.aborted || !snapshot) throw new FlightProviderError('Seller flight search could not connect or took too long. Please try again.');
  } finally { clearTimeout(timeout); }
  if (!snapshot) throw new FlightProviderError('The seller flight provider did not return search results.');
  const offers = normalizeSkyscannerOffers(snapshot, query, snapshotAt, settings.basis);
  if ((!complete || Object.keys(snapshot.itineraries).length) && !offers.length) {
    throw new FlightProviderError('No supported complete-itinerary seller quotes were returned. Split-ticket bundles and incomplete prices cannot be compared. Try another search.');
  }
  return { offers, mode: 'live', searchedAt: new Date().toISOString(), coverage: { source: 'skyscanner', complete,
    message: complete
      ? 'Seller quotes received for this search. Confirm final price and availability with the seller. Split-ticket options are excluded.'
      : 'This search did not finish. These are the seller quotes received so far; more offers may be available. Split-ticket options are excluded.',
  } };
}
const cache = new Map<string, { expires: number; result: SearchResponse }>();
const pending = new Map<string, Promise<SearchResponse>>();
export async function searchSkyscannerFlights(query: SearchQuery): Promise<SearchResponse> {
  const config = getFlightConfig();
  if (config.provider !== 'skyscanner' || config.mode !== 'live' || config.status !== 'configured') throw new FlightProviderError(config.provider === 'skyscanner' ? config.message : 'Skyscanner seller search is not selected.', 503);
  const key = process.env.SKYSCANNER_API_KEY!.trim();
  const market = process.env.SKYSCANNER_MARKET?.trim() || 'UK', locale = process.env.SKYSCANNER_LOCALE?.trim() || 'en-GB';
  const basis = process.env.SKYSCANNER_PRICE_BASIS!.trim() as PriceBasis;
  const identity = createHash('sha256').update(JSON.stringify([key, market, locale, basis])).digest('hex');
  const settings: Settings = { key, market, locale, basis };
  const cacheKey = identity + JSON.stringify([query.origin, query.destination, query.departureDate, query.returnDate, query.adults, query.cabin]);
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.result;
  const inProgress = pending.get(cacheKey);
  if (inProgress) return inProgress;
  const search = runSearch(query, settings).then(result => {
    if (result.coverage?.complete) {
      if (cache.size >= 50) cache.delete(cache.keys().next().value!);
      cache.set(cacheKey, { expires: Date.now() + 60_000, result });
    }
    return result;
  });
  pending.set(cacheKey, search);
  try { return await search; } finally { pending.delete(cacheKey); }
}
