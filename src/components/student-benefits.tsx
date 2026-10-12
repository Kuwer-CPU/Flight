'use client';

import { useState } from 'react';
import { ArrowUpRight, ChevronDown, GraduationCap, Luggage, Search, ShieldCheck } from 'lucide-react';
import { airline } from '@/lib/airlines';
import {
  baggageBenefitLabel, benefitStatuses, benefitStatusDescriptions, benefitStatusLabels,
  canShowPolicyTerms, filterStudentBenefits, officialBenefitUrl, policyStatus, policyVerificationDate, studentBenefitPolicies,
  type BenefitStatus, type StudentBenefitPolicy,
} from '@/lib/student-benefits';
import { ToolPage } from './tool-page';
import { AirlineMark } from './ui';

const confirm = 'Confirm with airline';

export function StudentBenefits({ today }: { today: string }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BenefitStatus | 'all'>('all');
  const matches = filterStudentBenefits(studentBenefitPolicies, search, status, today);
  const counts = Object.fromEntries(benefitStatuses.map(value => [value, studentBenefitPolicies.filter(policy => policyStatus(policy, today) === value).length]));
  function reset() { setSearch(''); setStatus('all'); }

  return <ToolPage eyebrow="YOUR STUDENT ID. YOUR POSSIBILITIES." title="Check your student advantage." description="Find official airline program links, understand what to ask, and confirm the benefits that apply to your journey.">
    <section className="tool-notice benefits-notice" aria-label="Student benefit verification">
      <GraduationCap size={24} aria-hidden="true" /><div><strong>A program link is a starting point.</strong><p>Current airline policies in this directory still need verification. No discount or baggage allowance is added to a flight unless the specific fare, booking channel and your eligibility are confirmed.</p></div>
    </section>
    <section className="benefit-status-guide" aria-label="How policy verification works">
      {benefitStatuses.map(value => <div key={value}><span className={'benefit-status status-' + value}>{benefitStatusLabels[value]}</span><p>{benefitStatusDescriptions[value]}</p></div>)}
    </section>
    <section className="benefits-directory" aria-labelledby="benefits-directory-heading">
      <div className="benefits-toolbar"><div><span className="eyebrow">THE AIRLINE DIRECTORY</span><h2 id="benefits-directory-heading">Find your airline.</h2></div><label className="benefits-search"><Search size={18} aria-hidden="true" /><span className="benefits-sr-only">Search airlines or student programs</span><input type="search" placeholder="Airline or program name…" value={search} onChange={event => setSearch(event.target.value)} /></label></div>
      <div className="benefits-filters" role="group" aria-label="Filter by policy verification"><button type="button" aria-pressed={status === 'all'} onClick={() => setStatus('all')}>All airlines <span>{studentBenefitPolicies.length}</span></button>{benefitStatuses.map(value => <button type="button" key={value} aria-pressed={status === value} onClick={() => setStatus(value)}>{benefitStatusLabels[value]} <span>{counts[value]}</span></button>)}</div>
      <p className="benefits-result-count" role="status">{matches.length} airline{matches.length === 1 ? '' : 's'} shown</p>
      {matches.length ? <div className="benefits-grid">{matches.map(policy => <BenefitCard key={policy.id} policy={policy} today={today} />)}</div> : <div className="tool-card benefits-empty"><Search size={29} aria-hidden="true" /><h3>No matching airline records.</h3><p>{status === 'verified-current' || status === 'conditional' ? 'There are no reviewed policies matching this filter yet. Use the unverified program links to check directly with an airline.' : 'Try another airline or clear the filters to explore the directory.'}</p><button type="button" className="button" onClick={reset}>Clear filters</button></div>}
    </section>
    <section className="tool-card benefits-next-step"><div><span className="eyebrow">MAKE THE WHOLE JOURNEY COUNT</span><h2>Check the rules. Compare the cost.</h2><p>When you have a quote and confirmed baggage charges, compare your full journey cost with the travel calculator.</p></div><a className="button" href="/travel-calculator">Compare travel costs<ArrowUpRight size={17} aria-hidden="true" /></a></section>
  </ToolPage>;
}

function BenefitCard({ policy, today }: { policy: StudentBenefitPolicy; today: string }) {
  const status = policyStatus(policy, today);
  const reviewed = canShowPolicyTerms(policy, today);
  const verificationDate = policyVerificationDate(policy, today);
  const source = officialBenefitUrl(policy);
  const baggage = reviewed ? baggageBenefitLabel(policy.benefits.checkedBaggage) : null;
  const term = (value: string | null) => reviewed && value?.trim() ? value : confirm;
  const details = [
    ['Student verification', term(policy.benefits.verification)],
    ['Eligible booking channels', term(policy.benefits.bookingChannels?.join(', ') ?? null)],
    ['Promo-code requirements', term(policy.benefits.promoCode)],
    ['Student membership', term(policy.benefits.membership)],
    ['Flexible ticket conditions', term(policy.benefits.flexibleTickets)],
    ['Route and fare conditions', term(policy.benefits.routeAndFareRestrictions)],
  ];

  return <article className="tool-card benefit-card" aria-label={policy.airlineName + ' student benefits'}>
    <div className="benefit-airline"><AirlineMark airline={airline(policy.airlineCode)} /><div><h3>{policy.airlineName}</h3><p>{policy.programName ?? 'Student program not identified in our data'}</p></div></div>
    <span className={'benefit-status status-' + status}>{status === 'verified-current' && <ShieldCheck size={13} aria-hidden="true" />}{benefitStatusLabels[status]}</span>
    <p className="benefit-intro">{policy.programName ? 'Explore the official program page. Availability and current terms need confirmation for your journey.' : 'Check the official airline website for current student offers. This record does not mean no offer exists.'}</p>
    <dl className="benefit-summary"><div><dt>Student discount</dt><dd>{term(policy.benefits.discount)}</dd></div><div><dt><Luggage size={14} aria-hidden="true" />Checked baggage</dt><dd>{baggage ?? confirm}</dd></div><div><dt>Age restrictions</dt><dd>{term(policy.benefits.ageRestrictions)}</dd></div></dl>
    <details className="benefit-details"><summary>Eligibility and booking details<ChevronDown size={16} aria-hidden="true" /></summary><dl>{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}{reviewed && baggage && <div><dt>Baggage conditions</dt><dd>{policy.benefits.checkedBaggage!.conditions}</dd></div>}</dl><p>{benefitStatusDescriptions[status]}</p></details>
    <div className="benefit-source"><div><span>Last policy verification</span><strong>{verificationDate ? <time dateTime={verificationDate}>{new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(verificationDate + 'T00:00:00Z'))}</time> : 'Not verified'}</strong></div>{source ? <a className="text-link" href={source} target="_blank" rel="noopener noreferrer">{policy.programName ? 'Official program page' : 'Official airline website'}<ArrowUpRight size={15} aria-hidden="true" /></a> : <p className="muted">Official source needs review.</p>}</div>
  </article>;
}
