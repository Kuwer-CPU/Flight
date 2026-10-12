'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Calculator, CheckSquare, GraduationCap, Plane, ShieldCheck, Wallet } from 'lucide-react';
import type { TravelpayoutsIntegration } from '@/lib/flight-integration';
import { StudentTravelPlanning } from './student-travel-planning';
import { ToolPage } from './tool-page';
import { TravelpayoutsWidget } from './travelpayouts-widget';

export function PartnerFlightSearch({ config, active = true }: { config: TravelpayoutsIntegration; active?: boolean }) {
  const [frameLoaded, setFrameLoaded] = useState(false);
  const script = config.status === 'configured' && config.transport === 'script' && !!config.scriptUrl;
  const frame = config.status === 'configured' && config.transport === 'iframe' && !!config.frameUrl;
  const available = script || frame;
  const relation = 'noopener noreferrer' + (config.affiliateLinks ? ' sponsored' : '');
  const tools = [
    { href: '/student-benefits', icon: GraduationCap, title: 'Student benefits', description: 'Check official airline programs, age limits and eligibility before counting on a benefit.', action: 'Explore programs' },
    { href: '/travel-calculator', icon: Calculator, title: 'Travel calculator', description: 'Compare your entered ticket quotes, baggage charges and other travel costs.', action: 'Compare journey costs' },
    { href: '/miles-wallet', icon: Wallet, title: 'Miles Wallet', description: 'Keep your manually entered loyalty balances and estimate cash versus miles.', action: 'Open your wallet' },
    { href: '/travel-checklist', icon: CheckSquare, title: 'Travel checklist', description: 'Prepare your documents, student registration, bags and arrival reminders.', action: 'Plan your journey' },
  ];

  return <div className="partner-flight-search"><ToolPage eyebrow="FLIGHT SEARCH" title="Find your next flight." description="Search flights here, then plan your student benefits and full journey cost below.">
    {available ? <section className="partner-interface tool-panel" aria-labelledby="partner-search-title">
      <div className="partner-interface-heading"><span className="partner-search-icon"><Plane size={25} aria-hidden="true" /></span><div><h2 id="partner-search-title">Search flights with Travelpayouts</h2><p>Enter your departure, destination, dates and travelers in the search below. Confirm your final itinerary and conditions with the booking seller.</p></div></div>
      <p className="partner-privacy"><ShieldCheck size={18} aria-hidden="true" />{script ? 'Partner search may use cookies and access page context. The partner’s privacy and booking terms apply.' : 'Loading search connects your browser to the partner website, which may use cookies. Its privacy and booking terms apply.'}</p>
      <p className="partner-affiliate">Eligible partner bookings may earn Flyora a commission. Results and booking redirects are provided by the partner. Student benefits are checked separately.</p>
      {frame && <div className="partner-search-actions">{!frameLoaded && <button type="button" className="button" onClick={() => setFrameLoaded(true)}>Load partner search<ArrowRight size={17} aria-hidden="true" /></button>}
        <a className="text-link" href={config.frameUrl} target="_blank" rel={relation} referrerPolicy="no-referrer">Open search in a new tab<ArrowUpRight size={16} aria-hidden="true" /></a>
      </div>}
      {script && <TravelpayoutsWidget config={config} active={active} />}
      {frame && frameLoaded && <div className="partner-frame-container"><iframe src={config.frameUrl} title="Partner flight search" loading="lazy" referrerPolicy="no-referrer" sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox" /><p>If search does not appear here, open the partner site in a new tab. Check the selected itinerary and final price there before booking.</p></div>}
    </section> : <section className="partner-placeholder tool-panel" aria-labelledby="partner-search-title"><span className="partner-search-icon"><Plane size={28} aria-hidden="true" /></span><h2 id="partner-search-title">Flight search is unavailable.</h2><p>You can explore official student airline programs and plan your travel costs while search is unavailable.</p><p className="muted">No flight prices or booking offers have been confirmed here.</p></section>}
    <section className="partner-planning-tools" aria-labelledby="partner-tools-title"><div className="partner-planning-heading"><span className="eyebrow">YOUR STUDENT TRAVEL TOOLKIT</span><h2 id="partner-tools-title">Plan beyond the ticket.</h2><p>Keep student eligibility and baggage planning separate from your flight search. Airline benefits depend on the specific fare and booking channel.</p></div>
      <StudentTravelPlanning />
      <div className="tool-grid">{tools.map(tool => <Link className="partner-tool tool-panel" href={tool.href} key={tool.href}><tool.icon size={25} aria-hidden="true" /><h3>{tool.title}</h3><p>{tool.description}</p><span>{tool.action}<ArrowRight size={16} aria-hidden="true" /></span></Link>)}</div>
    </section>
  </ToolPage></div>;
}
