import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, CheckSquare, GraduationCap, Globe2, Luggage, Plane, Search, ShieldCheck, ShoppingBag, Sparkles, Scale } from 'lucide-react';
import { airportCount, countryCount } from '@/lib/airports';
import { flightSearchUrl } from '@/lib/search';
import type { SearchQuery } from '@/lib/types';
import { StudentBaggageCalculator } from './student-baggage-calculator';
import { travelEssentials } from '@/lib/travel-essentials';

export function Home({ initialQuery, integration }: { initialQuery: SearchQuery; integration?: { integration: 'api' | 'travelpayouts'; status?: string } }) {
  const apiSearch = integration?.integration === 'api';
  const searchHref = '/flights';
  const routes = [
    { origin: 'JFK', destination: 'HND', from: 'New York', to: 'Tokyo', country: 'JAPAN', image: '/tokyo.svg', alt: 'Illustration of Tokyo and Mount Fuji' },
    { origin: 'GRU', destination: 'CPT', from: 'São Paulo', to: 'Cape Town', country: 'SOUTH AFRICA', image: '/cape-town.svg', alt: 'Illustration of Table Mountain above Cape Town' },
    { origin: 'SYD', destination: 'SIN', from: 'Sydney', to: 'Singapore', country: 'SINGAPORE', image: '/singapore.svg', alt: 'Illustration of Singapore’s Marina Bay skyline' },
    { origin: 'CDG', destination: 'DEL', from: 'Paris', to: 'Delhi', country: 'INDIA', image: '/delhi.svg', alt: 'Illustration of India Gate in Delhi' },
    { origin: 'YYZ', destination: 'MEX', from: 'Toronto', to: 'Mexico City', country: 'MEXICO', image: '/mexico-city.svg', alt: 'Illustration of Mexico City’s skyline' },
    { origin: 'NBO', destination: 'LHR', from: 'Nairobi', to: 'London', country: 'UNITED KINGDOM', image: '/london.svg', alt: 'Illustration of Westminster in London' },
  ];
  const advantages = [
    { icon: Luggage, title: 'Check your baggage', text: 'Weigh each bag, compare ticket allowances and review student conditions.', href: '/#luggage-calculator', tag: 'START HERE', tone: 'green' },
    { icon: GraduationCap, title: 'Student airline benefits', text: 'Find official programs and check route, fare and eligibility restrictions.', href: '/student-benefits', tag: 'STUDENT PERKS', tone: 'sand' },
    { icon: ShoppingBag, title: 'Travel Essentials', text: 'Discover flight comforts, scales, adapters, stickers and packing accessories.', href: '/travel-essentials', tag: 'PACK BETTER', tone: 'blue' },
    { icon: Plane, title: 'Search flights', text: 'Find flights through our booking partner and confirm the fare with the seller.', href: '/flights', tag: 'FLY SMARTER', tone: 'rose' },
  ];
  return <div className="v2-home">
    <section className="container v2-hero v2-baggage-hero">
      <div className="v2-hero-copy">
        <div className="v2-eyebrow"><GraduationCap size={17} /> MADE FOR STUDENTS FLYING FROM INDIA AND BEYOND</div>
        <h1>Your bags.<br />Your flight.<br /><em>Know your allowance.</em></h1>
        <p>Enter your suitcase weights and compare baggage rules for different airline tickets. Explore student benefits without guessing what is included.</p>
        <div className="v2-hero-actions"><a className="button" href="#luggage-calculator">Calculate my baggage <ArrowDown size={18} /></a><Link className="v2-secondary-link" href="/student-benefits">Explore Student Benefits <ArrowRight size={16} /></Link></div>
        <div className="v2-hero-assurance"><ShieldCheck size={16} />Actual ticket terms first. Unverified student offers are clearly labelled.</div>
      </div>
      <div className="v2-hero-board v2-baggage-hero-board" aria-label="Your baggage planning toolkit">
        <div className="v2-board-top"><Sparkles size={20} /><span>START WITH WHAT YOU ARE PACKING</span></div>
        <div className="v2-journey-card">
          <span className="v2-small-label">ONE TRIP. CLEARER BAGGAGE DECISIONS.</span>
          <h2>Two bags. Six airlines.<br /><em>One clearer comparison.</em></h2>
          <p>Check your total weight, each bag limit and the difference between your ticket allowance and a conditional student extra.</p>
          <div className="v2-hero-baggage-points"><span><Scale size={16} /> Weigh each bag</span><span><Luggage size={16} /> Compare airlines</span><span><ShieldCheck size={16} /> Verify conditions</span></div>
        </div>
        <div className="v2-board-tools"><Link href="/travel-essentials"><span><ShoppingBag size={23} /></span><div><strong>Everything for your flight</strong><small>Pillows, packing tools, luggage scales and more.</small></div><ArrowUpRight size={16} /></Link></div>
        <div className="v2-board-stamp" aria-hidden="true"><Globe2 size={26} /><span>MADE FOR<br />THE JOURNEY</span></div>
      </div>
      <div className="v2-hero-bottom"><span>WEIGH → COMPARE → VERIFY → PACK → FLY</span><span>FLYORA / INDIA-FIRST STUDENT TRAVEL</span></div>
    </section>
    <section id="luggage-calculator" className="container luggage-page v2-home-baggage" aria-labelledby="home-baggage-title">
      <div className="v2-home-baggage-heading"><div><span className="eyebrow">START HERE — NO SIGN-UP REQUIRED</span><h2 id="home-baggage-title">Calculate your luggage allowance.</h2><p>Compare up to four airlines using your real ticket baggage terms. Your bags and results stay on this page.</p></div><Link className="v2-secondary-link" href="/luggage-calculator">Open standalone calculator <ArrowUpRight size={16} /></Link></div>
      <div className="luggage-assurance"><ShieldCheck size={22} aria-hidden="true" /><p><strong>Standard allowance comes from your ticket, not a general airline claim.</strong><span>Student extras are conditional and currently unverified. Check the operating airline and official policy before travelling.</span></p></div>
      <StudentBaggageCalculator essentials={travelEssentials()} today={new Date().toISOString().slice(0, 10)} />
    </section>
    <section className="container v2-search-section v2-secondary-flight-section" aria-label="Flight search">
      <div className="v2-search-cta"><span className="v2-search-cta-icon"><Plane size={25} aria-hidden="true" /></span><div className="v2-search-cta-copy"><span className="v2-small-label">FLIGHTS WHEN YOU NEED THEM</span><h2>Ready to search flights?</h2><p>Search with our flight partner, then confirm the final fare, baggage and student eligibility with your seller.</p></div><Link className="button" href="/flights">Search flights <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
    </section>
    <section className="container v2-advantages"><div className="v2-section-intro"><div><span className="eyebrow">YOUR STUDENT TRAVEL TOOLKIT</span><h2>A little more clarity.<br /><em>A lot more possibility.</em></h2></div><p>Start with your baggage, then discover student benefits, travel products and flights.</p></div><div className="v2-advantage-grid">{advantages.map(card => <Link className={'v2-advantage v2-tone-' + card.tone} href={card.href} key={card.href}><span className="v2-advantage-icon"><card.icon size={24} /></span><span className="v2-small-label">{card.tag}</span><h3>{card.title}</h3><p>{card.text}</p><span className="v2-card-link">Take a closer look<ArrowUpRight size={18} /></span></Link>)}</div></section>
    <section className="container v2-essentials-feature" aria-labelledby="home-essentials-title"><span className="v2-essentials-icon"><ShoppingBag size={34} aria-hidden="true" /></span><div><span className="eyebrow">PACK FOR YOUR NEXT CHAPTER</span><h2 id="home-essentials-title">Little essentials. A smoother journey.</h2><p>Explore packing, luggage, electronics and document accessories for your journey from India. Shop with an external retailer and check the details before choosing.</p></div><Link className="button button-secondary" href="/travel-essentials">Explore Travel Essentials<ArrowUpRight size={18} aria-hidden="true" /></Link></section>
    <section className="container v2-student-feature"><div><span className="eyebrow">YOUR STUDENT ID IS A STARTING POINT</span><h2>Your bags have plans.<br /><em>Check the small print.</em></h2><p>Find the airline’s official source, then check your route, fare, age and booking channel before counting on a student benefit.</p><Link className="text-link" href="/student-benefits">Find airline student programs<ArrowRight size={17} /></Link></div><div className="v2-benefit-guide"><span className="v2-small-label">BEFORE YOU BOOK</span>{[{ title: 'Baggage that’s actually included', text: 'Separate the fare allowance from any student extra.' }, { title: 'The right registration and proof', text: 'Let the airline confirm membership and eligibility.' }, { title: 'A booking channel that qualifies', text: 'An agency fare may have different student terms.' }].map(item => <div key={item.title}><span><Check size={16} /></span><div><strong>{item.title}</strong><p>{item.text}</p></div></div>)}<small>Current policy leads still need review. We don’t add unverified extras to fares.</small></div></section>
    <section id="destinations" className="container destinations-section v2-destinations"><div className="section-heading"><div><span className="eyebrow">YOUR JOURNEY HAS NO BORDERS</span><h2>From your campus<br />to <em>your world.</em></h2><p className="worldwide-points"><Globe2 size={15} />{apiSearch ? <>{airportCount.toLocaleString('en-GB')} airports · {countryCount} countries and territories</> : 'Route inspiration for your next journey'}</p></div><Link className="text-link" href={searchHref}>Find your destination<ArrowUpRight size={17} /></Link></div><div className="destination-grid">{routes.map(route => <Link className="destination-card" href={apiSearch ? flightSearchUrl({ ...initialQuery, origin: route.origin, destination: route.destination }) : '/flights'} key={route.to}><div className="destination-image"><img src={route.image} alt={route.alt} width="600" height="390" loading="lazy" /><span className="destination-country">{route.country}</span><span className="destination-arrow"><ArrowUpRight size={21} /></span></div><div className="destination-copy"><h3>{route.from}<ArrowRight size={18} />{route.to}</h3><p className={apiSearch ? undefined : 'v2-route-inspiration'}>{apiSearch ? 'Explore this journey' : 'Route inspiration · Enter route in search'}<span>Search<ArrowRight size={14} /></span></p></div></Link>)}</div></section>
    <section className="container v2-plan-strip"><CheckSquare size={36} /><div><span className="eyebrow">A CHECKLIST FOR YOUR NEXT CHAPTER</span><h2>Leave the last-minute scramble behind.</h2><p>Build your travel reminders, make them your own, and tick things off as you go.</p></div><Link className="button" href="/travel-checklist">Plan my journey<ArrowUpRight size={17} /></Link></section>
    <section id="how-it-works" className="container v2-how"><div className="v2-section-intro"><div><span className="eyebrow">A CLEAR WAY TO YOUR NEXT CHAPTER</span><h2>One journey.<br /><em>Better informed.</em></h2></div><p>Flyora helps you plan. The chosen airline or authorized booking partner handles the ticket.</p></div><div className="v2-how-grid">{[{ icon: Search, title: 'Search & compare', text: 'Find your route, explore partner results and check official student terms.' }, { icon: Luggage, title: 'Pack & plan', text: 'Compare the baggage on your ticket, find useful essentials and prepare your checklist.' }, { icon: Plane, title: 'Book externally', text: 'Confirm the final fare and conditions with the seller, then complete booking there.' }].map((step, index) => <article key={step.title}><span className="v2-step-number">0{index + 1}</span><step.icon size={26} /><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></section>
  </div>;
}
