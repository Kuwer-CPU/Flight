export const CHECKLIST_STORAGE_KEY = 'flyora:checklist:v1';
export const MAX_CHECKLIST_ITEMS = 80;
export const MAX_REMINDER_LENGTH = 400;

export const checklistCategories = [
  { id: 'documents', label: 'Passport & documents' },
  { id: 'visa', label: 'Visa & residence' },
  { id: 'enrolment', label: 'University & enrolment' },
  { id: 'airline', label: 'Airline student programs' },
  { id: 'baggage', label: 'Baggage' },
  { id: 'transport', label: 'Transport' },
  { id: 'accommodation', label: 'Accommodation' },
  { id: 'arrival', label: 'Arrival' },
] as const;
export type ChecklistCategory = typeof checklistCategories[number]['id'];
export type TripPurpose = 'study' | 'return-home' | 'holiday' | 'other';

export interface ChecklistProfile {
  departureCountry: string;
  destinationCountry: string;
  travelDate: string;
  universityStartDate: string;
  purpose: TripPurpose;
}
export interface ChecklistItem {
  id: string;
  category: ChecklistCategory;
  text: string;
  completed: boolean;
}
export interface TravelChecklistState {
  schemaVersion: 1;
  profile: ChecklistProfile;
  items: ChecklistItem[];
  generatedAt: string;
}
export interface OfficialGuidance { label: string; url: string; context: string }

const purposes: TripPurpose[] = ['study', 'return-home', 'holiday', 'other'];
const schengenCountries = new Set([
  'austria', 'belgium', 'bulgaria', 'croatia', 'czechia', 'czech republic', 'denmark',
  'estonia', 'finland', 'france', 'germany', 'greece', 'hungary', 'iceland', 'italy',
  'latvia', 'liechtenstein', 'lithuania', 'luxembourg', 'malta', 'netherlands',
  'norway', 'poland', 'portugal', 'romania', 'slovakia', 'slovenia', 'spain',
  'sweden', 'switzerland',
]);
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function country(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= 2 && value.length <= 80 && !/[\u0000-\u001f\u007f]/.test(value);
}
export function validChecklistDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function checklistToday() { return new Date().toISOString().slice(0, 10); }

/** Calendar validation also accepts a past saved trip; old plans must remain removable. */
export function validChecklistProfile(value: unknown): value is ChecklistProfile {
  return record(value) && country(value.departureCountry) && country(value.destinationCountry) &&
    validChecklistDate(value.travelDate) && typeof value.universityStartDate === 'string' &&
    (value.universityStartDate === '' || validChecklistDate(value.universityStartDate)) &&
    typeof value.purpose === 'string' && purposes.includes(value.purpose as TripPurpose);
}
export function checklistProfileError(value: unknown, currentDate = checklistToday()): string | undefined {
  if (!record(value) || !country(value.departureCountry) || !country(value.destinationCountry)) return 'Enter departure and destination countries, using 2–80 characters each.';
  if (!validChecklistDate(value.travelDate)) return 'Choose a valid expected travel date.';
  if (validChecklistDate(currentDate) && value.travelDate < currentDate) return 'Choose today or a future expected travel date.';
  if (typeof value.universityStartDate !== 'string' || (value.universityStartDate !== '' && !validChecklistDate(value.universityStartDate))) return 'Choose a valid university start date or leave it blank.';
  if (typeof value.purpose !== 'string' || !purposes.includes(value.purpose as TripPurpose)) return 'Choose a trip purpose.';
}
function cleanProfile(profile: ChecklistProfile): ChecklistProfile {
  return { departureCountry: profile.departureCountry.trim(), destinationCountry: profile.destinationCountry.trim(),
    travelDate: profile.travelDate, universityStartDate: profile.universityStartDate, purpose: profile.purpose };
}

/** Reminders are planning prompts, never a determination of immigration eligibility. */
export function generateTravelChecklist(profile: ChecklistProfile, now = new Date()): TravelChecklistState {
  const error = checklistProfileError(profile, now.toISOString().slice(0, 10));
  if (error) throw new Error(error);
  const cleaned = cleanProfile(profile);
  const items: ChecklistItem[] = [];
  const add = (id: string, category: ChecklistCategory, text: string) => items.push({ id, category, text, completed: false });
  add('documents-passport', 'documents', 'Check your passport validity and the document rules for your destination, transit countries and booking. Keep secure copies you can access offline.');
  add('documents-booking', 'documents', 'Check that the name on your ticket matches your travel document. Keep your booking confirmation and insurer or emergency contact details accessible.');
  add('visa-entry', 'visa', `Check entry and transit requirements for ${cleaned.destinationCountry} using the destination embassy or official government guidance. Requirements depend on citizenship, residence and the purpose of travel.`);
  add('visa-return', 'visa', `If you need to return to ${cleaned.departureCountry}, check any residence or re-entry conditions and document expiry dates. This checklist does not establish visa or residence eligibility.`);
  if (cleaned.purpose === 'study') {
    add('enrolment-confirm', 'enrolment', 'Confirm your university enrolment, arrival instructions and any orientation or registration appointments. Ask your university which records you should bring.');
    add('enrolment-documents', 'enrolment', 'Keep your offer or enrolment letter and student ID or accepted proof of study available for the university and any student program you plan to use.');
  } else {
    add('enrolment-if-needed', 'enrolment', 'If you are currently enrolled, check university absence, return or enrolment arrangements relevant to your trip. Remove this reminder if it does not apply.');
  }
  add('airline-registration', 'airline', 'If claiming a student offer, check the airline’s current official terms, age and route restrictions, accepted proof of study, registration steps and required booking channel.');
  add('airline-fare', 'airline', 'Confirm that any student benefit applies to the specific fare and seller before paying. Program membership alone does not confirm extra baggage or a discount.');
  add('baggage-allowance', 'baggage', 'Check your booked fare’s checked and cabin baggage limits with the seller. Review weight versus piece limits, paid add-ons and rules for every segment.');
  add('baggage-pack', 'baggage', 'Weigh your bags, label them and check airline restrictions for batteries, medicines and other items. Keep essentials and travel documents accessible.');
  add('transport-airport', 'transport', 'Plan transport to the departure airport and an arrival route to your accommodation. Check schedules, fares and a backup option for delays.');
  add('accommodation-confirm', 'accommodation', 'Confirm your first-night accommodation, address, check-in hours and a way to contact the host if your flight is delayed.');
  add('arrival-contact', 'arrival', `Prepare an arrival plan for ${cleaned.destinationCountry}: offline directions, emergency contacts, payment access and a way to connect your phone.`);
  if (cleaned.universityStartDate) {
    add('arrival-university', 'arrival', `Check that your planned travel on ${cleaned.travelDate} leaves time for your university start on ${cleaned.universityStartDate}. Confirm the actual arrival and registration arrangements with the university.`);
  } else if (cleaned.purpose === 'study') {
    add('arrival-university', 'arrival', 'Confirm your university start and arrival dates before finalising the trip. Add the start date to your profile when it is known.');
  }
  if (cleaned.purpose === 'return-home') add('arrival-home', 'arrival', 'Coordinate your arrival with anyone meeting you and confirm accommodation or onward travel at home.');
  return { schemaVersion: 1, profile: cleaned, items, generatedAt: now.toISOString() };
}

/** Known official entry points only; no destination-specific requirements are asserted. */
export function officialChecklistGuidance(profile: Pick<ChecklistProfile, 'departureCountry' | 'destinationCountry'>): OfficialGuidance[] {
  const links: OfficialGuidance[] = [];
  const seen = new Set<string>();
  for (const [name, context] of [[profile.destinationCountry, 'Destination'], [profile.departureCountry, 'Departure / return']] as const) {
    const normalized = name.trim().toLowerCase().replace(/\s+/g, ' ');
    const add = (label: string, url: string) => { if (!seen.has(url)) { seen.add(url); links.push({ label, url, context }); } };
    if (['india', 'in', 'ind'].includes(normalized)) add('India official visa guidance', 'https://indianvisaonline.gov.in/');
    if (['france', 'fr', 'fra'].includes(normalized)) add('France official visa guidance', 'https://france-visas.gouv.fr/');
    if (['united kingdom', 'uk', 'gb', 'gbr', 'great britain', 'britain'].includes(normalized)) add('UK government visa checker', 'https://www.gov.uk/check-uk-visa');
    if (schengenCountries.has(normalized) || ['fr', 'fra'].includes(normalized)) add('EU official entry and visa guidance', 'https://europa.eu/youreurope/citizens/travel/entry-exit/non-eu-nationals/index_en.htm');
  }
  return links;
}

export function checklistProgress(items: ChecklistItem[]) {
  const completed = items.filter(item => item.completed).length;
  return { completed, total: items.length, percent: items.length ? Math.round(completed / items.length * 100) : 0 };
}
export function validReminderText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= MAX_REMINDER_LENGTH && !/[\u0000-\u001f\u007f]/.test(value);
}

/** Browser storage is untrusted; only bounded, validated scalar values enter the UI. */
export function readTravelChecklist(raw: string | null): TravelChecklistState | null {
  if (!raw || raw.length > 128_000) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!record(value) || value.schemaVersion !== 1 || !validChecklistProfile(value.profile) ||
      typeof value.generatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.generatedAt) || !Number.isFinite(Date.parse(value.generatedAt)) || new Date(value.generatedAt).toISOString() !== value.generatedAt ||
      !Array.isArray(value.items) || value.items.length > MAX_CHECKLIST_ITEMS) return null;
    const ids = new Set<string>();
    const items: ChecklistItem[] = [];
    for (const item of value.items) {
      if (!record(item) || typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(item.id) || ids.has(item.id) ||
        !checklistCategories.some(category => category.id === item.category) || !validReminderText(item.text) || typeof item.completed !== 'boolean') return null;
      ids.add(item.id);
      items.push({ id: item.id, category: item.category as ChecklistCategory, text: item.text.trim(), completed: item.completed });
    }
    return { schemaVersion: 1, profile: cleanProfile(value.profile), items, generatedAt: value.generatedAt };
  } catch { return null; }
}
