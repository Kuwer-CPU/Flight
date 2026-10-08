import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../../src/app/api/status/route';

afterEach(() => vi.unstubAllEnvs());

describe('public flight configuration status', () => {
  it('reports missing production credentials without advertising connected fares', async () => {
    vi.stubEnv('FLIGHT_DATA_MODE', 'live');
    vi.stubEnv('AMADEUS_ENVIRONMENT', 'production');
    vi.stubEnv('AMADEUS_API_KEY', '');
    vi.stubEnv('AMADEUS_API_SECRET', '');
    const response = GET();
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toMatchObject({ mode: 'live', provider: 'amadeus', environment: 'production', status: 'missing-credentials', configured: false });
  });

  it('exposes presence only and never serializes API keys or secrets', async () => {
    vi.stubEnv('FLIGHT_DATA_MODE', 'live');
    vi.stubEnv('AMADEUS_ENVIRONMENT', 'production');
    vi.stubEnv('AMADEUS_API_KEY', 'unit-status-private-key');
    vi.stubEnv('AMADEUS_API_SECRET', 'unit-status-private-secret');
    const payload = await GET().json();
    expect(payload).toMatchObject({ status: 'configured', configured: true });
    expect(JSON.stringify(payload)).not.toContain('unit-status-private');
    expect(Object.keys(payload).sort()).toEqual(['configured', 'environment', 'message', 'mode', 'provider', 'status']);
  });
});
