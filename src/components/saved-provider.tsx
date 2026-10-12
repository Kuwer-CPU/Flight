'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { FlightOffer } from '@/lib/types';
import { readSavedFlights } from '@/lib/saved-flights';

const SavedContext = createContext<{ saved: FlightOffer[]; toggle: (offer: FlightOffer) => void; clear: () => void; open: boolean; setOpen: (open: boolean) => void }>({ saved: [], toggle: () => {}, clear: () => {}, open: false, setOpen: () => {} });
export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<FlightOffer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('flyora:saved:v1');
      setSaved(readSavedFlights(raw));
    } catch { /* A browser with disabled storage can still search flights. */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) try { if (saved.length) localStorage.setItem('flyora:saved:v1', JSON.stringify(saved)); else localStorage.removeItem('flyora:saved:v1'); } catch { /* Saving remains available for the session. */ }
  }, [saved, loaded]);
  const toggle = (offer: FlightOffer) => setSaved(previous => previous.some(o => o.id === offer.id) ? previous.filter(o => o.id !== offer.id) : [offer, ...previous].slice(0, 20));
  return <SavedContext.Provider value={{ saved, toggle, clear: () => setSaved([]), open, setOpen }}>{children}</SavedContext.Provider>;
}
export function useSaved() { return useContext(SavedContext); }
