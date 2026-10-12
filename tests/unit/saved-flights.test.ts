import { describe, expect, it } from 'vitest';
import { readSavedFlights, validSavedFlight } from '../../src/lib/saved-flights';
import { dateLabel, time } from '../../src/lib/search';
import type { FlightOffer } from '../../src/lib/types';

function snapshot(id = 'saved-qr'): FlightOffer {
  return {
    id, airlineCode: 'QR', airlineName: 'Qatar Airways', price: 1259.98, currency: 'EUR',
    passengers: 2, cabin: 'ECONOMY', mode: 'live', provider: 'skyscanner', baggage: { weight: 23, unit: 'KG' },
    itineraries: [{ duration: 480, segments: [{
      from: 'CDG', to: 'DOH', departure: '2026-11-20T09:30:00+01:00',
      arrival: '2026-11-20T19:30:00+03:00', duration: 480, carrier: 'QR', flightNumber: '040', operatingCarrier: 'QR',
    }] }],
  };
}

describe('saved flight recovery', () => {
  it('keeps complete valid snapshots and their original prices and baggage', () => {
    const original = snapshot();
    expect(readSavedFlights(JSON.stringify([original]))).toEqual([original]);
    const [restored] = readSavedFlights(JSON.stringify([original]));
    expect(() => dateLabel(restored.itineraries[0].segments[0].departure)).not.toThrow();
    expect(time(restored.itineraries[0].segments[0].departure)).toBe('09:30');
  });

  it('isolates broken nested rows without losing neighboring valid saves', () => {
    const before = snapshot('before');
    const after = snapshot('after');
    const broken = [
      null, {}, { ...snapshot(), itineraries: [null] },
      { ...snapshot(), itineraries: [{ duration: 480, segments: [] }] },
      { ...snapshot(), itineraries: [{ duration: 480, segments: [null] }] },
      { ...snapshot(), baggage: { weight: '23' } },
    ];
    expect(readSavedFlights(JSON.stringify([before, ...broken, after]))).toEqual([before, after]);
  });

  it.each([
    undefined, null, 1795167000000, {}, 'Friday morning', '2026-11-20',
    '2026-02-30T09:30:00Z', '2026-11-20T25:30:00Z', '2026-11-20T09:99:00Z',
    '2026-11-20T09:30:99Z', '2026-11-20T09:30:00+99:00',
  ])('discards timestamps that cannot safely enter the itinerary UI: %s', departure => {
    const malformed = snapshot('broken');
    (malformed.itineraries[0].segments[0] as unknown as Record<string, unknown>).departure = departure;
    expect(() => readSavedFlights(JSON.stringify([malformed, snapshot('kept')]))).not.toThrow();
    expect(readSavedFlights(JSON.stringify([malformed, snapshot('kept')])).map(value => value.id)).toEqual(['kept']);
  });

  it.each(['2026-11-20T09:30', '2026-11-20T09:30:00Z', '2026-11-20T09:30:00.123+01:00'])('retains supported airline timestamps %s', departure => {
    const saved = snapshot();
    saved.itineraries[0].segments[0].departure = departure;
    expect(validSavedFlight(saved)).toBe(true);
  });

  it.each([null, {}, ['QR'], 12, true, '', 'QATAR', 'qr'])('rejects malformed optional operating carrier values: %s', operatingCarrier => {
    const malformed = snapshot();
    (malformed.itineraries[0].segments[0] as unknown as Record<string, unknown>).operatingCarrier = operatingCarrier;
    expect(validSavedFlight(malformed)).toBe(false);
  });
  it('supports an absent operating carrier and numeric IATA carrier codes', () => {
    const saved = snapshot();
    delete saved.itineraries[0].segments[0].operatingCarrier;
    saved.airlineCode = '6E';
    saved.itineraries[0].segments[0].carrier = '6E';
    expect(validSavedFlight(saved)).toBe(true);
  });

  it.each([
    { price: 0 }, { price: -100 }, { price: '1259.98' }, { currency: 'USD' }, { passengers: 0 },
    { passengers: 10 }, { passengers: 1.5 }, { baggage: { pieces: -1 } },
    { baggage: { weight: -1 } }, { baggage: { unit: 'grams' } }, { cabin: 'FIRST' }, { mode: 'production' },
  ])('does not restore malformed price, traveler or baggage data', overrides => {
    expect(validSavedFlight({ ...snapshot(), ...overrides })).toBe(false);
  });

  it.each([null, '', '{invalid JSON', '{}', 'null', '"saved"'])('recovers from missing or corrupt raw storage: %s', raw => {
    expect(readSavedFlights(raw)).toEqual([]);
  });
  it('bounds storage parsing and the number of restored snapshots', () => {
    expect(readSavedFlights(' '.repeat(500_001))).toEqual([]);
    const saved = Array.from({ length: 25 }, (_, index) => snapshot('saved-' + index));
    const restored = readSavedFlights(JSON.stringify([null, ...saved]));
    expect(restored).toHaveLength(20);
    expect(restored.map(value => value.id)).toEqual(saved.slice(0, 20).map(value => value.id));
  });
});
