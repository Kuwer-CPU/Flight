import type { FlightConnection } from './types';

/** Safe to send to the browser. Credential presence is not an authentication check. */
export function getFlightConfig(): FlightConnection {
  const requestedMode = process.env.FLIGHT_DATA_MODE?.trim() || 'live';
  const requestedEnvironment = process.env.AMADEUS_ENVIRONMENT?.trim() || 'production';
  const configured = !!process.env.AMADEUS_API_KEY?.trim() && !!process.env.AMADEUS_API_SECRET?.trim();
  const environment: FlightConnection['environment'] = requestedEnvironment === 'test' ? 'test' : 'production';
  const base = { provider: 'amadeus' as const, environment, configured };

  if (!['demo', 'live'].includes(requestedMode) || !['test', 'production'].includes(requestedEnvironment)) {
    return {
      ...base, mode: 'live', status: 'invalid-configuration',
      message: 'Flight search configuration is invalid. Use FLIGHT_DATA_MODE=live or demo and AMADEUS_ENVIRONMENT=production or test.',
    };
  }
  if (requestedMode === 'demo') {
    return { ...base, mode: 'demo', status: 'demo', message: 'Demo mode is enabled. Flights and fares are fictional examples.' };
  }
  const mode = environment === 'production' ? 'live' : 'test';
  if (!configured) {
    return {
      ...base, mode, status: 'missing-credentials',
      message: 'Flight search is not connected. Add both AMADEUS_API_KEY and AMADEUS_API_SECRET in the server environment, then restart or redeploy.',
    };
  }
  return {
    ...base, mode, status: 'configured',
    message: environment === 'production'
      ? 'Amadeus production credentials are configured. Authentication and fare availability are checked when you search.'
      : 'Amadeus test credentials are configured. Searches use sandbox data, not bookable production fares.',
  };
}
