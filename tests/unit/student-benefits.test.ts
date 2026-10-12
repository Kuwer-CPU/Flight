import { describe, expect, it } from 'vitest';
import {
  baggageBenefitLabel, canShowPolicyTerms, filterStudentBenefits, officialBenefitUrl,
  policyStatus, policyVerificationDate, studentBenefitPolicies, type StudentBenefitPolicy,
} from '../../src/lib/student-benefits';

const today = '2026-10-12';
const current = (): StudentBenefitPolicy => ({
  ...studentBenefitPolicies[0], status: 'verified-current', lastVerifiedAt: '2026-10-01',
  reviewDueAt: '2026-12-01', validUntil: null,
  benefits: { ...studentBenefitPolicies[0].benefits },
});

describe('student policy records', () => {
  it('publishes only unverified leads with no invented dates or benefits', () => {
    expect(studentBenefitPolicies.length).toBeGreaterThan(10);
    expect(new Set(studentBenefitPolicies.map(policy => policy.id)).size).toBe(studentBenefitPolicies.length);
    for (const policy of studentBenefitPolicies) {
      expect(policyStatus(policy, today)).toBe('unverified');
      expect(policy.lastVerifiedAt).toBeNull();
      expect(policy.reviewDueAt).toBeNull();
      expect(policy.validUntil).toBeNull();
      expect(Object.values(policy.benefits).every(value => value === null)).toBe(true);
      expect(officialBenefitUrl(policy)).toMatch(/^https:\/\//);
      expect(canShowPolicyTerms(policy, today)).toBe(false);
    }
  });

  it('keeps unidentified programs separate from a claim that no offer exists', () => {
    const policy = studentBenefitPolicies.find(policy => policy.airlineCode === 'AF')!;
    expect(policy.programName).toBeNull();
    expect(policy.sourceUrl).toBe('https://www.airfrance.com/');
  });

  it('supports airline, IATA code and program-name searches without claiming eligibility', () => {
    expect(filterStudentBenefits(studentBenefitPolicies, '  student club  ', 'all', today).map(policy => policy.airlineCode)).toEqual(['QR']);
    expect(filterStudentBenefits(studentBenefitPolicies, 'klm', 'unverified', today).map(policy => policy.airlineCode)).toEqual(['KL']);
    expect(filterStudentBenefits(studentBenefitPolicies, 'Qatar', 'verified-current', today)).toEqual([]);
  });
});

describe('policy verification safeguards', () => {
  it('preserves reviewed current and conditional statuses without applying them to a flight', () => {
    expect(policyStatus(current(), today)).toBe('verified-current');
    expect(policyStatus({ ...current(), status: 'conditional' }, today)).toBe('conditional');
    expect(canShowPolicyTerms(current(), today)).toBe(true);
  });

  it.each([null, '', '2026-02-30', 'yesterday', '2026-10-13'])('does not trust an absent, malformed or future verification date: %s', lastVerifiedAt => {
    expect(policyStatus({ ...current(), lastVerifiedAt }, today)).toBe('unverified');
  });

  it('does not trust unsupported statuses, even with a source and review date', () => {
    expect(policyStatus({ ...current(), status: 'approved' as StudentBenefitPolicy['status'] }, today)).toBe('unverified');
  });

  it('downgrades an expired review or offer and hides its allowance', () => {
    for (const policy of [
      { ...current(), reviewDueAt: '2026-10-11' },
      { ...current(), validUntil: '2026-10-11', status: 'conditional' as const },
    ]) {
      expect(policyStatus(policy, today)).toBe('outdated');
      expect(canShowPolicyTerms(policy, today)).toBe(false);
      expect(policyVerificationDate(policy, today)).toBe('2026-10-01');
    }
  });

  it('does not invent a visible verification date from missing or invalid metadata', () => {
    expect(policyVerificationDate(studentBenefitPolicies[0], today)).toBeNull();
    expect(policyVerificationDate({ ...current(), lastVerifiedAt: '2026-10-13' }, today)).toBeNull();
    expect(policyVerificationDate({ ...current(), lastVerifiedAt: '2026-02-30' }, today)).toBeNull();
  });

  it('requires valid review metadata and keeps an explicit outdated status', () => {
    expect(policyStatus({ ...current(), reviewDueAt: '2026-09-01' }, today)).toBe('unverified');
    expect(policyStatus({ ...current(), reviewDueAt: '2026-02-30' }, today)).toBe('unverified');
    expect(policyStatus({ ...current(), validUntil: 'not a date' }, today)).toBe('unverified');
    expect(policyStatus({ ...current(), status: 'outdated' }, today)).toBe('outdated');
  });

  it.each([
    'http://www.qatarairways.com/en/student-club.html', 'javascript:alert(1)',
    'https://evil.example/?official=qatarairways.com', 'https://qatarairways.com.evil.example/',
    'https://www.qatarairways.com@evil.example/', 'https://user:secret@www.qatarairways.com/',
    'https://www.qatarairways.com:8443/',
  ])('does not use an unsafe or non-airline official-source URL: %s', sourceUrl => {
    const policy = { ...current(), sourceUrl };
    expect(officialBenefitUrl(policy)).toBeNull();
    expect(policyStatus(policy, today)).toBe('unverified');
  });

  it('supports airline-owned subdomains and rejects unknown airlines', () => {
    expect(officialBenefitUrl({ ...current(), sourceUrl: 'https://offers.qatarairways.com/students' })).toBe('https://offers.qatarairways.com/students');
    expect(officialBenefitUrl({ ...current(), airlineCode: 'XX' })).toBeNull();
  });
});

describe('checked baggage rule semantics', () => {
  it('distinguishes a total allowance from an additional allowance', () => {
    const common = { amount: 30, unit: 'kg' as const, conditions: 'Illustrative test fixture only' };
    expect(baggageBenefitLabel({ ...common, basis: 'total-weight' })).toBe('Total allowance: 30 kg');
    expect(baggageBenefitLabel({ ...common, amount: 10, basis: 'extra-weight' })).toBe('Additional 10 kg');
    expect(baggageBenefitLabel({ amount: 1, unit: 'pieces', basis: 'extra-pieces', conditions: 'Test fixture' })).toBe('Additional 1 piece');
  });

  it('does not turn unknown, invalid or unqualified baggage terms into an allowance', () => {
    expect(baggageBenefitLabel(null)).toBeNull();
    expect(baggageBenefitLabel({ amount: NaN, unit: 'kg', basis: 'extra-weight', conditions: 'Fixture' })).toBeNull();
    expect(baggageBenefitLabel({ amount: 1.5, unit: 'pieces', basis: 'extra-pieces', conditions: 'Fixture' })).toBeNull();
    expect(baggageBenefitLabel({ amount: 10, unit: 'pieces', basis: 'extra-weight', conditions: 'Fixture' })).toBeNull();
    expect(baggageBenefitLabel({ amount: 10, unit: 'kg', basis: 'extra-weight', conditions: '' })).toBeNull();
  });
});
