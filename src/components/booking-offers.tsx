import { ArrowUpRight, CircleCheck, Store } from 'lucide-react';
import { getBookingOffers } from '@/lib/booking-offers';
import type { FlightOffer } from '@/lib/types';

/** Seller quotes retain currency precision instead of rounding the fare to whole euros. */
export function bookingMoney(value: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(value);
}

export function BookingPriceSummary({ offer }: { offer: FlightOffer }) {
  const sellers = getBookingOffers(offer);
  if (!sellers.length) return null;
  return <section className="seller-price-summary" aria-label={'Booking prices for ' + offer.airlineName}>
    <div className="seller-summary-heading"><span><Store size={15} />{sellers.length} booking {sellers.length === 1 ? 'site' : 'sites'} returned</span><small>price / adult</small></div>
    <ul>{sellers.slice(0, 3).map((seller, index) => <li key={seller.id}><span>{seller.sellerName}{index === 0 && <small>Lowest returned</small>}</span><strong>{bookingMoney(seller.price / offer.passengers, seller.currency)}</strong></li>)}</ul>
    {sellers.length > 3 && <p>+{sellers.length - 3} more prices in flight details</p>}
    <p className="seller-summary-terms">Baggage and final price need a check with each seller.</p>
  </section>;
}

export function BookingOffers({ offer }: { offer: FlightOffer }) {
  const sellers = getBookingOffers(offer);
  if (!sellers.length) return null;
  return <section className="booking-offers" aria-label="Compare booking prices">
    <div className="booking-offers-heading"><span className="eyebrow"><Store size={16} />CHOOSE WHERE TO BOOK</span><h3>Compare booking prices</h3><p>Prices for the same itinerary and {offer.passengers} adult{offer.passengers === 1 ? '' : 's'}, from the booking sites returned by the provider.</p></div>
    <div className="booking-table-scroll" tabIndex={0} role="region" aria-label="Scrollable booking price comparison">
      <table className="booking-price-table"><caption className="sr-only">Booking prices for {offer.passengers} adult{offer.passengers === 1 ? '' : 's'}, lowest returned price first</caption><thead><tr><th scope="col">Booking site</th><th scope="col">Price / adult</th><th scope="col">Group total</th><th scope="col">Baggage terms</th><th scope="col">Book</th></tr></thead><tbody>{sellers.map((seller, index) => <tr key={seller.id} className={index === 0 ? 'lowest-booking-price' : undefined}>
        <th scope="row"><span className="booking-seller-name">{seller.sellerName}</span><small>{seller.sellerType === 'airline' ? 'Airline' : seller.sellerType === 'agency' ? 'Travel agency' : 'Seller type unconfirmed'}</small>{seller.selfTransfer === true && <small className="seller-transfer-warning">Self-transfer: confirm connection protection</small>}{index === 0 && <span className="lowest-price-badge"><CircleCheck size={12} />Lowest returned</span>}</th>
        <td>{bookingMoney(seller.price / offer.passengers, seller.currency)}</td><td><strong>{bookingMoney(seller.price, seller.currency)}</strong><small>for {offer.passengers} adult{offer.passengers === 1 ? '' : 's'}</small></td><td>Check seller</td>
        <td><a className="button button-small seller-booking-link" href={seller.bookingUrl} target="_blank" rel="noopener noreferrer" aria-label={'Book with ' + seller.sellerName}>Book<ArrowUpRight size={15} /></a></td>
      </tr>)}</tbody></table>
    </div>
    <p className="booking-offers-note">The lowest returned price is the lowest among these quotes. Confirm baggage, change rules, any fees, connection protection and the final fare with the seller. Booking and payment take place on its website.</p>
  </section>;
}
