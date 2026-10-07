# Flyora

A student-focused flight-search website built with Next.js, React and TypeScript. Travelers search routes and dates, compare ticket prices and included baggage, save a shortlist, inspect itineraries, and continue to an airline to book.

## Run locally

Requires Node.js 22 or later. Node.js 24 is used in the cloud environment.

    npm ci
    npm run dev

Open the address printed by Next.js. The default mode is a clearly labeled preview with generated sample flights. No API key, database or paid service is needed to try it.

## Launch on Vercel

1. Push these application files to your Flight repository.
2. Import the repository in Vercel. Select Next.js as the framework; use Node.js 24, the default repository root, install command npm ci and build command npm run build.
3. Add NEXT_PUBLIC_SITE_URL with your deployed HTTPS origin, without a trailing slash. This sets canonical metadata and the sitemap.
4. Leave FLIGHT_DATA_MODE=demo to publish a labeled demonstration, or connect production flight data as described below.
5. Deploy. Test a route search and the airline booking handoff on your deployed domain.

The website has not been deployed by this coding task. Deployment to a hosting account is a separate action.

Any Node.js hosting platform can also use:

    npm ci
    npm run build
    npm start

Set PORT if your hosting platform requires it. This app needs a Next.js/Node runtime because flight credentials stay on the server; do not host it as a plain static export.

## Connect live flight search

Create an Amadeus for Developers account and a Flight Offers Search application. Enter credentials securely in your hosting provider’s environment settings, or in an ignored .env.local file for development. Never put credentials in source files or NEXT_PUBLIC variables.

The .env.example file documents these settings:

| Variable | Purpose |
| --- | --- |
| FLIGHT_DATA_MODE | demo for sample flights; live to enable the provider |
| AMADEUS_ENVIRONMENT | test for sandbox data; production for production data |
| AMADEUS_API_KEY | Server-side Amadeus client ID |
| AMADEUS_API_SECRET | Server-side Amadeus client secret |
| NEXT_PUBLIC_SITE_URL | Your public HTTPS site origin |

For sandbox testing, use FLIGHT_DATA_MODE=live and AMADEUS_ENVIRONMENT=test with your test credentials. Results are labeled “Provider sandbox” and are not bookable production tickets.

For real fares, obtain Amadeus production access, use production credentials, and set AMADEUS_ENVIRONMENT=production and FLIGHT_DATA_MODE=live. Restart or redeploy after changing variables. Amadeus Self-Service coverage does not include every airline, route, special student fare or booking channel.

The server requests an OAuth token, then Flight Offers Search. Tokens and search results are cached briefly in memory; keys never reach the browser. Missing credentials and provider failures produce explicit errors instead of substituting sample results. Allow HTTPS egress to test.api.amadeus.com and api.amadeus.com when using a restricted cloud environment.

Real provider access could not be exercised during development because credentials were not available. The adapter is tested against mocked provider responses, including authentication failures, caching and baggage normalization.

## Booking model

This version uses an airline handoff: “Continue to airline” opens the airline’s website, where the traveler searches the itinerary, confirms eligibility and fare conditions, pays, and receives the ticket. It does not reserve an offer or prefill an airline cart, issue tickets, or process payments. Displayed offers can change before purchase.

The website does not yet earn affiliate revenue. Add approved affiliate deep links in src/lib/airlines.ts after joining a booking partner’s program. On-site ticket issuance would require a separate booking-provider integration, passenger collection, payment flow, order storage and booking lifecycle support; there is no simulated checkout or fake purchase confirmation.

## Student baggage and fares

Student-program links are in src/lib/airlines.ts. Current terms could not be retrieved from the cloud’s restricted network during development, so every listed program is visibly marked as needing review. Links themselves also need review before a commercial launch. No program is represented as a verified discount, guaranteed age eligibility or extra baggage allowance.

Displayed baggage comes from the flight offer. The minimum known allowance across all travelers and segments is shown; pieces are never converted into an invented weight. Unverified student benefits are not added to flight fares or baggage. Recommendations compare price, total outbound/return travel time and confirmed baggage that meets the traveler’s needs.

Before advertising specific student savings, review the official airline terms for the relevant route, fare, age, registration and verification conditions, then extend the data model with source URLs and actual review dates. Student offers can require booking through a different channel from ordinary provider fares.

## Validation

    npm run typecheck
    npm test
    npx playwright install chromium
    npm run test:e2e
    npm run build

If a system Chromium is already installed, use its absolute path:

    PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e

Browser tests cover search, sorting, baggage and stop filters, round-trip/one-way selection, adult counts, saved-flight persistence, mobile layout, booking handoffs, provider errors and empty states. Unit tests cover input validation, pricing and baggage comparisons, and the Amadeus adapter.

## Project map

| Location | Contents |
| --- | --- |
| src/app | Pages, metadata and server-side search/status endpoints |
| src/components | Search form, results, booking details, saved flights and layout |
| src/lib/amadeus.ts | Server-side provider authentication and offer normalization |
| src/lib/demo.ts | Deterministic sample offers, marked as preview data |
| src/lib/search.ts | Validation, query serialization and recommendation sorting |
| src/lib/airports.ts | Supported airports and time zones; add more here |
| src/lib/airlines.ts | Airline identities, official websites and student-program links |
| public | Original local SVG artwork; fonts are served locally from an npm package |
| tests | Unit and browser checks |

There are no accounts, payments, analytics or tracking cookies. Saved flights stay in the visitor’s browser. Flight API rate limiting and caches are per process; a higher-traffic or multi-instance deployment should add a shared rate-limit store and provider monitoring. Review privacy/terms copy for your business identity before a commercial launch.
