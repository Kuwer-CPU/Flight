import type { FlightConnection } from './types';

/** Safe to send to the browser. Credential presence is not an authentication check. */
export function getFlightConfig(): FlightConnection {
  const requestedMode = process.env.FLIGHT_DATA_MODE?.trim() || 'live';
  const requestedProvider = process.env.FLIGHT_PROVIDER?.trim() || 'amadeus';
  const provider: FlightConnection['provider'] = requestedProvider === 'skyscanner' ? 'skyscanner' : 'amadeus';
  const requestedEnvironment = (provider === 'skyscanner' ? process.env.SKYSCANNER_ENVIRONMENT : process.env.AMADEUS_ENVIRONMENT)?.trim() || 'production';
  const configured = provider === 'skyscanner' ? !!process.env.SKYSCANNER_API_KEY?.trim()
    : !!process.env.AMADEUS_API_KEY?.trim() && !!process.env.AMADEUS_API_SECRET?.trim();
  const environment: FlightConnection['environment'] = provider === 'amadeus' && requestedEnvironment === 'test' ? 'test' : 'production';
  const base = { provider, environment, configured };
  const invalid = (message: string): FlightConnection => ({ ...base, mode: 'live', status: 'invalid-configuration', message });

  if (!['amadeus', 'skyscanner'].includes(requestedProvider)) {
    return invalid('Flight provider configuration is invalid. Use FLIGHT_PROVIDER=amadeus or skyscanner.');
  }
  if (!['demo', 'live'].includes(requestedMode) ||
    (provider === 'amadeus' ? !['test', 'production'].includes(requestedEnvironment) : requestedEnvironment !== 'production')) {
    return invalid(provider === 'amadeus'
      ? 'Flight search configuration is invalid. Use FLIGHT_DATA_MODE=live or demo and AMADEUS_ENVIRONMENT=production or test.'
      : 'Flight search configuration is invalid. Use FLIGHT_DATA_MODE=live or demo and SKYSCANNER_ENVIRONMENT=production. Skyscanner sandbox search is not supported.');
  }
  if (requestedMode === 'demo') {
    return { ...base, mode: 'demo', status: 'demo', message: 'Demo mode is enabled. Flights and fares are fictional examples.' };
  }
  if (provider === 'skyscanner') {
    const market = process.env.SKYSCANNER_MARKET?.trim() || 'UK';
    const locale = process.env.SKYSCANNER_LOCALE?.trim() || 'en-GB';
    if (!/^[A-Z]{2}$/.test(market) || !/^[a-z]{2,3}-[A-Z]{2}$/.test(locale)) {
      return invalid('Skyscanner market or locale configuration is invalid. Use a supported two-letter market and locale such as UK and en-GB.');
    }
    const basis = process.env.SKYSCANNER_PRICE_BASIS?.trim();
    if (basis !== 'group' && basis !== 'per-person') {
      return invalid('Skyscanner price basis is not configured. Confirm whether your partner contract returns whole-party or per-person prices, then set SKYSCANNER_PRICE_BASIS=group or per-person.');
    }
  }
  const mode = environment === 'production' ? 'live' : 'test';
  if (!configured) {
    return {
      ...base, mode, status: 'missing-credentials',
      message: provider === 'skyscanner'
        ? 'Seller flight search is not connected. Add an approved SKYSCANNER_API_KEY in the server environment, then restart or redeploy.'
        : 'Flight search is not connected. Add both AMADEUS_API_KEY and AMADEUS_API_SECRET in the server environment, then restart or redeploy.',
    };
  }
  return {
    ...base, mode, status: 'configured',
    message: provider === 'skyscanner'
      ? 'A Skyscanner partner API key is configured. Live access and seller offers are checked when you search.'
      : environment === 'production'
        ? 'Amadeus production credentials are configured. Authentication and fare availability are checked when you search.'
        : 'Amadeus test credentials are configured. Searches use sandbox data, not bookable production fares.',
  };
}
