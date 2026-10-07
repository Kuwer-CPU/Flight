import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { baggageKg, baggageLabel, defaults, parseSearch, searchParams, sortedFlights } from '../../src/lib/search';
import { demoFlights } from '../../src/lib/demo';

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-07T12:00:00Z')); });
afterEach(() => vi.useRealTimers());
describe('search validation', () => {
  it('round-trips a complete search without losing adult, cabin or student preferences', () => {
    const query = { ...defaults(), adults: 3, cabin: 'BUSINESS' as const, student: false, baggage: 40 };
    expect(parseSearch(searchParams(query))).toEqual(query);
  });
  it('supports one-way flights and normalizes airport codes', () => {
    const params = searchParams({ ...defaults(), origin: 'cdg', returnDate: undefined });
    const query = parseSearch(params);
    expect(query.origin).toBe('CDG');
    expect(query.returnDate).toBeUndefined();
  });
  it.each([
    ['departureDate', '2026-10-06', 'departure'],
    ['departureDate', '2026-02-30', 'departure'],
    ['returnDate', '2026-10-10', 'return'],
    ['origin', 'XYZ', 'airport'],
    ['destination', 'CDG', 'different'],
    ['adults', '0', 'adult'],
    ['adults', '2.5', 'adult'],
    ['age', '15', 'age'],
    ['baggage', '-1', 'baggage'],
    ['cabin', 'INVALID', 'cabin'],
  ])('rejects invalid %s=%s', (key, value, message) => {
    const params = searchParams(defaults()); params.set(key, value);
    expect(() => parseSearch(params)).toThrow(new RegExp(message, 'i'));
  });
});
describe('fare and baggage comparisons', () => {
  it('does not invent a weight for piece-based or unspecified allowances', () => {
    expect(baggageKg({ pieces: 2 })).toBeUndefined();
    expect(baggageLabel({ pieces: 2 })).toBe('2 checked bags');
    expect(baggageLabel({})).toBe('Baggage not specified');
    expect(baggageLabel({ weight: 0, unit: 'KG' })).toBe('No checked bag');
    expect(baggageKg({ weight: 50, unit: 'LB' })).toBe(22.7);
  });
  it('sorts by price and by the combined travel time of outbound and return', () => {
    const query = defaults();
    const offers = demoFlights(query);
    const cheapest = sortedFlights(offers, 'cheapest', query);
    expect(cheapest[0].price).toBe(Math.min(...offers.map(o => o.price)));
    const fastest = sortedFlights(offers, 'fastest', query);
    expect(fastest[0].itineraries.reduce((sum, it) => sum + it.duration, 0)).toBe(Math.min(...offers.map(o => o.itineraries.reduce((sum, it) => sum + it.duration, 0))));
    expect(offers.map(o => o.id)).toEqual(demoFlights(query).map(o => o.id));
  });
  it('returns one-way itineraries and quotes the full group price without student discounts', () => {
    const base = { ...defaults(), returnDate: undefined };
    const one = demoFlights(base);
    const three = demoFlights({ ...base, adults: 3 });
    const nonStudent = demoFlights({ ...base, student: false });
    expect(three.every(o => o.itineraries.length === 1 && o.passengers === 3)).toBe(true);
    expect(three[0].price).toBe(one[0].price * 3);
    expect(nonStudent[0].price).toBe(one[0].price);
  });
});
