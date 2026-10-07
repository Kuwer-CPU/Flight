import { ArrowRight, ArrowUpRight, Check, GraduationCap, Info, Luggage, ShieldCheck } from 'lucide-react';
import { airline } from '@/lib/airlines';
import { baggageLabel, money } from '@/lib/search';
import { studentComparison } from '@/lib/student-value';
import type { FlightOffer, SearchQuery } from '@/lib/types';

export function StudentBaggagePanel({ offer, query, score }: { offer: FlightOffer; query: SearchQuery; score?: number }) {
  const c = studentComparison(offer, query);
  const program = airline(offer.airlineCode)?.student;
  const fits = c.eligibleKg !== undefined && c.eligibleKg >= query.baggage;
  return <section className="student-baggage-panel" aria-label={'Student baggage comparison for ' + offer.airlineName}>
    <div className="student-panel-heading"><span><GraduationCap size={17} />Your student advantage</span>{score !== undefined && <span className="value-score"><strong>{score.toFixed(1)}<small>/10</small></strong><span>{c.example ? 'Example student value' : 'Student value'}</span></span>}</div>
    <div className="baggage-equation">
      <div><span>Standard baggage</span><strong>{c.standardKg !== undefined ? <>{c.standardKg}<small> kg</small></> : baggageLabel(offer.baggage)}</strong><small>Included in fare</small></div>
      <span className="equation-symbol" aria-hidden="true">+</span>
      <div className={'student-extra' + (c.extraKg === 0 ? ' no-extra' : '')}><span>Student extra</span><strong>{c.extraKg !== undefined ? <>{c.extraKg > 0 ? '+' : ''}{c.extraKg}<small> kg</small></> : 'Check offer'}</strong><small>{c.example ? 'Illustrative benefit' : 'Terms unverified'}</small></div>
      <span className="equation-symbol" aria-hidden="true">=</span>
      <div className={'eligible-total' + (fits ? ' meets-needs' : '')}><span>Total if eligible</span><strong>{c.eligibleKg !== undefined ? <>{c.eligibleKg}<small> kg</small></> : 'To confirm'}</strong><small>{c.eligibleKg === undefined ? 'Extra not included yet' : fits ? <><Check size={12} />Fits your {query.baggage} kg</> : `${Math.max(0, query.baggage - c.eligibleKg)} kg short of your needs`}</small></div>
    </div>
    <div className="student-panel-bottom"><span><ShieldCheck size={14} />{c.example ? c.verificationRequired ? 'Student verification + registration required in this example' : 'No student extra in this example' : program ? 'Register and verify eligibility with the airline' : 'No verified student offer in our data'}</span>{program && <a href={program.url} target="_blank" rel="noopener noreferrer">Official terms<ArrowUpRight size={13} /></a>}</div>
    {c.example && <p className="example-policy-note"><Info size={12} />Benefit and add-on prices are fictional examples, not {offer.airlineName} policy.</p>}
  </section>;
}

export function ComparableCost({ offer, query }: { offer: FlightOffer; query: SearchQuery }) {
  const c = studentComparison(offer, query);
  return <div className="comparable-cost"><span>{c.example ? 'Example cost' : 'Cost'} / adult with {query.baggage} kg</span><strong>{c.comparableCostPerAdult === undefined ? 'Check add-on price' : money(c.comparableCostPerAdult, offer.currency)}</strong><small>{c.additionalCostPerAdult === undefined ? 'Baggage price not available' : c.additionalCostPerAdult > 0 ? `Fare + ${money(c.additionalCostPerAdult, offer.currency)} baggage / adult` : c.example && c.extraKg && c.extraKg > 0 ? 'If the example benefit applies' : 'No extra bag cost for your needs'}</small></div>;
}

export function HomeStudentComparison() {
  return <div className="hero-student-comparison" aria-label="Illustrative student flight comparison">
    <div className="comparison-caption"><GraduationCap size={20} /><span>THE SAME TRIP. A DIFFERENT DEAL.</span><span className="example-pill">ILLUSTRATIVE EXAMPLE</span></div>
    <div className="comparison-scenario"><span>You’re a student. You need <strong>30 kg.</strong></span><Luggage size={20} /></div>
    <article className="hero-offer hero-offer-best"><div className="hero-offer-top"><span className="fictional-airline">A</span><div><h2>Airline A</h2><span>Student verification required</span></div><strong>€610<small>fare / adult</small></strong></div><div className="hero-bag-equation"><div><span>Standard</span><strong>23<small> kg</small></strong></div><b>+</b><div><span>Student extra</span><strong>10<small> kg</small></strong></div><b>=</b><div><span>Total if eligible</span><strong>33<small> kg</small></strong></div></div><div className="hero-offer-bottom"><span><Check size={14} />Your 30 kg fits</span><span><strong>€610</strong> with your bags</span></div></article>
    <article className="hero-offer hero-offer-other"><div className="hero-offer-top"><span className="fictional-airline">B</span><div><h2>Airline B</h2><span>Lower fare · no student extra</span></div><strong>€545<small>fare / adult</small></strong></div><div className="hero-other-detail"><span>20 kg standard + 10 kg add-on</span><strong>+€95</strong></div><div className="hero-offer-bottom"><span>Cost with your 30 kg</span><strong>€640</strong></div></article>
    <div className="comparison-takeaway"><span className="takeaway-icon"><GraduationCap size={21} /></span><p><strong>The lower fare can cost you more.</strong><span>Airline A saves €30 when you compare the baggage you need.</span></p><ArrowRight size={19} /></div>
    <p className="hero-example-note">Fictional airlines and benefits demonstrate the comparison. Actual offers depend on airline terms.</p>
  </div>;
}
