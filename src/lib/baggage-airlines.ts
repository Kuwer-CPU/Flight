import type { BaggageAirline } from './student-baggage';

/** Official-page research leads only. CONNECT 403 prevented source review on
 * 2026-10-19. No verification date, allowance or benefit has been inferred. */
export const baggageAirlines: BaggageAirline[] = [
  { code: 'QR', name: 'Qatar Airways', programName: 'Student Club', studentUrl: 'https://www.qatarairways.com/en/student-club.html', baggageUrl: 'https://www.qatarairways.com/en/baggage/allowance.html', program: null },
  { code: 'EK', name: 'Emirates', programName: 'Student offers', studentUrl: 'https://www.emirates.com/english/special-offers/student-special-fares/', baggageUrl: 'https://www.emirates.com/english/before-you-fly/baggage/checked-baggage/', program: null },
  { code: 'SQ', name: 'Singapore Airlines', programName: 'Student privileges', studentUrl: 'https://www.singaporeair.com/en_UK/sg/plan-travel/promotions/student-privileges/', baggageUrl: 'https://www.singaporeair.com/en_UK/sg/travel-info/baggage/checked-baggage/', program: null },
  { code: 'TK', name: 'Turkish Airlines', programName: 'Student discounts', studentUrl: 'https://www.turkishairlines.com/en-int/student/', baggageUrl: 'https://www.turkishairlines.com/en-int/any-questions/free-baggage/', program: null },
  { code: 'LH', name: 'Lufthansa', programName: 'Student fares', studentUrl: 'https://www.lufthansa.com/in/en/student-fares', baggageUrl: 'https://www.lufthansa.com/us/en/free-baggage-rules', program: null },
];
