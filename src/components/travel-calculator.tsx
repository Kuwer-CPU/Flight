'use client';

import { useMemo, useRef, useState } from 'react';
import { Calculator, CheckCircle2, CircleHelp, FlaskConical, Luggage, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { money } from '@/lib/search';
import { compareTravelCosts, hypotheticalTravelOptions, newTravelOption, TRAVEL_CURRENCIES, type TravelCostField, type TravelCostOption, type TravelCurrency } from '@/lib/travel-cost';

const expenseFields = [
  { key: 'ticketPrice', label: 'Ticket price', hint: 'The full ticket quote for this option.' },
  { key: 'transfer', label: 'Airport transfer', hint: 'Bus, train, taxi or another airport transfer.' },
  { key: 'insurance', label: 'Travel insurance', hint: 'Only the insurance you plan to purchase.' },
  { key: 'other', label: 'Other costs', hint: 'Meals, seat selection or other planned charges.' },
] as const;
const tableCosts = [
  ['ticketPrice', 'Ticket'], ['extraBagCost', 'Extra bag'], ['transfer', 'Transfer'], ['insurance', 'Insurance'], ['other', 'Other'],
] as const;

export function TravelCalculator() {
  const [options, setOptions] = useState<TravelCostOption[]>(() => [newTravelOption('option-1', 'Option A'), newTravelOption('option-2', 'Option B')]);
  const [currency, setCurrency] = useState<TravelCurrency>('EUR');
  const [illustration, setIllustration] = useState(false);
  const [currencyNotice, setCurrencyNotice] = useState('');
  const nextId = useRef(3);
  const comparison = useMemo(() => compareTravelCosts(options), [options]);
  const completeCount = comparison.rows.filter(row => row.result.status === 'complete').length;
  const lowestNames = comparison.rows.filter(row => comparison.lowestIds.includes(row.option.id)).map(row => row.option.name.trim() || 'Unnamed option');
  const update = (id: string, field: keyof TravelCostOption, value: string) => setOptions(previous => previous.map(option => option.id === id ? {
    ...option, [field]: value, ...(field === 'extraKg' && value.trim() !== '' && Number(value) === 0 ? { extraBagCost: '' } : {}),
  } : option));
  const changeCurrency = (value: TravelCurrency) => {
    setCurrency(value);
    setOptions(previous => previous.map(option => ({ ...option, ticketPrice: '', extraBagCost: '', transfer: '', insurance: '', other: '' })));
    setIllustration(false);
    setCurrencyNotice('Currency changed to ' + value + '. Prices were cleared. Enter all quotes in ' + value + '; no conversion was applied.');
  };
  const reset = () => {
    setOptions([newTravelOption('option-1', 'Option A'), newTravelOption('option-2', 'Option B')]);
    nextId.current = 3; setIllustration(false); setCurrencyNotice('');
  };

  return <div className="travel-calculator">
    <div className="calculator-toolbar">
      <label className="tool-label calculator-currency" htmlFor="calculator-currency">One currency for every option<select id="calculator-currency" value={currency} onChange={event => changeCurrency(event.target.value as TravelCurrency)}>{TRAVEL_CURRENCIES.map(value => <option key={value} value={value}>{value}</option>)}</select><small>No currency conversion. Changing currency clears prices.</small></label>
      <div className="tool-actions calculator-example-actions"><button className="text-button" onClick={() => { setOptions(hypotheticalTravelOptions()); setCurrency('EUR'); setIllustration(true); setCurrencyNotice(''); }}><FlaskConical size={15} aria-hidden="true" />Load hypothetical example</button><button className="text-button" onClick={reset}><RotateCcw size={14} aria-hidden="true" />Clear all</button></div>
    </div>
    <p className="tool-notice calculator-manual-notice"><CircleHelp size={18} aria-hidden="true" /><span>Manual calculator. These are your entered costs, not live flight offers. Use quotes for the same travelers and journey. Blank transfer, insurance and other costs count as 0 only if you do not expect those charges.</span></p>
    {currencyNotice && <p className="calculator-currency-notice" role="status">{currencyNotice}</p>}
    {illustration && <div className="calculator-example-notice"><FlaskConical size={18} aria-hidden="true" /><div><strong>Hypothetical illustration — not a bookable fare.</strong><p>A 480 ticket plus a 110 bag costs 590, compared with a 530 ticket including the needed baggage. No airline or student benefit is claimed. Confirm student eligibility and the seller’s actual baggage allowance before entering a student quote.</p></div></div>}

    <div className="calculator-options">
      {comparison.rows.map(({ option, result }, index) => {
        const touched = option.ticketPrice.trim() !== '' || option.extraKg.trim() !== '';
        const extraRequired = result.extraKg !== undefined && result.extraKg > 0;
        const issue = (field: TravelCostField) => result.issues.find(value => value.field === field && (value.kind === 'invalid' || touched));
        const input = (field: TravelCostField, label: string, hint: string, unit: string, required = false) => {
          const problem = issue(field);
          const id = option.id + '-' + field;
          return <div className={'calculator-field' + (problem?.kind === 'invalid' ? ' calculator-field-invalid' : '')}>
            <label className="tool-label" htmlFor={id}>{label}{required && <span className="calculator-required">Required</span>}</label>
            <div className="calculator-input"><span aria-hidden="true">{unit}</span><input id={id} type="text" inputMode="decimal" autoComplete="off" value={option[field]} onChange={event => update(option.id, field, event.target.value)} aria-describedby={id + '-hint' + (problem ? ' ' + id + '-issue' : '')} aria-invalid={problem?.kind === 'invalid' || undefined} aria-required={required || undefined} placeholder={required ? 'Enter amount' : '0 if none'} /></div>
            <small id={id + '-hint'}>{hint}</small>{problem && <p className="calculator-field-issue" id={id + '-issue'}>{problem.message}</p>}
          </div>;
        };
        return <fieldset className="tool-panel calculator-option" key={option.id}>
          <legend>Option {index + 1}</legend>
          <div className="calculator-option-header"><div><label className="tool-label" htmlFor={option.id + '-name'}>Option name</label><input id={option.id + '-name'} className="calculator-option-name" aria-label={'Option ' + (index + 1) + ' name'} maxLength={60} value={option.name} onChange={event => update(option.id, 'name', event.target.value)} /></div>{options.length > 2 && <button className="icon-button" aria-label={'Remove option ' + (index + 1)} onClick={() => setOptions(previous => previous.filter(value => value.id !== option.id))}><Trash2 size={17} aria-hidden="true" /></button>}</div>
          <div className="tool-fields calculator-fields">{input('ticketPrice', 'Ticket price', 'Full quote for all travelers in this option.', currency, true)}
            <div className="calculator-baggage-heading"><Luggage size={16} aria-hidden="true" /><span>Checked baggage</span></div>
            <div className="calculator-baggage-fields">{input('includedKg', 'Standard baggage included', 'Optional: enter the quoted weight allowance.', 'kg')}{input('extraKg', 'Additional baggage needed', 'Enter 0 if the included allowance is enough.', 'kg', true)}</div>
            {extraRequired && input('extraBagCost', 'Quoted extra-bag charge', 'Total quoted charge for all additional baggage, not a price per kg.', currency, true)}
            <div className="calculator-baggage-note">A student allowance applies only when your seller confirms your eligibility and that booking’s baggage terms.</div>
            {expenseFields.filter(field => field.key !== 'ticketPrice').map(field => <div key={field.key}>{input(field.key, field.label, field.hint, currency)}</div>)}
          </div>
          <div className={'calculator-option-total calculator-status-' + result.status}><span>{result.status === 'complete' ? 'Total entered cost' : result.status === 'invalid' ? 'Check entered values' : 'Total pending'}</span><strong>{result.totalCents === undefined ? '—' : money(result.totalCents / 100, currency)}</strong>{result.status === 'complete' && comparison.lowestIds.includes(option.id) && completeCount >= 2 && <small><CheckCircle2 size={13} aria-hidden="true" />Lowest complete entered cost</small>}{result.status === 'pending' && <small>Waiting for ticket or baggage details.</small>}</div>
        </fieldset>;
      })}
    </div>
    <div className="calculator-add-row"><button className="button button-small" disabled={options.length >= 4} onClick={() => { const id = nextId.current++; setOptions(previous => previous.length < 4 ? [...previous, newTravelOption('option-' + id, 'Option ' + String.fromCharCode(65 + previous.length))] : previous); }}><Plus size={17} aria-hidden="true" />Add travel option</button><span>Compare 2–4 options in the same currency.</span></div>

    <section className="tool-panel calculator-comparison" aria-labelledby="calculator-comparison-title">
      <div className="calculator-comparison-heading"><div><span className="tool-tag">Your full travel cost</span><h2 id="calculator-comparison-title">Compare beyond the ticket.</h2><p>Pending or invalid options cannot be the lowest complete cost.</p></div><Calculator size={29} aria-hidden="true" /></div>
      <div className="calculator-table-scroll" tabIndex={0} role="region" aria-label="Travel cost comparison; scroll horizontally on smaller screens"><table className="calculator-table"><caption className="sr-only">All amounts in {currency}, using manually entered quotes for the same travelers.</caption><thead><tr><th scope="col">Travel option</th>{tableCosts.map(([, title]) => <th scope="col" key={title}>{title}</th>)}<th scope="col">Total ({currency})</th></tr></thead><tbody>{comparison.rows.map(({ option, result }, index) => <tr key={option.id} className={result.status === 'complete' && comparison.lowestIds.includes(option.id) && completeCount >= 2 ? 'calculator-lowest-row' : ''}><th scope="row">{option.name.trim() || 'Option ' + (index + 1)}<small>{result.status === 'complete' ? 'Complete entered costs' : result.status === 'invalid' ? 'Check values' : 'Pending details'}</small></th>{tableCosts.map(([field]) => <td key={field}>{result.costs[field] === undefined ? (result.issues.some(issue => issue.field === field && issue.kind === 'invalid') ? 'Check value' : 'Pending') : money(result.costs[field]! / 100, currency)}</td>)}<td><strong>{result.totalCents === undefined ? (result.status === 'invalid' ? 'Check values' : 'Pending') : money(result.totalCents / 100, currency)}</strong></td></tr>)}</tbody></table></div>
      <div className="calculator-result" role="status" aria-live="polite">{comparison.lowestCents === undefined ? <p>Add complete quotes to see the lowest entered cost.</p> : completeCount < 2 ? <p>One option totals <strong>{money(comparison.lowestCents / 100, currency)}</strong>. Complete another option to compare.</p> : <p><CheckCircle2 size={18} aria-hidden="true" /><span><strong>{lowestNames.join(' and ')}</strong> {lowestNames.length > 1 ? 'share the lowest complete entered cost' : 'has the lowest complete entered cost'}: <strong>{money(comparison.lowestCents / 100, currency)}</strong>.{completeCount < options.length && ' Other options still need complete, valid costs.'}</span></p>}</div>
      <p className="calculator-final-note">This estimate covers only the costs you enter; amounts round to two decimal places before adding. Confirm the currency, traveler count, student conditions, taxes and final payable price with your chosen seller. Your entries stay on this page and are not saved or sent to a provider.</p>
    </section>
  </div>;
}
