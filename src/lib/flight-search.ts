import type { SearchQuery, SearchResponse } from './types';
import { searchFlights as searchAmadeus, FlightProviderError } from './amadeus';
import { getFlightConfig } from './flight-config';
import { searchSkyscannerFlights } from './skyscanner';

/** Select one configured feed. Provider failures never select another provider or demo data. */
export async function searchFlights(query: SearchQuery): Promise<SearchResponse> {
  const config = getFlightConfig();
  if (config.status === 'invalid-configuration' || config.status === 'missing-credentials') {
    throw new FlightProviderError(config.message, 503);
  }
  if (config.mode !== 'demo' && config.provider === 'skyscanner') return searchSkyscannerFlights(query);
  const result = await searchAmadeus(query);
  return result.mode === 'demo' ? result : { ...result, offers: result.offers.map(offer => ({ ...offer, provider: 'amadeus' })) };
}
