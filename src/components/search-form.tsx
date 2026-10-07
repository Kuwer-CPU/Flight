'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeftRight, PlaneTakeoff, PlaneLanding, CalendarDays, Users, GraduationCap, Luggage, Search } from 'lucide-react';
import { airports } from '@/lib/airports';
import { defaults, flightSearchUrl, futureDate, parseSearch, searchParams, today } from '@/lib/search';
import type { SearchQuery } from '@/lib/types';

export function SearchForm({ initial, compact = false }: { initial?: SearchQuery; compact?: boolean }) {
  const [query, setQuery] = useState<SearchQuery>(initial ?? defaults);
  const [roundTrip, setRoundTrip] = useState(!!query.returnDate);
  const [error, setError] = useState('');
  const router = useRouter();
  const change = <K extends keyof SearchQuery>(key: K, value: SearchQuery[K]) => {
    setError('');
    setQuery(old => {
      const next = { ...old, [key]: value };
      if (key === 'departureDate' && next.returnDate && next.returnDate < next.departureDate) next.returnDate = next.departureDate;
      return next;
    });
  };
  function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const valid = parseSearch(searchParams({ ...query, returnDate: roundTrip ? query.returnDate ?? query.departureDate : undefined }));
      router.push(flightSearchUrl(valid));
    } catch (e) { setError(e instanceof Error ? e.message : 'Check your search details.'); }
  }
  return <form id="search" className={'search-form' + (compact ? ' search-compact' : '')} onSubmit={submit}>
    <div className="search-top">
      <div className="trip-switch" aria-label="Trip type"><button type="button" className={roundTrip ? 'active' : ''} aria-pressed={roundTrip} onClick={() => { setRoundTrip(true); if (!query.returnDate) change('returnDate', query.departureDate); }}>Round trip</button><button type="button" className={!roundTrip ? 'active' : ''} aria-pressed={!roundTrip} onClick={() => setRoundTrip(false)}>One way</button></div>
      <label className="student-toggle"><GraduationCap size={18} /><span>Student traveler</span><input type="checkbox" checked={query.student} onChange={e => change('student', e.target.checked)} /><span className="toggle-track" aria-hidden="true" /></label>
    </div>
    <div className="search-fields">
      <label className="search-field airport-field"><span className="field-label"><PlaneTakeoff size={15} />From</span><select aria-label="Departure airport" value={query.origin} onChange={e => change('origin', e.target.value)}>{airports.map(a => <option key={a.code} value={a.code}>{a.city} ({a.code})</option>)}</select><span className="field-hint">{airports.find(a => a.code === query.origin)?.name}</span></label>
      <button type="button" className="swap-button" aria-label="Swap departure and arrival" onClick={() => setQuery(old => ({ ...old, origin: old.destination, destination: old.origin }))}><ArrowLeftRight size={17} /></button>
      <label className="search-field airport-field"><span className="field-label"><PlaneLanding size={15} />To</span><select aria-label="Arrival airport" value={query.destination} onChange={e => change('destination', e.target.value)}>{airports.map(a => <option key={a.code} value={a.code}>{a.city} ({a.code})</option>)}</select><span className="field-hint">{airports.find(a => a.code === query.destination)?.name}</span></label>
      <label className="search-field date-field"><span className="field-label"><CalendarDays size={15} />Departure</span><input aria-label="Departure date" type="date" required min={today()} max={futureDate(365)} value={query.departureDate} onChange={e => change('departureDate', e.target.value)} /><span className="field-hint">Start your next chapter</span></label>
      {roundTrip && <label className="search-field date-field"><span className="field-label"><CalendarDays size={15} />Return</span><input aria-label="Return date" type="date" required min={query.departureDate} max={futureDate(365)} value={query.returnDate ?? query.departureDate} onChange={e => change('returnDate', e.target.value)} /><span className="field-hint">Home is a round trip away</span></label>}
      <label className="search-field traveler-field"><span className="field-label"><Users size={15} />Travelers</span><select aria-label="Number of adult travelers" value={query.adults} onChange={e => change('adults', Number(e.target.value))}>{[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{n} adult{n > 1 ? 's' : ''}</option>)}</select><select className="cabin-select" aria-label="Cabin class" value={query.cabin} onChange={e => change('cabin', e.target.value as SearchQuery['cabin'])}><option value="ECONOMY">Economy</option><option value="PREMIUM_ECONOMY">Premium economy</option><option value="BUSINESS">Business</option></select></label>
      <button className="button button-search" type="submit"><Search size={18} /><span>Search flights</span><ArrowRight size={18} /></button>
    </div>
    <div className="search-bottom">
      {query.student ? <><span className="profile-intro"><GraduationCap size={16} />Your student profile</span><label>Age <input aria-label="Traveler age" type="number" min="16" max="99" required value={query.age} onChange={e => change('age', Number(e.target.value))} /></label></> : <span className="profile-intro">Find the flight that fits you</span>}
      <label className="baggage-input"><Luggage size={15} />Checked baggage <select aria-label="Checked baggage needed" value={query.baggage} onChange={e => change('baggage', Number(e.target.value))}>{[0, 15, 20, 23, 25, 30, 35, 40, 45, 50, 60].map(n => <option key={n} value={n}>{n === 0 ? 'None' : n + ' kg'}</option>)}</select></label>
      <span className="search-reassurance">Compare student value. Book with the airline.</span>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
  </form>;
}
