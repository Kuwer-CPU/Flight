'use client';
import { useState } from 'react';
import Link from 'next/link';
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
  const links = [
    { href: '/flights', label: 'Flights', active: pathname === '/' || pathname === '/flights' },
    { href: '/student-benefits', label: 'Student Benefits', active: pathname.startsWith('/student-benefits') || pathname === '/student-perks' },
    { href: '/travel-calculator', label: 'Travel Calculator', active: pathname === '/travel-calculator' },
    { href: '/miles-wallet', label: 'Miles Wallet', active: pathname === '/miles-wallet' },
    { href: '/travel-checklist', label: 'Travel Checklist', active: pathname === '/travel-checklist' },
  ];
  return <header className="site-header"><div className="container header-inner"><Brand /><nav className={menu ? 'main-nav mobile-open' : 'main-nav'} aria-label="Main navigation">{links.map(link => <Link className={link.active ? 'nav-active' : ''} href={link.href} key={link.label} aria-current={link.active ? 'page' : undefined} onClick={() => setMenu(false)}>{link.label}</Link>)}</nav><div className="header-actions"><button className="saved-button" onClick={() => setOpen(true)} aria-label={'Saved flights' + (saved.length ? ', ' + saved.length + ' saved' : '')}><Heart size={18} /><span>Saved</span>{saved.length > 0 && <b>{saved.length}</b>}</button><button className="mobile-menu icon-button" aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X size={22} /> : <Menu size={22} />}</button></div></div></header>;
}
export function Footer({ businessName }: { businessName?: string }) {
  return <footer className="footer"><div className="container footer-main"><div className="footer-brand"><Brand light /><p>Search flights. Compare student benefits.<br />Travel smarter.</p><span className="footer-tag"><Plane size={13} />Made for the student journey</span></div><div className="footer-links"><div><h3>Your travel tools</h3><Link href="/flights">Find a flight</Link><Link href="/student-benefits">Student Benefits</Link><Link href="/luggage-calculator">Luggage Calculator</Link><Link href="/travel-calculator">Travel Calculator</Link><Link href="/miles-wallet">Miles Wallet</Link><Link href="/travel-checklist">Travel Checklist</Link></div><div><h3>The small print</h3><Link href="/privacy">Privacy</Link><Link href="/terms">Terms of use</Link><Link href="/contact">Contact</Link><Link href="/#how-it-works">How booking works</Link></div></div><div className="footer-message"><span>YOUR NEXT CHAPTER</span><p>Starts with<br /><em>a plan.</em><ArrowUpRight size={40} /></p></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Flyora. {businessName ? 'Operated by ' + businessName + '.' : 'Go somewhere good.'}</span><span>Partner bookings may earn commission. Book and pay with the seller.</span></div></footer>;
}
export function SavedFlights() {
  const { saved, toggle, clear, open, setOpen } = useSaved();
  const [selected, setSelected] = useState<FlightOffer | null>(null);
  return <>{open && <Modal title="Your saved flights" onClose={() => setOpen(false)}><p className="muted saved-intro">Your shortlist stays in this browser. Saved fares are snapshots; check current prices and availability with the seller.</p>{saved.length > 0 && <button className="text-button" onClick={clear}>Clear all saved flights</button>}{saved.length === 0 ? <div className="saved-empty"><Heart size={38} /><h3>A little inspiration, saved.</h3><p>Tap the heart on a flight to keep it here.</p><Link href="/#search" className="button" onClick={() => setOpen(false)}>Find your flight<ArrowRight size={17} /></Link></div> : <div className="saved-list">{saved.map(offer => { const segments = offer.itineraries[0].segments; return <div className="saved-card" key={offer.id}><AirlineMark airline={airline(offer.airlineCode)} code={offer.airlineCode} size="small" /><div><strong>{city(segments[0].from)} <ArrowRight size={12} /> {city(segments.at(-1)!.to)}</strong><span>{offer.airlineName} · {dateLabel(segments[0].departure)}{offer.mode === 'demo' ? ' · demo' : offer.mode === 'test' ? ' · sandbox' : ''}</span></div><button className="saved-price" onClick={() => { setOpen(false); setSelected(offer); }} aria-label={'View saved ' + offer.airlineName + ' flight'}>{money(offer.price / offer.passengers, offer.currency)}<ArrowUpRight size={14} /></button><button className="icon-button" aria-label={'Remove saved ' + offer.airlineName + ' flight'} onClick={() => toggle(offer)}><X size={17} /></button></div>; })}</div>}</Modal>}{selected && <FlightDetail offer={selected} onClose={() => setSelected(null)} />}</>;
}
