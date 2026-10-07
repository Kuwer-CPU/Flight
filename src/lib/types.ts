export type Cabin = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS';
export type DataMode = 'demo' | 'test' | 'live';
export interface SearchQuery {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  cabin: Cabin;
  student: boolean;
  age: number;
  baggage: number;
}
export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  lat: number;
  lon: number;
}
export interface BaggageAllowance {
  weight?: number;
  unit?: string;
  pieces?: number;
}
export interface FlightSegment {
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: number;
  carrier: string;
  flightNumber: string;
  operatingCarrier?: string;
}
export interface Itinerary {
  duration: number;
  segments: FlightSegment[];
}
export interface FlightOffer {
  id: string;
  airlineCode: string;
  airlineName: string;
  price: number;
  currency: string;
  passengers: number;
  cabin: Cabin;
  itineraries: Itinerary[];
  baggage: BaggageAllowance;
  mode: DataMode;
}
export interface SearchResponse {
  offers: FlightOffer[];
  mode: DataMode;
  searchedAt: string;
}
