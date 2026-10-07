import type { BaggageAllowance } from './types';

export function baggageKg(baggage: BaggageAllowance) {
  if (baggage.weight === undefined || !Number.isFinite(baggage.weight) || baggage.weight < 0) return undefined;
  if (baggage.unit === 'LB') return Math.round(baggage.weight * 0.453592 * 10) / 10;
  return baggage.unit === 'KG' ? baggage.weight : undefined;
}
export function baggageLabel(baggage: BaggageAllowance) {
  const kg = baggageKg(baggage);
  if (kg !== undefined) return kg === 0 ? 'No checked bag' : kg + ' kg checked bag';
  if (baggage.pieces !== undefined) return baggage.pieces === 0 ? 'No checked bag' : baggage.pieces + ' checked bag' + (baggage.pieces > 1 ? 's' : '');
  return 'Baggage not specified';
}
