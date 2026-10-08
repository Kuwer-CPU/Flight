import { describe, expect, it } from 'vitest';
import type { BookingOffer, FlightOffer } from '../../src/lib/types';
import { getBookingOffers, safeBookingUrl } from '../../src/lib/booking-offers';
import { money } from '../../src/lib/search';

function quote(id: string, price: number, sellerType: BookingOffer['sellerType'] = 'agency'): BookingOffer {
  return { id, sellerId: id, sellerName: id, sellerType, price, currency: 'EUR', bookingUrl: `https://${id}.example.com/checkout?itinerary=quoted`, retrievedAt: '2026-10-08T10:00:00Z' };
}
function flight(quotes: BookingOffer[], mode: FlightOffer['mode'] = 'live'): FlightOffer {
  return { id: 'flight', airlineCode: 'QR', airlineName: 'Qatar Airways', price: 1200.50, currency: 'EUR', passengers: 2, cabin: 'ECONOMY', mode, baggage: {}, itineraries: [], bookingOffers: quotes };
}

describe('booking offer comparison', () => {
  it('orders real seller quotes by the complete party price and preserves the quoted URL', () => {
    const direct = quote('airline', 1300.50, 'airline');
    const agency = quote('agency', 1200.50);
    const result = getBookingOffers(flight([direct, agency]));
    expect(result.map(q => q.sellerId)).toEqual(['agency', 'airline']);
    expect(result[0].price).toBe(1200.50);
    expect(result[0].bookingUrl).toBe('https://agency.example.com/checkout?itinerary=quoted');
  });
  it('does not silently mix currencies or duplicate a seller quote', () => {
    const original = quote('airline', 1300);
    const foreign = { ...quote('foreign', 1000), currency: 'USD' };
    expect(getBookingOffers(flight([original, { ...original }, foreign]))).toEqual([original]);
  });
  it('does not turn injected demo or sandbox seller fields into real booking options', () => {
    expect(getBookingOffers(flight([quote('seller', 1200)], 'demo'))).toEqual([]);
    expect(getBookingOffers(flight([quote('seller', 1200)], 'test'))).toEqual([]);
  });
  it('rejects corrupted saved quote data and unsafe links before rendering', () => {
    const valid = quote('airline', 1300);
    const invalid = [null, {}, { ...valid, price: -1 }, { ...valid, retrievedAt: 'broken' }, { ...valid, bookingUrl: 'javascript:alert(1)' }];
    expect(getBookingOffers(flight([valid, ...invalid] as BookingOffer[]))).toEqual([valid]);
  });
  it('retains explicit self-transfer metadata and rejects malformed saved flags', () => {
    const valid = { ...quote('agency', 1200), selfTransfer: true };
    const malformed = { ...quote('broken', 1100), selfTransfer: 'false' };
    expect(getBookingOffers(flight([valid, malformed] as BookingOffer[]))).toEqual([valid]);
  });
  it.each(['javascript:alert(1)', 'http://agency.example.com/checkout', 'https://user:secret@agency.example.com/checkout', 'https://127.0.0.1/book', 'https://localhost/book', 'https://server.internal/book', '//agency.example.com/book'])('blocks invalid checkout URL %s', value => {
    expect(safeBookingUrl(value)).toBe(false);
  });
  it('shows quoted cents instead of rounding different seller prices to the same integer', () => {
    expect(money(610.05)).toBe('€610.05');
    expect(money(610.95)).toBe('€610.95');
    expect(money(610)).toBe('€610');
  });
});
