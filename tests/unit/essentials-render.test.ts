import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TravelEssentialsCatalog } from '../../src/components/travel-essentials-catalog';
import { resolveEssentialsCatalog } from '../../src/lib/essentials-config';

// Fictional configuration fixtures exercise rendering; these are not real products or affiliate links.
const fixtureNow = new Date('2026-10-19T12:00:00.000Z');
const fixtureItem = {
  approved: true,
  network: 'amazon-associates',
  retailer: 'Test retailer (fixture)',
  url: 'https://retailer.example/approved-test-link',
  productTitle: 'Fictional test pillow listing',
  productUrl: 'https://retailer.example/products/test-pillow',
  price: {
    amount: 1299,
    currency: 'INR',
    verifiedAt: '2026-10-19',
    sourceUrl: 'https://retailer.example/products/test-pillow',
  },
};

function render(record?: Record<string, unknown>) {
  const config = record ? { FLYORA_ESSENTIALS_LINKS_JSON: JSON.stringify({ 'neck-pillow': record }) } : {};
  return renderToStaticMarkup(createElement(TravelEssentialsCatalog, {
    products: resolveEssentialsCatalog(config, fixtureNow),
  }));
}

function pillowCard(html: string) {
  const card = html.match(/<article[^>]*aria-label="Neck pillow"[\s\S]*?<\/article>/)?.[0];
  expect(card).toBeDefined();
  return card!;
}

describe('Travel Essentials retailer and price rendering', () => {
  it('renders defaults as ordinary India retailer searches without numeric prices or affiliate claims', () => {
    const html = render();
    const card = pillowCard(html);
    expect((html.match(/External retailer search · Amazon India/g) ?? [])).toHaveLength(29);
    expect(card).toContain('aria-label="Search Amazon India for Neck pillow"');
    expect(card).toContain('href="https://www.amazon.in/s?k=Neck%20pillow"');
    expect(card).toContain('Check price with retailer');
    expect(card).toContain('No verified price recorded.');
    expect(html).not.toMatch(/₹[\d,]+/);
    expect(html).not.toContain('sponsored');
    expect(html).not.toContain('As an Amazon Associate');
    expect(html).not.toContain('Linked item:');
  });

  it('shows a sourced, dated INR reference only beside the identified linked item', () => {
    const html = render(fixtureItem);
    const card = pillowCard(html);
    expect(card).toContain('Linked item: Fictional test pillow listing');
    expect(card).toContain('₹1,299.00');
    expect(card).toContain('Recorded INR price · checked');
    expect(card).toContain('<time dateTime="2026-10-19">19 Oct 2026</time>');
    expect(card).toContain('Price may change.');
    expect(card).toContain('href="https://retailer.example/products/test-pillow" target="_blank" rel="noopener noreferrer">View price source');
    expect(card).not.toContain('No verified price recorded.');
    expect((html.match(/Recorded INR price · checked/g) ?? [])).toHaveLength(1);
  });

  it('labels approved affiliate destinations and supplies sponsored rel without altering the configured URL', () => {
    const html = render(fixtureItem);
    const card = pillowCard(html);
    const affiliateCta = card.match(/<a class="essential-link"[^>]*>/)?.[0];
    expect(affiliateCta).toContain('href="https://retailer.example/approved-test-link"');
    expect(affiliateCta).toContain('target="_blank"');
    expect(affiliateCta).toContain('rel="noopener noreferrer sponsored"');
    expect(affiliateCta).toContain('aria-label="View Neck pillow at Test retailer (fixture)"');
    expect(card).toContain('Affiliate link · Test retailer (fixture)');
    expect(html).toContain('As an Amazon Associate, Flyora earns from qualifying purchases.');
  });

  it('only shows the Amazon Associates-specific disclosure for an approved Amazon network link', () => {
    expect(render({ ...fixtureItem, network: 'admitad' })).not.toContain('As an Amazon Associate');
    expect(render({ ...fixtureItem, network: 'retailer' })).not.toContain('As an Amazon Associate');
    expect(render({ ...fixtureItem, approved: false })).not.toContain('As an Amazon Associate');
    expect(render({ ...fixtureItem, url: 'javascript:alert(1)' })).not.toContain('As an Amazon Associate');
    expect(render({ ...fixtureItem, price: undefined })).toContain('As an Amazon Associate');
  });

  it('formats larger INR references with Indian digit grouping and paise', () => {
    const card = pillowCard(render({ ...fixtureItem, price: { ...fixtureItem.price, amount: 123456.5 } }));
    expect(card).toContain('₹1,23,456.50');
  });

  it('hides stale or mismatched prices while retaining a clearly marked approved affiliate link', () => {
    for (const invalidPrice of [
      { ...fixtureItem.price, verifiedAt: '2026-10-01' },
      { ...fixtureItem.price, sourceUrl: 'https://retailer.example/products/different-item' },
      { ...fixtureItem.price, currency: 'USD' },
    ]) {
      const card = pillowCard(render({ ...fixtureItem, price: invalidPrice }));
      expect(card).toContain('Affiliate link · Test retailer (fixture)');
      expect(card).toContain('No verified price recorded.');
      expect(card).not.toMatch(/₹[\d,]+/);
      expect(card).not.toContain('View price source');
      expect(card).not.toContain('Recorded INR price');
    }
  });
});
