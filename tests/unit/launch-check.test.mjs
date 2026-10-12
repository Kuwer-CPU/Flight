import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { assessLaunch, validEvidence } from '../../scripts/launch-check.mjs';

const envNames = [
  'FLIGHT_DATA_MODE', 'FLIGHT_PROVIDER', 'AMADEUS_ENVIRONMENT', 'AMADEUS_API_KEY', 'AMADEUS_API_SECRET',
  'SKYSCANNER_ENVIRONMENT', 'SKYSCANNER_API_KEY', 'SKYSCANNER_MARKET', 'SKYSCANNER_LOCALE', 'SKYSCANNER_PRICE_BASIS',
  'NEXT_PUBLIC_SITE_URL', 'FLYORA_BUSINESS_NAME', 'FLYORA_CONTACT_EMAIL', 'FLYORA_ALLOW_INDEXING',
  'NEXT_PUBLIC_PROVIDER_API_KEY',
];
const manualIds = ['provider_contract', 'live_seller_quotes', 'student_rules', 'business_and_legal', 'hosting_https', 'monitoring_and_limits'];
function reviewed() {
  return { schemaVersion: 1, checks: Object.fromEntries(manualIds.map(id => [id, {
    status: 'complete', reviewedOn: '2026-10-11', evidence: 'Recorded operator review for ' + id,
  }])) };
}
function configuredSellerFeed() {
  vi.stubEnv('FLIGHT_PROVIDER', 'skyscanner');
  vi.stubEnv('SKYSCANNER_API_KEY', 'fixture-seller-private-key');
  vi.stubEnv('SKYSCANNER_PRICE_BASIS', 'group');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://flyoratravel.com');
  vi.stubEnv('FLYORA_BUSINESS_NAME', 'Flyora Travel');
  vi.stubEnv('FLYORA_CONTACT_EMAIL', 'support@flyoratravel.com');
}
function check(report, id) { return report.checks.find(value => value.id === id); }

beforeEach(() => {
  for (const name of envNames) vi.stubEnv(name, undefined);
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-12T12:00:00Z'));
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe('manual launch evidence', () => {
  it('accepts a dated, nonempty completed review recorded on or before today', () => {
    expect(validEvidence({ status: 'complete', reviewedOn: '2026-10-12', evidence: 'Reviewed official terms and recorded results.' })).toBe(true);
  });
  it.each([
    undefined, null, {}, { status: 'pending', reviewedOn: '2026-10-11', evidence: 'Not complete' },
    { status: 'complete', reviewedOn: '', evidence: 'Missing review date' },
    { status: 'complete', reviewedOn: '2026-02-30', evidence: 'Invalid calendar date' },
    { status: 'complete', reviewedOn: '2026-10-13', evidence: 'Future review' },
    { status: 'complete', reviewedOn: '2026-10-11T10:00:00Z', evidence: 'Wrong date format' },
    { status: 'complete', reviewedOn: '2026-10-11', evidence: '   ' },
  ])('does not count incomplete, malformed or future evidence: %s', value => {
    expect(validEvidence(value)).toBe(false);
  });
  it('keeps all required reviews blocked when the evidence file is absent or unsupported', () => {
    configuredSellerFeed();
    for (const review of [undefined, {}, { ...reviewed(), schemaVersion: 2 }]) {
      const report = assessLaunch(review);
      expect(manualIds.filter(id => check(report, id)?.status === 'blocked')).toEqual(manualIds);
    }
  });
  it('does not let a complete checklist conceal one invalid review', () => {
    configuredSellerFeed();
    const review = reviewed();
    review.checks.live_seller_quotes.reviewedOn = '2026-10-13';
    const report = assessLaunch(review);
    expect(check(report, 'live_seller_quotes').status).toBe('blocked');
    expect(report.blocked).toBe(1);
  });
});

describe('offline launch guardrails', () => {
  it('reports missing provider and operator settings without pretending the launch is ready', () => {
    const report = assessLaunch(reviewed());
    for (const id of ['production_configuration', 'seller_comparison_feed', 'public_origin', 'business_identity', 'business_contact']) {
      expect(check(report, id)?.status).toBe('blocked');
    }
    expect(report.configurationStatus).toBe('missing-credentials');
  });
  it('allows indexing to remain disabled for a limited launch after genuine external review', () => {
    configuredSellerFeed();
    const report = assessLaunch(reviewed());
    expect(check(report, 'indexing_configuration').status).toBe('pass');
    expect(report.blocked).toBe(0);
    expect(report.audit).toBe('offline launch preparation');
  });
  it('distinguishes configured credential presence from authentication, legal review and issued tickets', () => {
    configuredSellerFeed();
    const report = assessLaunch(reviewed());
    expect(check(report, 'production_configuration').description).toContain('Presence does not verify authentication');
    expect(report.limitations).toContain('not independently verified');
    expect(report.limitations).toContain('does not certify legal compliance, API access, prices or successful ticket issuance');
  });
  it('does not claim Amadeus production fares satisfy the required seller comparison', () => {
    configuredSellerFeed();
    vi.stubEnv('FLIGHT_PROVIDER', 'amadeus');
    vi.stubEnv('AMADEUS_API_KEY', 'fixture-amadeus-key');
    vi.stubEnv('AMADEUS_API_SECRET', 'fixture-amadeus-secret');
    const report = assessLaunch(reviewed());
    expect(check(report, 'production_configuration').status).toBe('pass');
    expect(check(report, 'seller_comparison_feed').status).toBe('blocked');
  });
  it('rejects explicit indexing opt-in while essential production settings are missing', () => {
    configuredSellerFeed();
    vi.stubEnv('FLYORA_CONTACT_EMAIL', undefined);
    vi.stubEnv('FLYORA_ALLOW_INDEXING', 'true');
    expect(check(assessLaunch(reviewed()), 'indexing_configuration').status).toBe('blocked');
  });
  it('blocks public credentials without printing public or private fixture secret values', () => {
    configuredSellerFeed();
    vi.stubEnv('AMADEUS_API_SECRET', 'fixture-amadeus-private-secret');
    vi.stubEnv('NEXT_PUBLIC_PROVIDER_API_KEY', 'fixture-exposed-public-secret');
    const review = reviewed();
    review.checks.provider_contract.evidence = 'fixture-confidential-evidence-content';
    const report = assessLaunch(review);
    expect(check(report, 'private_credentials').status).toBe('blocked');
    expect(JSON.stringify(report)).not.toMatch(/fixture-seller-private-key|fixture-amadeus-private-secret|fixture-exposed-public-secret|fixture-confidential-evidence-content/);
  });
});
