import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlightConnection } from '../../src/lib/types';
import { businessContactEmail, canIndexSite, getSiteConfig, publicSiteOrigin } from '../../src/lib/site-config';

beforeEach(() => {
  for (const variable of ['NEXT_PUBLIC_SITE_URL', 'FLYORA_BUSINESS_NAME', 'FLYORA_CONTACT_EMAIL', 'FLYORA_ALLOW_INDEXING']) vi.stubEnv(variable, undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe('public launch configuration', () => {
  it('accepts a real HTTPS origin and normalizes whitespace and a standard HTTPS port', () => {
    expect(publicSiteOrigin(' https://FlyoraTravel.com:443/ ')).toBe('https://flyoratravel.com');
    expect(publicSiteOrigin('https://flyora-production.vercel.app')).toBe('https://flyora-production.vercel.app');
  });

  it.each([
    undefined, '', 'not a URL', 'http://flyoratravel.com', 'https://flyoratravel.com/flights',
    'https://flyoratravel.com?campaign=student', 'https://flyoratravel.com#search',
    'https://username:password@flyoratravel.com', 'https://flyoratravel.com:3000',
    'https://localhost', 'https://flyora.local', 'https://flyora.internal', 'https://flyora.test',
    'https://flyora.invalid', 'https://example.com', 'https://preview.example.org',
    'https://127.0.0.1', 'https://[::1]', 'https://-flyora.com', 'https://flyora..com',
    'https://' + 'a'.repeat(64) + '.com',
  ])('does not publish an unsafe, placeholder or malformed origin: %s', value => {
    expect(publicSiteOrigin(value)).toBeUndefined();
  });

  it('allows building without business or deployment settings and keeps indexing off', () => {
    expect(getSiteConfig()).toEqual({
      siteUrl: 'http://localhost:3000', publicOrigin: false,
      businessName: undefined, contactEmail: undefined, indexingRequested: false,
    });
  });

  it('returns trimmed public contact details without exposing unrelated credentials', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://flyoratravel.com');
    vi.stubEnv('FLYORA_BUSINESS_NAME', '  Flyora Travel Ltd  ');
    vi.stubEnv('FLYORA_CONTACT_EMAIL', ' support@flyoratravel.com ');
    vi.stubEnv('AMADEUS_API_SECRET', 'fixture-private-secret');
    expect(getSiteConfig()).toMatchObject({ publicOrigin: true, businessName: 'Flyora Travel Ltd', contactEmail: 'support@flyoratravel.com' });
    expect(JSON.stringify(getSiteConfig())).not.toContain('fixture-private-secret');
  });

  it.each(['', ' ', 'A'.repeat(161), 'Flyora\nTravel', 'Flyora\rTravel'])('does not render invalid operator names', name => {
    vi.stubEnv('FLYORA_BUSINESS_NAME', name);
    expect(getSiteConfig().businessName).toBeUndefined();
  });

  it('accepts a public support address while leaving delivery verification to the operator', () => {
    expect(businessContactEmail(' support+flights@FlyoraTravel.com ')).toBe('support+flights@FlyoraTravel.com');
  });
  it.each([
    undefined, '', 'support', 'support@', 'support@flyora.test', 'support@example.com',
    'support@preview.example.org', 'support@flyora.internal', 'support@flyora.localhost',
    'support@flyora..com', 'support@-flyora.com', 'support@flyora..site.com',
    'support@flyora.-site.com', '.support@flyoratravel.com', 'support.@flyoratravel.com',
    'support..flights@flyoratravel.com', 'support\n@flyoratravel.com',
  ])('does not present an invalid or placeholder support address: %s', email => {
    expect(businessContactEmail(email)).toBeUndefined();
  });
});

describe('search indexing opt-in', () => {
  const production: FlightConnection = {
    mode: 'live', provider: 'skyscanner', environment: 'production', status: 'configured',
    configured: true, message: 'Configured credential presence only',
  };
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://flyoratravel.com');
    vi.stubEnv('FLYORA_BUSINESS_NAME', 'Flyora Travel');
    vi.stubEnv('FLYORA_CONTACT_EMAIL', 'support@flyoratravel.com');
  });
  it('stays disabled until explicitly requested even with production configuration', () => {
    expect(canIndexSite(production)).toBe(false);
    vi.stubEnv('FLYORA_ALLOW_INDEXING', 'true');
    expect(canIndexSite(production)).toBe(true);
  });
  it('uses the primary partner configuration without requiring unused API credentials', () => {
    vi.stubEnv('FLYORA_ALLOW_INDEXING', 'true');
    const missingApi: FlightConnection = { ...production, provider: 'amadeus', status: 'missing-credentials', configured: false };
    expect(canIndexSite(missingApi, getSiteConfig(), { integration: 'travelpayouts', status: 'configured' })).toBe(true);
    expect(canIndexSite(production, getSiteConfig(), { integration: 'travelpayouts', status: 'disabled' })).toBe(false);
    expect(canIndexSite(production, getSiteConfig(), { integration: 'travelpayouts', status: 'invalid-configuration' })).toBe(false);
  });
  it.each(['false', '1', 'TRUE', 'yes'])('does not infer consent from %s', flag => {
    vi.stubEnv('FLYORA_ALLOW_INDEXING', flag);
    expect(canIndexSite(production)).toBe(false);
  });
  it.each([
    { mode: 'demo', status: 'demo' },
    { mode: 'test', environment: 'test' },
    { status: 'missing-credentials', configured: false },
    { status: 'invalid-configuration' },
  ])('prevents indexing non-production or unusable connections', overrides => {
    vi.stubEnv('FLYORA_ALLOW_INDEXING', 'true');
    expect(canIndexSite({ ...production, ...overrides } as FlightConnection)).toBe(false);
  });
  it.each(['NEXT_PUBLIC_SITE_URL', 'FLYORA_BUSINESS_NAME', 'FLYORA_CONTACT_EMAIL'])('requires %s before indexing', variable => {
    vi.stubEnv('FLYORA_ALLOW_INDEXING', 'true');
    vi.stubEnv(variable, undefined);
    expect(canIndexSite(production)).toBe(false);
  });
});
