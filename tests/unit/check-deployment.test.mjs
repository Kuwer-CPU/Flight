import { describe, expect, it } from 'vitest';
import { integrationDescription } from '../../scripts/check-deployment.mjs';

const partner = {
  integration: 'travelpayouts', status: 'configured', configured: true,
  transport: 'script', affiliateLinks: false, message: 'Server message should not be printed directly.',
};
const api = {
  integration: 'api', mode: 'live', provider: 'amadeus', environment: 'production',
  status: 'missing-credentials', configured: false, message: 'The API is not connected.',
};

describe('deployment checks for the selected integration', () => {
  it('accepts primary partner configuration independently of API credentials or demo mode', () => {
    const result = integrationDescription(JSON.stringify(partner), { expectedIntegration: 'travelpayouts', expectedMode: 'demo' });
    expect(result.integration).toBe('travelpayouts');
    expect(result.description).toContain('Amadeus credentials are not required');
    expect(result.description).toContain('configuration only');
    expect(result.description).not.toContain(partner.message);
  });
  it('keeps explicit API mode checks and missing-key status truthful', () => {
    expect(integrationDescription(JSON.stringify(api), { expectedIntegration: 'api', expectedMode: 'live' }).description).toContain('credentials are missing');
    expect(() => integrationDescription(JSON.stringify(api), { expectedMode: 'demo' })).toThrow('mode differs');
    expect(() => integrationDescription(JSON.stringify(api), { expectedIntegration: 'travelpayouts' })).toThrow('integration differs');
  });
  it('reports disabled partner configuration without claiming rendering succeeded', () => {
    const result = integrationDescription(JSON.stringify({ ...partner, configured: false, status: 'disabled' }));
    expect(result.description).toContain('disabled');
    expect(result.description).toContain('rendering, live prices, account ownership and booking availability are not checked');
  });
  it.each([
    'null', '[]', 'invalid', JSON.stringify({ ...partner, configured: false }),
    JSON.stringify({ ...partner, status: 'unexpected' }),
    JSON.stringify({ ...partner, frameUrl: 'https://private-source.com/?marker=fixture' }),
    JSON.stringify({ ...partner, whiteLabelId: '23277' }),
    JSON.stringify({ ...api, apiKey: 'fixture-private-key' }),
  ])('rejects malformed or overexposing status responses', body => {
    expect(() => integrationDescription(body)).toThrow();
  });
});
