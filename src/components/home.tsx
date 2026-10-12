import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, CheckSquare, Coins, GraduationCap, Globe2, Luggage, Plane, Search, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { airportCount, countryCount } from '@/lib/airports';
import { flightSearchUrl } from '@/lib/search';
import type { FlightConnection, SearchQuery } from '@/lib/types';
import { SearchForm } from './search-form';
import { ConnectionNotice } from './ui';

export function Home({ initialQuery, connection, integration }: { initialQuery: SearchQuery; connection: FlightConnection; integration?: { integration: 'api' | 'travelpayouts'; status?: string } }) {
  const routes = [
    { origin: 'JFK', destination: 'HND', from: 'New York', to: 'Tokyo', country: 'JAPAN', image: '/tokyo.svg', alt: 'Illustration of Tokyo and Mount Fuji' },
    { origin: 'GRU', destination: 'CPT', from: 'São Paulo', to: 'Cape Town', country: 'SOUTH AFRICA', image: '/cape-town.svg', alt: 'Illustration of Table Mountain above Cape Town' },
    { origin: 'SYD', destination: 'SIN', from: 'Sydney', to: 'Singapore', country: 'SINGAPORE', image: '/singapore.svg', alt: 'Illustration of Singapore’s Marina Bay skyline' },
    { origin: 'CDG', destination: 'DEL', from: 'Paris', to: 'Delhi', country: 'INDIA', image: '/delhi.svg', alt: 'Illustration of India Gate in Delhi' },
    { origin: 'YYZ', destination: 'MEX', from: 'Toronto', to: 'Mexico City', country: 'MEXICO', image: '/mexico-city.svg', alt: 'Illustration of Mexico City’s skyline' },
    { origin: 'NBO', destination: 'LHR', from: 'Nairobi', to: 'London', country: 'UNITED KINGDOM', image: '/london.svg', alt: 'Illustration of Westminster in London' },
  ];
  const advantages = [
    { icon: Plane, title: 'Partner flight search', text: 'Use the supported partner interface, then confirm your flight with the seller.', href: '/flights', tag: 'SEARCH', tone: 'green' },
    { icon: GraduationCap, title: 'Your student advantage', text: 'Find official airline programs and check baggage, fare and eligibility rules.', href: '/student-benefits', tag: 'COMPARE', tone: 'sand' },
    { icon: Luggage, title: 'The whole journey cost', text: 'Compare your entered quotes, including bags, transfers and the little extras.', href: '/travel-calculator', tag: 'PLAN', tone: 'blue' },
    { icon: Wallet, title: 'Flyora Miles Wallet', text: 'Keep manual balances together and explore cash versus miles.', href: '/miles-wallet', tag: 'TRACK', tone: 'rose' },
  ];
  return <div className="v2-home">
    <section className="container v2-hero">
      <div className="v2-hero-copy">
        <div className="v2-eyebrow"><GraduationCap size={17} />FOR YOUR NEXT CHAPTER</div>
        <h1>Smarter flights<br />for students<br /><em>worldwide.</em></h1>
        <p>Search flights, discover student baggage benefits, compare your real travel costs, and make the most of your airline miles.</p>
        <div className="v2-hero-actions"><a className="button" href="#search">Search Flights<ArrowUpRight size={18} /></a><Link className="v2-secondary-link" href="/student-benefits">Explore Student Benefits<ArrowRight size={16} /></Link></div>
        <div className="v2-hero-assurance"><ShieldCheck size={16} />Plan on Flyora. Book with the airline or travel partner.</div>
      </div>
      <div className="v2-hero-board" aria-label="Your student travel toolkit">
        <div className="v2-board-top"><Sparkles size={20} /><span>EVERYTHING FOR YOUR JOURNEY</span><span aria-hidden="true">•••</span></div>
        <div className="v2-journey-card"><span className="v2-small-label">BIG DREAMS. A WORLD OF POSSIBILITIES.</span><div className="v2-journey-route"><span>Campus<small>YOUR NEXT CHAPTER</small></span><div><i /><Plane size={25} /><i /></div><span>Anywhere<small>STUDENT JOURNEYS</small></span></div><div className="v2-journey-footer"><Globe2 size={14} />India ↔ Europe, and beyond</div></div>
        <div className="v2-board-tools"><Link href="/student-benefits"><span><GraduationCap size={23} /></span><div><strong>Check your student perks</strong><small>Official sources. Clear conditions.</small></div><ArrowUpRight size={16} /></Link><Link href="/miles-wallet"><span><Coins size={23} /></span><div><strong>Your miles, in one place</strong><small>Your entries. Your possibilities.</small></div><ArrowUpRight size={16} /></Link></div>
        <Link className="v2-board-checklist" href="/travel-checklist"><span><CheckSquare size={17} />A little planning. A calmer departure.</span><ArrowRight size={18} /></Link>
        <div className="v2-board-stamp" aria-hidden="true"><Globe2 size={26} /><span>MADE FOR<br />THE JOURNEY</span></div>
      </div>
      <div className="v2-hero-bottom"><span>SEARCH → COMPARE → SAVE → PLAN → TRACK MILES → BOOK EXTERNALLY</span><span>FLYORA / A SMARTER WAY TO GO</span></div>
    </section>
    <section className="container v2-search-section" aria-label="Worldwide flight search"><SearchForm initial={initialQuery} /><div className="v2-search-status">{integration?.integration === 'api' ? <ConnectionNotice connection={connection} /> : <><span className="v2-status-dot" /><span>{integration?.status === 'configured' ? 'Partner search opens in the flight finder. Confirm your itinerary in its interface.' : 'Partner flight search is being prepared. Your student planning tools are ready to use.'}</span></>}</div></section>
    <section className="container v2-advantages"><div className="v2-section-intro"><div><span className="eyebrow">MORE THAN A TICKET SEARCH</span><h2>A little more clarity.<br /><em>A lot more possibility.</em></h2></div><p>Four useful tools for the journey between where you are and where you’re going.</p></div><div className="v2-advantage-grid">{advantages.map(card => <Link className={'v2-advantage v2-tone-' + card.tone} href={card.href} key={card.href}><span className="v2-advantage-icon"><card.icon size={24} /></span><span className="v2-small-label">{card.tag}</span><h3>{card.title}</h3><p>{card.text}</p><span className="v2-card-link">Take a closer look<ArrowUpRight size={18} /></span></Link>)}</div></section>
    <section className="container v2-student-feature"><div><span className="eyebrow">YOUR STUDENT ID IS A STARTING POINT</span><h2>Your bags have plans.<br /><em>Check the small print.</em></h2><p>Find the airline’s official source, then check your route, fare, age and booking channel before counting on a student benefit.</p><Link className="text-link" href="/student-benefits">Find airline student programs<ArrowRight size={17} /></Link></div><div className="v2-benefit-guide"><span className="v2-small-label">BEFORE YOU BOOK</span>{[{ title: 'Baggage that’s actually included', text: 'Separate the fare allowance from any student extra.' }, { title: 'The right registration and proof', text: 'Let the airline confirm membership and eligibility.' }, { title: 'A booking channel that qualifies', text: 'An agency fare may have different student terms.' }].map(item => <div key={item.title}><span><Check size={16} /></span><div><strong>{item.title}</strong><p>{item.text}</p></div></div>)}<small>Current policy leads still need review. We don’t add unverified extras to fares.</small></div></section>
    <section id="destinations" className="container destinations-section v2-destinations"><div className="section-heading"><div><span className="eyebrow">YOUR JOURNEY HAS NO BORDERS</span><h2>From your campus<br />to <em>your world.</em></h2><p className="worldwide-points"><Globe2 size={15} />{airportCount.toLocaleString('en-GB')} airports · {countryCount} countries and territories</p></div><a className="text-link" href="#search">Find your destination<ArrowUpRight size={17} /></a></div><div className="destination-grid">{routes.map(route => <a className="destination-card" href={flightSearchUrl({ ...initialQuery, origin: route.origin, destination: route.destination })} key={route.to}><div className="destination-image"><img src={route.image} alt={route.alt} width="600" height="390" loading="lazy" /><span className="destination-country">{route.country}</span><span className="destination-arrow"><ArrowUpRight size={21} /></span></div><div className="destination-copy"><h3>{route.from}<ArrowRight size={18} />{route.to}</h3><p>Explore this journey<span>Search<ArrowRight size={14} /></span></p></div></a>)}</div></section>
    <section className="container v2-plan-strip"><CheckSquare size={36} /><div><span className="eyebrow">A CHECKLIST FOR YOUR NEXT CHAPTER</span><h2>Leave the last-minute scramble behind.</h2><p>Build your travel reminders, make them your own, and tick things off as you go.</p></div><Link className="button" href="/travel-checklist">Plan my journey<ArrowUpRight size={17} /></Link></section>
    <section id="how-it-works" className="container v2-how"><div className="v2-section-intro"><div><span className="eyebrow">A CLEAR WAY TO YOUR NEXT CHAPTER</span><h2>One journey.<br /><em>Better informed.</em></h2></div><p>Flyora helps you plan. The chosen airline or authorized booking partner handles the ticket.</p></div><div className="v2-how-grid">{[{ icon: Search, title: 'Search & compare', text: 'Find your route, explore partner results and check official student terms.' }, { icon: Wallet, title: 'Save & plan', text: 'Compare entered trip costs, track your miles and prepare your checklist.' }, { icon: Plane, title: 'Book externally', text: 'Confirm the final fare and conditions with the seller, then complete booking there.' }].map((step, index) => <article key={step.title}><span className="v2-step-number">0{index + 1}</span><step.icon size={26} /><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></section>
  </div>;
}
