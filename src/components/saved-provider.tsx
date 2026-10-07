'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { FlightOffer } from '@/lib/types';

const SavedContext = createContext<{ saved: FlightOffer[]; toggle: (offer: FlightOffer) => void; open: boolean; setOpen: (open: boolean) => void }>({ saved: [], toggle: () => {}, open: false, setOpen: () => {} });
function validSaved(value: unknown): value is FlightOffer {
  if (!value || typeof value !== 'object') return false;
  const offer = value as FlightOffer;
  return typeof offer.id === 'string' && typeof offer.airlineCode === 'string' && typeof offer.airlineName === 'string' && Number.isFinite(offer.price) && offer.price > 0 && typeof offer.currency === 'string' && /^[A-Z]{3}$/.test(offer.currency) && Number.isInteger(offer.passengers) && offer.passengers > 0 && !!offer.baggage && ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS'].includes(offer.cabin) && ['demo', 'test', 'live'].includes(offer.mode) && Array.isArray(offer.itineraries) && offer.itineraries.length > 0 && offer.itineraries.every(it => Number.isFinite(it.duration) && it.duration > 0 && Array.isArray(it.segments) && it.segments.length > 0 && it.segments.every(s => typeof s.from === 'string' && typeof s.to === 'string' && typeof s.departure === 'string' && typeof s.arrival === 'string' && !Number.isNaN(Date.parse(s.departure)) && !Number.isNaN(Date.parse(s.arrival)) && Number.isFinite(s.duration) && typeof s.carrier === 'string' && typeof s.flightNumber === 'string'));
}
export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<FlightOffer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('flyora:saved:v1');
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setSaved(parsed.filter(validSaved).slice(0, 20));
    } catch { /* A browser with disabled storage can still search flights. */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) try { localStorage.setItem('flyora:saved:v1', JSON.stringify(saved)); } catch { /* Saving remains available for the session. */ }
  }, [saved, loaded]);
  const toggle = (offer: FlightOffer) => setSaved(previous => previous.some(o => o.id === offer.id) ? previous.filter(o => o.id !== offer.id) : [offer, ...previous].slice(0, 20));
  return <SavedContext.Provider value={{ saved, toggle, open, setOpen }}>{children}</SavedContext.Provider>;
}
export function useSaved() { return useContext(SavedContext); }
