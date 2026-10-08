# Flyora

A student-focused flight-search website built with Next.js, React and TypeScript. Travelers search routes worldwide, compare baggage and student benefits, inspect returned airline/travel-agency quotes for the same flight, save a shortlist and continue to the chosen seller’s booking link. Real price-feed access and verified student terms are launch prerequisites.

Preview screenshots: [Homepage](docs/previews/homepage.png), [student comparison](docs/previews/comparison.png), and [mobile flight card](docs/previews/mobile-flight.png). Also see [worldwide airport search](docs/previews/worldwide-search.png) and [global destinations](docs/previews/worldwide-destinations.png). These screenshots show the labeled demo mode, not verified airline offers.

## Run locally

Requires Node.js 22 or later. Node.js 24 is used in the cloud environment.

    npm ci
    npm run dev

Open the address printed by Next.js. Flight search now defaults to Amadeus production. Create `.env.local` from `.env.example` and add the matching production credentials as described in [Connect real flight search](docs/live-flight-search.md). Without credentials, the site loads but search reports that it is not connected. To intentionally explore fictional sample flights without an account, set `FLIGHT_DATA_MODE=demo` in `.env.local` and restart.

## Launch on Vercel

1. Push these application files to your Flight repository.
2. Import the repository in Vercel. Select Next.js as the framework; use Node.js 24, the default repository root, install command npm ci and build command npm run build.
3. Add NEXT_PUBLIC_SITE_URL with your deployed HTTPS origin, without a trailing slash. This sets canonical metadata and the sitemap.
4. Choose your approved feed. For Amadeus fares, add `FLIGHT_DATA_MODE=live`, `FLIGHT_PROVIDER=amadeus`, `AMADEUS_ENVIRONMENT=production` and matching server-side credentials. For airline/agency price comparison, follow the partner settings and contract validation in [seller-price-comparison.md](docs/seller-price-comparison.md). Set `FLIGHT_DATA_MODE=demo` only for a labeled demonstration.
5. Deploy. Test actual searches and each returned seller handoff on your deployed domain before opening it to customers.

The website has not been deployed by this coding task. Deployment to a hosting account is a separate action.

Any Node.js hosting platform can also use:

    npm ci
    npm run build
    npm start

Set PORT if your hosting platform requires it. This app needs a Next.js/Node runtime because flight credentials stay on the server; do not host it as a plain static export.

## Worldwide airport search

The From and To fields search 5,332 airports across 235 countries and territories. Enter a city, airport name, country, or three-letter IATA code, then choose an airport suggestion. Keyboard users can use arrow keys and Enter; a complete airport code can be selected directly with Enter. Replacing a selected name clears its airport code so an unfinished edit cannot silently submit the old route.

The airport catalog covers every inhabited continent. Example searches include New York–Tokyo, São Paulo–Cape Town, Sydney–Singapore, Toronto–Mexico City and Nairobi–London. It is bundled with the application, so airport lookup works without a provider account or a separate locations API. Airport and timezone data sources, licenses and refresh instructions are documented in [docs/airport-data.md](docs/airport-data.md).

This enables worldwide route inputs; actual flight availability is determined by the flight provider. An airport being in the catalog is not a guarantee that a particular airline serves it. Preview routes use visibly labeled generated flights. Live search requires the selected provider's approved credentials and production access; coverage does not include every airline, fare or route worldwide.

## Connect live flight search

For airline/OTA seller comparison, see [docs/seller-price-comparison.md](docs/seller-price-comparison.md). An approved partner feed is required; an ordinary Amadeus fare is not the airline website’s confirmed selling price. Before launch, complete [docs/launch-checklist.md](docs/launch-checklist.md).

Step-by-step account, local setup, hosting and troubleshooting instructions: [docs/live-flight-search.md](docs/live-flight-search.md).

Create an Amadeus for Developers account and a Flight Offers Search application. Enter credentials securely in your hosting provider’s environment settings, or in an ignored .env.local file for development. Never put credentials in source files or NEXT_PUBLIC variables.

The .env.example file documents these settings:

| Variable | Purpose |
| --- | --- |
| FLIGHT_DATA_MODE | live by default; demo only for intentional fictional previews |
| FLIGHT_PROVIDER | amadeus by default; skyscanner for the optional multi-seller partner feed |
| AMADEUS_ENVIRONMENT | production by default; test for matching sandbox credentials |
| AMADEUS_API_KEY | Server-side Amadeus client ID |
| AMADEUS_API_SECRET | Server-side Amadeus client secret |
| NEXT_PUBLIC_SITE_URL | Your public HTTPS site origin |

For sandbox testing, use FLIGHT_DATA_MODE=live and AMADEUS_ENVIRONMENT=test with your test credentials. Results are labeled “Provider sandbox” and are not bookable production tickets.

For real fares, obtain Amadeus production access, use production credentials, and set AMADEUS_ENVIRONMENT=production and FLIGHT_DATA_MODE=live. Restart or redeploy after changing variables. Amadeus Self-Service coverage does not include every airline, route, special student fare or booking channel.

The server requests an OAuth token, then Flight Offers Search. Tokens and search results are cached briefly in memory; keys never reach the browser. Missing credentials, invalid settings and provider failures produce explicit errors instead of substituting sample results. `/api/status` exposes safe configuration status without any credentials; `configured` means values are present, not that authentication was verified. Successful live results show their retrieval timestamp. Malformed rows are isolated, and baggage stays unknown unless every traveler and segment is covered. Allow HTTPS egress to test.api.amadeus.com and api.amadeus.com when using a restricted cloud environment.

Real provider access has not been exercised because credentials are not available. The adapter is tested against mocked provider responses, including production/test hosts, missing and invalid settings, authentication and rate-limit failures, caching, malformed responses and baggage normalization. Browser tests simulate production offers to verify their display; they do not establish provider access.

## Booking model

When a partner feed returns priced seller links, flight details compare those airline and travel-agency quotes and link to the chosen offer. The headline price is the lowest accepted returned seller quote. Coverage may be incomplete and no universal lowest-price claim is made. Without a quote-specific link, a known airline’s website is offered only as a clearly labeled search handoff; its price is unconfirmed. Unknown airlines with no booking link return to Flyora search. This version does not reserve offers, issue tickets or process payments. Final fares and conditions are confirmed by the seller.

The website does not yet earn affiliate revenue. Join permitted affiliate programs and follow their tracking and disclosure requirements. Do not modify provider quote links without permission under the partner contract. On-site ticket issuance would require a separate booking-provider integration, passenger collection, payment flow, order storage and booking lifecycle support; there is no simulated checkout or fake purchase confirmation.

## Student baggage and fares

Student-program links are in src/lib/airlines.ts. Current terms could not be retrieved from the cloud’s restricted network during development, so every listed program is visibly marked as needing review. Links themselves also need review before a commercial launch. No program is represented as a verified discount, guaranteed age eligibility or extra baggage allowance.

The homepage leads with a fictional Airline A/B example showing why a €610 fare with sufficient baggage can beat a €545 fare plus a €95 bag add-on. Search results put a comparison table above the flights and a prominent baggage equation on each card and itinerary dialog. Registration and student verification requirements are visible beside the allowance.

Displayed standard baggage comes from the flight offer. The minimum known allowance across all travelers and segments is shown; pieces are never converted into an invented weight. Demo flights also have explicitly fictional student bonuses and bag add-on prices to demonstrate this comparison. Every numerical example is labeled as an illustration rather than actual airline policy. These inputs are only accepted for demo-mode offers; the comparison code discards them for both live and Amadeus sandbox offers. Actual student terms remain unverified, with eligible totals and student scores shown as pending.

Student value is the default sort for student searches. It weights cost with the requested baggage at 40%, included baggage coverage at 45%, and combined outbound/return travel time at 15%. Cost and time are relative to the cheapest comparable cost and shortest journey in the full search; filters do not change the scores. Baggage coverage is capped at the traveler's request. Costs are per adult; paid packages are rounded up to meet the shortfall, and the original ticket fare is unchanged. The example add-on quotes cover the complete itinerary. Unknown allowances or necessary add-on prices, and mixed currencies, leave scores pending rather than inventing a cost. The interface includes an explanation of the calculation.

Before advertising specific student savings, review the official airline terms for the relevant route, fare, age, registration and verification conditions, then extend the data model with source URLs and actual review dates. Student offers can require booking through a different channel from ordinary provider fares.

## Validation

    npm run typecheck
    npm test
    npx playwright install chromium
    npm run test:e2e
    npm run build

If a system Chromium is already installed, use its absolute path:

    PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e

Browser tests cover worldwide city/code/country search, keyboard and touch airport selection, search validation, sorting, student comparisons and score explanations, baggage and stop filters, round-trip/one-way selection, adult counts, saved-flight persistence, mobile layout, accessibility, booking handoffs, provider errors and empty states. Unit tests cover input validation, pricing and baggage comparisons, student-value calculations, separation of fictional and live benefits, and the Amadeus and optional seller-feed adapters.

## Project map

| Location | Contents |
| --- | --- |
| src/app | Pages, metadata and server-side search/status endpoints |
| src/components | Search form, results, booking details, saved flights and layout |
| src/lib/amadeus.ts | Server-side Amadeus authentication and offer normalization |
| src/lib/skyscanner.ts | Optional partner API polling and multi-seller quote normalization |
| src/lib/booking-offers.ts | Safe quote links and seller comparison validation |
| docs/launch-checklist.md | Business, data, student terms and production launch prerequisites |
| src/lib/demo.ts | Deterministic sample offers, marked as preview data |
| src/lib/search.ts | Validation, query serialization and recommendation sorting |
| src/lib/student-value.ts | Eligible baggage, comparable costs and transparent student value scores |
| src/lib/airports.ts | Worldwide airport lookup and city, name, country and IATA search |
| src/data/airports.json | Sourced worldwide airport catalog with coordinates and time zones |
| scripts/build-airport-catalog.mjs | Reproducible airport catalog generation from upstream downloads |
| src/lib/airlines.ts | Airline identities, official websites and student-program links |
| public | Original local SVG artwork; fonts are served locally from an npm package |
| tests | Unit and browser checks |

There are no accounts, payments, analytics or tracking cookies. Saved flights stay in the visitor’s browser. Flight API rate limiting and caches are per process; a higher-traffic or multi-instance deployment should add a shared rate-limit store and provider monitoring. Review privacy/terms copy for your business identity before a commercial launch.
