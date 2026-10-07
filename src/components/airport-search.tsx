'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, PlaneLanding, PlaneTakeoff } from 'lucide-react';
import { airport, airportLabel, searchAirports } from '@/lib/airports';
import type { Airport } from '@/lib/types';

export function AirportSearch({ direction, value, onChange }: { direction: 'departure' | 'arrival'; value: string; onChange: (code: string) => void }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [entry, setEntry] = useState(() => ({ code: value, text: airportLabel(airport(value)), editing: false }));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const selected = airport(value);
  const text = entry.code === value ? entry.text : airportLabel(selected);
  const editing = entry.code === value && entry.editing;
  const options = useMemo(() => searchAirports(editing ? text : ''), [editing, text]);
  const listId = id + '-list';
  const label = direction === 'departure' ? 'Departure airport' : 'Arrival airport';
  const Icon = direction === 'departure' ? PlaneTakeoff : PlaneLanding;
  useEffect(() => { if (open && active >= 0) document.getElementById(id + '-option-' + active)?.scrollIntoView({ block: 'nearest' }); }, [active, open, id]);
  function choose(a: Airport) {
    setEntry({ code: a.code, text: airportLabel(a), editing: false }); setOpen(false); setActive(-1); onChange(a.code);
  }
  return <div className={'search-field airport-field airport-search' + (open ? ' airport-search-open' : '')}>
    <label htmlFor={id} className="field-label"><Icon size={15} />{direction === 'departure' ? 'From' : 'To'}</label>
    <input ref={input} id={id} type="text" role="combobox" aria-label={label} aria-autocomplete="list" aria-expanded={open}
      aria-controls={open ? listId : undefined} aria-activedescendant={open && active >= 0 ? id + '-option-' + active : undefined}
      aria-describedby={id + '-hint'} autoComplete="off" spellCheck={false} required placeholder="City or airport code"
      value={text} onFocus={() => { setOpen(true); setActive(-1); input.current?.select(); }}
      onBlur={() => { setOpen(false); setActive(-1); }}
      onChange={e => { setEntry({ code: '', text: e.target.value, editing: true }); setOpen(true); setActive(-1); onChange(''); }}
      onKeyDown={e => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault(); setOpen(true);
          setActive(previous => options.length ? e.key === 'ArrowDown' ? (previous + 1) % options.length : previous <= 0 ? options.length - 1 : previous - 1 : -1);
        } else if (e.key === 'Enter' && open && active >= 0 && options[active]) {
          e.preventDefault(); choose(options[active]);
        } else if (e.key === 'Enter' && open && editing) {
          // An exact code is unambiguous; city/country names still require an explicit airport choice.
          e.preventDefault(); const exact = airport(text.trim()); if (exact) choose(exact); else setActive(options.length ? 0 : -1);
        } else if (e.key === 'Escape' && open) { e.preventDefault(); setOpen(false); setActive(-1); }
      }} />
    <span className="field-hint" id={id + '-hint'}>{selected ? selected.name : 'Choose an airport from the suggestions'}</span>
    {open && <div className="airport-dropdown"><div className="airport-search-tip">{editing ? 'Matching airports worldwide' : 'Popular airports worldwide'}<span>City · airport · country · code</span></div><ul id={listId} role="listbox" aria-label={label + ' suggestions'}>{options.map((a, index) => <li key={a.code} id={id + '-option-' + index} role="option" aria-selected={active === index} className={active === index ? 'airport-option-active' : ''}
      onPointerDown={e => e.preventDefault()} onClick={() => choose(a)} onPointerMove={() => setActive(index)}>
      <span className="airport-option-code">{a.code}</span><span className="airport-option-copy"><strong>{a.city}<small>{a.country}</small></strong><span>{a.name}</span></span>{value === a.code && <Check size={15} aria-label="Selected airport" />}
    </li>)}</ul>{!options.length && <p className="airport-no-results" role="status">No airports found. Try a city, country or three-letter airport code.</p>}<span className="sr-only" role="status">{options.length > 0 ? options.length + ' suggestions available. Use arrow keys and Enter to choose.' : ''}</span></div>}
  </div>;
}
