import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFlightIntegration, validatedFrameOrigin } from '../../src/lib/flight-integration';

// Synthetic configuration fixture only; no request is made to this address.
const approvedUrl = 'https://partner-flight-interface.com/search?marker=public-marker&locale=en';
const variables = ['FLIGHT_SEARCH_INTEGRATION', 'TRAVELPAYOUTS_EMBED_ENABLED', 'TRAVELPAYOUTS_WHITE_LABEL_ID', 'TRAVELPAYOUTS_WHITE_LABEL_URL', 'TRAVELPAYOUTS_WIDGET_CODE', 'TRAVELPAYOUTS_AFFILIATE_LINKS', 'NEXT_PUBLIC_SITE_URL'] as const;
beforeEach(() => { for (const variable of variables) vi.stubEnv(variable, undefined); });
afterEach(() => vi.unstubAllEnvs());
function optIn() { vi.stubEnv('TRAVELPAYOUTS_EMBED_ENABLED', 'true'); }

describe('partner flight-search configuration', () => {
  it('defaults to the owner-supplied White Label module without exposing iframe details', () => {
    expect(getFlightIntegration()).toEqual({ integration: 'travelpayouts', transport: 'script', status: 'configured', affiliateLinks: false,
      whiteLabelId: '23277', scriptUrl: 'https://tpwidg.com/wl_web/main.js?wl_id=23277', scriptOrigin: 'https://tpwidg.com' });
  });
  it('honors an explicit opt-out even when a valid hosted URL exists', () => {
    vi.stubEnv('TRAVELPAYOUTS_WHITE_LABEL_URL', approvedUrl);
    vi.stubEnv('TRAVELPAYOUTS_EMBED_ENABLED', 'false');
    expect(getFlightIntegration()).not.toHaveProperty('frameUrl');
    expect(getFlightIntegration()).not.toHaveProperty('frameOrigin');
  });
  it('uses the supplied module when optional iframe sources are absent', () => {
    optIn(); expect(getFlightIntegration()).toMatchObject({ integration: 'travelpayouts', transport: 'script', status: 'configured', whiteLabelId: '23277' });
  });
  it('preserves the approved source URL without adding itinerary or student profile parameters', () => {
    optIn(); vi.stubEnv('TRAVELPAYOUTS_WHITE_LABEL_URL', approvedUrl);
    vi.stubEnv('AMADEUS_API_KEY', 'private-api-key'); vi.stubEnv('AMADEUS_API_SECRET', 'private-api-secret');
    const config = getFlightIntegration();
    expect(config).toEqual({ integration: 'travelpayouts', transport: 'iframe', status: 'configured', affiliateLinks: false, frameUrl: approvedUrl, frameOrigin: 'https://partner-flight-interface.com' });
    const output = JSON.stringify(config);
    expect(output).not.toMatch(/private-api-key|private-api-secret|student|baggage|adults|departureDate/);
  });
  it('keeps native API results an explicit independent choice without a false readiness status', () => {
    vi.stubEnv('FLIGHT_SEARCH_INTEGRATION', 'api'); vi.stubEnv('TRAVELPAYOUTS_WIDGET_CODE', '<script>untrusted()</script>');
    expect(getFlightIntegration()).toEqual({ integration: 'api' });
  });
  it.each([['FLIGHT_SEARCH_INTEGRATION', 'unknown'], ['TRAVELPAYOUTS_EMBED_ENABLED', 'yes'], ['TRAVELPAYOUTS_AFFILIATE_LINKS', 'yes']])('fails closed for invalid %s', (variable, value) => {
    optIn(); vi.stubEnv('TRAVELPAYOUTS_WHITE_LABEL_URL', approvedUrl); vi.stubEnv(variable, value);
    const config = getFlightIntegration();
    expect(config).toMatchObject({ integration: 'travelpayouts', status: 'invalid-configuration' });
    expect(config).not.toHaveProperty('frameUrl');
  });
  it('marks outbound affiliate links only after an explicit owner flag', () => {
    optIn(); vi.stubEnv('TRAVELPAYOUTS_WHITE_LABEL_URL', approvedUrl); vi.stubEnv('TRAVELPAYOUTS_AFFILIATE_LINKS', 'true');
    expect(getFlightIntegration()).toMatchObject({ status: 'configured', affiliateLinks: true });
  });
  it('extracts just an iframe source and never publishes or inherits pasted HTML attributes', () => {
    optIn(); vi.stubEnv('TRAVELPAYOUTS_WIDGET_CODE', '<iframe src="https://partner-flight-interface.com/search?marker=public-marker&amp;locale=en" width="100%" height="600" title="Flights" sandbox="allow-top-navigation" style="border:0" allowfullscreen></iframe>');
    expect(getFlightIntegration()).toEqual({ integration: 'travelpayouts', transport: 'iframe', status: 'configured', affiliateLinks: false, frameUrl: approvedUrl, frameOrigin: 'https://partner-flight-interface.com' });
    expect(JSON.stringify(getFlightIntegration())).not.toMatch(/<iframe|allow-top-navigation|border:0|width/);
  });
  it('accepts quoted iframe attributes with multiline whitespace and either quote style', () => {
    optIn(); vi.stubEnv('TRAVELPAYOUTS_WIDGET_CODE', "<IFRAME\n SRC='https://partner-flight-interface.com/search'\n title='Flight search'\n></IFRAME>");
    expect(getFlightIntegration()).toMatchObject({ status: 'configured', frameUrl: 'https://partner-flight-interface.com/search' });
  });
  it('validates the decoded source rather than allowing encoded executable protocols', () => {
    optIn(); vi.stubEnv('TRAVELPAYOUTS_WIDGET_CODE', '<iframe src="javascript&#58;alert(1)"></iframe>');
    expect(getFlightIntegration()).toMatchObject({ status: 'invalid-configuration' });
    vi.stubEnv('TRAVELPAYOUTS_WIDGET_CODE', '<iframe src="https&#58;//partner-flight-interface.com/search"></iframe>');
    expect(getFlightIntegration()).toMatchObject({ status: 'configured', frameOrigin: 'https://partner-flight-interface.com' });
  });
  it.each([
    '<script src="https://partner-flight-interface.com/widget.js"></script>',
    '<div><iframe src="https://partner-flight-interface.com/search"></iframe></div>',
    '<iframe src="https://partner-flight-interface.com/search"><script>alert(1)</script></iframe>',
    '<iframe src="https://partner-flight-interface.com/search" onload="alert(1)"></iframe>',
    '<iframe src="https://partner-flight-interface.com/search" srcdoc="untrusted"></iframe>',
    '<iframe src="https://partner-flight-interface.com/search" SRC="https://other-provider.com"></iframe>',
    '<iframe src=https://partner-flight-interface.com/search></iframe>',
    '<iframe src="https://partner-flight-interface.com/search"></iframe><iframe src="https://other-provider.com"></iframe>',
    '<iframe data-src="https://partner-flight-interface.com/search"></iframe>',
    '<iframe src="https://partner-flight-interface.com/search" data-unverified="x"></iframe>',
  ])('rejects unsupported or unsafe widget HTML: %s', code => {
    optIn(); vi.stubEnv('TRAVELPAYOUTS_WIDGET_CODE', code);
    expect(getFlightIntegration()).toMatchObject({ status: 'invalid-configuration' });
    expect(getFlightIntegration()).not.toHaveProperty('frameOrigin');
  });
  it('does not silently override conflicting hosted URL and widget sources', () => {
    optIn(); vi.stubEnv('TRAVELPAYOUTS_WHITE_LABEL_URL', approvedUrl); vi.stubEnv('TRAVELPAYOUTS_WIDGET_CODE', '<iframe src="https://other-provider.com/search"></iframe>');
    expect(getFlightIntegration()).toMatchObject({ status: 'invalid-configuration' });
  });
  it('rejects an application-origin embed with scripts and same-origin sandbox permission', () => {
    optIn(); vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://flyora-flight-app.com'); vi.stubEnv('TRAVELPAYOUTS_WHITE_LABEL_URL', 'https://flyora-flight-app.com/flights');
    expect(getFlightIntegration()).toMatchObject({ status: 'invalid-configuration' });
  });
  it('limits URL and snippet lengths before parsing', () => {
    optIn(); vi.stubEnv('TRAVELPAYOUTS_WHITE_LABEL_URL', approvedUrl + 'x'.repeat(8200));
    expect(getFlightIntegration()).toMatchObject({ status: 'invalid-configuration' });
    vi.stubEnv('TRAVELPAYOUTS_WHITE_LABEL_URL', ''); vi.stubEnv('TRAVELPAYOUTS_WIDGET_CODE', '<iframe src="' + approvedUrl + '">' + ' '.repeat(20_000) + '</iframe>');
    expect(getFlightIntegration()).toMatchObject({ status: 'invalid-configuration' });
  });
});

describe('exact external frame origin validation', () => {
  it('returns a single HTTPS origin rather than a source path or broad wildcard', () => {
    expect(validatedFrameOrigin(approvedUrl)).toBe('https://partner-flight-interface.com');
    expect(validatedFrameOrigin('https://partner-flight-interface.com:443/search#results')).toBe('https://partner-flight-interface.com');
  });
  it.each([
    undefined, '', 'javascript:alert(1)', 'data:text/html,untrusted', 'http://partner-flight-interface.com/search',
    '//partner-flight-interface.com/search', '/flights', 'https://user:secret@partner-flight-interface.com/search',
    'https://partner-flight-interface.com:8443/search', 'https://localhost/search', 'https://host.local/search',
    'https://host.internal/search', 'https://127.0.0.1/search', 'https://127.1/search', 'https://2130706433/search',
    'https://[::1]/search', 'https://example.com/search', 'https://host.invalid/search', 'https://host.example/search',
    'https://-invalid-host.com/search', 'https://partner-flight-interface.com/\nsearch',
  ])('rejects unsafe or non-public frame source %s', value => {
    expect(validatedFrameOrigin(value)).toBeUndefined();
    optIn(); vi.stubEnv('TRAVELPAYOUTS_WHITE_LABEL_URL', value);
    expect(getFlightIntegration()).not.toHaveProperty('frameUrl');
  });
});
