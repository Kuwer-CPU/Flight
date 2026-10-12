import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../../src/app/api/integration-status/route';

const variables = [
  'FLIGHT_SEARCH_INTEGRATION', 'TRAVELPAYOUTS_EMBED_ENABLED', 'TRAVELPAYOUTS_AFFILIATE_LINKS',
  'TRAVELPAYOUTS_WHITE_LABEL_ID', 'TRAVELPAYOUTS_WHITE_LABEL_URL', 'TRAVELPAYOUTS_WIDGET_CODE',
  'FLIGHT_DATA_MODE', 'FLIGHT_PROVIDER', 'AMADEUS_ENVIRONMENT', 'AMADEUS_API_KEY', 'AMADEUS_API_SECRET',
  'SKYSCANNER_API_KEY', 'NEXT_PUBLIC_SITE_URL',
];
beforeEach(() => { for (const name of variables) vi.stubEnv(name, undefined); });
afterEach(() => vi.unstubAllEnvs());

describe('selected integration status', () => {
  it('reports primary script configuration without requiring API keys or promising availability', async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const payload = await response.json();
    expect(payload).toMatchObject({ integration: 'travelpayouts', status: 'configured', configured: true, transport: 'script', affiliateLinks: false });
    expect(payload.message).toContain('have not been verified');
    expect(Object.keys(payload).sort()).toEqual(['affiliateLinks', 'configured', 'integration', 'message', 'status', 'transport']);
  });
  it('returns a safe configuration summary for an iframe without exposing its source or query', async () => {
    vi.stubEnv('TRAVELPAYOUTS_WIDGET_CODE', '<iframe src="https://partner-flight-interface.com/search?marker=fixture-affiliate-marker" title="Fixture"></iframe>');
    vi.stubEnv('AMADEUS_API_KEY', 'fixture-private-key');
    vi.stubEnv('AMADEUS_API_SECRET', 'fixture-private-secret');
    const payload = await GET().json();
    expect(payload).toMatchObject({ integration: 'travelpayouts', configured: true, transport: 'iframe' });
    expect(JSON.stringify(payload)).not.toMatch(/fixture-affiliate-marker|fixture-private|partner-flight-interface\.com|src=|frameUrl|scriptUrl|whiteLabelId/);
  });
  it('marks disabled and invalid partner settings as unconfigured', async () => {
    vi.stubEnv('TRAVELPAYOUTS_EMBED_ENABLED', 'false');
    expect(await GET().json()).toMatchObject({ status: 'disabled', configured: false });
    vi.stubEnv('TRAVELPAYOUTS_EMBED_ENABLED', 'true');
    vi.stubEnv('TRAVELPAYOUTS_WHITE_LABEL_ID', 'invalid');
    expect(await GET().json()).toMatchObject({ status: 'invalid-configuration', configured: false });
  });
  it('reports explicit API configuration with the existing safe fields and no credential values', async () => {
    vi.stubEnv('FLIGHT_SEARCH_INTEGRATION', 'api');
    expect(await GET().json()).toMatchObject({ integration: 'api', status: 'missing-credentials', configured: false, provider: 'amadeus' });
    vi.stubEnv('AMADEUS_API_KEY', 'fixture-status-private-key');
    vi.stubEnv('AMADEUS_API_SECRET', 'fixture-status-private-secret');
    const payload = await GET().json();
    expect(payload).toMatchObject({ integration: 'api', status: 'configured', configured: true });
    expect(Object.keys(payload).sort()).toEqual(['configured', 'environment', 'integration', 'message', 'mode', 'provider', 'status']);
    expect(JSON.stringify(payload)).not.toContain('fixture-status-private');
  });
});
