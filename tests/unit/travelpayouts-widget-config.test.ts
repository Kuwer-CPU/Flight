import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFlightIntegration } from '../../src/lib/flight-integration';

const variables = ['FLIGHT_SEARCH_INTEGRATION', 'TRAVELPAYOUTS_EMBED_ENABLED', 'TRAVELPAYOUTS_WHITE_LABEL_ID', 'TRAVELPAYOUTS_WHITE_LABEL_URL', 'TRAVELPAYOUTS_WIDGET_CODE', 'TRAVELPAYOUTS_AFFILIATE_LINKS', 'NEXT_PUBLIC_SITE_URL'] as const;
beforeEach(() => { for (const name of variables) vi.stubEnv(name, undefined); });
afterEach(() => vi.unstubAllEnvs());

describe('owner-supplied Travelpayouts White Label module', () => {
  it('uses exactly the supplied public module and ID without an API key or pasted HTML', () => {
    vi.stubEnv('AMADEUS_API_KEY', 'private-amadeus-key'); vi.stubEnv('SKYSCANNER_API_KEY', 'private-skyscanner-key');
    const config = getFlightIntegration();
    expect(config).toEqual({ integration: 'travelpayouts', transport: 'script', status: 'configured', affiliateLinks: false,
      whiteLabelId: '23277', scriptUrl: 'https://tpwidg.com/wl_web/main.js?wl_id=23277', scriptOrigin: 'https://tpwidg.com' });
    expect(JSON.stringify(config)).not.toMatch(/private-amadeus-key|private-skyscanner-key|<script/);
  });
  it('changes only the public numeric identifier in the fixed module URL', () => {
    vi.stubEnv('TRAVELPAYOUTS_WHITE_LABEL_ID', '45678');
    vi.stubEnv('TRAVELPAYOUTS_SCRIPT_URL', 'https://untrusted-provider.com/script.js');
    expect(getFlightIntegration()).toMatchObject({ transport: 'script', status: 'configured', whiteLabelId: '45678', scriptUrl: 'https://tpwidg.com/wl_web/main.js?wl_id=45678', scriptOrigin: 'https://tpwidg.com' });
  });
  it.each(['0', '023277', '-1', '23277&url=other', '<script>', 'https://untrusted-provider.com', '1234567890123', '23277\n<script>'])('fails closed for an invalid public ID %s', value => {
    vi.stubEnv('TRAVELPAYOUTS_WHITE_LABEL_ID', value);
    const config = getFlightIntegration();
    expect(config).toMatchObject({ integration: 'travelpayouts', transport: 'script', status: 'invalid-configuration' });
    expect(config).not.toHaveProperty('scriptUrl'); expect(config).not.toHaveProperty('whiteLabelId');
  });
  it('supports explicit partner disablement without exposing a loadable script', () => {
    vi.stubEnv('TRAVELPAYOUTS_EMBED_ENABLED', 'false');
    const config = getFlightIntegration();
    expect(config).toMatchObject({ transport: 'script', status: 'disabled' });
    expect(config).not.toHaveProperty('scriptUrl');
  });
  it.each(['api_key', 'apiKey', 'secret', 'password', 'access_token', 'token', 'auth', 'client_secret'])('never emits an iframe source containing credential query %s', name => {
    vi.stubEnv('TRAVELPAYOUTS_WHITE_LABEL_URL', 'https://partner-flight-interface.com/search?' + name + '=private-string');
    const config = getFlightIntegration();
    expect(config).toMatchObject({ transport: 'iframe', status: 'invalid-configuration' });
    expect(JSON.stringify(config)).not.toContain('private-string');
    expect(config).not.toHaveProperty('frameUrl'); expect(config).not.toHaveProperty('scriptUrl');
  });
  it('preserves permitted public affiliate identifiers in an approved iframe source', () => {
    const source = 'https://partner-flight-interface.com/search?marker=123&wl_id=23277&trs=public-marker';
    vi.stubEnv('TRAVELPAYOUTS_WHITE_LABEL_URL', source);
    expect(getFlightIntegration()).toMatchObject({ transport: 'iframe', status: 'configured', frameUrl: source });
  });
  it('checks credential queries after iframe HTML entity decoding', () => {
    vi.stubEnv('TRAVELPAYOUTS_WIDGET_CODE', '<iframe src="https://partner-flight-interface.com/search?marker=123&amp;api_key=private-string"></iframe>');
    const config = getFlightIntegration();
    expect(config).toMatchObject({ status: 'invalid-configuration' });
    expect(JSON.stringify(config)).not.toContain('private-string');
  });
  it('retains API mode only as an explicit selector, without a partner failure fallback', () => {
    vi.stubEnv('FLIGHT_SEARCH_INTEGRATION', 'api'); vi.stubEnv('TRAVELPAYOUTS_WHITE_LABEL_ID', 'bad');
    expect(getFlightIntegration()).toEqual({ integration: 'api' });
    vi.stubEnv('FLIGHT_SEARCH_INTEGRATION', 'travelpayouts');
    expect(getFlightIntegration()).toMatchObject({ integration: 'travelpayouts', status: 'invalid-configuration' });
  });
});
