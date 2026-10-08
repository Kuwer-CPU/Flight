import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFlightConfig } from '../../src/lib/flight-config';

beforeEach(() => {
  vi.stubEnv('FLIGHT_DATA_MODE', undefined); vi.stubEnv('AMADEUS_ENVIRONMENT', undefined);
  vi.stubEnv('AMADEUS_API_KEY', undefined); vi.stubEnv('AMADEUS_API_SECRET', undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe('flight connection configuration', () => {
  it('defaults to live production with a clear missing-credentials status', () => {
    expect(getFlightConfig()).toMatchObject({ mode: 'live', provider: 'amadeus', environment: 'production', configured: false, status: 'missing-credentials' });
  });
  it('reports configured credential presence without claiming verified connectivity', () => {
    vi.stubEnv('AMADEUS_API_KEY', 'private-key'); vi.stubEnv('AMADEUS_API_SECRET', 'private-secret');
    const config = getFlightConfig();
    expect(config).toMatchObject({ mode: 'live', environment: 'production', configured: true, status: 'configured' });
    expect(config.message).toContain('checked when you search');
    expect(JSON.stringify(config)).not.toMatch(/private-key|private-secret/);
  });
  it('uses sandbox only when test is explicitly selected', () => {
    vi.stubEnv('AMADEUS_ENVIRONMENT', 'test');
    expect(getFlightConfig()).toMatchObject({ mode: 'test', environment: 'test', status: 'missing-credentials' });
    vi.stubEnv('AMADEUS_API_KEY', 'key'); vi.stubEnv('AMADEUS_API_SECRET', 'secret');
    expect(getFlightConfig()).toMatchObject({ mode: 'test', status: 'configured' });
    expect(getFlightConfig().message).toContain('not bookable production fares');
  });
  it('uses fictional demo data only when explicitly enabled', () => {
    vi.stubEnv('FLIGHT_DATA_MODE', 'demo');
    expect(getFlightConfig()).toMatchObject({ mode: 'demo', configured: false, status: 'demo' });
  });
  it.each([['FLIGHT_DATA_MODE', 'demoo'], ['FLIGHT_DATA_MODE', 'test'], ['AMADEUS_ENVIRONMENT', 'prod'], ['AMADEUS_ENVIRONMENT', 'Production']])('rejects invalid %s values without displaying them or falling back', (variable, value) => {
    vi.stubEnv(variable, value);
    expect(getFlightConfig()).toMatchObject({ mode: 'live', status: 'invalid-configuration' });
    expect(getFlightConfig().message).toBe('Flight search configuration is invalid. Use FLIGHT_DATA_MODE=live or demo and AMADEUS_ENVIRONMENT=production or test.');
  });
  it('validates environment settings even when demo is explicitly requested', () => {
    vi.stubEnv('FLIGHT_DATA_MODE', 'demo'); vi.stubEnv('AMADEUS_ENVIRONMENT', 'invalid');
    expect(getFlightConfig()).toMatchObject({ mode: 'live', status: 'invalid-configuration' });
  });
  it('treats empty settings as defaults and whitespace credentials as missing', () => {
    vi.stubEnv('FLIGHT_DATA_MODE', ''); vi.stubEnv('AMADEUS_ENVIRONMENT', '');
    vi.stubEnv('AMADEUS_API_KEY', '  '); vi.stubEnv('AMADEUS_API_SECRET', 'secret');
    expect(getFlightConfig()).toMatchObject({ mode: 'live', environment: 'production', configured: false, status: 'missing-credentials' });
  });
});
