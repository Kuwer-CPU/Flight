import { airport } from './airports';
import { airline } from './airlines';
import type { FlightOffer, FlightSegment, Itinerary, SearchQuery } from './types';

function distance(from: string, to: string) {
  const a = airport(from)!;
  const b = airport(to)!;
  const rad = Math.PI / 180;
  const h = Math.sin((b.lat - a.lat) * rad / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((b.lon - a.lon) * rad / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function localTime(date: Date, code: string) {
  const parts = new Intl.DateTimeFormat('sv-SE', { timeZone: airport(code)!.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const value = (type: string) => parts.find(p => p.type === type)!.value;
  return value('year') + '-' + value('month') + '-' + value('day') + 'T' + value('hour') + ':' + value('minute') + ':' + value('second');
}
function localDeparture(date: string, hour: number, code: string) {
  const target = new Date(date + 'T' + String(hour).padStart(2, '0') + ':00:00Z');
  let result = target;
  for (let i = 0; i < 2; i++) {
    const rendered = new Date(localTime(result, code) + 'Z');
    result = new Date(result.getTime() + target.getTime() - rendered.getTime());
  }
  return result;
}
function itinerary(from: string, to: string, date: string, carrier: string, index: number, direct: boolean): Itinerary {
  const company = airline(carrier)!;
  const hub = company.hub;
  const stops = !direct && hub && hub !== from && hub !== to ? [from, hub, to] : [from, to];
  let start = localDeparture(date, [9, 14, 7, 18, 11, 22][index], from);
  let total = 0;
  const segments: FlightSegment[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const minutes = Math.max(55, Math.round(distance(stops[i], stops[i + 1]) / 830 * 60) + 40);
    const arrival = new Date(start.getTime() + minutes * 60_000);
    segments.push({ from: stops[i], to: stops[i + 1], departure: localTime(start, stops[i]), arrival: localTime(arrival, stops[i + 1]), duration: minutes, carrier, flightNumber: String(130 + index * 43 + i) });
    total += minutes;
    if (i < stops.length - 2) {
      const layover = 90 + index * 25;
      total += layover;
      start = new Date(arrival.getTime() + layover * 60_000);
    }
  }
  return { duration: total, segments };
}
export function demoFlights(query: SearchQuery): FlightOffer[] {
  const codes = ['QR', 'EK', 'TK', 'LH', 'AF', 'AI'];
  const base = Math.max(115, distance(query.origin, query.destination) * 0.064);
  return codes.map((code, i) => {
    const company = airline(code)!;
    const itineraries = [itinerary(query.origin, query.destination, query.departureDate, code, i, i === 4)];
    if (query.returnDate) itineraries.push(itinerary(query.destination, query.origin, query.returnDate, code, i, i === 4));
    const price = Math.round((base + [14, 58, -30, 31, 110, -63][i]) * (query.returnDate ? 1.65 : 1) * (query.cabin === 'BUSINESS' ? 3 : query.cabin === 'PREMIUM_ECONOMY' ? 1.7 : 1));
    return {
      id: 'demo-' + code + '-' + query.origin + query.destination + query.departureDate + (query.returnDate ?? '') + '-' + query.adults + '-' + query.cabin,
      airlineCode: code, airlineName: company.name, price: price * query.adults, currency: 'EUR', passengers: query.adults, cabin: query.cabin,
      itineraries, baggage: { weight: [23, 30, 23, 23, 20, 0][i], unit: 'KG' }, mode: 'demo',
      studentExample: {
        extraKg: [10, 10, 0, 0, 0, 0][i], verificationRequired: true, registrationRequired: true,
        addOn: { kg: 10, pricePerAdult: [95, 95, 85, 100, 95, 110][i], currency: 'EUR' },
      },
    };
  });
}
