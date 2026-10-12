import { describe, expect, it } from 'vitest';
import {
  MAX_CHECKLIST_ITEMS, checklistCategories, checklistProfileError, checklistProgress,
  generateTravelChecklist, officialChecklistGuidance, readTravelChecklist,
  validChecklistDate, validChecklistProfile, validReminderText,
} from '@/lib/travel-checklist';
import type { ChecklistProfile } from '@/lib/travel-checklist';

const now = new Date('2026-10-12T12:00:00.000Z');
const profile: ChecklistProfile = {
  departureCountry: 'India', destinationCountry: 'France', travelDate: '2026-11-01',
  universityStartDate: '2026-11-03', purpose: 'study',
};
const state = () => generateTravelChecklist(profile, now);

describe('travel checklist reminders', () => {
  it('covers all eight practical categories without declaring visa eligibility or baggage benefits', () => {
    const generated = state();
    expect(new Set(generated.items.map(item => item.category))).toEqual(new Set(checklistCategories.map(category => category.id)));
    expect(generated.items.every(item => item.completed === false)).toBe(true);
    expect(generated.items.find(item => item.id === 'visa-entry')?.text).toContain('Requirements depend on citizenship');
    expect(generated.items.find(item => item.id === 'airline-fare')?.text).toContain('does not confirm extra baggage or a discount');
    expect(generated.items.find(item => item.id === 'arrival-university')?.text).toContain('2026-11-03');
  });
  it('adapts university reminders to studying, another purpose and a missing start date', () => {
    const study = generateTravelChecklist({ ...profile, universityStartDate: '' }, now);
    expect(study.items.find(item => item.id === 'arrival-university')?.text).toContain('when it is known');
    const holiday = generateTravelChecklist({ ...profile, purpose: 'holiday', universityStartDate: '' }, now);
    expect(holiday.items.some(item => item.id === 'enrolment-confirm')).toBe(false);
    expect(holiday.items.find(item => item.id === 'enrolment-if-needed')?.text).toContain('Remove this reminder if it does not apply');
    expect(holiday.items.some(item => item.id === 'arrival-university')).toBe(false);
  });
  it('adds a going-home reminder without changing the original profile or another list', () => {
    const first = state();
    first.items[0].completed = true;
    first.items[0].text = 'Edited task';
    const regenerated = generateTravelChecklist({ ...profile, purpose: 'return-home' }, now);
    expect(regenerated.items.some(item => item.id === 'arrival-home')).toBe(true);
    expect(regenerated.items[0].completed).toBe(false);
    expect(regenerated.items[0].text).not.toBe('Edited task');
    expect(profile.purpose).toBe('study');
  });
  it('normalizes country whitespace and refuses to generate a trip in the past', () => {
    expect(generateTravelChecklist({ ...profile, departureCountry: ' India ' }, now).profile.departureCountry).toBe('India');
    expect(() => generateTravelChecklist({ ...profile, travelDate: '2026-10-11' }, now)).toThrow('future expected travel date');
  });
});

describe('official checklist references', () => {
  it('links India, France and relevant EU guidance, without claiming reviewed rules', () => {
    const links = officialChecklistGuidance(profile);
    expect(links.map(link => new URL(link.url).hostname)).toEqual(['france-visas.gouv.fr', 'europa.eu', 'indianvisaonline.gov.in']);
    expect(links[0].context).toBe('Destination');
    expect(links.at(-1)?.context).toBe('Departure / return');
  });
  it('recognizes UK and Schengen destinations without adding irrelevant visa sites', () => {
    expect(officialChecklistGuidance({ departureCountry: 'Canada', destinationCountry: ' UK ' }).map(link => link.url)).toEqual(['https://www.gov.uk/check-uk-visa']);
    expect(officialChecklistGuidance({ departureCountry: 'Brazil', destinationCountry: 'Germany' }).map(link => new URL(link.url).hostname)).toEqual(['europa.eu']);
  });
  it('does not invent domains for other countries or duplicate references', () => {
    expect(officialChecklistGuidance({ departureCountry: 'Canada', destinationCountry: 'Japan' })).toEqual([]);
    const same = officialChecklistGuidance({ departureCountry: 'France', destinationCountry: 'France' });
    expect(same).toHaveLength(2);
    expect(new Set(same.map(link => link.url)).size).toBe(2);
  });
});

describe('profile and completion validation', () => {
  it('checks actual calendar dates and allows valid leap dates', () => {
    expect(validChecklistDate('2026-02-30')).toBe(false);
    expect(validChecklistDate('2026-02-29')).toBe(false);
    expect(validChecklistDate('2028-02-29')).toBe(true);
    expect(validChecklistDate('November 1, 2026')).toBe(false);
    expect(validChecklistDate({ date: '2026-11-01' })).toBe(false);
  });
  it('accepts an optional university date and warns on past travel independently of stored schema', () => {
    expect(validChecklistProfile({ ...profile, universityStartDate: '' })).toBe(true);
    expect(checklistProfileError({ ...profile, universityStartDate: '' }, '2026-10-12')).toBeUndefined();
    expect(checklistProfileError({ ...profile, universityStartDate: '2026-02-30' }, '2026-10-12')).toContain('university start date');
    expect(checklistProfileError({ ...profile, travelDate: '2026-10-11' }, '2026-10-12')).toContain('future');
    expect(validChecklistProfile({ ...profile, travelDate: '2026-10-11' })).toBe(true);
  });
  it('bounds country names and rejects invalid purpose, objects and control characters', () => {
    expect(validChecklistProfile({ ...profile, purpose: 'arbitrary' })).toBe(false);
    expect(validChecklistProfile({ ...profile, departureCountry: 'a'.repeat(81) })).toBe(false);
    expect(validChecklistProfile({ ...profile, destinationCountry: { name: 'France' } })).toBe(false);
    expect(validChecklistProfile({ ...profile, departureCountry: 'India\n' })).toBe(false);
    expect(checklistProfileError(null, '2026-10-12')).toContain('departure');
  });
  it('uses a complete count and has a defined empty-list progress', () => {
    const items = state().items.slice(0, 3);
    items[0].completed = true;
    expect(checklistProgress(items)).toEqual({ completed: 1, total: 3, percent: 33 });
    expect(checklistProgress([])).toEqual({ completed: 0, total: 0, percent: 0 });
  });
  it('limits custom reminder text without rejecting normal Unicode', () => {
    expect(validReminderText('Collect my clé de chambre')).toBe(true);
    expect(validReminderText(' ')).toBe(false);
    expect(validReminderText('x'.repeat(401))).toBe(false);
    expect(validReminderText('Task\u0000')).toBe(false);
  });
});

describe('browser checklist restoration', () => {
  it('restores edits, custom reminders and completion, including a past trip', () => {
    const saved = state();
    saved.items[0].completed = true;
    saved.items[0].text = 'Check my documents with the university';
    saved.items.push({ id: 'custom-1', category: 'arrival', text: 'Collect room keys', completed: true });
    saved.profile.travelDate = '2026-01-01';
    expect(readTravelChecklist(JSON.stringify(saved))).toEqual(saved);
  });
  it.each([null, '', '{', 'null', '[]', '{"schemaVersion":2}', 'x'.repeat(128_001)])('handles absent, corrupt or oversized storage without throwing', raw => {
    expect(() => readTravelChecklist(raw)).not.toThrow();
    expect(readTravelChecklist(raw)).toBeNull();
  });
  it.each([
    (saved: ReturnType<typeof state>) => ({ ...saved, profile: null }),
    (saved: ReturnType<typeof state>) => ({ ...saved, items: [null] }),
    (saved: ReturnType<typeof state>) => ({ ...saved, items: [{ ...saved.items[0], text: { document: 'oops' } }] }),
    (saved: ReturnType<typeof state>) => ({ ...saved, items: [{ ...saved.items[0], completed: 'yes' }] }),
    (saved: ReturnType<typeof state>) => ({ ...saved, items: [{ ...saved.items[0], category: 'unknown' }] }),
    (saved: ReturnType<typeof state>) => ({ ...saved, items: [{ ...saved.items[0], id: '<script>' }] }),
    (saved: ReturnType<typeof state>) => ({ ...saved, items: [saved.items[0], saved.items[0]] }),
    (saved: ReturnType<typeof state>) => ({ ...saved, generatedAt: '2026-02-30T12:00:00.000Z' }),
    (saved: ReturnType<typeof state>) => ({ ...saved, items: Array.from({ length: MAX_CHECKLIST_ITEMS + 1 }, (_, i) => ({ ...saved.items[0], id: 'item-' + i })) }),
  ])('rejects invalid nested data, duplicate IDs and bounded-list violations', corrupt => {
    expect(readTravelChecklist(JSON.stringify(corrupt(state())))).toBeNull();
  });
  it('whitelists fields so unexpected saved secrets or executable reference links are not retained', () => {
    const saved = state();
    const restored = readTravelChecklist(JSON.stringify({ ...saved, passport: 'do not retain', profile: { ...saved.profile, apiKey: 'do not retain' }, items: saved.items.map(item => ({ ...item, url: 'javascript:alert(1)' })) }));
    expect(restored).toEqual(saved);
    expect(JSON.stringify(restored)).not.toContain('do not retain');
    expect(JSON.stringify(restored)).not.toContain('javascript:');
  });
});
