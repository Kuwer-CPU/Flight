/** Ticket-specific baggage comparisons. No airline allowances are inferred. */
export type BaggageRule =
  | { basis: 'weight'; totalKg: number; perBagKg: number; maxPieces?: number }
  | { basis: 'pieces'; pieces: number; perBagKg: number };
export type Cabin = 'economy' | 'premium-economy' | 'business' | 'first';
export interface Journey {
  departure: string;
  destination: string;
  departureAirport: string;
  destinationAirport: string;
  age: string;
  verification: 'unknown' | 'enrolled' | 'airline-verified';
  cabin: Cabin;
}
export interface OfficialStudentProgram {
  verifiedAt: string;
  reviewDueAt: string;
  sourceUrl: string;
  minAge: number;
  maxAge: number;
  departureCountries: string[];
  destinationCountries: string[];
  departureAirports?: string[];
  destinationAirports?: string[];
  cabins: Cabin[];
  /** Complete eligible allowance, never an assumed addition to a generic fare. */
  allowance: BaggageRule;
  extraLabel: string;
  benefits: string[];
  restrictions: string[];
  activation: string[];
}
export interface BaggageAirline {
  code: string;
  name: string;
  programName: string;
  studentUrl: string;
  baggageUrl: string;
  /** Null until the official terms have actually been reviewed. */
  program: OfficialStudentProgram | null;
}
export interface TicketTerms {
  standard: BaggageRule | null;
  contextConfirmed: boolean;
  studentActivationConfirmed: boolean;
  cabin?: { pieces: number; perBagKg: number };
}
export type Fit = 'fits' | 'exceeds' | 'unknown';
export type ComparisonStatus = 'Fits standard allowance' | 'May fit with student benefit' | 'Exceeds allowance' | 'Needs airline confirmation';
export interface FitResult { status: Fit; reasons: string[] }

export function validRule(rule: BaggageRule): boolean {
  const nonnegative = (value: number) => Number.isFinite(value) && value >= 0;
  if (!nonnegative(rule.perBagKg) || rule.perBagKg === 0) return false;
  return rule.basis === 'weight'
    ? nonnegative(rule.totalKg) && (rule.maxPieces === undefined || (Number.isInteger(rule.maxPieces) && nonnegative(rule.maxPieces)))
    : Number.isInteger(rule.pieces) && nonnegative(rule.pieces);
}
export function validWeights(weights: number[]): boolean {
  return weights.length <= 10 && weights.every(weight => Number.isFinite(weight) && weight > 0 && weight <= 100);
}
export function totalWeight(weights: number[]) { return Math.round(weights.reduce((sum, weight) => sum + weight, 0) * 100) / 100; }
export function assessBags(weights: number[], rule: BaggageRule | null): FitResult {
  if (!validWeights(weights)) return { status: 'unknown', reasons: ['Enter a valid weight above 0 and up to 100 kg for every bag.'] };
  if (!rule || !validRule(rule)) return { status: 'unknown', reasons: ['Check with airline: the complete ticket allowance and per-bag limit are needed.'] };
  const reasons: string[] = [];
  weights.forEach((weight, index) => { if (weight > rule.perBagKg) reasons.push(`Bag ${index + 1} exceeds the ${rule.perBagKg} kg per-bag limit.`); });
  if (rule.basis === 'weight' && totalWeight(weights) > rule.totalKg) reasons.push(`Total is ${Math.round((totalWeight(weights) - rule.totalKg) * 100) / 100} kg over the entered allowance.`);
  const pieces = rule.basis === 'pieces' ? rule.pieces : rule.maxPieces;
  if (pieces !== undefined && weights.length > pieces) reasons.push(`${weights.length} bags exceed the ${pieces}-bag limit.`);
  return { status: reasons.length ? 'exceeds' : 'fits', reasons };
}
export function ruleLabel(rule: BaggageRule | null): string {
  if (!rule || !validRule(rule)) return 'Check with airline';
  return rule.basis === 'weight'
    ? `${rule.totalKg} kg total · ${rule.perBagKg} kg per bag${rule.maxPieces === undefined ? '' : ` · up to ${rule.maxPieces} bags`}`
    : `${rule.pieces} ${rule.pieces === 1 ? 'bag' : 'bags'} × ${rule.perBagKg} kg · no weight pooling`;
}
export function currentProgram(airline: BaggageAirline, today: string): OfficialStudentProgram | null {
  const program = airline.program;
  if (!program) return null;
  const date = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  try {
    const source = new URL(program.sourceUrl);
    if (source.protocol !== 'https:' || source.origin !== new URL(airline.studentUrl).origin || source.username || source.password) return null;
    if (!date(today) || !date(program.verifiedAt) || !date(program.reviewDueAt) || program.verifiedAt > today || program.reviewDueAt < today || program.reviewDueAt < program.verifiedAt || !validRule(program.allowance)) return null;
    if (!Number.isInteger(program.minAge) || !Number.isInteger(program.maxAge) || program.minAge < 0 || program.maxAge < program.minAge || !program.restrictions.length || !program.activation.length) return null;
    return program;
  } catch { return null; }
}
export function studentEligibility(program: OfficialStudentProgram | null, journey: Journey, activated: boolean): { applicable: boolean; reasons: string[] } {
  if (!program) return { applicable: false, reasons: ['Check with airline: current student-program terms have not been verified.'] };
  const reasons: string[] = [];
  const age = /^\d{1,3}$/.test(journey.age) ? Number(journey.age) : NaN;
  if (!Number.isInteger(age) || age < program.minAge || age > program.maxAge) reasons.push(`Published age range: ${program.minAge}–${program.maxAge}.`);
  if (!program.departureCountries.includes(journey.departure) || !program.destinationCountries.includes(journey.destination)) reasons.push('This route is outside the reviewed country coverage.');
  if (program.departureAirports && !program.departureAirports.includes(journey.departureAirport)) reasons.push('Confirm the eligible departure airport.');
  if (program.destinationAirports && !program.destinationAirports.includes(journey.destinationAirport)) reasons.push('Confirm the eligible destination airport.');
  if (!program.cabins.includes(journey.cabin)) reasons.push('This cabin is outside the reviewed offer.');
  if (journey.verification !== 'airline-verified') reasons.push('Airline student verification is required.');
  if (!activated) reasons.push('Confirm registration, booking channel, operating carrier and activation requirements with the airline.');
  return { applicable: reasons.length === 0, reasons };
}
export function compareBaggage(airline: BaggageAirline, journey: Journey, checked: number[], cabin: number[], terms: TicketTerms, today: string) {
  const journeyComplete = !!journey.departure && !!journey.destination && (!journey.departureAirport || /^[A-Z]{3}$/.test(journey.departureAirport)) && (!journey.destinationAirport || /^[A-Z]{3}$/.test(journey.destinationAirport));
  const standard = assessBags(checked, journeyComplete && terms.contextConfirmed ? terms.standard : null);
  const program = currentProgram(airline, today);
  const eligibility = studentEligibility(program, journey, terms.studentActivationConfirmed && terms.contextConfirmed && journeyComplete);
  const student = assessBags(checked, eligibility.applicable && program ? program.allowance : null);
  const cabinResult = cabin.length ? assessBags(cabin, terms.contextConfirmed && journeyComplete && terms.cabin ? { basis: 'pieces', ...terms.cabin } : null) : { status: 'fits' as Fit, reasons: [] };
  let status: ComparisonStatus = 'Needs airline confirmation';
  if (standard.status === 'fits') status = 'Fits standard allowance';
  else if (student.status === 'fits') status = 'May fit with student benefit';
  else if (standard.status === 'exceeds' && student.status === 'exceeds') status = 'Exceeds allowance';
  // Without reviewed student terms, excess against the entered standard stays explicit,
  // while the overall answer remains unknown rather than ruling out a student offer.
  if (cabinResult.status === 'exceeds') status = 'Exceeds allowance';
  else if (cabinResult.status === 'unknown') status = 'Needs airline confirmation';
  return { airline, standard, student, program, eligibility, cabin: cabinResult, status };
}
