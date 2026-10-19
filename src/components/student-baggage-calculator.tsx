'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUpRight, Check, CircleHelp, Luggage, Plus, Scale, ShieldCheck, Trash2 } from 'lucide-react';
import { baggageAirlines } from '@/lib/baggage-airlines';
import { compareBaggage, ruleLabel, totalWeight, type BaggageRule, type Journey, type TicketTerms } from '@/lib/student-baggage';
import type { TravelEssential } from '@/lib/travel-essentials';

interface TicketInput {
  basis: 'unknown' | 'weight' | 'pieces'; total: string; perBag: string; maxPieces: string;
  confirmed: boolean; activation: boolean; cabinPieces: string; cabinKg: string;
}
const newTicket = (): TicketInput => ({ basis: 'unknown', total: '', perBag: '', maxPieces: '', confirmed: false, activation: false, cabinPieces: '', cabinKg: '' });
const number = (value: string) => value.trim() === '' ? NaN : Number(value);
function ticketTerms(input: TicketInput): TicketTerms {
  let standard: BaggageRule | null = null;
  if (input.basis === 'weight') standard = { basis: 'weight', totalKg: number(input.total), perBagKg: number(input.perBag), ...(input.maxPieces.trim() ? { maxPieces: number(input.maxPieces) } : {}) };
  if (input.basis === 'pieces') standard = { basis: 'pieces', pieces: number(input.total), perBagKg: number(input.perBag) };
  return { standard, contextConfirmed: input.confirmed, studentActivationConfirmed: input.activation,
    ...(input.cabinPieces.trim() && input.cabinKg.trim() ? { cabin: { pieces: number(input.cabinPieces), perBagKg: number(input.cabinKg) } } : {}) };
}
export function StudentBaggageCalculator({ countries, essentials, today }: { countries: { code: string; name: string }[]; essentials: TravelEssential[]; today: string }) {
  const [journey, setJourney] = useState<Journey>({ departure: '', destination: '', departureAirport: '', destinationAirport: '', age: '', verification: 'unknown', cabin: 'economy' });
  const [bags, setBags] = useState(['', '']);
  const [cabin, setCabin] = useState<string[]>([]);
  const [selected, setSelected] = useState(['QR', 'EK']);
  const [tickets, setTickets] = useState<Record<string, TicketInput>>({});
  const [compared, setCompared] = useState(false);
  const [revision, setRevision] = useState(false);
  const changeJourney = <K extends keyof Journey>(key: K, value: Journey[K]) => {
    setJourney(previous => ({ ...previous, [key]: value }));
    setTickets(previous => Object.fromEntries(Object.entries(previous).map(([code, ticket]) => [code, { ...ticket, confirmed: false, activation: false }])));
    setRevision(compared);
  };
  const editTicket = (code: string, patch: Partial<TicketInput>) => setTickets(previous => ({ ...previous, [code]: { ...(previous[code] ?? newTicket()), ...patch } }));
  const checkedWeights = bags.map(number);
  const cabinWeights = cabin.map(number);
  const validBags = [...checkedWeights, ...cabinWeights].every(value => Number.isFinite(value) && value > 0 && value <= 100);
  const comparison = selected.map(code => {
    const company = baggageAirlines.find(airline => airline.code === code)!;
    return compareBaggage(company, journey, checkedWeights, cabinWeights, ticketTerms(tickets[code] ?? newTicket()), today);
  });
  const bagFields = (values: string[], update: (next: string[]) => void, prefix: string) => <div className="baggage-weight-list">{values.map((value, index) => <div className="baggage-weight-row" key={index}>
    <label className="tool-label" htmlFor={prefix + index}>{prefix === 'checked' ? 'Checked bag' : 'Cabin bag'} {index + 1}<span className="baggage-unit-input"><input id={prefix + index} type="number" inputMode="decimal" min="0.01" max="100" step="0.01" required value={value} onChange={event => update(values.map((old, i) => i === index ? event.target.value : old))} /><span>kg</span></span></label>
    <button className="baggage-remove" type="button" aria-label={'Remove ' + (prefix === 'checked' ? 'checked' : 'cabin') + ' bag ' + (index + 1)} onClick={() => update(values.filter((_, i) => i !== index))}><Trash2 size={16} aria-hidden="true" /></button>
  </div>)}</div>;
  return <div className="student-baggage">
    <form onSubmit={event => { event.preventDefault(); setCompared(true); setRevision(false); requestAnimationFrame(() => document.getElementById('baggage-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}>
      <div className="baggage-workspace">
        <section className="tool-panel baggage-journey" aria-labelledby="baggage-journey-title">
          <div className="baggage-section-title"><span className="baggage-step">01</span><div><h2 id="baggage-journey-title">Your journey</h2><p>One traveler. The same trip for every airline.</p></div></div>
          <div className="baggage-form-grid">
            {(['departure', 'destination'] as const).map(key => <label className="tool-label" key={key}>{key === 'departure' ? 'Departure country' : 'Destination country'}<select required value={journey[key]} onChange={event => changeJourney(key, event.target.value)}><option value="">Choose country or territory</option>{countries.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>)}
            {(['departureAirport', 'destinationAirport'] as const).map(key => <label className="tool-label" key={key}>{key === 'departureAirport' ? 'Departure airport (optional)' : 'Destination airport (optional)'}<input placeholder={key === 'departureAirport' ? 'e.g. DEL' : 'e.g. LHR'} maxLength={3} pattern="[A-Za-z]{3}" title="Enter a three-letter IATA airport code" value={journey[key]} onChange={event => changeJourney(key, event.target.value.toUpperCase())} /></label>)}
            <label className="tool-label">Student age<input type="number" inputMode="numeric" min="1" max="120" step="1" required placeholder="Your age" value={journey.age} onChange={event => changeJourney('age', event.target.value)} /></label>
            <label className="tool-label">Cabin class<select value={journey.cabin} onChange={event => changeJourney('cabin', event.target.value as Journey['cabin'])}><option value="economy">Economy</option><option value="premium-economy">Premium economy</option><option value="business">Business</option><option value="first">First</option></select></label>
            <label className="tool-label baggage-wide">Student verification status<select value={journey.verification} onChange={event => changeJourney('verification', event.target.value as Journey['verification'])}><option value="unknown">Not verified / unsure</option><option value="enrolled">Enrolled student, not verified by airline</option><option value="airline-verified">Verified by the selected airlines</option></select><small>A student ID alone does not activate an airline’s offer.</small></label>
          </div>
        </section>
        <section className="tool-panel baggage-packing" aria-labelledby="baggage-packing-title">
          <div className="baggage-section-title"><span className="baggage-step">02</span><div><h2 id="baggage-packing-title">What are you packing?</h2><p>Weigh every bag separately, including the suitcase.</p></div><Luggage size={26} aria-hidden="true" /></div>
          <div className="baggage-packing-total"><span>Checked baggage<strong>{validBags ? totalWeight(checkedWeights) + ' kg' : '— kg'}</strong></span><span>{bags.length} checked {bags.length === 1 ? 'bag' : 'bags'}</span></div>
          {bagFields(bags, setBags, 'checked')}
          <button className="text-button baggage-add" type="button" disabled={bags.length >= 10} onClick={() => setBags([...bags, ''])}><Plus size={15} aria-hidden="true" />Add checked bag</button>
          <details className="baggage-cabin"><summary>Optional cabin baggage{cabin.length ? ` · ${cabin.length} ${cabin.length === 1 ? 'bag' : 'bags'}` : ''}</summary><p>Cabin allowance is separate. Dimensions and personal-item rules still need checking.</p>{bagFields(cabin, setCabin, 'cabin')}<button type="button" className="text-button baggage-add" disabled={cabin.length >= 3} onClick={() => setCabin([...cabin, ''])}><Plus size={15} aria-hidden="true" />Add cabin bag</button></details>
          <p className="baggage-small-note"><ShieldCheck size={16} aria-hidden="true" />Your entries stay on this page. No account or provider request.</p>
        </section>
      </div>
      <section className="tool-panel baggage-airline-selection" aria-labelledby="baggage-airline-title">
        <div className="baggage-section-title"><span className="baggage-step">03</span><div><h2 id="baggage-airline-title">Choose airlines to compare</h2><p>Select up to four. Add the allowance from each actual ticket or quote.</p></div></div>
        <div className="baggage-airline-chips">{baggageAirlines.map(company => <label key={company.code} className={selected.includes(company.code) ? 'is-selected' : ''}><input type="checkbox" checked={selected.includes(company.code)} disabled={!selected.includes(company.code) && selected.length >= 4} onChange={event => setSelected(previous => event.target.checked ? [...previous, company.code] : previous.filter(code => code !== company.code))} /><span>{company.name}</span>{selected.includes(company.code) && <Check size={14} aria-hidden="true" />}</label>)}</div>
        <div className="baggage-ticket-grid">{selected.map(code => {
          const company = baggageAirlines.find(airline => airline.code === code)!;
          const ticket = tickets[code] ?? newTicket();
          const field = (key: 'total' | 'perBag' | 'maxPieces' | 'cabinPieces' | 'cabinKg', label: string, whole = false) => <label className="tool-label">{label}<input type="number" inputMode={whole ? 'numeric' : 'decimal'} min={key === 'perBag' || key === 'cabinKg' ? '0.01' : '0'} step={whole ? '1' : '0.01'} value={ticket[key]} placeholder="From your ticket" onChange={event => editTicket(code, { [key]: event.target.value, confirmed: false })} /></label>;
          return <fieldset className="baggage-ticket" key={code}><legend>{company.name} ticket allowance</legend><label className="tool-label">Checked baggage system<select value={ticket.basis} onChange={event => editTicket(code, { basis: event.target.value as TicketInput['basis'], total: '', perBag: '', maxPieces: '', confirmed: false })}><option value="unknown">I don’t know yet</option><option value="weight">Weight allowance (kg total)</option><option value="pieces">Piece allowance (bags × kg)</option></select></label>
            {ticket.basis !== 'unknown' && <><div className="baggage-form-grid">{field('total', ticket.basis === 'weight' ? 'Total checked allowance (kg)' : 'Included checked bags', ticket.basis === 'pieces')}{field('perBag', 'Maximum per checked bag (kg)')}{ticket.basis === 'weight' && field('maxPieces', 'Maximum bags (if specified)', true)}</div><p className="baggage-small-note">No weight pooling for piece-based tickets. Bag dimensions, special items and codeshares need separate checks.</p></>}
            {cabin.length > 0 && <div className="baggage-form-grid">{field('cabinPieces', 'Included cabin bags', true)}{field('cabinKg', 'Maximum per cabin bag (kg)')}</div>}
            <label className="baggage-confirm"><input type="checkbox" checked={ticket.confirmed} onChange={event => editTicket(code, { confirmed: event.target.checked })} />These terms match my route, cabin, fare and operating airline.</label>
          </fieldset>;
        })}</div>
        <div className="baggage-submit-row"><button className="button" type="submit" disabled={!selected.length || !validBags}><Scale size={18} aria-hidden="true" />Compare baggage & benefits<ArrowDown size={16} aria-hidden="true" /></button><span>{!validBags ? 'Enter a weight above 0 and up to 100 kg for every bag.' : !selected.length ? 'Select at least one airline.' : 'No assumed allowances. No automatic student extras.'}</span></div>
      </section>
    </form>
    {compared && <section className="baggage-results" id="baggage-results" aria-labelledby="baggage-results-title">
      <div className="baggage-results-heading"><div><span className="eyebrow">Pack with a clearer picture</span><h2 id="baggage-results-title">Your airline comparison</h2><p>{validBags ? `${totalWeight(checkedWeights)} kg checked · ${bags.length} bags` : 'Check your bag weights'} · {selected.length} airlines · one traveler</p></div><a className="text-link" href="#baggage-journey-title">Revise trip & bags ↑</a></div>
      <p className="baggage-result-notice" role="status">{revision ? 'Journey changed: reconfirm each ticket’s route, cabin, fare and operating airline. ' : 'Results update as you edit weights. '}Student policies are not currently verified. “Check with airline” means no definitive student eligibility result.</p>
      <div className="baggage-comparison-grid">{comparison.map(result => <article className="baggage-result-card" aria-label={result.airline.name + ' baggage comparison'} key={result.airline.code}>
        <div className="baggage-result-brand"><span>{result.airline.code}</span><div><h3>{result.airline.name}</h3><p>{result.airline.programName}</p></div></div>
        <p className={'baggage-outcome ' + (result.status === 'Fits standard allowance' ? 'baggage-outcome-fit' : '')}>{result.status === 'Fits standard allowance' ? <Check size={17} aria-hidden="true" /> : <CircleHelp size={17} aria-hidden="true" />}{result.status}</p>
        <dl className="baggage-result-values"><div><dt>Standard allowance</dt><dd>{ruleLabel(ticketTerms(tickets[result.airline.code] ?? newTicket()).standard)}<small>{result.standard.status === 'fits' ? 'Fits the entered, confirmed ticket terms.' : result.standard.status === 'exceeds' ? 'Exceeds the entered standard allowance.' : 'Ticket-specific confirmation needed.'}</small></dd></div><div><dt>Additional student baggage</dt><dd>{result.program?.extraLabel ?? 'Check with airline'}</dd></div><div><dt>Potential student total</dt><dd>{ruleLabel(result.program?.allowance ?? null)}<small>{result.eligibility.applicable ? 'May apply after airline confirmation.' : 'Not added to your standard allowance.'}</small></dd></div>{cabin.length > 0 && <div><dt>Cabin baggage</dt><dd>{result.cabin.status === 'fits' ? 'Fits entered cabin limits' : result.cabin.status === 'exceeds' ? 'Exceeds entered cabin limits' : 'Needs airline confirmation'}</dd></div>}</dl>
        {result.standard.reasons.length > 0 && <ul className="baggage-result-reasons">{result.standard.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>}
        {result.cabin.reasons.length > 0 && <ul className="baggage-result-reasons">{result.cabin.reasons.map(reason => <li key={reason}>Cabin: {reason}</li>)}</ul>}
        <div className="baggage-offer-notes"><h4>Student fares & flexibility</h4>{result.program ? <ul>{result.program.benefits.map(benefit => <li key={benefit}>{benefit}</li>)}</ul> : <p>Check with airline. Discounts, special fares and change benefits have not been verified.</p>}</div>
        <details className="baggage-policy-details"><summary>Eligibility, restrictions & sources</summary><p>{result.program ? `Official terms reviewed ${result.program.verifiedAt}.` : 'Date verified: not verified. Official links are research leads; no current numerical policy is claimed.'}</p><ul>{(result.program ? [...result.program.restrictions, ...result.program.activation, ...result.eligibility.reasons] : ['Confirm age limits and eligible countries, airports and cabin.', 'Ask which student ID, enrolment evidence and airline registration are required.', 'Confirm booking channel, fare restrictions, operating airline and offer activation.', 'Check the allowance printed on your final ticket, plus bag dimensions and individual weight limits.']).map(reason => <li key={reason}>{reason}</li>)}</ul></details>
        <div className="baggage-official-links"><a href={result.airline.studentUrl} target="_blank" rel="noopener noreferrer">{result.program ? 'View official student offer' : 'Check official student program'}<ArrowUpRight size={15} aria-hidden="true" /></a><a href={result.airline.baggageUrl} target="_blank" rel="noopener noreferrer">Check baggage policy<ArrowUpRight size={15} aria-hidden="true" /></a></div>
      </article>)}</div>
      <aside className="baggage-essentials" aria-labelledby="baggage-essentials-title"><div><span className="eyebrow">Travel Essentials</span><h2 id="baggage-essentials-title">A little more prepared.</h2><p>Optional accessories. Purchases do not increase your allowance or resolve excess-baggage charges.</p></div><div className="baggage-essentials-grid">{essentials.map(item => <a href={item.href} target="_blank" rel={'noopener noreferrer' + (item.affiliate ? ' sponsored' : '')} key={item.name}><h3>{item.name}<ArrowUpRight size={16} aria-hidden="true" /></h3><p>{item.detail}</p><small>{item.affiliate ? 'Affiliate link · Flyora may earn a commission' : 'External retailer search · Amazon'}</small></a>)}</div></aside>
    </section>}
  </div>;
}
