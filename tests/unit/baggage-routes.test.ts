import { describe, expect, it } from 'vitest';
import { airports } from '../../src/lib/airports';
import { baggageAirports, baggageCountries, indianDepartureCodes } from '../../src/lib/baggage-routes';

describe('India-first baggage route choices', () => {
  it('prioritizes India for departures and popular student destinations', () => {
    expect(baggageCountries('departure')[0].code).toBe('IN');
    expect(baggageCountries('destination').slice(0, 4).map(country => country.code)).toEqual(['GB', 'CA', 'US', 'AU']);
  });

  it('retains every catalog country for departures and destinations', () => {
    const catalogCountries = new Set(airports.map(airport => airport.countryCode).filter(Boolean));
    for (const direction of ['departure', 'destination'] as const) {
      const countries = baggageCountries(direction);
      expect(new Set(countries.map(country => country.code))).toEqual(catalogCountries);
      expect(countries.every(country => country.name.length > 0)).toBe(true);
    }
  });

  it('prioritizes major Indian departure airports while retaining the other airports', () => {
    const choices = baggageAirports('IN', 'departure');
    expect(choices.slice(0, 2).map(airport => airport.code)).toEqual(['DEL', 'BOM']);
    expect(choices.slice(0, indianDepartureCodes.length).map(airport => airport.code)).toEqual(indianDepartureCodes);
    expect(new Set(choices.map(airport => airport.code))).toEqual(new Set(airports.filter(airport => airport.countryCode === 'IN').map(airport => airport.code)));
  });

  it('retains worldwide routes and orders destination airports without assuming baggage policies', () => {
    expect(baggageAirports('GB', 'destination')[0].code).toBe('LHR');
    expect(baggageAirports('CA', 'destination')[0].code).toBe('YYZ');
    expect(baggageAirports('JP', 'destination').map(airport => airport.code)).toContain('HND');
    expect(baggageAirports('BR', 'departure').map(airport => airport.code)).toContain('GRU');
    expect(baggageAirports('ZZ', 'departure')).toEqual([]);
  });
});
