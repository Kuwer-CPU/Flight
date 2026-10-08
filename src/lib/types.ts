export type Cabin = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS';
export type DataMode = 'demo' | 'test' | 'live';
/** Safe public configuration summary; credential presence is not a provider connection check. */
export interface FlightConnection {
  mode: DataMode;
  provider: 'amadeus';
  environment: 'test' | 'production';
  status: 'demo' | 'missing-credentials' | 'invalid-configuration' | 'configured';
  configured: boolean;
  message: string;
}
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
  countryCode?: string;
  size?: number;
  scheduled?: boolean;
  aliases?: string;
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
  /** Fictional comparison inputs, accepted only for visibly labeled demo offers. */
  studentExample?: {
    extraKg: number;
    verificationRequired: boolean;
    registrationRequired: boolean;
    addOn?: { kg: number; pricePerAdult: number; currency: string };
  };
}
export interface SearchResponse {
  offers: FlightOffer[];
  mode: DataMode;
  searchedAt: string;
}
