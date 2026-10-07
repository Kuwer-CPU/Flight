'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Heart, Menu, Plane, X } from 'lucide-react';
import { airline } from '@/lib/airlines';
import { city } from '@/lib/airports';
import { dateLabel, money } from '@/lib/search';
import type { FlightOffer } from '@/lib/types';
import { Brand, AirlineMark, Modal } from './ui';
import { useSaved } from './saved-provider';
import { FlightDetail } from './flight-detail';

export function Header() {
  const { saved, setOpen } = useSaved();
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();
  return <header className="site-header"><div className="container header-inner"><Brand /><nav className={menu ? 'main-nav mobile-open' : 'main-nav'} aria-label="Main navigation"><a className={pathname === '/' || pathname === '/flights' ? 'nav-active' : ''} href="/#search" onClick={() => setMenu(false)}>Flights</a><a className={pathname.startsWith('/student-perks') ? 'nav-active' : ''} href="/student-perks" onClick={() => setMenu(false)}>Student perks<span className="tiny-tag">A little extra</span></a><a href="/#how-it-works" onClick={() => setMenu(false)}>How it works</a></nav><div className="header-actions"><button className="saved-button" onClick={() => setOpen(true)} aria-label={'Saved flights' + (saved.length ? ', ' + saved.length + ' saved' : '')}><Heart size={18} /><span>Saved</span>{saved.length > 0 && <b>{saved.length}</b>}</button><button className="mobile-menu icon-button" aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X size={22} /> : <Menu size={22} />}</button><a className="button button-small header-cta" href="/#search">Let’s take off<ArrowUpRight size={16} /></a></div></div></header>;
}
export function Footer() {
  return <footer className="footer"><div className="container footer-main"><div className="footer-brand"><Brand light /><p>Big dreams. Better flights.<br />A little more room for your next chapter.</p><span className="footer-tag"><Plane size={13} />Made for the student journey</span></div><div className="footer-links"><div><h3>Explore</h3><a href="/#search">Find a flight</a><a href="/student-perks">Student perks</a><a href="/#destinations">Popular routes</a></div><div><h3>The small print</h3><a href="/privacy">Privacy</a><a href="/terms">Terms of use</a><a href="/#how-it-works">How booking works</a></div></div><div className="footer-message"><span>YOUR NEXT CHAPTER</span><p>Starts with<br /><em>a ticket.</em><ArrowUpRight size={40} /></p></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Flyora. Go somewhere good.</span><span>Compare on Flyora. Pay and book with the airline.</span></div></footer>;
}
export function SavedFlights() {
  const { saved, toggle, open, setOpen } = useSaved();
  const [selected, setSelected] = useState<FlightOffer | null>(null);
  return <>{open && <Modal title="Your saved flights" onClose={() => setOpen(false)}><p className="muted saved-intro">Your shortlist stays in this browser. Saved fares are snapshots; check current availability with the airline.</p>{saved.length === 0 ? <div className="saved-empty"><Heart size={38} /><h3>A little inspiration, saved.</h3><p>Tap the heart on a flight to keep it here.</p><a href="/#search" className="button" onClick={() => setOpen(false)}>Find your flight<ArrowRight size={17} /></a></div> : <div className="saved-list">{saved.map(offer => { const segments = offer.itineraries[0].segments; return <div className="saved-card" key={offer.id}><AirlineMark airline={airline(offer.airlineCode)} code={offer.airlineCode} size="small" /><div><strong>{city(segments[0].from)} <ArrowRight size={12} /> {city(segments.at(-1)!.to)}</strong><span>{offer.airlineName} · {dateLabel(segments[0].departure)}{offer.mode !== 'live' ? ' · sample' : ''}</span></div><button className="saved-price" onClick={() => { setOpen(false); setSelected(offer); }} aria-label={'View saved ' + offer.airlineName + ' flight'}>{money(offer.price / offer.passengers, offer.currency)}<ArrowUpRight size={14} /></button><button className="icon-button" aria-label={'Remove saved ' + offer.airlineName + ' flight'} onClick={() => toggle(offer)}><X size={17} /></button></div>; })}</div>}</Modal>}{selected && <FlightDetail offer={selected} onClose={() => setSelected(null)} />}</>;
}
