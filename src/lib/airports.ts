import catalog from '@/data/airports.json';
import metadata from '@/data/airport-catalog.json';
import type { Airport } from './types';

export const airports: Airport[] = catalog;
export const airportCount = metadata.airportCount;
export const countryCount = metadata.countryCount;
const byCode = new Map(airports.map(a => [a.code, a]));
export function airport(code: string) { return byCode.get(code.toUpperCase()); }
export function city(code: string) { return airport(code)?.city ?? code; }
export function airportLabel(a?: Airport) { return a ? `${a.city} (${a.code})` : ''; }

function normalize(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
const countryAliases: Record<string, string[]> = {
  US: ['USA', 'United States of America'], GB: ['UK', 'United Kingdom', 'Britain', 'England', 'Scotland', 'Wales'],
  AE: ['UAE'], KR: ['South Korea'], KP: ['North Korea'], VN: ['Vietnam'], CZ: ['Czech Republic'],
  TR: ['Turkey', 'Turkiye'], MO: ['Macau'], CD: ['DRC', 'DR Congo', 'Congo Kinshasa'],
};
const popularCodes = ['JFK', 'LHR', 'DXB', 'SIN', 'CDG', 'HND', 'SYD', 'DEL', 'LAX', 'YYZ', 'GRU', 'CPT', 'NBO', 'ICN', 'SCL'];
const popularity = new Map(popularCodes.map((code, index) => [code, index]));
const indexed = airports.map(a => ({
  a, city: normalize(a.city), name: normalize(a.name), code: a.code.toLowerCase(),
  country: normalize(a.country), countryCode: a.countryCode?.toLowerCase(),
  text: normalize([a.code, a.city, a.name, a.country, a.countryCode, a.aliases, countryAliases[a.countryCode ?? '']?.join(' ')].join(' ')),
}));
const countries = new Map(airports.map(a => [a.countryCode, [a.country, a.countryCode ?? '', ...(countryAliases[a.countryCode ?? ''] ?? [])].map(normalize)]));

/** Exact IATA and city matches first; large, scheduled airports before smaller matches. */
export function searchAirports(text: string, limit = 8): Airport[] {
  const query = normalize(text);
  const maximum = Math.max(1, Math.min(30, limit));
  if (!query) return popularCodes.map(code => airport(code)!).filter(Boolean).slice(0, maximum);
  const words = query.split(' ');
  const matchingCountries = new Set([...countries].filter(([, names]) => names.includes(query)).map(([code]) => code));
  return indexed.filter(entry => entry.code === query || (matchingCountries.size ? matchingCountries.has(entry.a.countryCode) : words.every(word => entry.text.includes(word)))).map(entry => {
    const rank = entry.code === query ? 0 : entry.city === query ? 1 : entry.code.startsWith(query) ? 2 :
      entry.city.startsWith(query) ? 3 : entry.name.startsWith(query) ? 4 : entry.city.includes(query) ? 5 :
      entry.country === query || entry.countryCode === query ? 6 : 7;
    return { ...entry, rank };
  }).sort((a, b) => a.rank - b.rank || (Number(b.a.scheduled) - Number(a.a.scheduled)) ||
    (b.a.size ?? 0) - (a.a.size ?? 0) || (popularity.get(a.a.code) ?? 100) - (popularity.get(b.a.code) ?? 100) ||
    a.a.city.localeCompare(b.a.city) || a.a.code.localeCompare(b.a.code))
    .slice(0, maximum).map(entry => entry.a);
}
