import { airports } from './airports';

export const indianDepartureCodes = ['DEL', 'BOM', 'BLR', 'HYD', 'MAA', 'COK', 'AMD', 'CCU'];
const studentDestinationCodes = ['LHR', 'YYZ', 'JFK', 'MEL', 'SYD', 'FRA', 'CDG', 'DUB', 'AKL', 'SIN', 'DXB'];
const destinationCountries = ['GB', 'CA', 'US', 'AU', 'DE', 'FR', 'IE', 'NZ', 'SG', 'AE'];
const countries = [...new Map(airports.filter(a => a.countryCode).map(a => [a.countryCode!, { code: a.countryCode!, name: a.country }])).values()];

/** Popularity only changes ordering, never coverage or baggage eligibility. */
export function baggageCountries(direction: 'departure' | 'destination') {
  const priority = direction === 'departure' ? ['IN'] : destinationCountries;
  const rank = (code: string) => priority.includes(code) ? priority.indexOf(code) : priority.length;
  return [...countries].sort((a, b) => rank(a.code) - rank(b.code) || a.name.localeCompare(b.name));
}
export function baggageAirports(countryCode: string, direction: 'departure' | 'destination') {
  const priority = direction === 'departure' ? indianDepartureCodes : studentDestinationCodes;
  const rank = (code: string) => priority.includes(code) ? priority.indexOf(code) : priority.length;
  return airports.filter(a => a.countryCode === countryCode).sort((a, b) => rank(a.code) - rank(b.code) || Number(!!b.scheduled) - Number(!!a.scheduled) || (b.size ?? 0) - (a.size ?? 0) || a.city.localeCompare(b.city) || a.code.localeCompare(b.code));
}
