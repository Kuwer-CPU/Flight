import { describe, expect, it } from 'vitest';
import {
  calculateRedemptionValue, createBrowserMilesWalletStore, deserializeMilesWallet, isMilesWalletEntry,
  isWalletDate, MAX_WALLET_ENTRIES, MILES_WALLET_KEY, serializeMilesWallet, type MilesWalletEntry,
} from '@/lib/miles-wallet';

const entry: MilesWalletEntry = { id: 'entry-1', programName: 'Emirates Skywards', balance: 42000, expiresOn: '2028-02-29', updatedAt: '2026-10-12T12:00:00.000Z', notes: 'Check expiration with airline.' };
const encoded = (entries: unknown[]) => JSON.stringify({ version: 1, entries });

describe('manual miles wallet storage', () => {
  it('starts empty without fabricated balances', () => {
    expect(deserializeMilesWallet(null)).toEqual({ entries: [], discardedData: false });
  });
  it('round-trips bounded entries and strips unrelated persisted fields', () => {
    const raw = encoded([{ ...entry, password: 'not-retained', programName: ' Emirates Skywards ' }]);
    expect(deserializeMilesWallet(raw).entries).toEqual([entry]);
    expect(deserializeMilesWallet(serializeMilesWallet([entry])).entries).toEqual([entry]);
    expect(serializeMilesWallet([{ ...entry, notes: '  reminder  ' }])).toContain('"notes":"reminder"');
  });
  it('discards corrupted rows independently while keeping valid programs', () => {
    const loaded = deserializeMilesWallet(encoded([null, { ...entry, id: 'bad-1', balance: -1 }, entry, { ...entry, id: 'bad-2', notes: {} }]));
    expect(loaded).toEqual({ entries: [entry], discardedData: true });
  });
  it.each(['{bad', '{}', '[]', JSON.stringify({ version: 2, entries: [entry] }), JSON.stringify({ version: 1, entries: {} }), ' '.repeat(100001)])('rejects malformed or unsupported storage safely', raw => {
    expect(deserializeMilesWallet(raw)).toEqual({ entries: [], discardedData: true });
  });
  it('rejects duplicate ids without dropping the first valid entry', () => {
    expect(deserializeMilesWallet(encoded([entry, { ...entry, balance: 3 }]))).toEqual({ entries: [entry], discardedData: true });
    expect(() => serializeMilesWallet([entry, entry])).toThrow();
  });
  it('bounds the number of records and reports discarded data', () => {
    const rows = Array.from({ length: MAX_WALLET_ENTRIES + 1 }, (_, index) => ({ ...entry, id: 'entry-' + index }));
    const result = deserializeMilesWallet(encoded(rows));
    expect(result.entries).toHaveLength(MAX_WALLET_ENTRIES);
    expect(result.discardedData).toBe(true);
    expect(() => serializeMilesWallet(rows)).toThrow();
  });
  it.each([
    { balance: 1.5 }, { balance: Number.MAX_SAFE_INTEGER + 1 }, { balance: Infinity },
    { programName: '' }, { programName: ' '.repeat(20) }, { programName: 'x'.repeat(101) },
    { id: '../../wallet' }, { id: '' }, { notes: 'x'.repeat(1001) }, { notes: 42 },
    { expiresOn: '2027-02-29' }, { expiresOn: '2028-02-30' }, { expiresOn: null },
    { updatedAt: '2026-02-30T12:00:00.000Z' }, { updatedAt: 'yesterday' },
  ])('rejects invalid entry fields: %j', change => {
    expect(isMilesWalletEntry({ ...entry, ...change })).toBe(false);
  });
  it('accepts zero balance, optional fields and custom programs', () => {
    expect(isMilesWalletEntry({ id: 'custom-1', programName: 'My airline loyalty program', balance: 0, updatedAt: entry.updatedAt })).toBe(true);
  });
  it('validates real calendar dates rather than normalized impossible dates', () => {
    expect(isWalletDate('2028-02-29')).toBe(true);
    expect(isWalletDate('2027-02-29')).toBe(false);
    expect(isWalletDate('2026-13-01')).toBe(false);
    expect(isWalletDate('2026-2-01')).toBe(false);
  });
  it('uses a replaceable store and removes the key when cleared', () => {
    const data = new Map<string, string>();
    const store = createBrowserMilesWalletStore({ getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); }, removeItem: key => { data.delete(key); } });
    store.write([entry]);
    expect(data.has(MILES_WALLET_KEY)).toBe(true);
    expect(store.read().entries).toEqual([entry]);
    store.clear();
    expect(data.has(MILES_WALLET_KEY)).toBe(false);
  });
  it('propagates disabled storage instead of claiming persistence', () => {
    const store = createBrowserMilesWalletStore({ getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('quota'); }, removeItem: () => { throw new Error('blocked'); } });
    expect(() => store.read()).toThrow('blocked');
    expect(() => store.write([entry])).toThrow('quota');
    expect(() => store.clear()).toThrow('blocked');
  });
});

describe('illustrative cash versus miles valuation', () => {
  it('subtracts all award charges and divides by miles in one currency', () => {
    expect(calculateRedemptionValue({ cashPrice: 700, milesRequired: 50000, awardTaxes: 150, redemptionFees: 50, currency: 'EUR' })).toEqual({ currency: 'EUR', cashPrice: 700, awardCost: 200, netCashValue: 500, valuePerMile: 0.01, minorUnitsPerMile: 1 });
  });
  it('preserves negative values when award charges exceed the comparable cash fare', () => {
    expect(calculateRedemptionValue({ cashPrice: 100, milesRequired: 10000, awardTaxes: 130, redemptionFees: 20, currency: 'GBP' }).valuePerMile).toBe(-0.005);
  });
  it('handles zero cash difference without promising savings', () => {
    expect(calculateRedemptionValue({ cashPrice: 200, milesRequired: 10000, awardTaxes: 200, redemptionFees: 0, currency: 'USD' }).valuePerMile).toBe(0);
  });
  it('handles minor units without floating-point currency residue', () => {
    const result = calculateRedemptionValue({ cashPrice: 100.3, milesRequired: 10, awardTaxes: 0.1, redemptionFees: 0.2, currency: 'EUR' });
    expect(result.awardCost).toBe(0.3);
    expect(result.netCashValue).toBe(100);
    expect(result.valuePerMile).toBe(10);
  });
  it.each([0, -100, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid miles %s', milesRequired => {
    expect(() => calculateRedemptionValue({ cashPrice: 700, milesRequired, awardTaxes: 150, redemptionFees: 0, currency: 'EUR' })).toThrow('whole number');
  });
  it.each([-1, Infinity, NaN, 1000000001])('rejects invalid monetary values %s', amount => {
    expect(() => calculateRedemptionValue({ cashPrice: amount, milesRequired: 1000, awardTaxes: 0, redemptionFees: 0, currency: 'EUR' })).toThrow();
    expect(() => calculateRedemptionValue({ cashPrice: 0, milesRequired: 1000, awardTaxes: amount, redemptionFees: 0, currency: 'EUR' })).toThrow();
    expect(() => calculateRedemptionValue({ cashPrice: 0, milesRequired: 1000, awardTaxes: 0, redemptionFees: amount, currency: 'EUR' })).toThrow();
  });
  it('does not accept an unsupported currency', () => {
    expect(() => calculateRedemptionValue({ cashPrice: 100, milesRequired: 1000, awardTaxes: 0, redemptionFees: 0, currency: 'ZZZ' as never })).toThrow('currency');
  });
});
