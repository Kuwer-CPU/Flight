import { describe, expect, it } from 'vitest';
import { defaults, sortedFlights } from '../../src/lib/search';
import { demoFlights } from '../../src/lib/demo';
import { studentComparison, studentValueScores } from '../../src/lib/student-value';
import type { FlightOffer } from '../../src/lib/types';

const query = defaults();
function examples(): FlightOffer[] {
  const base = demoFlights({ ...query, returnDate: undefined });
  const a = { ...base[0], id: 'a', price: 610, baggage: { weight: 23, unit: 'KG' }, itineraries: [{ ...base[0].itineraries[0], duration: 1200 }], studentExample: { extraKg: 10, verificationRequired: true, registrationRequired: true, addOn: { kg: 10, pricePerAdult: 95, currency: 'EUR' } } };
  const b = { ...base[1], id: 'b', price: 545, baggage: { weight: 20, unit: 'KG' }, itineraries: [{ ...base[1].itineraries[0], duration: 480 }], studentExample: { ...a.studentExample, extraKg: 0 } };
  return [a, b];
}

describe('student value comparison', () => {
  it('makes a higher base fare the better comparable deal when the example baggage benefit covers the need', () => {
    const [a, b] = examples();
    expect(studentComparison(a, query)).toMatchObject({ standardKg: 23, extraKg: 10, eligibleKg: 33, comparableCostPerAdult: 610, verificationRequired: true, registrationRequired: true });
    expect(studentComparison(b, query)).toMatchObject({ standardKg: 20, extraKg: 0, eligibleKg: 20, additionalCostPerAdult: 95, comparableCostPerAdult: 640, verificationRequired: false });
    expect(studentValueScores([a, b], query).get('a')).toBe(9.1);
    expect(studentValueScores([a, b], query).get('b')).toBe(8.3);
    expect(sortedFlights([a, b], 'student-value', query)[0].id).toBe('a');
    expect(sortedFlights([a, b], 'cheapest', query)[0].id).toBe('b');
  });
  it.each(['test', 'live'] as const)('rejects fictional benefits and add-on prices for %s offers', mode => {
    const [a] = examples();
    const actual = { ...a, mode };
    expect(studentComparison(actual, query)).toMatchObject({ standardKg: 23, example: false, extraKg: undefined, eligibleKg: undefined, comparableCostPerAdult: undefined, verificationRequired: false });
    expect(studentValueScores([actual], query).size).toBe(0);
    // Enough confirmed standard baggage can establish the cost without inventing a student total.
    expect(studentComparison({ ...actual, baggage: { weight: 35, unit: 'KG' } }, query)).toMatchObject({ comparableCostPerAdult: 610, eligibleKg: undefined });
  });
  it('does not invent weights, student bonuses or free add-ons when inputs are unknown', () => {
    const [a] = examples();
    const pieces = { ...a, baggage: { pieces: 1 } };
    expect(studentComparison(pieces, query).eligibleKg).toBeUndefined();
    expect(studentValueScores([pieces], query).size).toBe(0);
    expect(studentComparison({ ...a, studentExample: undefined }, query).extraKg).toBeUndefined();
    expect(studentComparison({ ...a, studentExample: { ...a.studentExample!, addOn: undefined } }, { ...query, baggage: 40 }).comparableCostPerAdult).toBeUndefined();
  });
  it('uses per-adult costs and rounds baggage packages up without altering the base fare', () => {
    const [a] = examples();
    const group = { ...a, price: 1830, passengers: 3 };
    expect(studentComparison(group, { ...query, baggage: 45 })).toMatchObject({ eligibleKg: 33, additionalCostPerAdult: 190, comparableCostPerAdult: 800 });
    expect(group.price).toBe(1830);
    expect(studentComparison(a, { ...query, student: false })).toMatchObject({ extraKg: 0, eligibleKg: 23, comparableCostPerAdult: 705, verificationRequired: false });
  });
  it('does not combine currencies or reward excess baggage beyond the traveler’s needs', () => {
    const [a, b] = examples();
    expect(studentComparison({ ...b, studentExample: { ...b.studentExample!, addOn: { kg: 10, pricePerAdult: 95, currency: 'USD' } } }, query).comparableCostPerAdult).toBeUndefined();
    expect(studentValueScores([a, { ...b, currency: 'USD', studentExample: { ...b.studentExample!, addOn: { kg: 10, pricePerAdult: 95, currency: 'USD' } } }], query).size).toBe(0);
    const scores = studentValueScores([a, b], query);
    expect(studentValueScores([{ ...a, baggage: { weight: 50, unit: 'KG' } }, b], query).get('a')).toBe(scores.get('a'));
    expect(sortedFlights([b, a], 'student-value', query, [a, b])[0].id).toBe('a');
  });
  it('handles no checked baggage without buying a baggage package', () => {
    const [a] = examples();
    expect(studentComparison({ ...a, baggage: {} }, { ...query, baggage: 0 }).comparableCostPerAdult).toBe(610);
  });
});
