# Flyora Travel Essentials

`/travel-essentials` is an India-first shopping discovery and affiliate-referral page.
It contains 29 generic product ideas in eight categories: in-flight comfort, baggage
accessories, luggage personalization, packing and organization, travel electronics,
passport/document accessories, bags/luggage and toiletries/hygiene.

These are shopping ideas, not Flyora stock or endorsed retailer listings. There is
no cart, checkout, inventory management, payment, shipping or fulfilment flow.
Purchases and after-sales support happen on the external retailer's website.

## Finding essentials

Visitors can search names, descriptions and keywords; filter by category, link type
or presence of a recorded INR price; and sort by name or packing-list order. Controls
work without navigation or storing a shopping profile. Empty states explain when
approved affiliate offers or price records have not been configured. A disclosure
appears before the catalog and each card identifies its link type.

The homepage retains its four existing feature cards and adds a separate Travel
Essentials callout. Header/footer navigation and the luggage calculator link to the
new page. The current flight search, student policies and Admitad verification metadata
remain in place.

## Affiliate configuration

The server reads `FLYORA_ESSENTIALS_LINKS_JSON`, a JSON object keyed by catalog product
ID. IDs and category contents are in `src/lib/essentials-catalog.ts`. Each configured
link requires `approved: true`, a valid public HTTPS `url`, `retailer` display name,
and a `network` value of `admitad`, `amazon-associates` or `retailer`.

Only enter an actual link supplied or approved by the affiliate program. Approval is
an operator assertion after checking the account, permitted market, destination and
required disclosures. Flyora does not apply to programs, validate account approval,
create tracking IDs or construct tracking URLs. It passes the supplied link through
without adding affiliate parameters. For example, after replacing both placeholders:

```json
{
  "digital-luggage-scale": {
    "approved": true,
    "network": "admitad",
    "retailer": "<actual retailer name>",
    "url": "<paste the approved HTTPS affiliate URL exactly>"
  }
}
```

This example is a configuration template, not an active affiliate URL. Never put API
credentials or account secrets in link configuration. The resolved public destinations
are necessarily visible in the browser. Configured affiliate CTAs use `rel="sponsored
noopener noreferrer"` (token order is immaterial). Amazon Associates disclosure appears
only when an approved Amazon Associates link is configured.

Unconfigured, unapproved, malformed or unsafe rows fall back independently to plain
Amazon India searches at `https://www.amazon.in/s?k=<item name>`. Those links have no
fabricated tracking tag and are labelled **External retailer search · Amazon India**.
Default production data includes no approved affiliate links, prices, discounts,
ratings or commission claims. The inherited three-item luggage-sidebar helper and its
existing configuration are preserved; the sidebar also links to the complete catalog.

## Recorded INR prices

A link may optionally include a price record. To publish one, supply all of:

- `productUrl`: the public HTTPS source page for the actual retailer item.
- `productTitle`: the actual item name, not just a broad product category.
- `price.amount`: the positive finite numeric INR amount checked at the source, with at most two decimal places.
- `price.currency`: exactly `INR`.
- `price.verifiedAt`: the actual checked date (`YYYY-MM-DD`) or UTC ISO timestamp.
- `price.sourceUrl`: the same canonical URL as `productUrl`.

No price example is prefilled. This is an operator-maintained record, not automatic
verification or a live feed. Records with missing product identity, invalid/future
dates, a different source, unsupported currency or an age over seven days are hidden.
Seven days is a display freshness limit, not a guarantee of price stability. On the
page, the linked item name, ₹ amount, checked date and source are shown with a reminder
that price may change. Without a valid record the card says **Check price with retailer**.
The route is rendered dynamically so stale prices expire without a new build.

## Design, privacy and checks

The page uses scoped green/cream styles and local decorative icons rather than
unverified retailer photos or invented product packaging. Filters remain in page
memory; outgoing retailer/affiliate providers have their own privacy and tracking
terms. Baggage, voltage, batteries and liquids still require journey-specific checks.
No accessory increases a ticket allowance or removes excess-baggage charges.

Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` and browser tests
with `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium`. Catalog tests cover all eight
categories, link validation, approval, safe fallbacks and price identity/freshness.
Browser tests cover filtering, sorting, navigation, external links, honest empty
states, keyboard-accessible controls, accessibility and 390/360-pixel layouts.

Live affiliate attribution, purchases, retailer prices and delivery availability are
not verified by automated tests. Before earning commission, the owner must supply
approved links and any required program disclosures. Verified prices remain optional.

## Review screenshots

- [Desktop: all 29 ideas](previews/travel-essentials-desktop.png)
- [Mobile: in-flight comfort category](previews/travel-essentials-mobile.png)
- [Mobile product-card detail](previews/travel-essentials-mobile-products.png)

## Validation record

Validated on 19 October 2026: 737 unit tests; 47 application browser tests including
all seven Travel Essentials cases and eleven luggage calculator cases; seven separate
Travelpayouts SDK-fixture tests; lint, TypeScript and production builds in API-demo
and primary Travelpayouts modes. The seven Essentials cases were also rerun against
the final primary build. Desktop1440 and mobile390/360 accessibility and overflow
checks passed after correcting hero-caption contrast. Existing-page HTTP smoke checks
passed. These checks do not verify live affiliate attribution, product prices or purchases.
