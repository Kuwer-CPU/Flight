'use client';
import { useEffect, useRef } from 'react';
import { X, Plane, ArrowUpRight } from 'lucide-react';
import type { Airline } from '@/lib/airlines';
import type { DataMode, FlightConnection } from '@/lib/types';

export function Brand({ light = false }: { light?: boolean }) {
  return <a href="/" className={'brand' + (light ? ' brand-light' : '')} aria-label="Flyora home"><span className="brand-icon"><Plane size={22} strokeWidth={2.4} /></span>flyora<span className="brand-dot">.</span></a>;
}
export function AirlineMark({ airline, name, code, size = 'normal' }: { airline?: Airline; name?: string; code?: string; size?: 'normal' | 'small' }) {
  return <span className={'airline-mark airline-' + size} style={{ color: 'color-mix(in srgb, ' + (airline?.color ?? '#275854') + ' 70%, #183329)', backgroundColor: (airline?.color ?? '#275854') + '0d' }} aria-hidden="true">{airline?.code ?? code ?? name?.slice(0, 2)}<Plane size={size === 'small' ? 12 : 16} /></span>;
}
export function ModeNotice({ mode, compact = false }: { mode: DataMode; compact?: boolean }) {
  if (mode === 'live') return <span className="live-label"><span />Live flight prices</span>;
  return <div className={'mode-notice' + (compact ? ' mode-compact' : '')}><span className="mode-dot" /><span><strong>{mode === 'demo' ? 'Preview mode' : 'Provider sandbox'}</strong>{compact ? ' · sample fares' : mode === 'demo' ? ' — explore the experience with sample flights. These fares cannot be booked.' : ' — these are test fares, not production tickets.'}</span></div>;
}
export function ConnectionNotice({ connection }: { connection: FlightConnection }) {
  if (connection.status === 'demo') return <ModeNotice mode="demo" compact />;
  if (connection.status === 'missing-credentials' || connection.status === 'invalid-configuration') return <div className="mode-notice connection-notice" role="status"><span className="mode-dot" /><span><strong>Flight search is not connected yet.</strong> Prices will appear once the service is connected.</span></div>;
  if (connection.mode === 'test') return <ModeNotice mode="test" compact />;
  return <span className="live-label"><span />Live flight search · prices checked when you search</span>;
}
export function Modal({ children, title, onClose, wide = false }: { children: React.ReactNode; title: string; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; dialog?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} className={'modal' + (wide ? ' modal-wide' : '')} aria-label={title} onCancel={(e) => { e.preventDefault(); closeRef.current(); }} onClick={e => { if (e.target === ref.current) onClose(); }}>
    <div className="modal-inner"><div className="modal-header"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={22} /></button></div>{children}</div>
  </dialog>;
}
export function ExternalArrow() { return <ArrowUpRight size={16} aria-hidden="true" />; }
