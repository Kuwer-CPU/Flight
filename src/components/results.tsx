'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Clock3, GraduationCap, Heart, Luggage, Plane, SlidersHorizontal, X } from 'lucide-react';
import { airline } from '@/lib/airlines';
import { city } from '@/lib/airports';
import { baggageKg, baggageLabel, dateLabel, defaults, duration, money, parseSearch, sortedFlights, time } from '@/lib/search';
import type { SortOrder } from '@/lib/search';
import type { DataMode, FlightOffer, SearchQuery } from '@/lib/types';
import { SearchForm } from './search-form';
import { FlightDetail } from './flight-detail';
import { useSaved } from './saved-provider';
import { AirlineMark, ModeNotice } from './ui';
import { studentValueScores } from '@/lib/student-value';
import { StudentBaggagePanel, ComparableCost } from './student-comparison';
import { StudentOverview } from './student-overview';

export function Results() {
  const params = useSearchParams();
  const paramsKey = params.toString();
  const parsed = useMemo(() => {
    try { return { query: paramsKey ? parseSearch(new URLSearchParams(paramsKey)) : defaults(), error: '' }; }
    catch (e) { return { query: defaults(), error: e instanceof Error ? e.message : 'Check your search details.' }; }
  }, [paramsKey]);
  const query = parsed.query;
  const [offers, setOffers] = useState<FlightOffer[]>([]);
  const [mode, setMode] = useState<DataMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [sort, setSort] = useState<SortOrder>(query.student ? 'student-value' : 'recommended');
  const [stops, setStops] = useState('any');
  const [fitBaggage, setFitBaggage] = useState(false);
  const [studentOnly, setStudentOnly] = useState(false);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<FlightOffer | null>(null);
  const clearFilters = () => { setStops('any'); setFitBaggage(false); setStudentOnly(false); setSelectedAirlines([]); setMaxPrice(null); };
  useEffect(() => {
    const controller = new AbortController();
    setOffers([]); setMode(null); setError(parsed.error); setLoading(!parsed.error);
    clearFilters();
    setSort(parsed.query.student ? 'student-value' : 'recommended');
    if (parsed.error) return () => controller.abort();
    const parameters = new URLSearchParams();
    Object.entries(parsed.query).forEach(([key, value]) => { if (value !== undefined) parameters.set(key, String(value)); });
    fetch('/api/flights?' + parameters.toString(), { signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error ?? 'We couldn’t search these flights.'); return data; })
      .then(data => { if (!controller.signal.aborted) { setOffers(data.offers); setMode(data.mode); } })
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'We couldn’t connect. Please try again.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [parsed, retry]);
  const ceiling = Math.ceil(Math.max(0, ...offers.map(o => o.price / o.passengers)) / 50) * 50;
  const carrierOptions = [...new Set(offers.map(o => o.airlineCode))];
  const scores = studentValueScores(offers, query);
  const visible = sortedFlights(offers.filter(o => {
    const maximumStops = Math.max(...o.itineraries.map(it => it.segments.length - 1));
    const kg = baggageKg(o.baggage);
    return (stops === 'any' || maximumStops <= Number(stops)) &&
      (!fitBaggage || (kg !== undefined && kg >= query.baggage)) &&
      (!studentOnly || !!airline(o.airlineCode)?.student) &&
      (!selectedAirlines.length || selectedAirlines.includes(o.airlineCode)) &&
      (maxPrice === null || o.price / o.passengers <= maxPrice);
  }), sort, query, offers);
  const cheapest = offers.length ? sortedFlights(offers, 'cheapest', query)[0] : undefined;
  const fastest = offers.length ? sortedFlights(offers, 'fastest', query)[0] : undefined;
  const recommended = offers.length ? sortedFlights(offers, query.student ? 'student-value' : 'recommended', query)[0] : undefined;
  const activeFilters = stops !== 'any' || fitBaggage || studentOnly || selectedAirlines.length > 0 || maxPrice !== null;
  return <div className="results-page">
    <div className="results-heading container"><a className="back-link" href="/">← Back to exploring</a><div className="results-title"><div><div className="eyebrow">YOUR NEXT CHAPTER</div><h1>{city(query.origin)}<ArrowRight size={30} />{city(query.destination)}</h1><p>{dateLabel(query.departureDate)}{query.returnDate ? ' – ' + dateLabel(query.returnDate) : ' · One way'} · {query.adults} adult{query.adults > 1 ? 's' : ''} · {query.cabin.toLowerCase().replaceAll('_', ' ')}</p></div>{query.student && <span className="student-profile"><GraduationCap size={17} />Student traveler · {query.baggage} kg luggage</span>}</div><SearchForm key={paramsKey} initial={query} compact /></div>
    <div className="container results-body">{mode && <ModeNotice mode={mode} />}<div className="results-layout"><aside className={'filters' + (showFilters ? ' filters-open' : '')}><div className="filter-title"><h2>Make it your flight.</h2>{activeFilters && <button className="text-button" onClick={clearFilters}>Reset</button>}<button className="icon-button filters-close" aria-label="Close filters" onClick={() => setShowFilters(false)}><X size={18} /></button></div><fieldset><legend>Stops</legend>{[{ value: 'any', text: 'Any number of stops' }, { value: '0', text: 'Nonstop only' }, { value: '1', text: 'Up to 1 stop' }].map(option => <label className="check-row" key={option.value}><input type="radio" name="stops" checked={stops === option.value} onChange={() => setStops(option.value)} />{option.text}</label>)}</fieldset><fieldset><legend>What you’re bringing</legend><label className="check-row"><input type="checkbox" checked={fitBaggage} onChange={e => setFitBaggage(e.target.checked)} />At least {query.baggage} kg included</label><p className="filter-help">Only confirmed weight allowances. Piece-based baggage needs an airline check.</p>{query.student && <label className="check-row student-filter"><input type="checkbox" checked={studentOnly} onChange={e => setStudentOnly(e.target.checked)} /><GraduationCap size={15} />Student program listed</label>}</fieldset>{ceiling > 0 && <fieldset><legend>Price per adult</legend><div className="price-range-label"><span>Up to</span><strong>{money(maxPrice ?? ceiling)}</strong></div><input type="range" aria-label="Maximum price per adult" min="50" max={ceiling} step="25" value={maxPrice ?? ceiling} onChange={e => setMaxPrice(Number(e.target.value))} /><div className="range-extents"><span>€50</span><span>{money(ceiling)}</span></div></fieldset>}{carrierOptions.length > 0 && <fieldset><legend>Airlines</legend>{carrierOptions.map(code => <label className="check-row airline-filter" key={code}><input type="checkbox" checked={selectedAirlines.includes(code)} onChange={() => setSelectedAirlines(previous => previous.includes(code) ? previous.filter(c => c !== code) : [...previous, code])} /><span>{airline(code)?.name ?? offers.find(o => o.airlineCode === code)?.airlineName}</span><small>{offers.filter(o => o.airlineCode === code).length}</small></label>)}</fieldset>}<div className="filter-tip"><GraduationCap size={24} /><strong>Your student ID is a starting point.</strong><p>Airlines confirm age, enrollment and route eligibility when you claim a student offer.</p><a href="/student-perks">Explore programs<ArrowUpRight size={13} /></a></div></aside><div className="results-list">
      <div className="results-toolbar"><span>{loading ? 'Looking for your flight…' : visible.length + ' flight' + (visible.length !== 1 ? 's' : '') + ' for your journey'}{!loading && activeFilters && <small> of {offers.length}</small>}</span><button className="filter-mobile-button" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={16} />Filters{activeFilters && <i />}</button><label className="sort-mobile">Sort<select aria-label="Sort flights" value={sort} onChange={e => setSort(e.target.value as SortOrder)}>{query.student && <option value="student-value">Student value</option>}<option value="recommended">Recommended</option><option value="cheapest">Cheapest</option><option value="fastest">Fastest</option></select><ChevronDown size={14} /></label></div>
      <div className="sort-tabs" aria-label="Sort flights">{([{ value: query.student ? 'student-value' : 'recommended', label: query.student ? 'Student value' : 'Recommended', icon: GraduationCap, offer: recommended }, { value: 'cheapest', label: 'Cheapest', icon: TicketIcon, offer: cheapest }, { value: 'fastest', label: 'Fastest', icon: Clock3, offer: fastest }] as const).map(tab => <button key={tab.value} className={sort === tab.value ? 'active' : ''} aria-pressed={sort === tab.value} onClick={() => setSort(tab.value)}><span><tab.icon size={16} />{tab.label}</span><small>{tab.offer ? money(tab.offer.price / tab.offer.passengers, tab.offer.currency) + ' · ' + duration(tab.offer.itineraries[0].duration) : 'Finding flights'}</small></button>)}</div>
      {!loading && !error && visible.length > 0 && query.student && <StudentOverview offers={visible} query={query} scores={scores} onSelect={setSelected} />}
      {loading ? <div className="flight-skeletons" role="status" aria-label="Searching flights">{[1, 2, 3].map(n => <div className="flight-skeleton" key={n}><div /><span /><span /><i /></div>)}<p>Finding a little more room for your journey…</p></div> : error ? <div className="results-empty" role="alert"><Plane size={35} /><h2>A small delay.</h2><p>{error}</p>{!parsed.error && <button className="button" onClick={() => setRetry(n => n + 1)}>Try again<ArrowRight size={17} /></button>}</div> : visible.length === 0 ? <div className="results-empty"><SearchIcon /><h2>{offers.length ? 'A little too specific.' : 'No flights found for these dates.'}</h2><p>{offers.length ? 'Try loosening your filters to find more flights.' : 'Try another day, a nearby airport or a different cabin.'}</p>{offers.length > 0 && <button className="button" onClick={clearFilters}>Clear filters<ArrowRight size={17} /></button>}</div> : <div className="flight-cards">{visible.map((offer, i) => <FlightCard key={offer.id} offer={offer} query={query} recommended={(sort === 'recommended' || sort === 'student-value') && i === 0} score={scores.get(offer.id)} onSelect={() => setSelected(offer)} />)}</div>}
      {!loading && offers.length > 0 && <p className="results-footnote">Student value compares cost with your bags (40%), baggage fit (45%) and travel time (15%). Preview benefits are examples; live student terms need verification. Base fares exclude unverified student discounts. All flight times are local.</p>}
    </div></div></div>{selected && <FlightDetail offer={selected} query={query} score={scores.get(selected.id)} onClose={() => setSelected(null)} />}
  </div>;
}
function FlightCard({ offer, query, recommended, score, onSelect }: { offer: FlightOffer; query: SearchQuery; recommended: boolean; score?: number; onSelect: () => void }) {
  const { saved, toggle } = useSaved();
  const company = airline(offer.airlineCode);
  const isSaved = saved.some(o => o.id === offer.id);
  const kg = baggageKg(offer.baggage);
  const fits = kg !== undefined && kg >= query.baggage && query.baggage > 0;
  return <article className={'flight-card' + (recommended ? ' flight-recommended' : '')}>{recommended && <div className="recommendation-ribbon"><SparkleIcon />{query.student ? score === undefined ? 'Student eligibility needs verification' : 'Your strongest student fit' : 'A good fit for your journey'}<span>{query.student ? 'STUDENT VALUE' : 'FARE + TIME + BAGGAGE'}</span></div>}<div className="flight-card-main"><div className="flight-card-content"><div className="flight-airline"><AirlineMark airline={company} code={offer.airlineCode} /><div><h3>{offer.airlineName}</h3><span>{offer.cabin.toLowerCase().replaceAll('_', ' ')}</span></div><button className={'save-flight icon-button' + (isSaved ? ' is-saved' : '')} aria-label={isSaved ? 'Unsave ' + offer.airlineName + ' flight' : 'Save ' + offer.airlineName + ' flight'} aria-pressed={isSaved} onClick={() => toggle(offer)}><Heart size={19} fill={isSaved ? 'currentColor' : 'none'} /></button></div>{query.student && <StudentBaggagePanel offer={offer} query={query} score={score} />}<div className="flight-journeys">{offer.itineraries.map((it, index) => { const first = it.segments[0]; const last = it.segments.at(-1)!; const dayDifference = Math.round((Date.parse(last.arrival.slice(0, 10)) - Date.parse(first.departure.slice(0, 10))) / 86_400_000); return <div className="flight-journey" key={index}><span className="journey-kind">{index === 0 ? 'OUT' : 'BACK'}</span><div className="journey-end"><strong>{time(first.departure)}</strong><span>{first.from}</span></div><div className="journey-path"><span>{duration(it.duration)}</span><div><i />{it.segments.length > 1 && <b />}<Plane size={13} /></div><small>{it.segments.length === 1 ? 'Nonstop' : (it.segments.length - 1) + ' stop' + (it.segments.length > 2 ? 's' : '') + ' · ' + it.segments.slice(0, -1).map(s => s.to).join(', ')}</small></div><div className="journey-end"><strong>{time(last.arrival)}{dayDifference > 0 && <sup>+{dayDifference}</sup>}</strong><span>{last.to}</span></div></div>; })}</div><div className="flight-benefits"><span className={fits ? 'baggage-fit' : ''}>{fits ? <Check size={14} /> : <Luggage size={14} />}{baggageLabel(offer.baggage)}</span>{company?.student && query.student && <a href={company.student.url} target="_blank" rel="noopener noreferrer"><GraduationCap size={15} />Student offer to check<ArrowUpRight size={12} /></a>}</div></div><div className="flight-price"><div><span>{offer.mode === 'live' ? 'Fare per adult' : 'Sample fare per adult'}</span><strong>{money(offer.price / offer.passengers, offer.currency)}</strong><small>{offer.itineraries.length === 2 ? 'round trip' : 'one way'}{offer.passengers > 1 ? ' · ' + money(offer.price, offer.currency) + ' total' : ''}</small></div>{query.student && <ComparableCost offer={offer} query={query} />}<button className="button button-select" onClick={onSelect}>Select flight<ArrowRight size={17} /></button><span className="price-note">{offer.mode === 'live' ? 'Book with the airline' : 'Preview itinerary'}</span></div></div></article>;
}
function TicketIcon({ size = 16 }: { size?: number }) { return <Luggage size={size} />; }
function SearchIcon() { return <SlidersHorizontal size={35} />; }
function SparkleIcon() { return <span aria-hidden="true">✳</span>; }
