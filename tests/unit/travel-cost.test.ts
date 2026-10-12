import { describe, expect, it } from 'vitest';
import { calculateTravelCost, compareTravelCosts, hypotheticalTravelOptions, newTravelOption } from '../../src/lib/travel-cost';

function entered(overrides = {}) {
  return { ...newTravelOption('a', 'My quote'), ticketPrice: '480', includedKg: '23', extraKg: '0', ...overrides };
}

describe('manual travel costs', () => {
  it('starts with missing quotes rather than fictional prices or a zero-cost winner', () => {
    const result = compareTravelCosts([newTravelOption('a', 'Option A'), newTravelOption('b', 'Option B')]);
    expect(result.lowestIds).toEqual([]);
    expect(result.lowestCents).toBeUndefined();
    expect(result.rows.every(row => row.result.status === 'pending' && row.result.totalCents === undefined)).toBe(true);
  });
  it('compares total entered costs, including the seller’s charge for extra baggage', () => {
    const result = compareTravelCosts(hypotheticalTravelOptions());
    expect(result.rows.map(row => row.result.totalCents)).toEqual([59_000, 53_000]);
    expect(result.lowestIds).toEqual(['example-b']);
  });
  it('does not award the lowest cost to an incomplete extra-bag quote', () => {
    const incomplete = entered({ id: 'pending', ticketPrice: '100', extraKg: '10' });
    const complete = entered({ id: 'complete', ticketPrice: '530' });
    const result = compareTravelCosts([incomplete, complete]);
    expect(result.rows[0].result).toMatchObject({ status: 'pending', totalCents: undefined });
    expect(result.rows[0].result.issues).toContainEqual(expect.objectContaining({ field: 'extraBagCost', kind: 'pending' }));
    expect(result.lowestIds).toEqual(['complete']);
  });
  it('requires an explicit additional baggage quantity rather than assuming none', () => {
    expect(calculateTravelCost(entered({ extraKg: '' }))).toMatchObject({ status: 'pending', totalCents: undefined });
  });
  it('accepts a confirmed zero extra-bag charge without inferring a student benefit', () => {
    const result = calculateTravelCost(entered({ extraKg: '10', extraBagCost: '0' }));
    expect(result).toMatchObject({ status: 'complete', totalCents: 48_000, costs: { extraBagCost: 0 } });
  });
  it('sums all entered expenses once and keeps monetary calculations in cents', () => {
    const result = calculateTravelCost(entered({ ticketPrice: '600.15', extraKg: '5', extraBagCost: '50.25', transfer: '14.30', insurance: '22.20', other: '5.10' }));
    expect(result.totalCents).toBe(69_200);
  });
  it('avoids floating-point penny loss and rounds decimal amounts before addition', () => {
    expect(calculateTravelCost(entered({ ticketPrice: '0.1', transfer: '0.2' })).totalCents).toBe(30);
    expect(calculateTravelCost(entered({ ticketPrice: '1.005', transfer: '4.999' })).totalCents).toBe(601);
  });
  it('allows zero expenses and treats explicitly optional blank costs as zero', () => {
    expect(calculateTravelCost(entered({ ticketPrice: '0', transfer: '0', insurance: '', other: '  ' }))).toMatchObject({ status: 'complete', totalCents: 0 });
  });
  it('allows an unknown included allowance when additional baggage and its charge are explicitly quoted', () => {
    expect(calculateTravelCost(entered({ includedKg: '', extraKg: '2.5', extraBagCost: '18.75' }))).toMatchObject({ status: 'complete', totalCents: 49_875, extraKg: 2.5 });
  });
  it.each(['-1', 'NaN', 'Infinity', '1e309', '1,000', '1000000.01', 'broken', null])('rejects invalid monetary input %s without a misleading total', ticketPrice => {
    const result = calculateTravelCost(entered({ ticketPrice }) as ReturnType<typeof entered>);
    expect(result).toMatchObject({ status: 'invalid', totalCents: undefined });
  });
  it.each(['extraBagCost', 'transfer', 'insurance', 'other'] as const)('does not silently zero out an invalid %s quote', field => {
    expect(calculateTravelCost(entered({ [field]: '-5' }))).toMatchObject({ status: 'invalid', totalCents: undefined });
  });
  it.each(['-2', '101', 'Infinity', '1e9', 'many bags'])('rejects invalid or excessive additional baggage %s', extraKg => {
    expect(calculateTravelCost(entered({ extraKg }))).toMatchObject({ status: 'invalid', totalCents: undefined });
  });
  it('keeps tied complete totals and excludes invalid cheap quotes', () => {
    const result = compareTravelCosts([
      entered({ id: 'a', ticketPrice: '500.25' }),
      entered({ id: 'b', ticketPrice: '480', transfer: '20.25' }),
      entered({ id: 'broken', ticketPrice: '-1' }),
    ]);
    expect(result.lowestCents).toBe(50_025);
    expect(result.lowestIds).toEqual(['a', 'b']);
  });
});
