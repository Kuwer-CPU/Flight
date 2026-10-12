'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, ClipboardCheck, Globe2, Info, Pencil, Plus, Printer, Save, Trash2 } from 'lucide-react';
import { Modal } from './ui';
import {
  CHECKLIST_STORAGE_KEY, MAX_CHECKLIST_ITEMS, MAX_REMINDER_LENGTH,
  checklistCategories, checklistProfileError, checklistProgress, checklistToday,
  generateTravelChecklist, officialChecklistGuidance, readTravelChecklist, validReminderText,
} from '@/lib/travel-checklist';
import type { ChecklistCategory, ChecklistProfile, TravelChecklistState, TripPurpose } from '@/lib/travel-checklist';

const emptyProfile: ChecklistProfile = { departureCountry: '', destinationCountry: '', travelDate: '', universityStartDate: '', purpose: 'study' };
function customId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return 'custom-' + crypto.randomUUID();
  return 'custom-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
}

export function TravelChecklist() {
  const [profile, setProfile] = useState<ChecklistProfile>(emptyProfile);
  const [checklist, setChecklist] = useState<TravelChecklistState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [storageNotice, setStorageNotice] = useState('Your checklist stays in this browser. No account needed.');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<TravelChecklistState | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editError, setEditError] = useState('');
  const [customText, setCustomText] = useState('');
  const [customCategory, setCustomCategory] = useState<ChecklistCategory>('arrival');
  const [customError, setCustomError] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      const saved = readTravelChecklist(raw);
      // Hydrate browser-only storage after SSR; the matching initial render and loaded gate prevent premature writes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) { setChecklist(saved); setProfile(saved.profile); }
      else if (raw) setStorageNotice('The saved checklist could not be restored. You can create a fresh list.');
    } catch { setStorageNotice('Browser storage is unavailable. You can use the checklist for this visit; it will not persist after you leave.'); }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      if (checklist) localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checklist));
      else localStorage.removeItem(CHECKLIST_STORAGE_KEY);
    } catch {
      // This reports a failure from the external storage API, rather than deriving state from React inputs.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStorageNotice(checklist
        ? 'Browser storage is unavailable or full. Your latest changes are available for this visit only.'
        : 'Browser storage could not be cleared. A previously saved checklist may return after reload. Clear this website’s data in your browser settings to remove it.');
    }
  }, [checklist, loaded]);

  const updateProfile = <K extends keyof ChecklistProfile>(key: K, value: ChecklistProfile[K]) => {
    setProfile(previous => ({ ...previous, [key]: value })); setError('');
  };
  const replace = (next: TravelChecklistState) => {
    setChecklist(next); setPending(null); setEditing(null); setCustomError('');
  };
  const generate = (event: React.FormEvent) => {
    event.preventDefault();
    const problem = checklistProfileError(profile);
    if (problem) { setError(problem); return; }
    const next = generateTravelChecklist(profile);
    if (checklist) setPending(next); else replace(next);
  };
  const editReminder = (id: string) => {
    if (!validReminderText(editText)) { setEditError('Enter a reminder using 1–400 characters.'); return; }
    setChecklist(previous => previous ? { ...previous, items: previous.items.map(item => item.id === id ? { ...item, text: editText.trim() } : item) } : previous);
    setEditing(null); setEditError('');
  };
  const addReminder = (event: React.FormEvent) => {
    event.preventDefault();
    if (!checklist) return;
    if (checklist.items.length >= MAX_CHECKLIST_ITEMS) { setCustomError('Your checklist can hold up to 80 reminders. Remove an item before adding another.'); return; }
    if (!validReminderText(customText)) { setCustomError('Enter a reminder using 1–400 characters.'); return; }
    let id = customId();
    // A bounded list makes uniqueness possible even when a browser's random source repeats.
    for (let suffix = 0; checklist.items.some(item => item.id === id); suffix++) id = 'custom-' + Date.now().toString(36) + '-' + suffix;
    setChecklist(previous => previous ? { ...previous, items: [...previous.items, { id, category: customCategory, text: customText.trim(), completed: false }] } : previous);
    setCustomText(''); setCustomError('');
  };
  const clear = () => {
    setChecklist(null); setProfile(emptyProfile); setConfirmClear(false); setEditing(null);
    setCustomText(''); setCustomError(''); setError('');
  };
  const progress = checklistProgress(checklist?.items ?? []);
  const guidance = checklist ? officialChecklistGuidance(checklist.profile) : [];

  return <div className="checklist-tool">
    <div className="tool-note checklist-boundary"><Info size={19} /><p><strong>A plan you can adapt.</strong> These are general reminders, not immigration advice or a confirmed list of legal requirements. Check citizenship, residence, transit and current rules with official authorities. Do not enter passport numbers, student documents or other sensitive details.</p></div>
    <section className="tool-panel checklist-profile" aria-labelledby="checklist-profile-heading">
      <div className="checklist-section-heading"><Globe2 size={23} /><div><h2 id="checklist-profile-heading">Tell us about your trip</h2><p>Generate a starting list, then edit anything to fit your journey.</p></div></div>
      <form onSubmit={generate}>
        <div className="tool-form-grid checklist-fields">
          <label className="tool-field">Departure country<input required maxLength={80} autoComplete="off" placeholder="e.g. India" value={profile.departureCountry} onChange={event => updateProfile('departureCountry', event.target.value)} /></label>
          <label className="tool-field">Destination country<input required maxLength={80} autoComplete="off" placeholder="e.g. France" value={profile.destinationCountry} onChange={event => updateProfile('destinationCountry', event.target.value)} /></label>
          <label className="tool-field">Expected travel date<input type="date" required min={checklistToday()} value={profile.travelDate} onChange={event => updateProfile('travelDate', event.target.value)} /></label>
          <label className="tool-field">University start date <span className="checklist-optional">(optional)</span><input type="date" value={profile.universityStartDate} onChange={event => updateProfile('universityStartDate', event.target.value)} /></label>
          <label className="tool-field">Trip purpose<select value={profile.purpose} onChange={event => updateProfile('purpose', event.target.value as TripPurpose)}><option value="study">Studying abroad</option><option value="return-home">Going home</option><option value="holiday">Holiday</option><option value="other">Other travel</option></select></label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="tool-actions checklist-generate"><button className="button" type="submit" disabled={!loaded}><ClipboardCheck size={18} />Generate checklist</button>{checklist && <span>Changing this profile leaves your current list intact until you choose to replace it.</span>}</div>
      </form>
    </section>

    <p className="checklist-storage" role="status"><Save size={15} />{loaded ? storageNotice : 'Loading your browser checklist…'}</p>

    {checklist ? <section className="checklist-plan" aria-labelledby="checklist-heading">
      <div className="checklist-plan-heading"><div><span className="eyebrow">ONE LESS THING ON YOUR MIND</span><h2 id="checklist-heading">Your travel checklist</h2><p>{checklist.profile.departureCountry} → {checklist.profile.destinationCountry} · Travel planned for {checklist.profile.travelDate}</p></div><div className="checklist-controls"><button className="checklist-secondary-button" onClick={() => window.print()}><Printer size={16} />Print checklist</button><button className="checklist-secondary-button" onClick={() => setConfirmClear(true)}><Trash2 size={16} />Clear checklist</button></div></div>
      <div className="checklist-progress"><div><strong>{progress.completed} of {progress.total} complete</strong><span>{progress.percent}%</span></div><progress max="100" value={progress.percent} aria-label="Checklist completion" /></div>
      {checklist.profile.travelDate < checklistToday() && <p className="tool-note">Your saved travel date has passed. Review your reminders or generate a fresh checklist for your next journey.</p>}
      {checklist.profile.universityStartDate && checklist.profile.travelDate > checklist.profile.universityStartDate && <p className="tool-note">Your planned travel is after the university start date. Confirm your actual arrival and registration arrangements with the university.</p>}

      <div className="checklist-category-grid">{checklistCategories.map(category => {
        const items = checklist.items.filter(item => item.category === category.id);
        if (!items.length) return null;
        return <section className="checklist-category" key={category.id} aria-labelledby={'checklist-' + category.id}><div className="checklist-category-heading"><h3 id={'checklist-' + category.id}>{category.label}</h3><span>{items.filter(item => item.completed).length}/{items.length}</span></div><ul>{items.map(item => <li className={item.completed ? 'checklist-item is-complete' : 'checklist-item'} key={item.id}>
          <label className="checklist-item-label"><input type="checkbox" checked={item.completed} onChange={() => setChecklist(previous => previous ? { ...previous, items: previous.items.map(candidate => candidate.id === item.id ? { ...candidate, completed: !candidate.completed } : candidate) } : previous)} /><span>{item.text}</span></label>
          {editing === item.id ? <form className="checklist-edit" onSubmit={event => { event.preventDefault(); editReminder(item.id); }}><label className="tool-field">Reminder text<input autoFocus maxLength={MAX_REMINDER_LENGTH} value={editText} onChange={event => { setEditText(event.target.value); setEditError(''); }} /></label>{editError && <p className="form-error" role="alert">{editError}</p>}<div className="tool-actions"><button className="checklist-secondary-button" type="submit"><Check size={15} />Save reminder</button><button className="text-button" type="button" onClick={() => { setEditing(null); setEditError(''); }}>Cancel edit</button></div></form> : <div className="checklist-item-actions"><button className="icon-button" aria-label={'Edit reminder: ' + item.text} onClick={() => { setEditing(item.id); setEditText(item.text); setEditError(''); }}><Pencil size={15} /></button><button className="icon-button" aria-label={'Remove reminder: ' + item.text} onClick={() => setChecklist(previous => previous ? { ...previous, items: previous.items.filter(candidate => candidate.id !== item.id) } : previous)}><Trash2 size={15} /></button></div>}
        </li>)}</ul></section>;
      })}</div>
      {checklist.items.length === 0 && <p className="checklist-empty">Your list is empty. Add your own reminders below, or generate a new starting list.</p>}

      <form className="tool-panel checklist-add" onSubmit={addReminder}><h3>Make room for your own reminders</h3><div className="tool-form-grid"><label className="tool-field">New reminder<input maxLength={MAX_REMINDER_LENGTH} value={customText} placeholder="e.g. Collect my room keys" onChange={event => { setCustomText(event.target.value); setCustomError(''); }} /></label><label className="tool-field">Reminder category<select value={customCategory} onChange={event => setCustomCategory(event.target.value as ChecklistCategory)}>{checklistCategories.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label></div>{customError && <p className="form-error" role="alert">{customError}</p>}<button className="button button-small" type="submit" disabled={checklist.items.length >= MAX_CHECKLIST_ITEMS}><Plus size={16} />Add reminder</button><p>{checklist.items.length}/{MAX_CHECKLIST_ITEMS} reminders. Keep sensitive document numbers out of this list.</p></form>

      <aside className="tool-panel checklist-guidance" aria-labelledby="checklist-guidance-heading"><h3 id="checklist-guidance-heading">Check the official guidance</h3><p>Country fields do not establish your citizenship or eligibility. Use the destination embassy or government website for current entry and transit rules.</p>{guidance.length > 0 && <ul>{guidance.map(link => <li key={link.url}><span>{link.context}</span><a className="text-link" href={link.url} target="_blank" rel="noopener noreferrer">{link.label}<ArrowUpRight size={15} /></a></li>)}</ul>}<p className="checklist-guidance-note">These are known official entry points. Their current requirements have not been independently verified by Flyora. For other destinations, check the destination’s embassy or official government site.</p></aside>
    </section> : loaded && <div className="checklist-empty"><ClipboardCheck size={35} /><h2>Start with a little direction.</h2><p>Fill in your trip to build reminders for documents, university, baggage, accommodation and arrival.</p></div>}

    {pending && <Modal title="Replace this checklist?" onClose={() => setPending(null)}><p>Your edits, custom reminders and completion progress will be replaced with a fresh checklist for the profile above.</p><div className="tool-actions checklist-confirm"><button className="button" onClick={() => replace(pending)}>Replace checklist</button><button className="checklist-secondary-button" onClick={() => setPending(null)}>Keep current checklist</button></div></Modal>}
    {confirmClear && <Modal title="Clear checklist?" onClose={() => setConfirmClear(false)}><p>This removes the checklist and its saved trip profile from this browser. You can generate a new one at any time.</p><div className="tool-actions checklist-confirm"><button className="button" onClick={clear}>Clear checklist from browser</button><button className="checklist-secondary-button" onClick={() => setConfirmClear(false)}>Keep checklist</button></div></Modal>}
  </div>;
}
