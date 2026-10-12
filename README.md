# Flyora 2.0

A student travel website built with Next.js, React and TypeScript. Flight search remains the main experience; student airline benefits, a full travel-cost calculator, a Miles Wallet and an editable travel checklist help visitors plan before booking externally.

The primary flight-search integration is the Travelpayouts White Label module **23277**. Amadeus and the optional Skyscanner seller API remain available through an explicit API mode. Flyora does not collect ticket payments or issue tickets.

## Run locally

Use Node.js 24, or at least Node.js 22.18. From the folder containing `package.json`:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

On Windows, copy `.env.example` to `.env.local` using your file manager. Open the localhost address printed by Next.js and keep the terminal running. Amadeus credentials are unnecessary for a build or the primary Travelpayouts experience.

The tools work without a flight-provider account. Partner fares require the actual third-party module to load and the account/domain configuration to be valid. A local environment file does not change Vercel settings.

## Vercel configuration

Import `Kuwer-CPU/Flight` as a Next.js project. Use the repository root, Node.js 24, install command `npm ci` and build command `npm run build`. Add these values under **Project → Settings → Environment Variables** for the deployment environment, then redeploy:

```env
NEXT_PUBLIC_SITE_URL=https://flight-ten-steel.vercel.app
FLIGHT_SEARCH_INTEGRATION=travelpayouts
TRAVELPAYOUTS_WHITE_LABEL_ID=23277
TRAVELPAYOUTS_EMBED_ENABLED=true
TRAVELPAYOUTS_AFFILIATE_LINKS=true
FLYORA_ALLOW_INDEXING=false
```

Set `TRAVELPAYOUTS_AFFILIATE_LINKS=true` only if the partner agreement permits the intended affiliate use; otherwise use `false`. The flag declares link behavior and does not create an account, establish approval or guarantee commission.

**Remove or leave unset `TRAVELPAYOUTS_WHITE_LABEL_URL` and `TRAVELPAYOUTS_WIDGET_CODE` for this script module.** A populated value selects the separate hosted/iframe compatibility mode. Setting both sources is invalid.

Before a public commercial launch, also supply the actual `FLYORA_BUSINESS_NAME` and a working `FLYORA_CONTACT_EMAIL`. These details are optional for builds. Keep indexing disabled until the real partner, privacy, business and booking checks have passed. Public metadata, contact details and integration security headers require a rebuild/redeploy after configuration changes.

The URL above is the intended Vercel origin. This coding environment could not inspect the deployed site or retrieve the real module because the CONNECT proxy returned HTTP 403. Local mocked tests do not establish that the deployed widget, current prices, booking links or affiliate attribution work.

See [deployment instructions](docs/deployment.md), [Travelpayouts setup](docs/travelpayouts-setup.md) and the [Flyora 2.0 guide](docs/flyora-v2.md).

## What is implemented

| Page | Behavior |
| --- | --- |
| `/` | Student travel homepage, worldwide route planning and links to the four tools |
| `/flights` | Primary Travelpayouts search module; externally handled results and booking |
| `/student-benefits` | Searchable airline directory with policy-review status, official sources and eligibility fields |
| `/travel-calculator` | Compare 2–4 manually entered ticket, baggage, transfer, insurance and other costs in one currency |
| `/miles-wallet` | Browser-local manual loyalty balances, entered expiry dates and a cash-versus-miles value calculator |
| `/travel-checklist` | Generate, edit, complete, add, remove, print and clear general travel reminders |
| `/student-perks` | Retained earlier program-directory route |

Student policy leads remain unverified. The directory displays “Confirm with airline” and “Not verified” rather than inventing numerical benefits or review dates. The calculator does not modify partner fares; unknown necessary bag charges keep an option pending. Its optional monetary example is explicitly hypothetical.

Wallet balances and checklist progress are manual records saved in this browser. There is no airline login, automatic balance sync, redemption purchase, cloud account or cross-device backup. The calculator does not persist entries. Browser storage can be cleared using each tool's controls or the browser's site-data settings.

## Worldwide route planning

The bundled catalog supports searching 5,332 airports across 235 countries and territories by city, airport name, country or IATA code. This enables worldwide route inputs; it does not guarantee provider coverage of every route, airline, seller or fare. See [airport sources and refresh instructions](docs/airport-data.md).

The Flyora form is a planning summary. No verified module-prefill contract is implemented: check route, dates, traveler count and cabin in the partner interface. Student eligibility and baggage must be confirmed for the fare and booking channel actually chosen.

## Optional API experience

Set `FLIGHT_SEARCH_INTEGRATION=api` to use the retained native flight cards. This mode defaults to live Amadeus production and needs matching server-side `AMADEUS_API_KEY` and `AMADEUS_API_SECRET` for searches. It still builds without those credentials; searches fail clearly rather than substituting fictional fares.

For deliberate API demonstrations, use `FLIGHT_DATA_MODE=demo`. For Amadeus sandbox responses, use `FLIGHT_DATA_MODE=live` and `AMADEUS_ENVIRONMENT=test` with test credentials. Both are visibly labeled and must not be presented as bookable production prices.

The optional Skyscanner adapter requires approved partner access, its own server key and a confirmed price basis. It can compare returned airline/agency seller quotes, but ordinary Amadeus fares alone are not a confirmed airline-website selling price. See [Amadeus setup](docs/live-flight-search.md) and [seller comparison requirements](docs/seller-price-comparison.md). These API settings do not drive the primary Travelpayouts module.

Never place private credentials in source files or `NEXT_PUBLIC_` variables. White Label ID 23277 is a public module identifier, not an API secret or proof of account ownership.

## Validation and launch review

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Browser tests use an explicit API demo server for the retained flow and local tools. Install Chromium with `npx playwright install chromium`, then run `npm run test:e2e`. On this cloud machine use `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium`. Primary-module browser tests intercept the SDK with a local fixture; they verify mounting, route behavior, failures and privacy disclosures without verifying the actual SDK or live fares. See [Flyora 2.0 validation boundaries](docs/flyora-v2.md).

`npm run launch:check` performs an offline configuration and recorded-evidence audit. `npm run check:deployment -- <public-origin> --expect-integration=travelpayouts` inspects public HTTP responses and `/api/integration-status` without executing the SDK or searching flights. `/api/status` describes only the retained API provider and is checked when API mode is selected. Neither command certifies commercial approval, student policies, actual fares or ticket issuance. Review [launch preparation](docs/launch-preparation.md) and the [launch checklist](docs/launch-checklist.md).

The GitHub workflow runs repository validation; it does not deploy or activate a paid service. Hosting eligibility, commercial-use terms, quotas and affiliate permissions remain owner responsibilities. Current configuration and mocked tests do not establish a live commercial launch.

## Project map

| Location | Contents |
| --- | --- |
| `src/lib/flight-integration.ts` | Primary Travelpayouts configuration and explicit API selection |
| `src/components/partner-flight-search.tsx` | Partner search UI and customer notices |
| `src/lib/student-benefits.ts` | Structured policy leads and honest verification states |
| `src/lib/travel-cost.ts` | Manual expense validation and integer-cent comparison |
| `src/lib/miles-wallet.ts` | Bounded browser-local wallet data and redemption math |
| `src/lib/travel-checklist.ts` | General reminders, trip validation and local saved-list recovery |
| `src/lib/amadeus.ts`, `src/lib/skyscanner.ts` | Retained optional API adapters |
| `src/lib/booking-offers.ts` | Quote-specific booking-link and seller validation in API mode |
| `docs/flyora-v2.md` | Product behavior, deployment settings and verification limits |
| `docs/launch-preparation.md` | Independent preparation and outstanding owner requirements |
| `.github/workflows/ci.yml` | Repeatable installation, lint, unit, build, type and browser checks |
| `tests` | Unit and browser regressions; provider fixtures are simulated |

Flyora has no native accounts or ticket checkout. The primary partner module executes third-party JavaScript in the page context after visiting flight search and may use cookies or affiliate tracking. Once loaded it may remain mounted during SPA navigation. Review the partner's current terms and the site's privacy disclosure before public launch.
