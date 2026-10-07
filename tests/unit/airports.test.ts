import { describe, expect, it } from 'vitest';
import { airport, airports, airportCount, countryCount, searchAirports } from '../../src/lib/airports';
import { defaults, parseSearch, searchParams } from '../../src/lib/search';
import { demoFlights } from '../../src/lib/demo';

describe('worldwide airport catalog', () => {
  it('contains unique IATA airports with usable coordinates and time zones', () => {
    expect(airports.length).toBe(airportCount);
    expect(airportCount).toBeGreaterThan(5000);
    expect(new Set(airports.map(a => a.countryCode)).size).toBe(countryCount);
    expect(countryCount).toBeGreaterThan(200);
    expect(new Set(airports.map(a => a.code)).size).toBe(airportCount);
    for (const a of airports) {
      expect(a.code).toMatch(/^[A-Z]{3}$/);
      expect(a.name && a.city && a.country).toBeTruthy();
      expect(Number.isFinite(a.lat) && Math.abs(a.lat) <= 90).toBe(true);
      expect(Number.isFinite(a.lon) && Math.abs(a.lon) <= 180).toBe(true);
    }
    for (const zone of new Set(airports.map(a => a.timezone))) expect(() => new Intl.DateTimeFormat('en', { timeZone: zone })).not.toThrow();
  });
  it.each([
    ['JFK', 'New York'], ['GRU', 'São Paulo'], ['CPT', 'Cape Town'], ['NBO', 'Nairobi'],
    ['SYD', 'Sydney'], ['AKL', 'Auckland'], ['HND', 'Tokyo'], ['MEX', 'Mexico City'],
  ])('finds airports in every inhabited continent: %s', (code, name) => {
    expect(airport(code)?.city).toContain(name);
    expect(airport(code.toLowerCase())?.code).toBe(code);
  });
  it('prioritizes codes and supports city, airport name, country and accent-insensitive searches', () => {
    expect(searchAirports('gru')[0].code).toBe('GRU');
    expect(searchAirports('Sao Paulo').map(a => a.code)).toContain('GRU');
    expect(searchAirports('São Paulo').map(a => a.code)).toEqual(searchAirports('Sao Paulo').map(a => a.code));
    expect(searchAirports('Heathrow')[0].code).toBe('LHR');
    expect(searchAirports('Japan').every(a => a.countryCode === 'JP')).toBe(true);
    expect(searchAirports('USA').every(a => a.countryCode === 'US')).toBe(true);
    expect(searchAirports('New York').map(a => a.code)).toEqual(expect.arrayContaining(['JFK', 'LGA']));
    expect(searchAirports('qwerty-not-an-airport')).toEqual([]);
    expect(searchAirports('')).toHaveLength(8);
  });
  it.each([['GRU', 'CPT'], ['JFK', 'HND'], ['SYD', 'SIN'], ['NBO', 'LHR'], ['YYZ', 'MEX'], ['AKL', 'SCL']])('validates and renders global demo routes %s → %s', (origin, destination) => {
    const query = parseSearch(searchParams({ ...defaults(), origin, destination }));
    const offers = demoFlights(query);
    expect(offers).toHaveLength(6);
    for (const offer of offers) {
      expect(offer.mode).toBe('demo');
      expect(offer.itineraries[0].segments[0].from).toBe(origin);
      expect(offer.itineraries[0].segments.at(-1)?.to).toBe(destination);
      expect(offer.itineraries[1].segments[0].from).toBe(destination);
      for (const it of offer.itineraries) for (const s of it.segments) {
        expect(Number.isNaN(Date.parse(s.departure))).toBe(false);
        expect(Number.isNaN(Date.parse(s.arrival))).toBe(false);
      }
    }
  });
});
