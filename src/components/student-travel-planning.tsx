'use client';
import { useState } from 'react';
import { GraduationCap, Luggage } from 'lucide-react';

function wholeNumber(value: string, minimum: number, maximum: number) {
  if (!value.trim()) return undefined;
  const number = Number(value);
  return Number.isInteger(number) && number >= minimum && number <= maximum ? number : undefined;
}

/** Local planning inputs only. They never submit, prefill or alter the partner search. */
export function StudentTravelPlanning() {
  const [age, setAge] = useState('');
  const [needed, setNeeded] = useState('');
  const [included, setIncluded] = useState('');
  const studentAge = wholeNumber(age, 16, 99);
  const neededKg = wholeNumber(needed, 0, 60);
  const includedKg = wholeNumber(included, 0, 120);
  const invalidAge = age !== '' && studentAge === undefined;
  const invalidNeeded = needed !== '' && neededKg === undefined;
  const invalidIncluded = included !== '' && includedKg === undefined;
  const extraKg = neededKg === undefined || includedKg === undefined ? undefined : Math.max(0, neededKg - includedKg);

  return <div className="tool-panel student-travel-planning">
    <fieldset className="student-planning-fields"><legend><GraduationCap size={20} aria-hidden="true" />Your student and baggage notes</legend>
      <p>Use your own plans and a seller’s quoted allowance. These inputs do not change the flight search or confirm student eligibility.</p>
      <div className="tool-fields">
        <label className="tool-label" htmlFor="student-planning-age">Student age (optional)<input id="student-planning-age" type="number" min="16" max="99" step="1" inputMode="numeric" value={age} onChange={event => setAge(event.target.value)} aria-invalid={invalidAge || undefined} aria-describedby="student-planning-age-note" placeholder="Your age" /><small id="student-planning-age-note">{invalidAge ? 'Enter a whole-number age from 16 to 99.' : 'Check the airline’s age limits, registration and proof-of-study requirements.'}</small></label>
        <label className="tool-label" htmlFor="student-planning-needed">Checked baggage needed (kg)<input id="student-planning-needed" type="number" min="0" max="60" step="1" inputMode="numeric" value={needed} onChange={event => setNeeded(event.target.value)} aria-invalid={invalidNeeded || undefined} aria-describedby="student-planning-needed-note" placeholder="Enter your weight" /><small id="student-planning-needed-note">{invalidNeeded ? 'Enter a whole-number weight from 0 to 60 kg.' : 'The checked luggage you expect to bring.'}</small></label>
        <label className="tool-label" htmlFor="student-planning-included">Quoted included baggage (kg)<input id="student-planning-included" type="number" min="0" max="120" step="1" inputMode="numeric" value={included} onChange={event => setIncluded(event.target.value)} aria-invalid={invalidIncluded || undefined} aria-describedby="student-planning-included-note" placeholder="Check your seller’s quote" /><small id="student-planning-included-note">{invalidIncluded ? 'Enter a whole-number allowance from 0 to 120 kg.' : 'Enter a confirmed weight allowance. Check piece-based allowances with the airline.'}</small></label>
      </div>
    </fieldset>
    <div className="student-baggage-estimate" role="status" aria-live="polite"><Luggage size={22} aria-hidden="true" /><div><strong>{extraKg === undefined ? 'Your baggage estimate' : extraKg === 0 ? 'Your entered allowance covers your entered needs.' : extraKg + ' kg beyond your entered allowance.'}</strong><p>{extraKg === undefined ? 'Enter both baggage weights to estimate how much extra you need to arrange.' : 'Check the price and conditions with the seller. A student extra applies only when the airline confirms that fare and your eligibility.'}</p></div></div>
  </div>;
}
