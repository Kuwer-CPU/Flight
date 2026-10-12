# Flyora 2.0 change report

This records the initial 2.0 release. The later [single-flight-search correction](single-flight-search.md) removes its duplicate planning/search forms and updates SDK readiness and CSP.

The existing Next.js App Router/TypeScript application is preserved. Flyora retains its search form, worldwide airport directory, global cream/green/lime design, saved flights, flight itinerary/details, baggage breakdown, student-value comparisons and independent Amadeus/Skyscanner adapters.

## Delivered behavior

- `/flights` defaults to Travelpayouts White Label **23277**, using the owner-supplied module and the separate search/results containers. It never routes this experience through the unconfigured Amadeus adapter or substitutes demo cards when loading fails.
- One persistent root surface keeps the partner containers across client navigation. Only visible search controls resolve the initialization notice; a script load alone does not verify results. Failure or timeout offers full-page retry.
- Existing custom cards and provider adapters remain available through deliberate `FLIGHT_SEARCH_INTEGRATION=api`. Their demo/sandbox labels and booking boundaries are retained; the widget's private fare data is not extracted.
- `/student-benefits` searches 30 airline research leads with official sources and explicit policy states. Initial claims remain unverified; unknown terms and review dates are not invented.
- `/travel-calculator` compares 2–4 entered quotes with baggage, transfers, insurance and other costs. Unquoted required baggage stays pending, and changing currency clears money values without claiming conversion.
- `/miles-wallet` holds manual browser-local balances, expiry/update dates and notes, plus an illustrative cash-versus-miles calculation. No airline account connection or live award availability is implied.
- `/travel-checklist` generates general reminders with editable items, completion, custom reminders, printing and local storage. Official links accompany country guidance; immigration eligibility is not determined.
- Homepage and five-tool navigation communicate the expanded student travel model while preserving Flyora branding. Privacy/terms, safe integration status, indexing controls, launch/deployment checks, CI and setup documentation are updated.

## Production configuration

Set these in **Vercel → Project → Settings → Environment Variables**, then redeploy:

```env
NEXT_PUBLIC_SITE_URL=https://flight-ten-steel.vercel.app
FLIGHT_SEARCH_INTEGRATION=travelpayouts
TRAVELPAYOUTS_WHITE_LABEL_ID=23277
TRAVELPAYOUTS_EMBED_ENABLED=true
FLYORA_ALLOW_INDEXING=false
```

Unset `TRAVELPAYOUTS_WHITE_LABEL_URL` and `TRAVELPAYOUTS_WIDGET_CODE` for the supplied module transport. The affiliate flag is optional and does not establish successful tracking; use it only under permitted current terms. No Amadeus key/secret is required for the primary flow or builds. Public business/contact details remain owner configuration.

`TRAVELPAYOUTS_RESOURCE_ORIGINS` optionally accepts approved exact HTTPS dependency origins, separated by commas. The CSP allows the supplied `tpwidg.com` source. Its other actual dependencies could not be inspected here; confirm them in an authorized deployed browser and current provider documentation before extending the allowlist. No guessed endpoints or broad wildcards are inserted.

The tracked `.env.example` documents the production origin. An ignored local `.env.local` holds only approved public settings for local validation. Neither this file nor saved cloud settings change Vercel.

## Validation

Local validation on 12 October 2026:

| Check | Outcome |
| --- | --- |
| Locked installation | `npm ci` completed; no provider credentials present |
| Lint | `npm run lint` passed |
| TypeScript | `npm run typecheck` passed |
| Unit tests | 531 tests passed in 21 files |
| Native flight/student browser coverage | All 29 unique cases verified; 28 passed in the full run, then all 4 worldwide cases passed after scoping two locators to visible accessible content |
| Travelpayouts browser wrapper | 3 module-fixture cases passed, including one successful module request/init, navigation retention, blocked retry, late-load timeout and mobile accessibility |
| Production builds | Primary Travelpayouts and explicitly selected API-demo builds passed without API credentials |
| Local response checks | 13 primary-integration routes/responses passed; no provider search was made |
| Visual review | Homepage and four tools captured on desktop/mobile; no horizontal overflow or page errors detected |

The browser counts describe distinct cases across the full and targeted runs, not a claim of a single 32-test run. The automated accessibility checks found and resolved low-contrast labels; they do not certify the real provider widget. The offline launch audit still requires actual business/contact information and six external review records.

The real SDK and deployed Vercel origin both returned CONNECT proxy HTTP 403 in this managed environment. SDK browser fixtures validate Flyora's mounting/navigation/failure wrapper, not actual prices, available sellers, booking handoffs or affiliate attribution. The actual deployed integration remains a separate verification step.

## Test after deployment

1. Open `https://flight-ten-steel.vercel.app/flights` on desktop and mobile. Confirm actual partner controls appear and the initialization/error notice resolves appropriately. Check browser Console/Network for blocked CSP resources or provider errors.
2. Confirm one `tpwl-search`, one `tpwl-tickets`, one module script and one successful module fetch on a fresh document. Navigate through each student tool using the header, then return to Flights; its state should remain without another initialization.
3. Enter or confirm the route, dates, passengers and cabin inside the partner interface. The Flyora planning summary is not a verified partner-prefill contract.
4. Run a real search and verify the correct itinerary, currency, baggage conditions, taxes/fees, seller and final booking destination without buying a ticket. Partner results remain separate from Flyora's custom cards.
5. Block the module request and reload. Confirm the clear error/reload path and absence of invented prices or `/api/flights` fallback. Re-enable the module and reload to retry.
6. Check the student directory, manual calculator, wallet persistence/deletion and editable checklist. Confirm current airline eligibility directly with official sources; do not count an unverified student extra as included baggage.
7. Verify actual domain/account authorization, affiliate attribution and provider privacy/consent requirements. These are not established by local tests or `configured` status.

## Exact changed files

- [.env.example](../.env.example)
- [.github/workflows/ci.yml](../.github/workflows/ci.yml)
- [AGENTS.md](../AGENTS.md)
- [README.md](../README.md)
- [docs/deployment.md](../docs/deployment.md)
- [docs/flyora-v2-change-report.md](../docs/flyora-v2-change-report.md)
- [docs/flyora-v2.md](../docs/flyora-v2.md)
- [docs/launch-preparation.md](../docs/launch-preparation.md)
- [docs/travelpayouts-setup.md](../docs/travelpayouts-setup.md)
- [eslint.config.mjs](../eslint.config.mjs)
- [next.config.ts](../next.config.ts)
- [package-lock.json](../package-lock.json)
- [package.json](../package.json)
- [playwright.config.ts](../playwright.config.ts)
- [scripts/check-deployment.mjs](../scripts/check-deployment.mjs)
- [scripts/launch-check.mjs](../scripts/launch-check.mjs)
- [src/app/api/integration-status/route.ts](../src/app/api/integration-status/route.ts)
- [src/app/contact/page.tsx](../src/app/contact/page.tsx)
- [src/app/error.tsx](../src/app/error.tsx)
- [src/app/flights/page.tsx](../src/app/flights/page.tsx)
- [src/app/flights/partner-search.css](../src/app/flights/partner-search.css)
- [src/app/flyora-v2.css](../src/app/flyora-v2.css)
- [src/app/layout.tsx](../src/app/layout.tsx)
- [src/app/miles-wallet/page.tsx](../src/app/miles-wallet/page.tsx)
- [src/app/miles-wallet/wallet.css](../src/app/miles-wallet/wallet.css)
- [src/app/not-found.tsx](../src/app/not-found.tsx)
- [src/app/page.tsx](../src/app/page.tsx)
- [src/app/privacy/page.tsx](../src/app/privacy/page.tsx)
- [src/app/robots.ts](../src/app/robots.ts)
- [src/app/sitemap.ts](../src/app/sitemap.ts)
- [src/app/student-benefits/benefits.css](../src/app/student-benefits/benefits.css)
- [src/app/student-benefits/page.tsx](../src/app/student-benefits/page.tsx)
- [src/app/student-perks/page.tsx](../src/app/student-perks/page.tsx)
- [src/app/terms/page.tsx](../src/app/terms/page.tsx)
- [src/app/travel-calculator/calculator.css](../src/app/travel-calculator/calculator.css)
- [src/app/travel-calculator/page.tsx](../src/app/travel-calculator/page.tsx)
- [src/app/travel-checklist/checklist.css](../src/app/travel-checklist/checklist.css)
- [src/app/travel-checklist/page.tsx](../src/app/travel-checklist/page.tsx)
- [src/components/flight-search-surface.tsx](../src/components/flight-search-surface.tsx)
- [src/components/home.tsx](../src/components/home.tsx)
- [src/components/miles-wallet.tsx](../src/components/miles-wallet.tsx)
- [src/components/partner-flight-search.tsx](../src/components/partner-flight-search.tsx)
- [src/components/perks.tsx](../src/components/perks.tsx)
- [src/components/results.tsx](../src/components/results.tsx)
- [src/components/saved-provider.tsx](../src/components/saved-provider.tsx)
- [src/components/search-form.tsx](../src/components/search-form.tsx)
- [src/components/shell.tsx](../src/components/shell.tsx)
- [src/components/student-benefits.tsx](../src/components/student-benefits.tsx)
- [src/components/tool-page.tsx](../src/components/tool-page.tsx)
- [src/components/travel-calculator.tsx](../src/components/travel-calculator.tsx)
- [src/components/travel-checklist.tsx](../src/components/travel-checklist.tsx)
- [src/components/travelpayouts-widget.tsx](../src/components/travelpayouts-widget.tsx)
- [src/components/ui.tsx](../src/components/ui.tsx)
- [src/lib/flight-integration.ts](../src/lib/flight-integration.ts)
- [src/lib/miles-wallet.ts](../src/lib/miles-wallet.ts)
- [src/lib/partner-resource-origins.ts](../src/lib/partner-resource-origins.ts)
- [src/lib/site-config.ts](../src/lib/site-config.ts)
- [src/lib/student-benefits.ts](../src/lib/student-benefits.ts)
- [src/lib/travel-checklist.ts](../src/lib/travel-checklist.ts)
- [src/lib/travel-cost.ts](../src/lib/travel-cost.ts)
- [tests/e2e/accessibility.spec.ts](../tests/e2e/accessibility.spec.ts)
- [tests/e2e/flights.spec.ts](../tests/e2e/flights.spec.ts)
- [tests/e2e/flyora-v2.spec.ts](../tests/e2e/flyora-v2.spec.ts)
- [tests/e2e/student-comparison.spec.ts](../tests/e2e/student-comparison.spec.ts)
- [tests/e2e/travelpayouts-widget.spec.ts](../tests/e2e/travelpayouts-widget.spec.ts)
- [tests/e2e/worldwide-search.spec.ts](../tests/e2e/worldwide-search.spec.ts)
- [tests/unit/check-deployment.test.mjs](../tests/unit/check-deployment.test.mjs)
- [tests/unit/flight-integration.test.ts](../tests/unit/flight-integration.test.ts)
- [tests/unit/integration-status.test.ts](../tests/unit/integration-status.test.ts)
- [tests/unit/launch-check.test.mjs](../tests/unit/launch-check.test.mjs)
- [tests/unit/miles-wallet.test.ts](../tests/unit/miles-wallet.test.ts)
- [tests/unit/partner-resource-origins.test.ts](../tests/unit/partner-resource-origins.test.ts)
- [tests/unit/site-config.test.ts](../tests/unit/site-config.test.ts)
- [tests/unit/student-benefits.test.ts](../tests/unit/student-benefits.test.ts)
- [tests/unit/travel-checklist.test.ts](../tests/unit/travel-checklist.test.ts)
- [tests/unit/travel-cost.test.ts](../tests/unit/travel-cost.test.ts)
- [tests/unit/travelpayouts-widget-config.test.ts](../tests/unit/travelpayouts-widget-config.test.ts)
