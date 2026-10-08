import { ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, GraduationCap, Heart, Luggage, Globe2, Plane, Search, Sparkles, Ticket } from 'lucide-react';
import { airlines } from '@/lib/airlines';
import { flightSearchUrl } from '@/lib/search';
import { airportCount, countryCount } from '@/lib/airports';
import type { FlightConnection, SearchQuery } from '@/lib/types';
import { SearchForm } from './search-form';
import { ConnectionNotice } from './ui';
import { HomeStudentComparison } from './student-comparison';

export function Home({ initialQuery, connection }: { initialQuery: SearchQuery; connection: FlightConnection }) {
  const routes = [
    { origin: 'JFK', destination: 'HND', from: 'New York', to: 'Tokyo', country: 'JAPAN', image: '/tokyo.svg', alt: 'Illustration of a Tokyo skyline with Mount Fuji', tag: 'A whole new chapter' },
    { origin: 'GRU', destination: 'CPT', from: 'São Paulo', to: 'Cape Town', country: 'SOUTH AFRICA', image: '/cape-town.svg', alt: 'Illustration of Table Mountain above Cape Town', tag: 'Take your curiosity further' },
    { origin: 'SYD', destination: 'SIN', from: 'Sydney', to: 'Singapore', country: 'SINGAPORE', image: '/singapore.svg', alt: 'Illustration of Singapore’s Marina Bay skyline', tag: 'Big plans. New horizons.' },
    { origin: 'CDG', destination: 'DEL', from: 'Paris', to: 'Delhi', country: 'INDIA', image: '/delhi.svg', alt: 'Illustration of India Gate in Delhi', tag: 'Home is calling' },
    { origin: 'YYZ', destination: 'MEX', from: 'Toronto', to: 'Mexico City', country: 'MEXICO', image: '/mexico-city.svg', alt: 'Illustration of Mexico City’s skyline and mountains', tag: 'A well-earned adventure' },
    { origin: 'NBO', destination: 'LHR', from: 'Nairobi', to: 'London', country: 'UNITED KINGDOM', image: '/london.svg', alt: 'Illustration of London’s Westminster skyline', tag: 'Your next campus awaits' },
  ];
  return <>
    <section className="hero container">
      <div className="hero-copy"><div className="eyebrow"><GraduationCap size={18} />FLIGHTS THAT VALUE YOUR STUDENT ID</div><h1>Same flight.<br />Student perks.<br /><span>Better deal.</span></h1><p>Don’t just compare ticket prices. Compare what you get as a student — extra baggage, eligible allowances, and the cost of taking your life with you, wherever you’re headed.</p><div className="hero-points"><span><Luggage size={17} />Standard + student baggage</span><span><GraduationCap size={18} />Your student value, side by side</span></div><a className="hero-link" href="#search">Find my student advantage<ArrowDownMark /></a></div>
      <HomeStudentComparison />
      <div className="hero-caption"><span>01 / A STUDENT ID CAN CHANGE THE MATH</span><span>STUDENT JOURNEYS. WORLDWIDE. ↗</span></div>
    </section>
    <div className="container search-container"><SearchForm initial={initialQuery} /><div className="home-mode"><ConnectionNotice connection={connection} /></div></div>
    <section className="airline-strip container" aria-label="Discover flights and student programs"><p>Your journey.<br /><strong>A world of airlines.</strong></p><div>{['QR', 'EK', 'LH', 'SQ', 'AI'].map(code => { const a = airlines.find(a => a.code === code)!; return <span className={'airline-wordmark wordmark-' + code} key={code}>{code === 'QR' && <Plane size={23} />}{a.shortName}{code === 'SQ' && <span className="airline-bird">〰</span>}</span>; })}</div><a href="/student-perks" aria-label="Explore airline student programs"><ArrowUpRight size={22} /></a></section>
    <section className="perks-section container"><div className="perks-intro"><div className="eyebrow">A STUDENT ID CAN GO A LONG WAY</div><h2>Your ticket should<br />work <em>harder for you.</em></h2><p>A €545 fare can become €640 with the bags you need. Compare standard baggage, student extras and your total cost before choosing a flight.</p><a className="text-link" href="/student-perks">Explore student perks<ArrowUpRight size={17} /></a></div><div className="perk-cards"><article className="perk-card"><span className="perk-icon"><Luggage size={25} /></span><h3>Pack your whole life.</h3><p>See standard baggage + student extra = your eligible total. Check whether it fits the luggage you actually need.</p><span className="perk-caption">MORE ROOM FOR WHAT MATTERS</span></article><article className="perk-card"><span className="perk-icon"><Ticket size={25} /></span><h3>Find your kind of fare.</h3><p>Compare the cost with your bags, see how student value is ranked, and check the registration and verification steps.</p><span className="perk-caption">A BETTER VIEW OF YOUR TICKET</span></article></div></section>
    <section id="destinations" className="destinations-section worldwide-destinations container"><div className="section-heading"><div><div className="eyebrow">STUDENT JOURNEYS HAVE NO BORDERS</div><h2>Your next chapter, <em>anywhere.</em></h2><p className="worldwide-points"><Globe2 size={15} />{airportCount.toLocaleString('en-GB')} airports · {countryCount} countries and territories</p></div><a className="text-link" href="#search">Find your destination<ArrowUpRight size={17} /></a></div><div className="destination-grid">{routes.map(route => <a className="destination-card" key={route.to} href={flightSearchUrl({ ...initialQuery, origin: route.origin, destination: route.destination })}><div className="destination-image"><img src={route.image} alt={route.alt} width="600" height="390" loading="lazy" /><span className="destination-country">{route.country}</span><span className="destination-arrow"><ArrowUpRight size={23} /></span></div><div className="destination-copy"><span>{route.tag}</span><h3>{route.from}<ArrowRight size={18} />{route.to}</h3><p>Explore flights<span>Let’s go<ArrowRight size={14} /></span></p></div></a>)}</div></section>
    <section id="how-it-works" className="how-section"><div className="container"><div className="how-heading"><div className="eyebrow">LESS PLANNING. MORE LIVING.</div><h2>From “what if”<br />to <em>wheels up.</em></h2><p>Three steps to your next chapter.<br />We keep the flight part simple.</p></div><div className="how-steps">{[
      { n: '01', icon: Search, title: 'Tell us where.', text: 'Add your route, dates and baggage needs. Flying for university or heading home? Start here.' },
      { n: '02', icon: Sparkles, title: 'Compare your advantage.', text: 'See baggage side by side and compare costs for your luggage needs. Check which benefits require student verification.' },
      { n: '03', icon: Plane, title: 'Make it happen.', text: 'Continue to the airline to confirm your fare, claim eligible student benefits and book securely.' },
    ].map(step => <article key={step.n}><div className="step-top"><span>{step.n}</span><step.icon size={24} /></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></div></section>
    <section className="final-cta container"><div className="cta-decoration"><Heart size={27} /><span>HOME IS A FEELING.<br />SOMETIMES, IT’S A FLIGHT.</span></div><h2>Take your dreams.<br /><em>We’ll find the flight.</em></h2><a className="button" href="#search">Find my next chapter<ArrowUpRight size={18} /></a><div className="cta-reassurance"><BadgeCheck size={16} />No booking fees from Flyora.</div></section>
  </>;
}
function ArrowDownMark() { return <ArrowDownRight size={21} aria-hidden="true" />; }
