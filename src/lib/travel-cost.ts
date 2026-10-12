/** Manual travel budgets only: no provider quotes, exchange rates or student benefits. */
export const TRAVEL_CURRENCIES = ['EUR', 'INR', 'GBP', 'USD'] as const;
export type TravelCurrency = typeof TRAVEL_CURRENCIES[number];
export const MAX_TRAVEL_AMOUNT = 1_000_000;
export const MAX_TRAVEL_BAGGAGE_KG = 100;

export type TravelExpense = 'ticketPrice' | 'extraBagCost' | 'transfer' | 'insurance' | 'other';
export type TravelCostField = TravelExpense | 'includedKg' | 'extraKg';
export interface TravelCostOption {
  id: string;
  name: string;
  ticketPrice: string;
  includedKg: string;
  extraKg: string;
  extraBagCost: string;
  transfer: string;
  insurance: string;
  other: string;
}
export interface TravelCostIssue { field: TravelCostField; kind: 'pending' | 'invalid'; message: string }
export interface TravelCostResult {
  status: 'complete' | 'pending' | 'invalid';
  costs: Record<TravelExpense, number | undefined>;
  totalCents?: number;
  includedKg?: number;
  extraKg?: number;
  issues: TravelCostIssue[];
}

export function newTravelOption(id: string, name: string): TravelCostOption {
  return { id, name, ticketPrice: '', includedKg: '', extraKg: '', extraBagCost: '', transfer: '', insurance: '', other: '' };
}

type Amount = { kind: 'empty' } | { kind: 'invalid' } | { kind: 'value'; cents: number };
/** Decimal strings are rounded once, half up, before any addition. */
function amount(value: unknown): Amount {
  if (typeof value !== 'string') return { kind: 'invalid' };
  const text = value.trim();
  if (!text) return { kind: 'empty' };
  if (text.length > 30 || !/^\d+(?:\.\d+)?$/.test(text)) return { kind: 'invalid' };
  const numeric = Number(text);
  if (!Number.isFinite(numeric) || numeric > MAX_TRAVEL_AMOUNT) return { kind: 'invalid' };
  const [whole, decimals = ''] = text.split('.');
  const cents = Number(whole) * 100 + Number((decimals + '00').slice(0, 2)) + (Number(decimals[2] ?? '0') >= 5 ? 1 : 0);
  return Number.isSafeInteger(cents) ? { kind: 'value', cents } : { kind: 'invalid' };
}

function kilograms(value: unknown): { kind: 'empty' | 'invalid'; value?: undefined } | { kind: 'value'; value: number } {
  if (typeof value !== 'string') return { kind: 'invalid' };
  const text = value.trim();
  if (!text) return { kind: 'empty' };
  if (text.length > 12 || !/^\d+(?:\.\d{1,3})?$/.test(text)) return { kind: 'invalid' };
  const numeric = Number(text);
  return Number.isFinite(numeric) && numeric <= MAX_TRAVEL_BAGGAGE_KG ? { kind: 'value', value: numeric } : { kind: 'invalid' };
}

export function calculateTravelCost(option: TravelCostOption): TravelCostResult {
  const issues: TravelCostIssue[] = [];
  const costs: TravelCostResult['costs'] = { ticketPrice: undefined, extraBagCost: undefined, transfer: undefined, insurance: undefined, other: undefined };
  const included = kilograms(option.includedKg);
  const extra = kilograms(option.extraKg);
  for (const [field, result] of [['includedKg', included], ['extraKg', extra]] as const) {
    if (result.kind === 'invalid') issues.push({ field, kind: 'invalid', message: 'Enter a number from 0 to ' + MAX_TRAVEL_BAGGAGE_KG + ' kg.' });
  }
  if (extra.kind === 'empty') issues.push({ field: 'extraKg', kind: 'pending', message: 'Enter extra baggage needed, or 0 if none.' });

  for (const field of ['ticketPrice', 'extraBagCost', 'transfer', 'insurance', 'other'] as const) {
    const parsed = amount(option[field]);
    if (parsed.kind === 'invalid') {
      issues.push({ field, kind: 'invalid', message: 'Enter a cost from 0 to ' + MAX_TRAVEL_AMOUNT.toLocaleString('en-GB') + ', using a decimal point.' });
      continue;
    }
    if (field === 'extraBagCost') {
      if (extra.kind === 'value' && extra.value === 0) costs[field] = 0;
      else if (extra.kind === 'value' && extra.value > 0) {
        if (parsed.kind === 'empty') issues.push({ field, kind: 'pending', message: 'Enter the seller’s quoted charge for all extra baggage. An unknown charge is not zero.' });
        else costs[field] = parsed.cents;
      }
    } else if (field === 'ticketPrice') {
      if (parsed.kind === 'empty') issues.push({ field, kind: 'pending', message: 'Enter a ticket quote to calculate this option.' });
      else costs[field] = parsed.cents;
    } else costs[field] = parsed.kind === 'empty' ? 0 : parsed.cents;
  }

  const status = issues.some(issue => issue.kind === 'invalid') ? 'invalid' : issues.length ? 'pending' : 'complete';
  return {
    status, costs, issues,
    totalCents: status === 'complete' ? Object.values(costs).reduce<number>((total, cost) => total + (cost ?? 0), 0) : undefined,
    includedKg: included.kind === 'value' ? included.value : undefined,
    extraKg: extra.kind === 'value' ? extra.value : undefined,
  };
}

export function compareTravelCosts(options: TravelCostOption[]) {
  const rows = options.map(option => ({ option, result: calculateTravelCost(option) }));
  const totals = rows.flatMap(row => row.result.status === 'complete' && row.result.totalCents !== undefined ? [row.result.totalCents] : []);
  const lowestCents = totals.length ? Math.min(...totals) : undefined;
  return { rows, lowestCents, lowestIds: lowestCents === undefined ? [] : rows.filter(row => row.result.totalCents === lowestCents).map(row => row.option.id) };
}

export function hypotheticalTravelOptions(): TravelCostOption[] {
  return [
    { ...newTravelOption('example-a', 'Extra bag charged'), ticketPrice: '480', includedKg: '23', extraKg: '10', extraBagCost: '110' },
    { ...newTravelOption('example-b', 'Baggage included'), ticketPrice: '530', includedKg: '33', extraKg: '0' },
  ];
}
