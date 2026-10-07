export interface Airline {
  code: string;
  name: string;
  shortName: string;
  color: string;
  website: string;
  hub?: string;
  student?: { name: string; url: string; description: string; reviewStatus: 'needs-review' };
}
export const airlines: Airline[] = [
  { code: 'QR', name: 'Qatar Airways', shortName: 'QATAR', color: '#762349', website: 'https://www.qatarairways.com/', hub: 'DOH', student: { name: 'Student Club', url: 'https://www.qatarairways.com/en/student-club.html', description: 'Explore Student Club for student fares and possible baggage benefits. Membership, route and fare conditions apply.', reviewStatus: 'needs-review' } },
  { code: 'EK', name: 'Emirates', shortName: 'Emirates', color: '#c62730', website: 'https://www.emirates.com/', hub: 'DXB', student: { name: 'Student offers', url: 'https://www.emirates.com/english/special-offers/student-special-fares/', description: 'Check current student offers for eligible fares, baggage and required student documents.', reviewStatus: 'needs-review' } },
  { code: 'TK', name: 'Turkish Airlines', shortName: 'TURKISH', color: '#d1272b', website: 'https://www.turkishairlines.com/', hub: 'IST', student: { name: 'Student discounts', url: 'https://www.turkishairlines.com/en-int/student/', description: 'Check the airline’s student membership options and terms for your country and itinerary.', reviewStatus: 'needs-review' } },
  { code: 'LH', name: 'Lufthansa', shortName: 'Lufthansa', color: '#061c53', website: 'https://www.lufthansa.com/', hub: 'FRA', student: { name: 'Student fares', url: 'https://www.lufthansa.com/in/en/student-fares', description: 'Student fares depend on departure country, route and booking conditions. Check your local airline site.', reviewStatus: 'needs-review' } },
  { code: 'AF', name: 'Air France', shortName: 'AIRFRANCE', color: '#082747', website: 'https://www.airfrance.com/', hub: 'CDG' },
  { code: 'AI', name: 'Air India', shortName: 'AIR INDIA', color: '#ca2445', website: 'https://www.airindia.com/', hub: 'DEL', student: { name: 'Student offers', url: 'https://www.airindia.com/in/en/book/special-offers/student-offers.html', description: 'Review current student fare and baggage offers, including route restrictions and proof of enrolment.', reviewStatus: 'needs-review' } },
  { code: 'EY', name: 'Etihad Airways', shortName: 'ETIHAD', color: '#967847', website: 'https://www.etihad.com/', hub: 'AUH', student: { name: 'Student offers', url: 'https://www.etihad.com/en/book/special-offers/promo/student-special-offer', description: 'Check whether a student offer is currently available for your itinerary and travel dates.', reviewStatus: 'needs-review' } },
  { code: 'SQ', name: 'Singapore Airlines', shortName: 'SINGAPORE', color: '#17395d', website: 'https://www.singaporeair.com/', hub: 'SIN', student: { name: 'Student privileges', url: 'https://www.singaporeair.com/en_UK/sg/plan-travel/promotions/student-privileges/', description: 'Explore verified student membership privileges. The airline confirms eligibility and the final fare.', reviewStatus: 'needs-review' } },
  { code: 'CX', name: 'Cathay Pacific', shortName: 'CATHAY', color: '#00625c', website: 'https://www.cathaypacific.com/', hub: 'HKG', student: { name: 'Student fares', url: 'https://www.cathaypacific.com/cx/en_US/offers/collection/student-fares.html', description: 'Student offers vary by market. Check eligible routes, verification requirements and current baggage conditions.', reviewStatus: 'needs-review' } },
  { code: 'KL', name: 'KLM', shortName: 'KLM', color: '#0085ba', website: 'https://www.klm.com/', hub: 'AMS', student: { name: 'Student fares', url: 'https://www.klm.com/information/ticket-services/student-fares', description: 'Check student fare availability, minimum stays and required documents on the airline’s website.', reviewStatus: 'needs-review' } },
  { code: 'AY', name: 'Finnair', shortName: 'FINNAIR', color: '#131846', website: 'https://www.finnair.com/', student: { name: 'Student offers', url: 'https://www.finnair.com/en/flight-offers/student-flight-offers', description: 'Review the current student offer and its booking, age and route restrictions before purchasing.', reviewStatus: 'needs-review' } },
  { code: 'BA', name: 'British Airways', shortName: 'BRITISH', color: '#243f7d', website: 'https://www.britishairways.com/' },
  { code: 'LX', name: 'SWISS', shortName: 'SWISS', color: '#c9202a', website: 'https://www.swiss.com/' },
  { code: '6E', name: 'IndiGo', shortName: 'IndiGo', color: '#2b328d', website: 'https://www.goindigo.in/' },
  { code: 'TG', name: 'Thai Airways', shortName: 'THAI', color: '#662a80', website: 'https://www.thaiairways.com/' },
  { code: 'MH', name: 'Malaysia Airlines', shortName: 'MALAYSIA', color: '#16255b', website: 'https://www.malaysiaairlines.com/' },
  { code: 'SV', name: 'Saudia', shortName: 'SAUDIA', color: '#176750', website: 'https://www.saudia.com/' },
  { code: 'UA', name: 'United Airlines', shortName: 'UNITED', color: '#1645a3', website: 'https://www.united.com/' },
  { code: 'DL', name: 'Delta Air Lines', shortName: 'DELTA', color: '#7b1934', website: 'https://www.delta.com/' },
  { code: 'AA', name: 'American Airlines', shortName: 'AMERICAN', color: '#167ca1', website: 'https://www.aa.com/' },
  { code: 'AC', name: 'Air Canada', shortName: 'AIR CANADA', color: '#c92230', website: 'https://www.aircanada.com/' },
  { code: 'QF', name: 'Qantas', shortName: 'QANTAS', color: '#d52032', website: 'https://www.qantas.com/' },
  { code: 'KE', name: 'Korean Air', shortName: 'KOREAN', color: '#184b86', website: 'https://www.koreanair.com/' },
  { code: 'JL', name: 'Japan Airlines', shortName: 'JAL', color: '#c6222c', website: 'https://www.jal.com/' },
  { code: 'NH', name: 'ANA', shortName: 'ANA', color: '#1055a1', website: 'https://www.ana.co.jp/' },
  { code: 'AZ', name: 'ITA Airways', shortName: 'ITA', color: '#066aa9', website: 'https://www.ita-airways.com/' },
  { code: 'IB', name: 'Iberia', shortName: 'IBERIA', color: '#c8242d', website: 'https://www.iberia.com/' },
  { code: 'OS', name: 'Austrian Airlines', shortName: 'AUSTRIAN', color: '#cd202f', website: 'https://www.austrian.com/' },
  { code: 'FR', name: 'Ryanair', shortName: 'RYANAIR', color: '#173568', website: 'https://www.ryanair.com/' },
  { code: 'U2', name: 'easyJet', shortName: 'easyJet', color: '#ee681b', website: 'https://www.easyjet.com/' },
];
export function airline(code: string) { return airlines.find(a => a.code === code); }
export function bookingUrl(code: string) { return airline(code)?.website ?? 'https://www.google.com/travel/flights'; }
