'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Coins, LockKeyhole, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import {
  calculateRedemptionValue, createBrowserMilesWalletStore, isWalletDate, LOYALTY_PROGRAMS,
  MAX_WALLET_ENTRIES, MAX_WALLET_NOTES, MAX_WALLET_PROGRAM_NAME, WALLET_CURRENCIES,
  type MilesWalletEntry, type MilesWalletStore, type RedemptionValue, type WalletCurrency,
} from '@/lib/miles-wallet';

function displayDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value.length === 10 ? value + 'T12:00:00Z' : value));
}

function currencyAmount(value: number, currency: WalletCurrency): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function MilesWallet() {
  const [entries, setEntries] = useState<MilesWalletEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState('');
  const [storageNotice, setStorageNotice] = useState('');
  const [discardedData, setDiscardedData] = useState(false);
  const [status, setStatus] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [program, setProgram] = useState<string>(LOYALTY_PROGRAMS[0]);
  const [customName, setCustomName] = useState('');
  const [balance, setBalance] = useState('');
  const [expiry, setExpiry] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const store = useRef<MilesWalletStore | null>(null);
  const formHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let active = true;
    // Read the external browser store after hydration; cancel if this view unmounts.
    queueMicrotask(() => {
      if (!active) return;
      setToday(new Date().toISOString().slice(0, 10));
      try {
        store.current = createBrowserMilesWalletStore(window.localStorage);
        const loaded = store.current.read();
        setEntries(loaded.entries);
        setDiscardedData(loaded.discardedData);
      } catch {
        store.current = null;
        setStorageNotice('Browser storage is unavailable. Your wallet changes will last only while this tab is open and will be lost when you reload.');
      }
      setReady(true);
    });
    return () => { active = false; };
  }, []);

  function commitEntries(next: MilesWalletEntry[]): boolean {
    setEntries(next);
    setConfirmClear(false);
    if (!store.current) return false;
    try {
      if (next.length === 0) store.current.clear(); else store.current.write(next);
      return true;
    } catch {
      store.current = null;
      setStorageNotice('Browser storage could not be updated. Changes last only in this tab. Older saved entries may reappear after a reload; remove site data in your browser settings if you need to erase them.');
      return false;
    }
  }

  function resetForm() {
    setEditId(null); setProgram(LOYALTY_PROGRAMS[0]); setCustomName('');
    setBalance(''); setExpiry(''); setNotes(''); setFormError('');
  }

  function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) return;
    const name = (program === 'other' ? customName : program).trim();
    if (!name || name.length > MAX_WALLET_PROGRAM_NAME) { setFormError('Enter a program name of up to 100 characters.'); return; }
    const amount = Number(balance);
    if (!balance.trim() || !Number.isSafeInteger(amount) || amount < 0) { setFormError('Enter a whole-number balance of zero or more.'); return; }
    if (expiry && !isWalletDate(expiry)) { setFormError('Enter a valid expiration date, or leave it empty.'); return; }
    if (notes.length > MAX_WALLET_NOTES) { setFormError('Keep notes to 1,000 characters or fewer.'); return; }
    if (!editId && entries.length >= MAX_WALLET_ENTRIES) { setFormError('You can keep up to 50 program entries. Remove an entry before adding another.'); return; }
    const updated: MilesWalletEntry = {
      id: editId ?? (globalThis.crypto?.randomUUID?.() ?? `wallet-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`), programName: name, balance: amount, updatedAt: new Date().toISOString(),
      ...(expiry ? { expiresOn: expiry } : {}), ...(notes.trim() ? { notes: notes.trim() } : {}),
    };
    const saved = commitEntries(editId ? entries.map(entry => entry.id === editId ? updated : entry) : [...entries, updated]);
    setStatus(`${editId ? 'Program updated' : 'Program added'} ${saved ? 'in this browser' : 'for this tab only'}.`);
    resetForm();
  }

  function editEntry(entry: MilesWalletEntry) {
    setEditId(entry.id);
    const known = LOYALTY_PROGRAMS.some(name => name === entry.programName);
    setProgram(known ? entry.programName : 'other'); setCustomName(known ? '' : entry.programName);
    setBalance(String(entry.balance)); setExpiry(entry.expiresOn ?? ''); setNotes(entry.notes ?? '');
    setFormError(''); setStatus('');
    formHeading.current?.focus();
  }

  function removeEntry(entry: MilesWalletEntry) {
    const saved = commitEntries(entries.filter(row => row.id !== entry.id));
    if (editId === entry.id) resetForm();
    setStatus(`${entry.programName} removed ${saved ? 'from this browser' : 'for this tab only'}.`);
  }

  const soon = today ? new Date(new Date(today + 'T12:00:00Z').getTime() + 90 * 86_400_000).toISOString().slice(0, 10) : '';
  const expiryCount = entries.filter(entry => entry.expiresOn && entry.expiresOn >= today && entry.expiresOn <= soon).length;
  const expiredCount = entries.filter(entry => entry.expiresOn && entry.expiresOn < today).length;

  return <div className="miles-wallet" aria-busy={!ready}>
    <div className="wallet-topline"><span className="wallet-manual-tag"><Pencil size={13} />Manually entered · stored in this browser</span><p>No connected airline accounts. Update each balance when you check your loyalty program.</p></div>
    {storageNotice && <p className="wallet-storage-notice" role="status">{storageNotice}</p>}
    {discardedData && <p className="wallet-storage-notice" role="status">Some saved wallet data was invalid and could not be loaded. Valid entries are still shown. Check your balances with each airline.</p>}
    <div className="wallet-stats" aria-label="Wallet overview">
      <div className="wallet-stat"><span>Program entries</span><strong>{entries.length}</strong><p>Every balance stays separate.</p></div>
      <div className="wallet-stat"><span>Expiring in 90 days</span><strong>{expiryCount}</strong><p>Based on dates you enter.</p></div>
      <div className="wallet-stat"><span>Past entered expiry</span><strong>{expiredCount}</strong><p>Confirm status with your airline.</p></div>
    </div>
    <div className="wallet-layout">
      <section className="wallet-panel" aria-labelledby="wallet-balances-heading">
        <div className="wallet-panel-heading"><div><h2 id="wallet-balances-heading">Your loyalty balances</h2><p>Different programs have different rules. Their points are not added together.</p></div><Wallet size={25} /></div>
        {!ready ? <p role="status" className="muted">Loading your wallet…</p> : entries.length === 0 ? <div className="wallet-empty"><Coins size={35} /><h3>A little mileage goes a long way.</h3><p>Add a balance from your airline account to start your personal record. No airline login is needed here.</p></div> : <div className="wallet-list">{entries.map(entry => <article className="wallet-entry" key={entry.id}>
          <div className="wallet-entry-heading"><h3>{entry.programName}</h3><span>Manual balance</span></div>
          <div className="wallet-balance"><strong>{entry.balance.toLocaleString('en-GB')}</strong><span>miles / points</span></div>
          <div className="wallet-dates"><span>Updated <time dateTime={entry.updatedAt}>{displayDate(entry.updatedAt)}</time></span><span className={entry.expiresOn && entry.expiresOn < today ? 'wallet-expired' : ''}>{entry.expiresOn ? <>{entry.expiresOn < today ? 'Entered expiry passed: ' : 'Entered expiry: '}<time dateTime={entry.expiresOn}>{displayDate(entry.expiresOn)}</time></> : 'No expiry recorded'}</span></div>
          {entry.notes && <p className="wallet-entry-notes">{entry.notes}</p>}
          <div className="wallet-entry-actions"><button type="button" aria-label={'Edit ' + entry.programName} onClick={() => editEntry(entry)}><Pencil size={13} />Edit</button><button type="button" aria-label={'Remove ' + entry.programName} onClick={() => removeEntry(entry)}><Trash2 size={13} />Remove</button></div>
        </article>)}</div>}
        {entries.length > 0 && <div className="wallet-clear">{confirmClear ? <><span className="wallet-clear-confirm">Remove every wallet entry from this browser?</span><button className="text-button" type="button" onClick={() => { const saved = commitEntries([]); resetForm(); setStatus(saved ? 'All wallet entries cleared from this browser.' : 'Wallet cleared for this tab only. Browser storage could not be erased.'); }}>Yes, clear my wallet</button><button className="text-button" type="button" onClick={() => setConfirmClear(false)}>Keep entries</button></> : <button className="text-button" type="button" onClick={() => setConfirmClear(true)}>Clear all wallet entries</button>}</div>}
        <p className="wallet-status" role="status" aria-live="polite">{status}</p>
      </section>
      <section className="wallet-panel" aria-labelledby="wallet-entry-heading">
        <div className="wallet-panel-heading"><div><h2 id="wallet-entry-heading" ref={formHeading} tabIndex={-1}>{editId ? 'Edit your program' : 'Add a loyalty program'}</h2><p>Copy the balance from your airline account. Never enter passwords or account numbers.</p></div><Plus size={23} /></div>
        <form onSubmit={saveEntry}>
          <fieldset className="wallet-form" disabled={!ready}>
            <label className="wallet-field">Loyalty program<select value={program} onChange={event => setProgram(event.target.value)}>{LOYALTY_PROGRAMS.map(name => <option key={name}>{name}</option>)}<option value="other">Other program</option></select></label>
            {program === 'other' && <label className="wallet-field">Program name<input value={customName} onChange={event => setCustomName(event.target.value)} maxLength={MAX_WALLET_PROGRAM_NAME} required autoComplete="off" /></label>}
            <label className="wallet-field">Miles or points balance<input type="number" inputMode="numeric" min="0" step="1" max={Number.MAX_SAFE_INTEGER} value={balance} onChange={event => setBalance(event.target.value)} required /><small>Enter the current balance manually. Zero is fine.</small></label>
            <label className="wallet-field">Expiration date (optional)<input type="date" value={expiry} onChange={event => setExpiry(event.target.value)} /><small>Record the date your program shows. Expiration rules can depend on activity.</small></label>
            <label className="wallet-field">Notes (optional)<textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={MAX_WALLET_NOTES} rows={3} placeholder="A reminder for your next trip" /><small>Keep sensitive personal information out of notes.</small></label>
            {formError && <p className="wallet-error" role="alert">{formError}</p>}
            <div className="wallet-form-actions"><button className="button" type="submit">{editId ? 'Save program changes' : 'Add program'}<ArrowRight size={16} /></button>{editId && <button className="text-button" type="button" onClick={resetForm}>Cancel editing</button>}</div>
          </fieldset>
        </form>
      </section>
    </div>
    <div className="wallet-privacy"><LockKeyhole size={16} /><p>Your entries are stored locally on this browser and device, without encryption. They are not uploaded to Flyora or synced with an airline or another device. Anyone using this browser profile may see them. Clearing site data removes the wallet. Use “Clear all wallet entries” on a shared device. <a href="/privacy">Read the privacy notice.</a></p></div>
    <RedemptionCalculator />
  </div>;
}

function RedemptionCalculator() {
  const [currency, setCurrency] = useState<WalletCurrency>('EUR');
  const [cash, setCash] = useState('');
  const [miles, setMiles] = useState('');
  const [taxes, setTaxes] = useState('');
  const [fees, setFees] = useState('');
  const [result, setResult] = useState<RedemptionValue | null>(null);
  const [error, setError] = useState('');

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      if (!cash.trim() || !miles.trim() || !taxes.trim()) throw new Error('Enter a cash fare, required miles, and award taxes. Enter zero if there are no taxes.');
      setResult(calculateRedemptionValue({ cashPrice: Number(cash), milesRequired: Number(miles), awardTaxes: Number(taxes), redemptionFees: fees.trim() ? Number(fees) : 0, currency }));
    } catch (problem) {
      setResult(null); setError(problem instanceof Error ? problem.message : 'Check your values and try again.');
    }
  }

  function clearResult() { setResult(null); setError(''); }

  return <section className="wallet-panel wallet-redemption" aria-labelledby="redemption-heading">
    <h2 id="redemption-heading">Cash or miles?</h2><p className="wallet-redemption-intro">Estimate the value of a redemption using prices you enter. Compare the same journey, cabin, baggage and ticket conditions in one currency. This does not check award availability.</p>
    <div className="wallet-redemption-layout">
      <form className="wallet-form" onSubmit={calculate}>
        <label className="wallet-field">Comparison currency<select value={currency} onChange={event => { setCurrency(event.target.value as WalletCurrency); clearResult(); }}>{WALLET_CURRENCIES.map(code => <option key={code}>{code}</option>)}</select></label>
        <div className="wallet-form-row"><label className="wallet-field">Comparable cash ticket price<input type="number" inputMode="decimal" min="0" max="1000000000" step="0.01" required value={cash} onChange={event => { setCash(event.target.value); clearResult(); }} /></label><label className="wallet-field">Miles required for award<input type="number" inputMode="numeric" min="1" max={Number.MAX_SAFE_INTEGER} step="1" required value={miles} onChange={event => { setMiles(event.target.value); clearResult(); }} /></label></div>
        <div className="wallet-form-row"><label className="wallet-field">Award taxes and surcharges<input type="number" inputMode="decimal" min="0" max="1000000000" step="0.01" required value={taxes} onChange={event => { setTaxes(event.target.value); clearResult(); }} /></label><label className="wallet-field">Additional redemption fees (optional)<input type="number" inputMode="decimal" min="0" max="1000000000" step="0.01" value={fees} onChange={event => { setFees(event.target.value); clearResult(); }} /><small>Leave empty if no additional fee applies.</small></label></div>
        {error && <p className="wallet-error" role="alert">{error}</p>}
        <button className="button" type="submit">Estimate redemption value<ArrowRight size={16} /></button>
      </form>
      <div className={'wallet-valuation' + (result ? '' : ' wallet-value-empty')} aria-live="polite" aria-atomic="true">
        {result ? <><span className="wallet-valuation-label">ILLUSTRATIVE VALUE · MANUALLY ENTERED PRICES</span><h3>{result.valuePerMile.toLocaleString('en-GB', { minimumFractionDigits: 4, maximumFractionDigits: 6 })} {result.currency} per mile</h3><p className="wallet-valuation-sub">{result.minorUnitsPerMile.toLocaleString('en-GB', { maximumFractionDigits: 4 })} {result.currency === 'INR' ? 'paise' : result.currency === 'GBP' ? 'pence' : 'cents'} per mile / point</p><dl><div><dt>Comparable cash fare</dt><dd>{currencyAmount(result.cashPrice, result.currency)}</dd></div><div><dt>Award taxes and fees</dt><dd>{currencyAmount(result.awardCost, result.currency)}</dd></div><div><dt>Cash difference before miles</dt><dd>{currencyAmount(result.netCashValue, result.currency)}</dd></div></dl>{result.netCashValue < 0 && <p className="wallet-negative-note">The entered award taxes and fees exceed the cash fare. This estimate gives a negative redemption value.</p>}{result.netCashValue === 0 && <p className="wallet-negative-note">The entered award costs equal the cash fare. This estimate gives no cash difference for your miles.</p>}<p className="wallet-valuation-note">Illustrative valuation only, not a guaranteed saving or live award offer. Check availability, total charges and loyalty rules with the airline.</p></> : <><span className="wallet-valuation-label">YOUR PERSONAL COMPARISON</span><h3>Give your miles a little context.</h3><p>Enter a cash quote and an award quote to see the estimated value per mile. No example fares or balances are filled in.</p></>}
      </div>
    </div>
    <p className="wallet-formula">Calculation: (comparable cash fare − award taxes − additional redemption fees) ÷ miles required. Estimates are not stored in your wallet.</p>
  </section>;
}
