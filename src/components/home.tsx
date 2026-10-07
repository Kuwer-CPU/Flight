import { ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, GraduationCap, Heart, Luggage, Plane, Search, Sparkles, Ticket } from 'lucide-react';
import { airlines } from '@/lib/airlines';
import { flightSearchUrl } from '@/lib/search';
import type { DataMode, SearchQuery } from '@/lib/types';
import { SearchForm } from './search-form';
import { ModeNotice } from './ui';

export function Home({ initialQuery, mode }: { initialQuery: SearchQuery; mode: DataMode }) {
  const routes = [
    { origin: 'CDG', destination: 'DEL', from: 'Paris', to: 'Delhi', country: 'INDIA', image: '/delhi.svg', tag: 'Home is calling' },
    { origin: 'LHR', destination: 'BOM', from: 'London', to: 'Mumbai', country: 'INDIA', image: '/mumbai.svg', tag: 'A city that feels like you' },
    { origin: 'BER', destination: 'BKK', from: 'Berlin', to: 'Bangkok', country: 'THAILAND', image: '/bangkok.svg', tag: 'A well-earned adventure' },
  ];
  return <>
    <section className="hero container">
      <div className="hero-copy"><div className="eyebrow"><span />FOR THE STUDENT GOING PLACES</div><h1>Big dreams.<br />Better flights.<br /><span>More baggage.</span></h1><p>Your next chapter deserves a better ticket. Find flights, discover student perks, and take a little more of home with you.</p><div className="hero-points"><span><Luggage size={17} />Baggage that fits your life</span><span><GraduationCap size={18} />Student perks worth checking</span></div><a className="hero-link" href="#search">Where will your story go?<ArrowDownMark /></a></div>
      <div className="hero-art"><img src="/hero-journey.svg" alt="An airplane circling a globe with a Paris to Delhi student boarding pass" width="900" height="800" /><div className="art-label"><span className="small-star">✳</span>LESS STRESS. MORE TAKEOFF.</div></div>
      <div className="hero-caption"><span>01 / YOUR JOURNEY STARTS HERE</span><span>GO FURTHER ↗</span></div>
    </section>
    <div className="container search-container"><SearchForm initial={initialQuery} /><div className="home-mode"><ModeNotice mode={mode} compact /></div></div>
    <section className="airline-strip container" aria-label="Discover flights and student programs"><p>Your journey.<br /><strong>A world of airlines.</strong></p><div>{['QR', 'EK', 'LH', 'SQ', 'AI'].map(code => { const a = airlines.find(a => a.code === code)!; return <span className={'airline-wordmark wordmark-' + code} key={code}>{code === 'QR' && <Plane size={23} />}{a.shortName}{code === 'SQ' && <span className="airline-bird">〰</span>}</span>; })}</div><a href="/student-perks" aria-label="Explore airline student programs"><ArrowUpRight size={22} /></a></section>
    <section className="perks-section container"><div className="perks-intro"><div className="eyebrow">A STUDENT ID CAN GO A LONG WAY</div><h2>Your ticket should<br />work <em>harder for you.</em></h2><p>A low fare is only part of the story. We put the details that matter to student travelers right next to the flight.</p><a className="text-link" href="/student-perks">Explore student perks<ArrowUpRight size={17} /></a></div><div className="perk-cards"><article className="perk-card"><span className="perk-icon"><Luggage size={25} /></span><h3>Pack your whole life.</h3><p>See included checked baggage and find airline student programs that may give you more room.</p><span className="perk-caption">MORE ROOM FOR WHAT MATTERS</span></article><article className="perk-card"><span className="perk-icon"><Ticket size={25} /></span><h3>Find your kind of fare.</h3><p>Compare ticket prices, travel times and bags together. Then check student-only offers with the airline.</p><span className="perk-caption">A BETTER VIEW OF YOUR TICKET</span></article></div></section>
    <section id="destinations" className="destinations-section container"><div className="section-heading"><div><div className="eyebrow">A LITTLE INSPIRATION</div><h2>Next stop, <em>somewhere good.</em></h2></div><a className="text-link" href="#search">Find your destination<ArrowUpRight size={17} /></a></div><div className="destination-grid">{routes.map(route => <a className="destination-card" key={route.to} href={flightSearchUrl({ ...initialQuery, origin: route.origin, destination: route.destination })}><div className="destination-image"><img src={route.image} alt={route.to === 'Delhi' ? 'Illustration of India Gate in Delhi' : route.to === 'Mumbai' ? 'Illustration of the Gateway of India in Mumbai' : 'Illustration of a temple in Bangkok'} width="600" height="390" loading="lazy" /><span className="destination-country">{route.country}</span><span className="destination-arrow"><ArrowUpRight size={23} /></span></div><div className="destination-copy"><span>{route.tag}</span><h3>{route.from}<ArrowRight size={18} />{route.to}</h3><p>Explore flights<span>Let’s go<ArrowRight size={14} /></span></p></div></a>)}</div></section>
    <section id="how-it-works" className="how-section"><div className="container"><div className="how-heading"><div className="eyebrow">LESS PLANNING. MORE LIVING.</div><h2>From “what if”<br />to <em>wheels up.</em></h2><p>Three steps to your next chapter.<br />We keep the flight part simple.</p></div><div className="how-steps">{[
      { n: '01', icon: Search, title: 'Tell us where.', text: 'Add your route, dates and baggage needs. Flying for university or heading home? Start here.' },
      { n: '02', icon: Sparkles, title: 'Find your flight.', text: 'Compare fares and schedules. Spot the baggage details and student programs worth exploring.' },
      { n: '03', icon: Plane, title: 'Make it happen.', text: 'Continue to the airline to confirm your fare, claim eligible student benefits and book securely.' },
    ].map(step => <article key={step.n}><div className="step-top"><span>{step.n}</span><step.icon size={24} /></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></div></section>
    <section className="final-cta container"><div className="cta-decoration"><Heart size={27} /><span>HOME IS A FEELING.<br />SOMETIMES, IT’S A FLIGHT.</span></div><h2>Take your dreams.<br /><em>We’ll find the flight.</em></h2><a className="button" href="#search">Find my next chapter<ArrowUpRight size={18} /></a><div className="cta-reassurance"><BadgeCheck size={16} />No booking fees from Flyora.</div></section>
  </>;
}
function ArrowDownMark() { return <ArrowDownRight size={21} aria-hidden="true" />; }
