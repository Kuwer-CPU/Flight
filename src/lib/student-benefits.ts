import { airlines, airline } from './airlines';

export const benefitStatuses = ['verified-current', 'conditional', 'unverified', 'outdated'] as const;
export type BenefitStatus = typeof benefitStatuses[number];

/** A published rule must include its fare/route context; unknown rules stay null. */
export interface CheckedBaggageBenefit {
  basis: 'extra-weight' | 'extra-pieces' | 'total-weight' | 'total-pieces';
  amount: number;
  unit: 'kg' | 'pieces';
  conditions: string;
}

export interface StudentBenefitPolicy {
  id: string;
  airlineCode: string;
  airlineName: string;
  programName: string | null;
  status: BenefitStatus;
  sourceUrl: string;
  lastVerifiedAt: string | null;
  reviewDueAt: string | null;
  validUntil: string | null;
  benefits: {
    discount: string | null;
    checkedBaggage: CheckedBaggageBenefit | null;
    ageRestrictions: string | null;
    verification: string | null;
    bookingChannels: string[] | null;
    promoCode: string | null;
    membership: string | null;
    flexibleTickets: string | null;
    routeAndFareRestrictions: string | null;
  };
}

export const benefitStatusLabels: Record<BenefitStatus, string> = {
  'verified-current': 'Verified current policy',
  conditional: 'Conditional benefit',
  unverified: 'Unverified information',
  outdated: 'Outdated information',
};

export const benefitStatusDescriptions: Record<BenefitStatus, string> = {
  'verified-current': 'Reviewed against the official source. Your specific fare and eligibility still need confirmation.',
  conditional: 'Reviewed benefit with route, fare, booking-channel or eligibility conditions. Check them before booking.',
  unverified: 'Current rules have not been verified. Follow the official airline link to confirm what is available.',
  outdated: 'A review or offer validity date has passed. Recheck the airline’s current terms before relying on it.',
};

/** Existing airline pages are research leads, not evidence of current student terms. */
export const studentBenefitPolicies: StudentBenefitPolicy[] = airlines.map(company => ({
  id: 'student-' + company.code.toLowerCase(),
  airlineCode: company.code,
  airlineName: company.name,
  programName: company.student?.name ?? null,
  status: 'unverified',
  sourceUrl: company.student?.url ?? company.website,
  lastVerifiedAt: null,
  reviewDueAt: null,
  validUntil: null,
  benefits: {
    discount: null,
    checkedBaggage: null,
    ageRestrictions: null,
    verification: null,
    bookingChannels: null,
    promoCode: null,
    membership: null,
    flexibleTickets: null,
    routeAndFareRestrictions: null,
  },
}));

/** Only airline-owned HTTPS pages are offered as official policy sources. */
export function officialBenefitUrl(policy: Pick<StudentBenefitPolicy, 'airlineCode' | 'sourceUrl'>): string | null {
  const company = airline(policy.airlineCode);
  if (!company) return null;
  try {
    const source = new URL(policy.sourceUrl);
    const airlineHost = new URL(company.website).hostname.replace(/^www\./, '');
    if (source.protocol !== 'https:' || source.username || source.password || source.port) return null;
    if (source.hostname !== airlineHost && !source.hostname.endsWith('.' + airlineHost)) return null;
    return source.href;
  } catch { return null; }
}

function validDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Downgrade unsubstantiated records instead of presenting their numeric terms as verified. */
export function policyStatus(policy: StudentBenefitPolicy, today = new Date().toISOString().slice(0, 10)): BenefitStatus {
  if (!benefitStatuses.includes(policy.status)) return 'unverified';
  if (policy.status === 'unverified' || policy.status === 'outdated') return policy.status;
  if (!validDate(today) || !validDate(policy.lastVerifiedAt) || policy.lastVerifiedAt > today || !officialBenefitUrl(policy)) return 'unverified';
  if (policy.reviewDueAt !== null && (!validDate(policy.reviewDueAt) || policy.reviewDueAt < policy.lastVerifiedAt)) return 'unverified';
  if (policy.validUntil !== null && !validDate(policy.validUntil)) return 'unverified';
  if ((policy.reviewDueAt && policy.reviewDueAt < today) || (policy.validUntil && policy.validUntil < today)) return 'outdated';
  return policy.status;
}

export function canShowPolicyTerms(policy: StudentBenefitPolicy, today?: string): boolean {
  const status = policyStatus(policy, today);
  return status === 'verified-current' || status === 'conditional';
}

/** Keep the last real review visible even after its policy becomes outdated. */
export function policyVerificationDate(policy: StudentBenefitPolicy, today = new Date().toISOString().slice(0, 10)): string | null {
  return validDate(today) && validDate(policy.lastVerifiedAt) && policy.lastVerifiedAt <= today ? policy.lastVerifiedAt : null;
}

export function baggageBenefitLabel(benefit: CheckedBaggageBenefit | null): string | null {
  if (!benefit || !Number.isFinite(benefit.amount) || benefit.amount <= 0 || !benefit.conditions.trim()) return null;
  const weight = benefit.basis === 'extra-weight' || benefit.basis === 'total-weight';
  const pieces = benefit.basis === 'extra-pieces' || benefit.basis === 'total-pieces';
  if ((!weight && !pieces) || (weight && benefit.unit !== 'kg') || (pieces && (benefit.unit !== 'pieces' || !Number.isInteger(benefit.amount)))) return null;
  const quantity = benefit.unit === 'kg' ? benefit.amount + ' kg' : benefit.amount + (benefit.amount === 1 ? ' piece' : ' pieces');
  return (benefit.basis.startsWith('extra-') ? 'Additional ' : 'Total allowance: ') + quantity;
}

export function filterStudentBenefits(policies: StudentBenefitPolicy[], search: string, status: BenefitStatus | 'all', today?: string): StudentBenefitPolicy[] {
  const query = search.trim().toLocaleLowerCase('en');
  return policies.filter(policy => (status === 'all' || policyStatus(policy, today) === status) &&
    (policy.airlineName + ' ' + policy.airlineCode + ' ' + (policy.programName ?? '')).toLocaleLowerCase('en').includes(query));
}
