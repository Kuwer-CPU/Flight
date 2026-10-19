'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Armchair, ArrowUpRight, Backpack, Battery, BatteryCharging, BedSingle,
  BookOpen, Cable, CircleHelp, Droplets, Ear, Files, Footprints, Gauge, Globe2,
  Layers, Link2, LockKeyhole, Luggage, Moon, Package, PackageOpen, Plane,
  Plug, Search, ShieldCheck, ShoppingBag, Sparkles, Sticker, Tag, Tags, Wallet,
  type LucideIcon,
} from 'lucide-react';
import { essentialsCategories, filterEssentialsProducts, type ResolvedEssential } from '@/lib/essentials-catalog';

const categoryIcons: Record<string, LucideIcon> = {
  comfort: Armchair, baggage: Gauge, personalization: Sticker, packing: Layers,
  electronics: Plug, documents: BookOpen, bags: Luggage, hygiene: Droplets,
};
const productIcons: Record<string, LucideIcon> = {
  'neck-pillow': Armchair, 'eye-mask': Moon, earplugs: Ear, 'travel-blanket': BedSingle,
  'digital-luggage-scale': Gauge, 'tsa-lock': LockKeyhole, 'luggage-straps': Link2, 'luggage-tags': Tag,
  'travel-stickers': Sticker, 'suitcase-decals': Sparkles, 'name-labels': Tags,
  'packing-cubes': Layers, 'compression-bags': Package, 'shoe-bags': Footprints, 'toiletry-organizer': ShoppingBag,
  'universal-adapter': Plug, 'travel-charger': BatteryCharging, 'cable-organizer': Cable, 'power-bank': Battery,
  'passport-holder': BookOpen, 'document-organizer': Files, 'travel-wallet': Wallet,
  suitcase: Luggage, 'cabin-bag': ShoppingBag, backpack: Backpack, 'duffel-bag': ShoppingBag,
  'refillable-bottles': Droplets, 'clear-toiletry-bag': PackageOpen, 'travel-hygiene-kit': ShieldCheck,
};
const rupees = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
const checkedDate = (value: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));

export function TravelEssentialsCatalog({ products }: { products: ResolvedEssential[] }) {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [linkType, setLinkType] = useState<'all' | 'affiliate' | 'search'>('all');
  const [recordedOnly, setRecordedOnly] = useState(false);
  const [sort, setSort] = useState('curated');
  const filtered = useMemo(() => {
    const items = filterEssentialsProducts(products, { query, categoryId, linkType }).filter(item => !recordedOnly || item.verifiedPrice);
    if (sort !== 'curated') items.sort((a, b) => (sort === 'name-asc' ? 1 : -1) * a.name.localeCompare(b.name, 'en-IN'));
    return items;
  }, [products, query, categoryId, linkType, recordedOnly, sort]);
  const clear = () => { setQuery(''); setCategoryId('all'); setLinkType('all'); setRecordedOnly(false); setSort('curated'); };
  const hasFilters = query !== '' || categoryId !== 'all' || linkType !== 'all' || recordedOnly || sort !== 'curated';
  const categoryName = essentialsCategories.find(category => category.id === categoryId)?.name ?? 'All essentials';
  const amazonAffiliate = products.some(product => product.affiliate && product.network === 'amazon-associates');
  return <>
    <header className="essentials-hero">
      <div className="essentials-hero-copy">
        <Link href="/" className="essentials-breadcrumb">Flyora / Travel Essentials</Link>
        <span className="eyebrow essentials-eyebrow">Packed for your next chapter</span>
        <h1>Little essentials.<br /><em>A smoother journey.</em></h1>
        <p>Thoughtful packing ideas for Indian students heading abroad. Explore what you need, check the details, and shop with your chosen retailer.</p>
        <div className="essentials-hero-notes"><span><Globe2 size={15} aria-hidden="true" />India-first shopping</span><span><Plane size={15} aria-hidden="true" />International journeys</span><span><ShieldCheck size={15} aria-hidden="true" />Buy with the retailer</span></div>
      </div>
      <div className="essentials-hero-art" aria-hidden="true">
        <span className="essentials-art-label">INDIA → YOUR NEXT CHAPTER</span>
        <div className="essentials-art-item essentials-art-luggage"><Luggage size={118} strokeWidth={1.2} /><span>Pack a little smarter.</span></div>
        <div className="essentials-art-item essentials-art-passport"><BookOpen size={44} strokeWidth={1.2} /><span>Keep it together.</span></div>
        <div className="essentials-art-item essentials-art-plug"><Plug size={42} strokeWidth={1.2} /><span>Ready to connect.</span></div>
        <div className="essentials-art-stamp"><Sparkles size={23} /><span>GO SOMEWHERE<br />GOOD.</span></div>
      </div>
    </header>

    <aside className="essentials-disclosure" aria-label="Affiliate disclosure">
      <CircleHelp size={21} aria-hidden="true" /><div><strong>Affiliate disclosure</strong><p>Flyora may earn a commission from purchases through links marked “Affiliate link.” Links marked “External retailer search” are ordinary shopping searches, not affiliate offers. You buy on the retailer’s website; its terms and final prices apply.</p>{amazonAffiliate && <p>As an Amazon Associate, Flyora earns from qualifying purchases.</p>}</div>
    </aside>

    <section className="essentials-browser" aria-labelledby="essentials-browser-title">
      <div className="essentials-category-heading"><div><span className="eyebrow">A place for every little thing</span><h2 id="essentials-browser-title">What’s on your packing list?</h2><p>{products.length} shopping ideas across {essentialsCategories.length} categories. Start with what suits your journey.</p></div><button type="button" className="text-button essentials-all" aria-pressed={categoryId === 'all'} onClick={() => setCategoryId('all')}>All essentials</button></div>
      <nav className="essentials-category-nav" aria-label="Shop by category">{essentialsCategories.map((category, index) => {
        const Icon = categoryIcons[category.id] ?? ShoppingBag;
        const count = products.filter(item => item.categoryId === category.id).length;
        return <button type="button" key={category.id} className={'essentials-category-button essential-tone-' + index} aria-pressed={categoryId === category.id} onClick={() => setCategoryId(category.id)}><Icon size={24} aria-hidden="true" /><span>{category.name}<small>{count} ideas</small></span></button>;
      })}</nav>
      <div className="essentials-toolbar">
        <label className="essentials-search"><span>Search travel essentials</span><div><Search size={18} aria-hidden="true" /><input type="search" placeholder="Try packing cubes, adapters, passport…" value={query} onChange={event => setQuery(event.target.value)} /></div></label>
        <label className="essentials-filter">Link type<select value={linkType} onChange={event => setLinkType(event.target.value as typeof linkType)}><option value="all">All retailer links</option><option value="search">External retailer searches</option><option value="affiliate">Approved affiliate offers</option></select></label>
        <label className="essentials-filter">Sort items<select value={sort} onChange={event => setSort(event.target.value)}><option value="curated">Packing-list order</option><option value="name-asc">Name: A–Z</option><option value="name-desc">Name: Z–A</option></select></label>
      </div>
      <div className="essentials-results-summary"><p role="status" aria-live="polite"><strong>{filtered.length} {filtered.length === 1 ? 'idea' : 'ideas'}</strong> · {categoryName}</p><label className="essentials-price-filter"><input type="checkbox" checked={recordedOnly} onChange={event => setRecordedOnly(event.target.checked)} />Only items with a recorded INR price</label>{hasFilters && filtered.length > 0 && <button type="button" className="text-button" onClick={clear}>Clear filters</button>}</div>
      <p className="essentials-price-note">These are product ideas, not stock listings. Prices are shown in ₹ only when a recent price record exists for a specific linked item. Always check the retailer’s current price, specifications and delivery terms.</p>

      {filtered.length > 0 ? <div className="essentials-product-grid">{filtered.map(product => {
        const categoryIndex = essentialsCategories.findIndex(category => category.id === product.categoryId);
        const category = essentialsCategories[categoryIndex];
        const Icon = productIcons[product.id] ?? ShoppingBag;
        return <article className={'essential-card essential-tone-' + categoryIndex} key={product.id} aria-label={product.name}>
          <div className="essential-visual" aria-hidden="true"><span className="essential-visual-lines" />{product.id === 'neck-pillow' ? <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3C6 3 3 8 3 15c0 4 2 6 5 5l2-4c-2-1-3-2-3-4a5 5 0 0 1 10 0c0 2-1 3-3 4l2 4c3 1 5-1 5-5C21 8 18 3 12 3Z" /></svg> : <Icon size={72} strokeWidth={1.15} />}<span className="essential-category">{category.name}</span></div>
          <div className="essential-card-content"><h3>{product.name}</h3><p>{product.description}</p><p className="essential-tip"><ShieldCheck size={15} aria-hidden="true" /><span>{product.tip}</span></p>
            <div className="essential-price">{product.verifiedPrice ? <><small>Linked item: {product.offerTitle}</small><strong>{rupees(product.verifiedPrice.amount)}</strong><small>Recorded INR price · checked <time dateTime={product.verifiedPrice.verifiedAt}>{checkedDate(product.verifiedPrice.verifiedAt)}</time>. Price may change.</small><a href={product.verifiedPrice.sourceUrl} target="_blank" rel="noopener noreferrer">View price source ↗</a></> : <><strong>Check price with retailer</strong><small>No verified price recorded.</small></>}</div>
            <a className="essential-link" href={product.href} target="_blank" rel={'noopener noreferrer' + (product.affiliate ? ' sponsored' : '')} aria-label={product.affiliate ? `View ${product.name} at ${product.retailer}` : `Search Amazon India for ${product.name}`}>{product.affiliate ? `View at ${product.retailer}` : 'Search Amazon India'}<ArrowUpRight size={16} aria-hidden="true" /></a>
            <small className="essential-link-kind">{product.affiliate ? `Affiliate link · ${product.retailer}` : 'External retailer search · Amazon India'}</small>
          </div>
        </article>;
      })}</div> : <div className="essentials-empty"><Search size={30} aria-hidden="true" /><h3>No matching essentials.</h3><p>Try another search or category, or clear your filters. Approved offers and recent price records may not be available for every item.</p><button type="button" className="button button-secondary" onClick={clear}>Clear filters</button></div>}
    </section>

    <section className="essentials-faq" aria-labelledby="essentials-faq-title"><span className="eyebrow">A little clarity before you choose</span><h2 id="essentials-faq-title">Pack thoughtfully. Check the details.</h2>
      <details><summary>Where do I buy and pay?</summary><p>Every product link takes you to an external retailer or a retailer search. Flyora provides shopping ideas and affiliate referrals. Purchases, payment, fulfilment, returns and customer service are handled by the retailer.</p></details>
      <details><summary>What should I check before flying?</summary><p>Check your airline’s current baggage dimensions and weight limits, battery and power-bank rules, and cabin-liquid restrictions for every airport on your journey. Adapters do not necessarily convert voltage. Compression and packing products do not reduce the weight of what you pack.</p></details>
      <details><summary>Does buying an accessory increase my baggage allowance?</summary><p>No. A scale helps you measure; a bag or packing organiser helps you pack. Neither increases your allowance or removes excess-baggage charges. Confirm the terms on your actual ticket.</p></details>
      <details><summary>Are prices, discounts or ratings guaranteed?</summary><p>No. We do not invent product prices, discounts or ratings. A recorded INR price is a dated reference for the identified retailer item, not a live quote. Check the current details and final amount with the retailer before buying.</p></details>
    </section>
    <div className="essentials-trip-links"><Link href="/luggage-calculator"><Luggage size={23} aria-hidden="true" /><strong>Check your luggage</strong><span>Compare bags with your entered ticket terms. →</span></Link><Link href="/travel-checklist"><Files size={23} aria-hidden="true" /><strong>Plan your departure</strong><span>Make a checklist for your student journey. →</span></Link><Link href="/flights"><Plane size={23} aria-hidden="true" /><strong>Find your flight</strong><span>Search and book with an external partner. →</span></Link></div>
  </>;
}
