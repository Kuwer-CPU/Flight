import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFlightConfig } from '../../src/lib/flight-config';

beforeEach(() => {
  vi.stubEnv('FLIGHT_DATA_MODE', undefined); vi.stubEnv('AMADEUS_ENVIRONMENT', undefined);
  vi.stubEnv('AMADEUS_API_KEY', undefined); vi.stubEnv('AMADEUS_API_SECRET', undefined);
  vi.stubEnv('FLIGHT_PROVIDER', undefined); vi.stubEnv('SKYSCANNER_API_KEY', undefined);
  vi.stubEnv('SKYSCANNER_ENVIRONMENT', undefined); vi.stubEnv('SKYSCANNER_MARKET', undefined);
  vi.stubEnv('SKYSCANNER_LOCALE', undefined); vi.stubEnv('SKYSCANNER_PRICE_BASIS', undefined);
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
  it('selects Skyscanner only explicitly and requires its approved partner key', () => {
    vi.stubEnv('FLIGHT_PROVIDER', 'skyscanner'); vi.stubEnv('SKYSCANNER_PRICE_BASIS', 'group');
    vi.stubEnv('AMADEUS_API_KEY', 'amadeus-key'); vi.stubEnv('AMADEUS_API_SECRET', 'amadeus-secret');
    expect(getFlightConfig()).toMatchObject({ provider: 'skyscanner', mode: 'live', configured: false, status: 'missing-credentials' });
    vi.stubEnv('SKYSCANNER_API_KEY', 'private-sky-key');
    const config = getFlightConfig();
    expect(config).toMatchObject({ provider: 'skyscanner', environment: 'production', configured: true, status: 'configured' });
    expect(JSON.stringify(config)).not.toContain('private-sky-key');
    expect(config.message).toContain('checked when you search');
  });
  it('rejects unknown provider selection instead of switching to another feed', () => {
    vi.stubEnv('FLIGHT_PROVIDER', 'private-invalid-value');
    expect(getFlightConfig()).toMatchObject({ mode: 'live', status: 'invalid-configuration' });
    expect(getFlightConfig().message).not.toContain('private-invalid-value');
  });
  it('keeps provider environment configuration separate and rejects Skyscanner test mode', () => {
    vi.stubEnv('FLIGHT_PROVIDER', 'skyscanner'); vi.stubEnv('SKYSCANNER_PRICE_BASIS', 'group');
    vi.stubEnv('SKYSCANNER_API_KEY', 'sky-key'); vi.stubEnv('AMADEUS_ENVIRONMENT', 'test');
    expect(getFlightConfig()).toMatchObject({ mode: 'live', environment: 'production', status: 'configured' });
    vi.stubEnv('SKYSCANNER_ENVIRONMENT', 'test');
    expect(getFlightConfig()).toMatchObject({ mode: 'live', status: 'invalid-configuration' });
  });
  it.each([['SKYSCANNER_MARKET', 'United Kingdom'], ['SKYSCANNER_MARKET', 'uk'], ['SKYSCANNER_LOCALE', 'english'], ['SKYSCANNER_LOCALE', 'en_GB']])('rejects invalid %s for the selected seller feed', (variable, value) => {
    vi.stubEnv('FLIGHT_PROVIDER', 'skyscanner'); vi.stubEnv('SKYSCANNER_PRICE_BASIS', 'group'); vi.stubEnv(variable, value);
    expect(getFlightConfig()).toMatchObject({ mode: 'live', status: 'invalid-configuration' });
  });
  it.each(['', 'total', 'unknown'])('requires an explicit confirmed price basis rather than inferring %s', basis => {
    vi.stubEnv('FLIGHT_PROVIDER', 'skyscanner'); vi.stubEnv('SKYSCANNER_API_KEY', 'sky-key'); vi.stubEnv('SKYSCANNER_PRICE_BASIS', basis);
    expect(getFlightConfig()).toMatchObject({ configured: true, status: 'invalid-configuration' });
    expect(getFlightConfig().message).toContain('Confirm whether your partner contract');
  });
  it.each(['group', 'per-person'])('accepts the owner-confirmed %s price contract', basis => {
    vi.stubEnv('FLIGHT_PROVIDER', 'skyscanner'); vi.stubEnv('SKYSCANNER_API_KEY', 'sky-key'); vi.stubEnv('SKYSCANNER_PRICE_BASIS', basis);
    expect(getFlightConfig()).toMatchObject({ provider: 'skyscanner', mode: 'live', status: 'configured' });
  });
  it('does not validate unused Skyscanner settings when Amadeus is selected', () => {
    vi.stubEnv('SKYSCANNER_ENVIRONMENT', 'test'); vi.stubEnv('SKYSCANNER_MARKET', 'invalid'); vi.stubEnv('SKYSCANNER_LOCALE', 'invalid');
    expect(getFlightConfig()).toMatchObject({ provider: 'amadeus', status: 'missing-credentials' });
  });
  it('allows an explicit seller-feed demo without a partner key or confirmed price basis', () => {
    vi.stubEnv('FLIGHT_PROVIDER', 'skyscanner'); vi.stubEnv('FLIGHT_DATA_MODE', 'demo');
    expect(getFlightConfig()).toMatchObject({ provider: 'skyscanner', mode: 'demo', configured: false, status: 'demo' });
  });
});
