import type { BookingOffer, FlightOffer } from './types';

/** Checkout links are external HTTPS URLs supplied by a provider, never executable URLs. */
export function safeBookingUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password &&
      url.hostname.includes('.') && !url.hostname.startsWith('[') &&
      !/^\d+(?:\.\d+){0,3}$/.test(url.hostname) &&
      !['localhost', 'local', 'internal'].some(suffix => url.hostname === suffix || url.hostname.endsWith('.' + suffix));
  } catch { return false; }
}

/** Saved browser data is untrusted; revalidate it before displaying a price or rendering a link. */
export function getBookingOffers(offer: FlightOffer): BookingOffer[] {
  if (offer.mode !== 'live' || !Array.isArray(offer.bookingOffers)) return [];
  const seen = new Set<string>();
  return offer.bookingOffers.filter((candidate): candidate is BookingOffer => {
    if (!candidate || typeof candidate !== 'object') return false;
    const quote = candidate as BookingOffer;
    if (typeof quote.id !== 'string' || !quote.id.trim() ||
      typeof quote.sellerId !== 'string' || !quote.sellerId.trim() ||
      typeof quote.sellerName !== 'string' || !quote.sellerName.trim() ||
      !['airline', 'agency', 'unknown'].includes(quote.sellerType) ||
      (quote.selfTransfer !== undefined && typeof quote.selfTransfer !== 'boolean') ||
      !Number.isFinite(quote.price) || quote.price <= 0 || quote.currency !== offer.currency ||
      !safeBookingUrl(quote.bookingUrl) || typeof quote.retrievedAt !== 'string' ||
      !Number.isFinite(Date.parse(quote.retrievedAt))) return false;
    const identity = JSON.stringify([quote.sellerId, quote.bookingUrl, quote.price, quote.currency]);
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  }).sort((a, b) => a.price - b.price || a.sellerName.localeCompare(b.sellerName));
}

export function lowestBookingOffer(offer: FlightOffer) { return getBookingOffers(offer)[0]; }
