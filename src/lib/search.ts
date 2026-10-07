import { airport } from './airports';
import type { BaggageAllowance, FlightOffer, SearchQuery } from './types';

export class SearchValidationError extends Error {}
export function today() { return new Date().toISOString().slice(0, 10); }
export function futureDate(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function defaults(): SearchQuery {
  return { origin: 'CDG', destination: 'DEL', departureDate: futureDate(21), returnDate: futureDate(35), adults: 1, cabin: 'ECONOMY', student: true, age: 22, baggage: 30 };
}
function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function parseSearch(params: URLSearchParams): SearchQuery {
  const origin = (params.get('origin') ?? '').toUpperCase();
  const destination = (params.get('destination') ?? '').toUpperCase();
  const departureDate = params.get('departureDate') ?? '';
  const returnDate = params.get('returnDate') || undefined;
  const adults = Number(params.get('adults') ?? '1');
  const cabin = params.get('cabin') ?? 'ECONOMY';
  const student = params.get('student') !== 'false';
  const age = Number(params.get('age') ?? '22');
  const baggage = Number(params.get('baggage') ?? '30');
  if (!airport(origin) || !airport(destination)) throw new SearchValidationError('Choose an airport from the suggestions.');
  if (origin === destination) throw new SearchValidationError('Departure and arrival airports must be different.');
  if (!validDate(departureDate) || departureDate < today() || departureDate > futureDate(365)) throw new SearchValidationError('Choose a departure date within the next 12 months.');
  if (returnDate && (!validDate(returnDate) || returnDate < departureDate || returnDate > futureDate(365))) throw new SearchValidationError('Your return date must be on or after departure, within the next 12 months.');
  if (!Number.isInteger(adults) || adults < 1 || adults > 9) throw new SearchValidationError('Choose between 1 and 9 adult travelers.');
  if (!['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS'].includes(cabin)) throw new SearchValidationError('Choose a valid cabin class.');
  if (!Number.isInteger(age) || age < 16 || age > 99) throw new SearchValidationError('Enter an age between 16 and 99. This search currently supports adult travelers.');
  if (!Number.isInteger(baggage) || baggage < 0 || baggage > 60) throw new SearchValidationError('Choose between 0 and 60 kg of checked baggage.');
  return { origin, destination, departureDate, returnDate, adults, cabin: cabin as SearchQuery['cabin'], student, age, baggage };
}
export function searchParams(query: SearchQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => { if (value !== undefined) params.set(key, String(value)); });
  return params;
}
export function flightSearchUrl(query: SearchQuery) { return '/flights?' + searchParams(query).toString(); }
export function money(value: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}
export function duration(minutes: number) { return Math.floor(minutes / 60) + 'h ' + (minutes % 60 ? minutes % 60 + 'm' : ''); }
export function time(value: string) { return value.slice(11, 16); }
export function dateLabel(value: string, long = false) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: long ? 'long' : 'short', timeZone: 'UTC' }).format(new Date(value.slice(0, 10) + 'T12:00:00Z'));
}
export function baggageKg(baggage: BaggageAllowance) {
  if (baggage.weight === undefined) return undefined;
  if (baggage.unit === 'LB') return Math.round(baggage.weight * 0.453592 * 10) / 10;
  return baggage.unit === 'KG' ? baggage.weight : undefined;
}
export function baggageLabel(baggage: BaggageAllowance) {
  const kg = baggageKg(baggage);
  if (kg !== undefined) return kg === 0 ? 'No checked bag' : kg + ' kg checked bag';
  if (baggage.pieces !== undefined) return baggage.pieces === 0 ? 'No checked bag' : baggage.pieces + ' checked bag' + (baggage.pieces > 1 ? 's' : '');
  return 'Baggage not specified';
}
export type SortOrder = 'recommended' | 'cheapest' | 'fastest';
export function sortedFlights(offers: FlightOffer[], sort: SortOrder, query: SearchQuery) {
  if (!offers.length) return [];
  const minimumPrice = Math.min(...offers.map(o => o.price));
  const totalDuration = (o: FlightOffer) => o.itineraries.reduce((sum, it) => sum + it.duration, 0);
  const shortest = Math.min(...offers.map(totalDuration));
  const score = (o: FlightOffer) => {
    const kg = baggageKg(o.baggage);
    const baggageMatch = query.baggage > 0 && kg !== undefined && kg >= query.baggage ? 0.15 : 0;
    return (minimumPrice / o.price) * 0.55 + (shortest / totalDuration(o)) * 0.30 + baggageMatch;
  };
  return [...offers].sort((a, b) => sort === 'cheapest' ? a.price - b.price : sort === 'fastest' ? totalDuration(a) - totalDuration(b) : score(b) - score(a));
}
