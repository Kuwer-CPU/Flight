import { describe, expect, it } from 'vitest';
import {
  essentialsCategories,
  essentialsProducts,
  filterEssentialsProducts,
} from '../../src/lib/essentials-catalog';
import {
  ESSENTIAL_PRICE_MAX_AGE_DAYS,
  resolveEssentialsCatalog,
} from '../../src/lib/essentials-config';

const now = new Date('2026-10-19T12:00:00.000Z');
const approvedLink = {
  url: 'https://shop.example/neck-pillow?approved-link=existing-value',
  approved: true,
  network: 'retailer',
  retailer: 'Configured retailer',
};
const productIdentity = { productTitle: 'Operator-reviewed linked item', productUrl: 'https://shop.example/products/pillow' };
const price = { amount: 1299, currency: 'INR', verifiedAt: '2026-10-19', sourceUrl: productIdentity.productUrl };

function config(records: unknown) {
  return { FLYORA_ESSENTIALS_LINKS_JSON: JSON.stringify(records) };
}

function configuredProduct(record: unknown) {
  return resolveEssentialsCatalog(config({ 'neck-pillow': record }), now)[0];
}

describe('India-first Travel Essentials catalog', () => {
  it('covers every requested category and all 29 generic shopping ideas exactly once', () => {
    expect(essentialsCategories.map(category => category.id)).toEqual([
      'comfort', 'baggage', 'personalization', 'packing', 'electronics', 'documents', 'bags', 'hygiene',
    ]);
    expect(essentialsProducts).toHaveLength(29);
    expect(new Set(essentialsProducts.map(product => product.id)).size).toBe(29);
    expect(Object.fromEntries(essentialsCategories.map(category => [
      category.id, essentialsProducts.filter(product => product.categoryId === category.id).length,
    ]))).toEqual({ comfort: 4, baggage: 4, personalization: 3, packing: 4, electronics: 4, documents: 3, bags: 4, hygiene: 3 });
    for (const product of essentialsProducts) {
      expect(essentialsCategories.some(category => category.id === product.categoryId)).toBe(true);
      expect(product.name).toBeTruthy();
      expect(product.description).toBeTruthy();
      expect(product.tip).toBeTruthy();
    }
  });

  it('defaults to honest Amazon India searches without affiliate, price, discount or rating claims', () => {
    const catalog = resolveEssentialsCatalog({}, now);
    for (const product of catalog) {
      const url = new URL(product.href);
      expect(url.origin).toBe('https://www.amazon.in');
      expect(url.pathname).toBe('/s');
      expect(url.searchParams.get('k')).toBe(product.name);
      expect([...url.searchParams.keys()]).toEqual(['k']);
      expect(product.affiliate).toBe(false);
      expect(product.retailer).toBe('Amazon India');
      expect(product.network).toBeUndefined();
      expect(product.verifiedPrice).toBeUndefined();
      expect(product.offerTitle).toBeUndefined();
      expect(product).not.toHaveProperty('rating');
      expect(product).not.toHaveProperty('discount');
      expect(product).not.toHaveProperty('commission');
    }
  });

  it('does not imply an accessory reduces baggage weight or increases the ticket allowance', () => {
    expect(essentialsProducts.find(product => product.id === 'compression-bags')?.tip).toContain('not weight');
    expect(essentialsProducts.find(product => product.id === 'packing-cubes')?.tip).toContain('do not reduce its weight');
    expect(essentialsProducts.find(product => product.id === 'digital-luggage-scale')?.tip).toContain('does not increase');
    expect(essentialsProducts.find(product => product.id === 'power-bank')?.tip).toContain('airline');
    expect(essentialsProducts.find(product => product.id === 'universal-adapter')?.tip).toContain('not a voltage converter');
  });
});

describe('approved external affiliate configuration', () => {
  it.each(['admitad', 'amazon-associates', 'retailer'])('supports an explicitly approved %s link unchanged', network => {
    const product = configuredProduct({ ...approvedLink, network });
    expect(product).toMatchObject({
      href: approvedLink.url, affiliate: true, network, retailer: approvedLink.retailer,
    });
    expect(product.verifiedPrice).toBeUndefined();
    expect(resolveEssentialsCatalog(config({ 'neck-pillow': { ...approvedLink, network } }), now)
      .slice(1).every(item => !item.affiliate)).toBe(true);
  });

  it.each([undefined, false, 'true', 1])('requires explicit boolean approval rather than %s', approved => {
    expect(configuredProduct({ ...approvedLink, approved }).affiliate).toBe(false);
  });

  it.each([
    'javascript:alert(1)', 'data:text/html,test', 'http://shop.example/item', 'not a URL',
    'https://user:secret@shop.example/item', 'https://shop.example:8443/item',
    'https://localhost/item', 'https://store.localhost/item', 'https://store.local/item',
    'https://store.internal/item', 'https://shop.example./item', 'https://127.0.0.1/item',
    'https://169.254.169.254/item', 'https://192.168.1.1/item', 'https://[::1]/item',
    'https://2130706433/item', 'https://0x7f000001/item', 'https://shop.example/\nitem',
  ])('falls back for an unsafe destination: %s', url => {
    const product = configuredProduct({ ...approvedLink, url });
    expect(product.affiliate).toBe(false);
    expect(new URL(product.href).origin).toBe('https://www.amazon.in');
  });

  it.each([
    null, [], 'url-only', {},
    { ...approvedLink, network: 'invented-network' },
    { ...approvedLink, retailer: '' },
    { ...approvedLink, retailer: 'x'.repeat(81) },
    { ...approvedLink, retailer: 'retailer\nunsafe' },
  ])('falls back for an incomplete or malformed product record', record => {
    expect(configuredProduct(record).affiliate).toBe(false);
  });

  it('isolates a broken row from valid rows and ignores unknown product identifiers', () => {
    const catalog = resolveEssentialsCatalog(config({
      'neck-pillow': { ...approvedLink, url: 'javascript:alert(1)' },
      'power-bank': { ...approvedLink, network: 'admitad' },
      'unrecognised-item': approvedLink,
    }), now);
    expect(catalog).toHaveLength(29);
    expect(catalog[0].affiliate).toBe(false);
    expect(catalog.find(product => product.id === 'power-bank')?.affiliate).toBe(true);
    expect(catalog.filter(product => product.affiliate)).toHaveLength(1);
  });

  it.each(['{invalid', '[]', 'null', '"text"', '42'])('handles malformed or non-record JSON: %s', raw => {
    const catalog = resolveEssentialsCatalog({ FLYORA_ESSENTIALS_LINKS_JSON: raw }, now);
    expect(catalog).toHaveLength(29);
    expect(catalog.every(product => !product.affiliate)).toBe(true);
  });
});

describe('recorded INR prices', () => {
  it('only exposes a recent sourced price for an explicitly identified linked product', () => {
    const product = configuredProduct({ ...approvedLink, ...productIdentity, price });
    expect(product.offerTitle).toBe(productIdentity.productTitle);
    expect(product.verifiedPrice).toEqual(price);
    expect(product.href).toBe(approvedLink.url);
  });

  it('accepts a source-matching direct product URL while keeping affiliate redirects separate', () => {
    const product = configuredProduct({
      ...approvedLink, ...productIdentity,
      url: 'https://affiliate.example/approved-redirect',
      productUrl: 'https://shop.example/products/pillow',
      price: { ...price, sourceUrl: 'https://shop.example/products/pillow' },
    });
    expect(product.verifiedPrice?.sourceUrl).toBe(productIdentity.productUrl);
    expect(product.href).toBe('https://affiliate.example/approved-redirect');
  });

  it.each([
    { productTitle: undefined },
    { productTitle: '' },
    { productTitle: 'x'.repeat(201) },
    { productUrl: undefined },
    { productUrl: 'http://shop.example/products/pillow' },
    { price: { ...price, sourceUrl: 'https://shop.example/different-item' } },
    { price: { ...price, sourceUrl: 'javascript:alert(1)' } },
  ])('hides a price without unambiguous product identity and a matching safe source', override => {
    const product = configuredProduct({ ...approvedLink, ...productIdentity, price, ...override });
    expect(product.affiliate).toBe(true);
    expect(product.verifiedPrice).toBeUndefined();
  });

  it.each([
    { ...price, amount: 0 }, { ...price, amount: -1 }, { ...price, amount: '1299' },
    { ...price, amount: null }, { ...price, currency: 'USD' },
    { ...price, verifiedAt: '2026-10-20' }, { ...price, verifiedAt: '2026-10-11' },
    { ...price, verifiedAt: 'not a date' }, { ...price, verifiedAt: '2026-02-30' },
    { ...price, verifiedAt: '10/19/2026' }, null,
  ])('keeps an approved link but hides invalid, future, stale or non-INR prices', invalidPrice => {
    const product = configuredProduct({ ...approvedLink, ...productIdentity, price: invalidPrice });
    expect(product.affiliate).toBe(true);
    expect(product.verifiedPrice).toBeUndefined();
  });

  it('expires prices after the documented seven-day window', () => {
    expect(ESSENTIAL_PRICE_MAX_AGE_DAYS).toBe(7);
    const record = {
      ...approvedLink, ...productIdentity,
      price: { ...price, verifiedAt: '2026-10-12T12:00:00.000Z' },
    };
    expect(configuredProduct(record).verifiedPrice).toBeDefined();
    expect(resolveEssentialsCatalog(config({ 'neck-pillow': record }), new Date('2026-10-19T12:00:00.001Z'))[0]
      .verifiedPrice).toBeUndefined();
  });

  it('never exposes price records from unapproved links', () => {
    const product = configuredProduct({ ...approvedLink, ...productIdentity, price, approved: false });
    expect(product.affiliate).toBe(false);
    expect(product.verifiedPrice).toBeUndefined();
  });

  it('preserves valid paise amounts without silently rounding the recorded price', () => {
    const product = configuredProduct({ ...approvedLink, ...productIdentity, price: { ...price, amount: 19.99 } });
    expect(product.verifiedPrice?.amount).toBe(19.99);
  });

  it.each([1.001, Number.MAX_SAFE_INTEGER / 10])('hides INR amounts with fractional or unsafe paise: %s', amount => {
    const product = configuredProduct({ ...approvedLink, ...productIdentity, price: { ...price, amount } });
    expect(product.affiliate).toBe(true);
    expect(product.verifiedPrice).toBeUndefined();
  });
});

describe('catalog search and filters', () => {
  const catalog = resolveEssentialsCatalog(config({ 'neck-pillow': approvedLink }), now);

  it('finds names, descriptions, category names and useful Indian-student shopping synonyms', () => {
    expect(filterEssentialsProducts(catalog, { query: ' POWER bank ' }).map(item => item.id)).toEqual(['power-bank']);
    expect(filterEssentialsProducts(catalog, { query: 'rucksack' }).map(item => item.id)).toEqual(['backpack']);
    expect(filterEssentialsProducts(catalog, { query: 'personalization' })).toHaveLength(3);
    expect(filterEssentialsProducts(catalog, { query: 'baggage scale' }).map(item => item.id)).toEqual(['digital-luggage-scale']);
  });

  it('combines search, category and affiliate filters', () => {
    expect(filterEssentialsProducts(catalog, { categoryId: 'comfort' })).toHaveLength(4);
    expect(filterEssentialsProducts(catalog, { categoryId: 'comfort', linkType: 'affiliate' }).map(item => item.id))
      .toEqual(['neck-pillow']);
    expect(filterEssentialsProducts(catalog, { categoryId: 'comfort', linkType: 'search' })).toHaveLength(3);
    expect(filterEssentialsProducts(catalog, { categoryId: 'electronics', query: 'power bank', linkType: 'affiliate' }))
      .toEqual([]);
  });

  it('preserves catalog order, supports all/blank filters and does not mutate input', () => {
    const before = catalog.map(item => item.id);
    expect(filterEssentialsProducts(catalog, { categoryId: 'all', linkType: 'all', query: '   ' })).toEqual(catalog);
    expect(filterEssentialsProducts(catalog, { query: 'no-matching-shopping-idea' })).toEqual([]);
    expect(catalog.map(item => item.id)).toEqual(before);
  });
});
