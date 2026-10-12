'use client';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Calculator, GraduationCap, Plane, ShieldCheck } from 'lucide-react';
import { city } from '@/lib/airports';
import { dateLabel, defaults, parseSearch } from '@/lib/search';
import type { TravelpayoutsIntegration } from '@/lib/flight-integration';
import { SearchForm } from './search-form';
import { ToolPage } from './tool-page';
import { TravelpayoutsWidget } from './travelpayouts-widget';

export function PartnerFlightSearch({ config, active = true }: { config: TravelpayoutsIntegration; active?: boolean }) {
  const params = useSearchParams();
  const paramsKey = params.toString();
  const parsed = useMemo(() => {
    try { return { query: paramsKey ? parseSearch(new URLSearchParams(paramsKey)) : defaults(), error: '' }; }
    catch (error) { return { query: defaults(), error: error instanceof Error ? error.message : 'Check your journey details.' }; }
  }, [paramsKey]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const script = config.status === 'configured' && config.transport === 'script' && !!config.scriptUrl;
  const frame = config.status === 'configured' && config.transport === 'iframe' && !!config.frameUrl;
  const available = script || frame;
  const loaded = frame && loadedFor === paramsKey && !parsed.error;
  const relation = 'noopener noreferrer' + (config.affiliateLinks ? ' sponsored' : '');

  return <div className="partner-flight-search"><ToolPage eyebrow="FLIGHT SEARCH" title="Find your next flight." description="Plan your journey and check student benefits before you book.">
    <SearchForm key={paramsKey} initial={parsed.query} compact />
    {parsed.error && <p className="tool-notice partner-query-error" role="alert">{parsed.error}</p>}
    {paramsKey && !parsed.error && <section className="partner-journey tool-panel" aria-label="Your search plan">
      <div><span className="tool-label">YOUR SEARCH PLAN</span><h2>{city(parsed.query.origin)} <ArrowRight size={21} aria-hidden="true" /> {city(parsed.query.destination)}</h2>
      <p>{dateLabel(parsed.query.departureDate)}{parsed.query.returnDate ? ' – ' + dateLabel(parsed.query.returnDate) : ' · One way'} · {parsed.query.adults} adult{parsed.query.adults > 1 ? 's' : ''} · {parsed.query.cabin.toLowerCase().replaceAll('_', ' ')}</p></div>
      <span className="partner-journey-bags">{parsed.query.baggage} kg luggage to plan for</span>
    </section>}
    {available ? <section className="partner-interface tool-panel" aria-labelledby="partner-search-title">
      <div className="partner-interface-heading"><span className="partner-search-icon"><Plane size={25} aria-hidden="true" /></span><div><h2 id="partner-search-title">Search with a travel partner</h2><p>Use the partner’s flight-search interface and confirm its current fares and booking conditions.</p></div></div>
      <p className="tool-notice">Your Flyora selections are a planning summary. Enter or check your route, dates, travelers and cabin inside the partner search; they are not automatically filled in. Student benefits are checked separately and are not automatically applied to partner fares.</p>
      <p className="partner-privacy"><ShieldCheck size={18} aria-hidden="true" />{script ? 'Flight search loads a third-party partner script on this page. It may use cookies and access page context. The partner’s privacy and booking terms apply.' : 'Loading search connects your browser to another website, which may use cookies. Its privacy and booking terms apply.'}</p>
      <p className="partner-affiliate">Partner search may contain affiliate tracking. Eligible bookings may earn Flyora a commission. Booking and result ordering are handled by the partner.</p>
      {frame && <div className="partner-search-actions">{!loaded && <button type="button" className="button" disabled={!!parsed.error} onClick={() => setLoadedFor(paramsKey)}>Load partner search<ArrowRight size={17} aria-hidden="true" /></button>}
        {!parsed.error && <a className="text-link" href={config.frameUrl} target="_blank" rel={relation} referrerPolicy="no-referrer">Open search in a new tab<ArrowUpRight size={16} aria-hidden="true" /></a>}
      </div>}
      {script && <TravelpayoutsWidget config={config} active={active} />}
      {loaded && <div className="partner-frame-container"><iframe src={config.frameUrl} title="Partner flight search" loading="lazy" referrerPolicy="no-referrer" sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox" /><p>If search does not appear here, open the partner site in a new tab. Check the selected itinerary and final price there before booking.</p></div>}
    </section> : <section className="partner-placeholder tool-panel" aria-labelledby="partner-search-title"><span className="partner-search-icon"><Plane size={28} aria-hidden="true" /></span><h2 id="partner-search-title">Flight search is coming soon.</h2><p>You can explore student airline programs and compare your travel costs while we prepare flight search.</p><p className="muted">No fares or booking offers are available on this page yet.</p></section>}
    <section className="partner-planning-tools" aria-labelledby="partner-tools-title"><h2 id="partner-tools-title">Make the most of your student journey.</h2><div className="tool-grid">
      <Link className="partner-tool tool-panel" href="/student-benefits"><GraduationCap size={25} aria-hidden="true" /><h3>Student benefits</h3><p>Check official airline programs and the terms that may apply to your journey.</p><span>Explore programs<ArrowRight size={16} aria-hidden="true" /></span></Link>
      <Link className="partner-tool tool-panel" href="/travel-calculator"><Calculator size={25} aria-hidden="true" /><h3>Travel calculator</h3><p>Compare your own ticket quotes, baggage charges and other travel costs.</p><span>Plan your budget<ArrowRight size={16} aria-hidden="true" /></span></Link>
    </div></section>
  </ToolPage></div>;
}
