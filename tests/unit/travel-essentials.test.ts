import { describe, expect, it } from 'vitest';
import { travelEssentials } from '../../src/lib/travel-essentials';

describe('luggage accessory destinations', () => {
  it('defaults to external retailer searches, without pretending they are affiliate links', () => {
    const recommendations = travelEssentials({});
    expect(recommendations).toHaveLength(3);
    for (const item of recommendations) {
      const url = new URL(item.href);
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toMatch(/^www\.amazon\.(com|in)$/);
      expect(url.searchParams.get('k')).toBeTruthy();
      expect(item.affiliate).toBe(false);
    }
    expect(recommendations.find(item => item.name === 'Packing cubes')?.detail).toContain('do not reduce its weight');
  });

  it('uses explicitly configured HTTPS affiliate destinations only for the relevant item', () => {
    const recommendations = travelEssentials({ TRAVEL_ESSENTIALS_SCALE_URL: 'https://retailer.example/scale?affiliate=flyora' });
    expect(recommendations[0]).toMatchObject({ href: 'https://retailer.example/scale?affiliate=flyora', affiliate: true });
    expect(recommendations.slice(1).every(item => !item.affiliate)).toBe(true);
  });

  it.each([
    'javascript:alert(1)', 'data:text/html,test', 'http://retailer.example/scale',
    'https://user:secret@retailer.example/scale', 'https://retailer.example:8443/scale', 'not a URL',
  ])('rejects unsafe affiliate configuration: %s', configured => {
    const item = travelEssentials({ TRAVEL_ESSENTIALS_SCALE_URL: configured })[0];
    expect(item.affiliate).toBe(false);
    expect(new URL(item.href).hostname).toMatch(/^www\.amazon\.(com|in)$/);
  });
});
