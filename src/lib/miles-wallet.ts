export const MILES_WALLET_KEY = 'flyora:miles:v1';
export const MAX_WALLET_ENTRIES = 50;
export const MAX_WALLET_NOTES = 1000;
export const MAX_WALLET_PROGRAM_NAME = 100;
const MAX_STORED_LENGTH = 100_000;
const MAX_MONEY = 1_000_000_000;

export const LOYALTY_PROGRAMS = [
  'Qatar Airways Privilege Club',
  'Emirates Skywards',
  'Air France–KLM Flying Blue',
  'Turkish Airlines Miles&Smiles',
] as const;

export const WALLET_CURRENCIES = ['EUR', 'INR', 'USD', 'GBP'] as const;
export type WalletCurrency = typeof WALLET_CURRENCIES[number];

/** Manually entered records only. No airline credentials or account identifiers. */
export interface MilesWalletEntry {
  id: string;
  programName: string;
  balance: number;
  expiresOn?: string;
  updatedAt: string;
  notes?: string;
}

export interface WalletReadResult {
  entries: MilesWalletEntry[];
  discardedData: boolean;
}

/** A persistence boundary for a future authenticated store; today the browser owns it. */
export interface MilesWalletStore {
  read(): WalletReadResult;
  write(entries: MilesWalletEntry[]): void;
  clear(): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isWalletDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function isMilesWalletEntry(value: unknown): value is MilesWalletEntry {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value.id)
    && typeof value.programName === 'string' && value.programName.trim().length > 0
    && value.programName.length <= MAX_WALLET_PROGRAM_NAME
    && Number.isSafeInteger(value.balance) && (value.balance as number) >= 0
    && (value.expiresOn === undefined || isWalletDate(value.expiresOn))
    && typeof value.updatedAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.updatedAt)
    && Number.isFinite(Date.parse(value.updatedAt)) && new Date(value.updatedAt).toISOString() === value.updatedAt
    && (value.notes === undefined || (typeof value.notes === 'string' && value.notes.length <= MAX_WALLET_NOTES));
}

function cleanEntry(entry: MilesWalletEntry): MilesWalletEntry {
  // Copy allowed properties rather than retaining arbitrary persisted properties.
  return {
    id: entry.id,
    programName: entry.programName.trim(),
    balance: entry.balance,
    updatedAt: entry.updatedAt,
    ...(entry.expiresOn ? { expiresOn: entry.expiresOn } : {}),
    ...(entry.notes?.trim() ? { notes: entry.notes.trim() } : {}),
  };
}

export function deserializeMilesWallet(raw: string | null): WalletReadResult {
  if (raw === null) return { entries: [], discardedData: false };
  if (typeof raw !== 'string' || raw.length > MAX_STORED_LENGTH) return { entries: [], discardedData: true };
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return { entries: [], discardedData: true }; }
  if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.entries)) return { entries: [], discardedData: true };
  const entries: MilesWalletEntry[] = [];
  const ids = new Set<string>();
  let discardedData = parsed.entries.length > MAX_WALLET_ENTRIES;
  for (const row of parsed.entries.slice(0, MAX_WALLET_ENTRIES)) {
    if (!isMilesWalletEntry(row) || ids.has(row.id)) { discardedData = true; continue; }
    entries.push(cleanEntry(row));
    ids.add(row.id);
  }
  return { entries, discardedData };
}

export function serializeMilesWallet(entries: MilesWalletEntry[]): string {
  if (!Array.isArray(entries) || entries.length > MAX_WALLET_ENTRIES
    || entries.some(entry => !isMilesWalletEntry(entry)) || new Set(entries.map(entry => entry.id)).size !== entries.length) {
    throw new Error('Wallet data is invalid. Check your program details before saving.');
  }
  return JSON.stringify({ version: 1, entries: entries.map(cleanEntry) });
}

export function createBrowserMilesWalletStore(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>): MilesWalletStore {
  return {
    read: () => deserializeMilesWallet(storage.getItem(MILES_WALLET_KEY)),
    write: entries => storage.setItem(MILES_WALLET_KEY, serializeMilesWallet(entries)),
    clear: () => storage.removeItem(MILES_WALLET_KEY),
  };
}

export interface RedemptionInput {
  cashPrice: number;
  milesRequired: number;
  awardTaxes: number;
  redemptionFees: number;
  currency: WalletCurrency;
}

export interface RedemptionValue {
  currency: WalletCurrency;
  cashPrice: number;
  awardCost: number;
  netCashValue: number;
  valuePerMile: number;
  minorUnitsPerMile: number;
}

/** Compare like-for-like cash and award itineraries in one currency; availability is unknown. */
export function calculateRedemptionValue(input: RedemptionInput): RedemptionValue {
  if (!WALLET_CURRENCIES.includes(input.currency)) throw new Error('Choose a supported currency.');
  if (![input.cashPrice, input.awardTaxes, input.redemptionFees].every(value => Number.isFinite(value) && value >= 0 && value <= MAX_MONEY)) {
    throw new Error('Enter cash prices and fees between 0 and 1,000,000,000.');
  }
  if (!Number.isSafeInteger(input.milesRequired) || input.milesRequired <= 0) throw new Error('Enter a whole number of miles greater than zero.');
  const cents = (value: number) => Math.round(value * 100);
  const cashCents = cents(input.cashPrice);
  const awardCostCents = cents(input.awardTaxes) + cents(input.redemptionFees);
  const netCents = cashCents - awardCostCents;
  return {
    currency: input.currency,
    cashPrice: cashCents / 100,
    awardCost: awardCostCents / 100,
    netCashValue: netCents / 100,
    valuePerMile: netCents / 100 / input.milesRequired,
    minorUnitsPerMile: netCents / input.milesRequired,
  };
}
