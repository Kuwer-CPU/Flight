import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import nextConfig from '../../next.config';

const variables = [
  'FLIGHT_SEARCH_INTEGRATION', 'TRAVELPAYOUTS_EMBED_ENABLED', 'TRAVELPAYOUTS_WHITE_LABEL_ID',
  'TRAVELPAYOUTS_WHITE_LABEL_URL', 'TRAVELPAYOUTS_WIDGET_CODE', 'TRAVELPAYOUTS_AFFILIATE_LINKS',
  'TRAVELPAYOUTS_RESOURCE_ORIGINS', 'NEXT_PUBLIC_SITE_URL',
] as const;

beforeEach(() => {
  for (const variable of variables) vi.stubEnv(variable, undefined);
  vi.stubEnv('NODE_ENV', 'production');
});
afterEach(() => vi.unstubAllEnvs());

type Policy = Record<string, string[]>;

async function contentSecurityPolicy(): Promise<Policy> {
  if (!nextConfig.headers) throw new Error('Deployment headers must be configured.');
  const rules = await nextConfig.headers();
  const value = rules.find(rule => rule.source === '/:path*')?.headers.find(header => header.key.toLowerCase() === 'content-security-policy')?.value;
  if (!value) throw new Error('The global deployment policy must include CSP.');
  return Object.fromEntries(value.split(';').map(directive => {
    const [name, ...sources] = directive.trim().split(/\s+/);
    return [name, sources];
  }).filter(([name]) => !!name));
}

function expectOnlyIn(policy: Policy, origin: string, directive: string) {
  expect(policy[directive]).toContain(origin);
  for (const [name, sources] of Object.entries(policy)) {
    if (name !== directive) expect(sources, origin + ' must not grant ' + name).not.toContain(origin);
  }
}

const sdkOrigins = [
  'https://tpwidg.com', 'https://api.apistp.com', 'https://autocomplete.apistp.com',
  'https://tickets-api.apistp.com', 'https://www.apistp.com', 'https://img.avs.io',
  'https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://tickets-api.eu-north-1.apistp.com', 'https://avsplow.com',
];

describe('Travelpayouts deployment CSP', () => {
  it.each([
    'https://api.apistp.com', 'https://autocomplete.apistp.com',
    'https://tickets-api.apistp.com', 'https://www.apistp.com',
    'https://tickets-api.eu-north-1.apistp.com', 'https://avsplow.com',
  ])('permits SDK requests to %s without allowing scripts, frames or other resource types from that API', async origin => {
    expectOnlyIn(await contentSecurityPolicy(), origin, 'connect-src');
  });

  it('permits observed image resources only as images', async () => {
    expectOnlyIn(await contentSecurityPolicy(), 'https://img.avs.io', 'img-src');
  });

  it('permits the observed font stylesheet origin without allowing JavaScript or arbitrary font hosts', async () => {
    const policy = await contentSecurityPolicy();
    expectOnlyIn(policy, 'https://fonts.googleapis.com', 'style-src');
  });

  it('permits font files referenced by the actual partner stylesheet only as fonts', async () => {
    expectOnlyIn(await contentSecurityPolicy(), 'https://fonts.gstatic.com', 'font-src');
  });

  it('loads the owner-supplied SDK from its exact origin without broad schemes or wildcard hosts', async () => {
    const policy = await contentSecurityPolicy();
    expect(policy['script-src']).toContain('https://tpwidg.com');
    expect(policy['script-src']).not.toContain("'unsafe-eval'");
    expect(policy['default-src']).toEqual(["'self'"]);
    expect(policy['object-src']).toEqual(["'none'"]);
    expect(policy['frame-ancestors']).toEqual(["'none'"]);
    for (const source of Object.values(policy).flat()) {
      expect(source).not.toContain('*');
      expect(source).not.toMatch(/^(?:https?|wss?):$/);
    }
  });

  it('limits connections to the exact observed HTTPS hosts, without guessing other regions or collector subdomains', async () => {
    const policy = await contentSecurityPolicy();
    expect(policy['connect-src']).toEqual([
      "'self'", 'https://tpwidg.com', 'https://api.apistp.com', 'https://autocomplete.apistp.com',
      'https://tickets-api.apistp.com', 'https://www.apistp.com',
      'https://tickets-api.eu-north-1.apistp.com', 'https://avsplow.com',
    ]);
    expect(policy['base-uri']).toEqual(["'self'"]);
    expect(policy['form-action']).toEqual(["'self'", 'https://tpwidg.com']);
    expect(policy['frame-src']).toEqual(['https://tpwidg.com']);
  });

  it('retains the production security headers and global document policy needed for SPA entry', async () => {
    const rules = await nextConfig.headers!();
    const headers = Object.fromEntries(rules.find(rule => rule.source === '/:path*')!.headers.map(header => [header.key, header.value]));
    expect(headers).toMatchObject({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000',
    });
    expect(rules.find(rule => rule.source === '/flights')?.headers).toContainEqual({
      key: 'X-Robots-Tag', value: 'noindex, nofollow, nosnippet',
    });
  });

  it('extends resource categories only with explicitly configured exact HTTPS origins', async () => {
    vi.stubEnv('TRAVELPAYOUTS_RESOURCE_ORIGINS', ' https://OWNER-PARTNER-CDN.com/, https://owner-partner-cdn.com ');
    const policy = await contentSecurityPolicy();
    for (const directive of ['script-src', 'style-src', 'img-src', 'font-src', 'connect-src', 'form-action', 'frame-src']) {
      expect(policy[directive].filter(source => source === 'https://owner-partner-cdn.com')).toHaveLength(1);
    }
    expect(policy['default-src']).toEqual(["'self'"]);
    expect(policy['object-src']).toEqual(["'none'"]);
    expect(policy['frame-ancestors']).toEqual(["'none'"]);
    expectOnlyIn(policy, 'https://api.apistp.com', 'connect-src');
  });

  it.each([
    'https://owner-partner-cdn.com; script-src *',
    'https:', 'https://*.owner-partner-cdn.com',
    'https://owner-partner-cdn.com, http://unsafe-partner-cdn.com',
    'https://owner-partner-cdn.com/script.js',
  ])('does not expand policy from malformed custom resource configuration: %s', async value => {
    vi.stubEnv('TRAVELPAYOUTS_RESOURCE_ORIGINS', value);
    const policy = await contentSecurityPolicy();
    expect(Object.values(policy).flat()).not.toContain('https://owner-partner-cdn.com');
    expect(Object.values(policy).flat()).not.toContain('http://unsafe-partner-cdn.com');
    expect(Object.values(policy).flat()).not.toContain('*');
    expectOnlyIn(policy, 'https://api.apistp.com', 'connect-src');
  });

  it.each([
    ['FLIGHT_SEARCH_INTEGRATION', 'api'],
    ['FLIGHT_SEARCH_INTEGRATION', 'unknown'],
    ['TRAVELPAYOUTS_EMBED_ENABLED', 'false'],
    ['TRAVELPAYOUTS_WHITE_LABEL_ID', 'not-an-approved-id'],
    ['TRAVELPAYOUTS_WHITE_LABEL_URL', 'javascript:alert(1)'],
    ['TRAVELPAYOUTS_AFFILIATE_LINKS', 'invalid'],
  ])('keeps partner resource permissions absent when %s=%s cannot use the module', async (variable, value) => {
    vi.stubEnv(variable, value);
    vi.stubEnv('TRAVELPAYOUTS_RESOURCE_ORIGINS', 'https://owner-partner-cdn.com');
    const policy = await contentSecurityPolicy();
    for (const origin of [...sdkOrigins, 'https://owner-partner-cdn.com']) expect(Object.values(policy).flat()).not.toContain(origin);
    expect(policy['script-src']).toEqual(["'self'", "'unsafe-inline'"]);
    expect(policy['connect-src']).toEqual(["'self'"]);
    expect(policy['frame-src']).toEqual(["'none'"]);
  });

  it('grants an approved iframe only its exact frame origin, without module or API resource permissions', async () => {
    vi.stubEnv('TRAVELPAYOUTS_WHITE_LABEL_URL', 'https://owner-approved-search.com/flights?marker=public-marker');
    vi.stubEnv('TRAVELPAYOUTS_RESOURCE_ORIGINS', 'https://owner-partner-cdn.com');
    const policy = await contentSecurityPolicy();
    expectOnlyIn(policy, 'https://owner-approved-search.com', 'frame-src');
    expect(policy['frame-src']).toEqual(['https://owner-approved-search.com']);
    for (const origin of [...sdkOrigins, 'https://owner-partner-cdn.com']) expect(Object.values(policy).flat()).not.toContain(origin);
    expect(policy['connect-src']).toEqual(["'self'"]);
  });

  it('rejects an unsafe iframe source without emitting credential values or broad frame permissions', async () => {
    vi.stubEnv('TRAVELPAYOUTS_WIDGET_CODE', '<iframe src="https://owner-approved-search.com/flights?api_key=private-fixture-key"></iframe>');
    const policy = await contentSecurityPolicy();
    expect(policy['frame-src']).toEqual(["'none'"]);
    expect(JSON.stringify(policy)).not.toContain('private-fixture-key');
    expect(Object.values(policy).flat()).not.toContain('https://owner-approved-search.com');
  });
});
