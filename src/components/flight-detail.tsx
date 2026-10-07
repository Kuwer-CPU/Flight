'use client';
import { ArrowRight, ArrowUpRight, Clock3, GraduationCap, Luggage, Plane, ShieldCheck } from 'lucide-react';
import { airline, bookingUrl } from '@/lib/airlines';
import { city } from '@/lib/airports';
import { baggageLabel, dateLabel, duration, money, time } from '@/lib/search';
import type { FlightOffer, SearchQuery } from '@/lib/types';
import { AirlineMark, Modal, ModeNotice } from './ui';
import { StudentBaggagePanel, ComparableCost } from './student-comparison';

export function FlightDetail({ offer, query, score, onClose }: { offer: FlightOffer; query?: SearchQuery; score?: number; onClose: () => void }) {
  const company = airline(offer.airlineCode);
  const first = offer.itineraries[0].segments[0];
  const last = offer.itineraries[0].segments.at(-1)!;
  return <Modal title={'Your flight to ' + city(last.to)} onClose={onClose} wide>
    <ModeNotice mode={offer.mode} />
    <div className="detail-airline"><AirlineMark airline={company} code={offer.airlineCode} /><div><strong>{offer.airlineName}</strong><span>{offer.cabin.toLowerCase().replaceAll('_', ' ')} · {offer.passengers} adult{offer.passengers > 1 ? 's' : ''}</span></div><div className="detail-price"><strong>{money(offer.price / offer.passengers, offer.currency)}</strong><span>per adult · {offer.itineraries.length === 2 ? 'round trip' : 'one way'}</span></div></div>
    {query?.student && <div className="detail-student-comparison"><StudentBaggagePanel offer={offer} query={query} score={score} /><ComparableCost offer={offer} query={query} /></div>}
    {offer.itineraries.map((itinerary, index) => <section className="itinerary" key={index}><div className="itinerary-title"><span><Plane size={16} />{index === 0 ? 'Outbound' : 'Return'} · {dateLabel(itinerary.segments[0].departure, true)}</span><span><Clock3 size={14} />{duration(itinerary.duration)}</span></div>{itinerary.segments.map((segment, i) => <div key={i}><div className="segment"><div className="segment-time"><strong>{time(segment.departure)}</strong><span>{time(segment.arrival)}</span></div><div className="segment-line"><i /><span /><i /></div><div className="segment-airports"><strong>{city(segment.from)} <small>{segment.from}</small></strong><span>{city(segment.to)} <small>{segment.to}</small></span></div><div className="segment-info"><span>{segment.carrier} {segment.flightNumber}</span><span>{duration(segment.duration)}</span>{segment.operatingCarrier && segment.operatingCarrier !== segment.carrier && <span>Operated by {airline(segment.operatingCarrier)?.name ?? segment.operatingCarrier}</span>}</div></div>{i < itinerary.segments.length - 1 && <div className="layover"><Clock3 size={14} />Connection in {city(segment.to)} · departure {time(itinerary.segments[i + 1].departure)}</div>}</div>)}</section>)}
    <div className="detail-inclusions"><Luggage size={20} /><div><strong>{baggageLabel(offer.baggage)}</strong><p>Minimum published allowance across the itinerary. Cabin baggage and any extra bag charges are confirmed by the airline.</p></div></div>
    {company?.student && <div className="student-detail"><GraduationCap size={23} /><div><strong>{company.student.name}</strong><p>{company.student.description}</p><p className="review-status">Current student terms need verification. No student discount or extra allowance has been added to this ticket.</p><a href={company.student.url} target="_blank" rel="noopener noreferrer">Check eligibility with {company.name}<ArrowUpRight size={14} /></a></div></div>}
    <div className="booking-summary"><div><span>Total for {offer.passengers} adult{offer.passengers > 1 ? 's' : ''}</span><strong>{money(offer.price, offer.currency)}{offer.mode !== 'live' && <small> sample fare</small>}</strong></div><a className="button" href={bookingUrl(offer.airlineCode)} target="_blank" rel="noopener noreferrer">Continue to {company ? company.name : 'booking search'}<ArrowUpRight size={18} /></a></div>
    <p className="booking-note"><ShieldCheck size={15} />{offer.mode === 'live' ? 'Search this itinerary on the airline’s site. The airline confirms availability, final price and payment.' : 'This sample ticket cannot be booked. The link opens the airline’s site, where you can search for real flights.'}</p>
    <div className="route-reminder">{first.from}<ArrowRight size={13} />{last.to} · {dateLabel(first.departure)} · All flight times are local.</div>
  </Modal>;
}
