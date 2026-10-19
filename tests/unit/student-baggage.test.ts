import { describe, expect, it } from 'vitest';
import { baggageAirlines } from '../../src/lib/baggage-airlines';
import {
  assessBags, compareBaggage, currentProgram, ruleLabel, studentEligibility, totalWeight, validRule, validWeights,
  type BaggageAirline, type BaggageRule, type Journey, type OfficialStudentProgram, type TicketTerms,
} from '../../src/lib/student-baggage';

const today = '2026-10-19';
const twoPieces: BaggageRule = { basis: 'pieces', pieces: 2, perBagKg: 23 };
const weightRule: BaggageRule = { basis: 'weight', totalKg: 30, perBagKg: 23 };

// These are fictional test terms, never an actual airline policy or a live offer.
function program(overrides: Partial<OfficialStudentProgram> = {}): OfficialStudentProgram {
  return {
    verifiedAt: '2026-10-01', reviewDueAt: '2026-12-01', sourceUrl: 'https://airline.example/student-terms',
    minAge: 18, maxAge: 30, departureCountries: ['IN'], destinationCountries: ['GB'],
    departureAirports: ['DEL', 'BOM'], destinationAirports: ['LHR'], cabins: ['economy'],
    allowance: twoPieces, extraLabel: 'Fictional test fixture: eligible total is two pieces',
    benefits: ['Fictional fare benefit for unit tests only'], restrictions: ['Fictional eligible fare restrictions'],
    activation: ['Fictional registration and offer activation required'], ...overrides,
  };
}
function airline(overrides: Partial<BaggageAirline> = {}): BaggageAirline {
  return {
    code: 'XX', name: 'Fictional test airline', programName: 'Fictional student program',
    studentUrl: 'https://airline.example/students', baggageUrl: 'https://airline.example/baggage',
    program: null, ...overrides,
  };
}
function journey(overrides: Partial<Journey> = {}): Journey {
  return {
    departure: 'IN', destination: 'GB', departureAirport: 'DEL', destinationAirport: 'LHR', age: '22',
    verification: 'airline-verified', cabin: 'economy', ...overrides,
  };
}
function ticket(overrides: Partial<TicketTerms> = {}): TicketTerms {
  return { standard: twoPieces, contextConfirmed: true, studentActivationConfirmed: false, ...overrides };
}

describe('checked baggage rule calculation', () => {
  it('adds the sample two 23 kg bags and checks each piece separately', () => {
    expect(totalWeight([23, 23])).toBe(46);
    expect(assessBags([23, 23], twoPieces)).toEqual({ status: 'fits', reasons: [] });
    expect(ruleLabel(twoPieces)).toBe('2 bags × 23 kg · no weight pooling');
  });

  it('supports total-weight tickets with independent per-bag and bag-count limits', () => {
    expect(assessBags([15, 15], weightRule).status).toBe('fits');
    expect(assessBags([23, 8], weightRule)).toMatchObject({ status: 'exceeds', reasons: ['Total is 1 kg over the entered allowance.'] });
    expect(assessBags([5, 5, 5], { ...weightRule, maxPieces: 2 })).toMatchObject({ status: 'exceeds', reasons: ['3 bags exceed the 2-bag limit.'] });
  });

  it('does not pool weight between piece-based bags', () => {
    const result = assessBags([24, 22], twoPieces);
    expect(totalWeight([24, 22])).toBe(46);
    expect(result.status).toBe('exceeds');
    expect(result.reasons).toContain('Bag 1 exceeds the 23 kg per-bag limit (1 kg over).');
  });

  it('checks individual limits even when total weight is permitted', () => {
    expect(assessBags([24, 5], weightRule)).toMatchObject({ status: 'exceeds', reasons: ['Bag 1 exceeds the 23 kg per-bag limit (1 kg over).'] });
  });

  it('checks piece count even when every bag is light', () => {
    expect(assessBags([2, 2, 2], twoPieces)).toMatchObject({ status: 'exceeds', reasons: ['3 bags exceed the 2-bag limit.'] });
  });

  it('retains both per-piece and total warnings when both limits are exceeded', () => {
    const result = assessBags([24, 10], weightRule);
    expect(result.status).toBe('exceeds');
    expect(result.reasons).toEqual(['Bag 1 exceeds the 23 kg per-bag limit (1 kg over).', 'Total is 4 kg over the entered allowance.']);
  });

  it('accepts no checked bags against explicit zero-allowance terms, without inventing unknown terms', () => {
    expect(validWeights([])).toBe(true);
    expect(assessBags([], { basis: 'pieces', pieces: 0, perBagKg: 23 }).status).toBe('fits');
    expect(assessBags([], { basis: 'weight', totalKg: 0, perBagKg: 23, maxPieces: 0 }).status).toBe('fits');
    expect(assessBags([], null).status).toBe('unknown');
    expect(assessBags([1], { basis: 'pieces', pieces: 0, perBagKg: 23 }).reasons).toContain('1 bag exceeds the 0-bag limit.');
  });

  it('rounds display totals without rounding a genuine excess into a fit', () => {
    expect(totalWeight([0.1, 0.2])).toBe(0.3);
    expect(assessBags([0.1, 0.2], { basis: 'weight', totalKg: 0.3, perBagKg: 1 }).status).toBe('fits');
    expect(assessBags([15, 15.001], weightRule)).toMatchObject({ status: 'exceeds', reasons: ['Total is less than 0.01 kg over the entered allowance.'] });
  });

  it.each([[-1], [0], [NaN], [Infinity], [100.01], Array(11).fill(1)])('rejects invalid or excessive bag entries: %s', (...weights) => {
    expect(validWeights(weights)).toBe(false);
    expect(assessBags(weights, twoPieces).status).toBe('unknown');
  });

  it.each([
    { basis: 'weight', totalKg: -1, perBagKg: 23 },
    { basis: 'weight', totalKg: 30, perBagKg: 0 },
    { basis: 'weight', totalKg: 30, perBagKg: 23, maxPieces: 1.5 },
    { basis: 'pieces', pieces: 2.5, perBagKg: 23 },
    { basis: 'pieces', pieces: -1, perBagKg: 23 },
    { basis: 'pieces', pieces: 2, perBagKg: Infinity },
    { basis: 'other', pieces: 2, perBagKg: 23 },
  ])('requires a complete valid allowance rule: %s', invalid => {
    const rule = invalid as BaggageRule;
    expect(validRule(rule)).toBe(false);
    expect(assessBags([23], rule).status).toBe('unknown');
    expect(ruleLabel(rule)).toBe('Check with airline');
  });

  it('labels weight rules and treats unknown policies as needing airline confirmation', () => {
    expect(ruleLabel({ ...weightRule, maxPieces: 2 })).toBe('30 kg total · 23 kg per bag · up to 2 bags');
    expect(ruleLabel(null)).toBe('Check with airline');
    expect(assessBags([23, 23], null).status).toBe('unknown');
  });
});

describe('reviewed student-program safeguards', () => {
  it('keeps every actual airline record unverified until official terms are reviewed', () => {
    expect(baggageAirlines.length).toBeGreaterThan(0);
    for (const item of baggageAirlines) {
      expect(item.program).toBeNull();
      expect(currentProgram(item, today)).toBeNull();
      expect(compareBaggage(item, journey(), [23, 23], [], ticket({ standard: null }), today).status).toBe('Needs airline confirmation');
    }
  });

  it('accepts current, complete fictional program metadata', () => {
    const terms = program();
    expect(currentProgram(airline({ program: terms }), today)).toBe(terms);
  });

  it.each([
    { verifiedAt: '2026-10-20' }, { verifiedAt: '2026-02-30' }, { verifiedAt: '' },
    { reviewDueAt: '2026-10-18' }, { reviewDueAt: 'not-a-date' }, { reviewDueAt: '2026-09-01' },
    { validUntil: '2026-10-18' }, { validUntil: '2026-02-30' },
    { minAge: 30, maxAge: 18 }, { maxAge: 121 },
    { restrictions: [] }, { restrictions: [' '] }, { activation: [] },
    { departureCountries: [] }, { destinationCountries: ['United Kingdom'] },
    { departureAirports: [] }, { destinationAirports: ['London'] },
    { cabins: [] }, { eligibleFares: [] }, { extraLabel: '' }, { benefits: [' '] },
  ])('does not publish incomplete, expired or malformed terms: %s', overrides => {
    expect(currentProgram(airline({ program: program(overrides) }), today)).toBeNull();
  });

  it.each(['', 'not-a-date', '2026-02-30'])('rejects invalid assessment dates: %s', date => {
    expect(currentProgram(airline({ program: program() }), date)).toBeNull();
  });

  it('allows the verification, review and expiry boundary dates', () => {
    expect(currentProgram(airline({ program: program({ verifiedAt: today, reviewDueAt: today, validUntil: today }) }), today)).not.toBeNull();
  });

  it.each([
    'http://airline.example/student-terms', 'javascript:alert(1)',
    'https://elsewhere.example/student-terms', 'https://airline.example.evil.test/',
    'https://airline.example@evil.test/', 'https://user:secret@airline.example/',
    'https://airline.example:8443/student-terms',
  ])('requires a secure source on the configured official airline origin: %s', sourceUrl => {
    expect(currentProgram(airline({ program: program({ sourceUrl }) }), today)).toBeNull();
  });

  it('does not accept an invalid allowance or an unsupported cabin in reviewed terms', () => {
    expect(currentProgram(airline({ program: program({ allowance: { basis: 'pieces', pieces: 1.5, perBagKg: 23 } }) }), today)).toBeNull();
    expect(currentProgram(airline({ program: program({ cabins: ['invalid' as Journey['cabin']] }) }), today)).toBeNull();
  });
});

describe('conditional student eligibility', () => {
  it('requires both reviewed terms and airline activation, even for a verified student', () => {
    expect(studentEligibility(null, journey(), true).applicable).toBe(false);
    expect(studentEligibility(program(), journey(), false).applicable).toBe(false);
    expect(studentEligibility(program(), journey(), true)).toEqual({ applicable: true, reasons: [] });
  });

  it.each(['17', '31', '', '22.5', 'unknown'])('does not approve an unqualified age: %s', age => {
    expect(studentEligibility(program(), journey({ age }), true)).toMatchObject({ applicable: false, reasons: ['Published age range: 18–30.'] });
  });

  it.each(['18', '30'])('includes the published age boundaries: %s', age => {
    expect(studentEligibility(program(), journey({ age }), true).applicable).toBe(true);
  });

  it.each([
    { departure: 'US' }, { destination: 'AU' }, { departureAirport: 'BLR' },
    { departureAirport: '' }, { destinationAirport: 'LGW' }, { cabin: 'business' as const },
    { verification: 'enrolled' as const }, { verification: 'unknown' as const },
  ])('blocks an unmet route, airport, cabin or verification condition: %s', overrides => {
    expect(studentEligibility(program(), journey(overrides), true).applicable).toBe(false);
  });

  it('keeps airport selection optional when the reviewed offer is country-wide', () => {
    expect(studentEligibility(program({ departureAirports: undefined, destinationAirports: undefined }), journey({ departureAirport: '', destinationAirport: '' }), true).applicable).toBe(true);
  });

  it('requires a matching reviewed fare instead of assuming all economy fares qualify', () => {
    const limited = program({ eligibleFares: ['Student Flex'] });
    expect(studentEligibility(limited, journey(), true).applicable).toBe(false);
    expect(studentEligibility(limited, journey(), true, 'Economy Basic').applicable).toBe(false);
    expect(studentEligibility(limited, journey(), true, ' student flex ').applicable).toBe(true);
  });
});

describe('airline comparisons and result states', () => {
  it('distinguishes a known standard fit from unverified student terms', () => {
    const result = compareBaggage(airline(), journey(), [23, 23], [], ticket(), today);
    expect(result.status).toBe('Fits standard allowance');
    expect(result.standard.status).toBe('fits');
    expect(result.student.status).toBe('unknown');
    expect(result.eligibility.applicable).toBe(false);
  });

  it('keeps explicit standard excess warnings when unknown student terms prevent a definitive overall result', () => {
    const result = compareBaggage(airline(), journey(), [23, 23], [], ticket({ standard: weightRule }), today);
    expect(result.status).toBe('Needs airline confirmation');
    expect(result.standard).toMatchObject({ status: 'exceeds', reasons: ['Total is 16 kg over the entered allowance.'] });
    expect(result.student.status).toBe('unknown');
  });

  it('uses the full conditional student allowance without adding it to the standard allowance', () => {
    const company = airline({ program: program() });
    const terms = ticket({ standard: { basis: 'pieces', pieces: 1, perBagKg: 23 }, studentActivationConfirmed: true });
    const result = compareBaggage(company, journey(), [23, 23], [], terms, today);
    expect(result.standard.status).toBe('exceeds');
    expect(result.student.status).toBe('fits');
    expect(result.status).toBe('May fit with student benefit');
    expect(compareBaggage(company, journey(), [23, 23, 23], [], terms, today).status).toBe('Exceeds allowance');
  });

  it('retains a standard fit if a conditional program has a smaller total allowance', () => {
    const result = compareBaggage(airline({ program: program({ allowance: { basis: 'pieces', pieces: 1, perBagKg: 23 } }) }), journey(), [23, 23], [], ticket({ studentActivationConfirmed: true }), today);
    expect(result.student.status).toBe('exceeds');
    expect(result.status).toBe('Fits standard allowance');
  });

  it('does not activate student extras from verification alone or an unconfirmed ticket context', () => {
    const company = airline({ program: program() });
    expect(compareBaggage(company, journey(), [23, 23], [], ticket({ standard: weightRule }), today).student.status).toBe('unknown');
    const unconfirmed = compareBaggage(company, journey(), [23, 23], [], ticket({ studentActivationConfirmed: true, contextConfirmed: false }), today);
    expect(unconfirmed.status).toBe('Needs airline confirmation');
    expect(unconfirmed.standard.status).toBe('unknown');
    expect(unconfirmed.student.status).toBe('unknown');
  });

  it('passes each airline’s fare separately to its student eligibility check', () => {
    const company = airline({ program: program({ eligibleFares: ['Student Flex'] }) });
    const terms = ticket({ standard: weightRule, studentActivationConfirmed: true, fareName: 'Student Flex' });
    expect(compareBaggage(company, journey(), [23, 23], [], terms, today).status).toBe('May fit with student benefit');
    expect(compareBaggage(company, journey(), [23, 23], [], { ...terms, fareName: 'Basic' }, today).status).toBe('Needs airline confirmation');
  });

  it('assesses selected airlines independently without a fictional winner', () => {
    const companies = [airline({ code: 'XX' }), airline({ code: 'YY' })];
    const tickets = [ticket(), ticket({ standard: weightRule })];
    const results = companies.map((company, index) => compareBaggage(company, journey(), [23, 23], [], tickets[index], today));
    expect(results.map(result => result.airline.code)).toEqual(['XX', 'YY']);
    expect(results.map(result => result.standard.status)).toEqual(['fits', 'exceeds']);
    expect(results.map(result => result.status)).toEqual(['Fits standard allowance', 'Needs airline confirmation']);
  });

  it.each([
    { departure: '' }, { destination: '' }, { departure: 'India' },
    { departureAirport: 'D' }, { destinationAirport: 'lhr' }, { cabin: 'invalid' as Journey['cabin'] },
  ])('does not report a ticket or student fit for incomplete or malformed journey context: %s', overrides => {
    const result = compareBaggage(airline({ program: program() }), journey(overrides), [23, 23], [], ticket({ studentActivationConfirmed: true }), today);
    expect(result.status).toBe('Needs airline confirmation');
    expect(result.standard.status).toBe('unknown');
    expect(result.student.status).toBe('unknown');
  });

  it('handles optional cabin bags separately from checked baggage', () => {
    expect(compareBaggage(airline(), journey(), [23, 23], [7], ticket(), today).status).toBe('Needs airline confirmation');
    expect(compareBaggage(airline(), journey(), [23, 23], [7], ticket({ cabin: { pieces: 1, perBagKg: 7 } }), today).status).toBe('Fits standard allowance');
    const overweightCabin = compareBaggage(airline(), journey(), [23, 23], [8], ticket({ cabin: { pieces: 1, perBagKg: 7 } }), today);
    expect(overweightCabin.status).toBe('Exceeds allowance');
    expect(overweightCabin.cabin.reasons).toContain('Bag 1 exceeds the 7 kg per-bag limit (1 kg over).');
  });

  it('never reports a fit when an entered checked or cabin weight is invalid', () => {
    expect(compareBaggage(airline(), journey(), [0, 23], [], ticket(), today).status).toBe('Needs airline confirmation');
    expect(compareBaggage(airline(), journey(), [23, 23], [0], ticket({ cabin: { pieces: 1, perBagKg: 7 } }), today).status).toBe('Needs airline confirmation');
    expect(compareBaggage(airline(), journey(), [23, 23], [7], ticket({ cabin: { pieces: -1, perBagKg: 7 } }), today).status).toBe('Needs airline confirmation');
  });
});
