import { describe, expect, it } from 'vitest';
import { normalizeOffers } from '../../src/lib/amadeus';
import { defaults } from '../../src/lib/search';

describe('fixed-EUR Amadeus fare normalization', () => {
  it.each(['live', 'test'] as const)('excludes otherwise valid USD fares while retaining EUR fares in %s mode', mode => {
    const query = { ...defaults(), returnDate: undefined };
    const raw = (id: string, currency: string, total: string) => ({
      id, price: { total, grandTotal: total, currency }, validatingAirlineCodes: ['AF'],
      itineraries: [{ duration: 'PT8H', segments: [{
        id: 'segment1', departure: { iataCode: query.origin, at: query.departureDate + 'T09:00:00' },
        arrival: { iataCode: query.destination, at: query.departureDate + 'T20:30:00' },
        duration: 'PT8H', carrierCode: 'AF', number: '226',
      }] }],
      travelerPricings: [{ travelerId: '1', fareDetailsBySegment: [{
        segmentId: 'segment1', cabin: 'ECONOMY', includedCheckedBags: { weight: 23, weightUnit: 'KG' },
      }] }],
    });
    const offers = normalizeOffers([
      raw('eur1', 'EUR', '570.50'), raw('usd', 'USD', '400.00'), raw('eur2', 'EUR', '610.25'),
    ], query, mode);
    expect(offers.map(offer => offer.price)).toEqual([570.50, 610.25]);
    expect(offers.every(offer => offer.currency === 'EUR')).toBe(true);
    expect(offers[0].baggage).toEqual({ weight: 23, unit: 'KG' });
    expect(offers.every(offer => offer.mode === mode)).toBe(true);
    expect(offers[0].itineraries[0].segments[0]).toMatchObject({ from: query.origin, to: query.destination, departure: query.departureDate + 'T09:00:00' });
  });
});
