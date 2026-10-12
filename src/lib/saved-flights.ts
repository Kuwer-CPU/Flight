import type { FlightOffer } from './types';

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function text(value: unknown, max = 200): value is string { return typeof value === 'string' && value.length > 0 && value.length <= max; }
function positive(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && value > 0; }
function timestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/.test(value)) return false;
  if (Number(value.slice(11, 13)) > 23 || Number(value.slice(14, 16)) > 59 || Number(value.slice(17, 19) || '0') > 59) return false;
  const date = value.slice(0, 10);
  return Number.isFinite(Date.parse(value)) && new Date(date + 'T12:00:00Z').toISOString().slice(0, 10) === date;
}

/** Each corrupt browser snapshot is discarded independently before UI formatting. */
export function validSavedFlight(value: unknown): value is FlightOffer {
  if (!record(value) || !text(value.id) || typeof value.airlineCode !== 'string' || !/^[A-Z0-9]{2}$/.test(value.airlineCode) || !text(value.airlineName) ||
    !positive(value.price) || value.currency !== 'EUR' || typeof value.passengers !== 'number' ||
    !Number.isInteger(value.passengers) || value.passengers < 1 || value.passengers > 9 ||
    typeof value.cabin !== 'string' || !['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS'].includes(value.cabin) ||
    typeof value.mode !== 'string' || !['demo', 'test', 'live'].includes(value.mode) || !record(value.baggage)) return false;
  const bag = value.baggage;
  if ((bag.weight !== undefined && (typeof bag.weight !== 'number' || !Number.isFinite(bag.weight) || bag.weight < 0)) ||
    (bag.pieces !== undefined && (typeof bag.pieces !== 'number' || !Number.isInteger(bag.pieces) || bag.pieces < 0)) ||
    (bag.unit !== undefined && (typeof bag.unit !== 'string' || !['KG', 'LB'].includes(bag.unit)))) return false;
  return Array.isArray(value.itineraries) && value.itineraries.length >= 1 && value.itineraries.length <= 2 &&
    value.itineraries.every(itinerary => record(itinerary) && positive(itinerary.duration) &&
      Array.isArray(itinerary.segments) && itinerary.segments.length > 0 && itinerary.segments.length <= 20 &&
      itinerary.segments.every(segment => record(segment) && typeof segment.from === 'string' && /^[A-Z]{3}$/.test(segment.from) &&
        typeof segment.to === 'string' && /^[A-Z]{3}$/.test(segment.to) && timestamp(segment.departure) && timestamp(segment.arrival) &&
        positive(segment.duration) && typeof segment.carrier === 'string' && /^[A-Z0-9]{2}$/.test(segment.carrier) && text(segment.flightNumber, 10) &&
        (segment.operatingCarrier === undefined || (typeof segment.operatingCarrier === 'string' && /^[A-Z0-9]{2}$/.test(segment.operatingCarrier)))));
}

export function readSavedFlights(raw: string | null): FlightOffer[] {
  if (!raw || raw.length > 500_000) return [];
  try {
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(validSavedFlight).slice(0, 20) : [];
  } catch { return []; }
}
