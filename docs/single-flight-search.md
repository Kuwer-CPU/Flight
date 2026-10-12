# Single flight search correction

## Customer experience

Travelpayouts White Label 23277 is the sole primary flight form on `/flights`. Flyora’s native trip form and its independently generated route/date summary are removed from the partner page. The primary homepage opens `/flights` directly; destination cards are explicitly route inspiration and do not append Flyora search parameters.

An independent student section below search keeps optional age, expected checked kilograms and the seller’s quoted included kilograms. Its local shortfall calculation never changes a partner itinerary or applies a student benefit. It contains no second flight form. The full travel calculator, student-benefit directory, Miles Wallet and travel checklist remain available. The native flight form is retained only in explicit API mode.

## Integration research

On 12 October 2026, the owner-supplied public entry script, its referenced public chunks and the deployed page returned HTTP 200 through the managed proxy. The deployed HTML confirmed the extra native form. This was a read-only source inspection, not a flight-price query.

The public configuration for WL 23277 has blank origin and destination. No NCE literal was found in the downloaded entry/main chunks. In a fresh browser context, the actual SDK displayed empty route and date inputs and `1 passenger`. Browser storage, URL state and geolocation are possible SDK inputs; the source of the user’s earlier NCE value was not established. Flyora does not overwrite or clear the provider’s controls or saved preferences.

The SDK contains internal configuration hooks, helper exports and URL/event handling. Those are not treated as a supported custom-form API. Official documentation requests remained blocked with CONNECT403, so no officially documented Flyora-form submission contract was verified. The supported supplied module and its own form handle searches; Flyora does not dispatch invented events, write into vendor fields or guess request parameters.

## Loading correction

The real module attaches open Shadow DOM to `tpwl-search`. The former light-DOM-only observer could miss a visible interface and show a false 20-second timeout. Readiness now observes the host and its open shadow root. A small discovery timer detects shadow-root attachment without patching `attachShadow` or modifying vendor nodes; it stops on readiness or when the flight page is inactive. Late rendering can recover a timeout. An error/retry button by itself does not count as a usable search field.

The persistent root surface retains the SDK containers during App Router navigation. It does not reload the module or call undocumented reinitialization functions. Reload remains the clean retry after a script failure.

## CSP correction

The shipped header previously allowed only `tpwidg.com`. The public SDK references additional resources. The updated CSP permits exact origins in the categories they require:

| Origin | Permission |
| --- | --- |
| `tpwidg.com` | Supplied SDK assets |
| `api.apistp.com` | Connections made by the SDK |
| `autocomplete.apistp.com` | Connections for place suggestions |
| `tickets-api.apistp.com` | SDK search-start connections |
| `www.apistp.com` | SDK geolocation connections |
| `img.avs.io` | Airline/seller images |
| `fonts.googleapis.com` | SDK-selected font stylesheet |

Flyora does not call these APIs directly. No broad wildcard, private credential or fictional data feed is added. The observed optional analytics collector `avsplow.com` is not enabled by default. Additional font-file, polling or booking-form destinations must be checked against actual authorized provider behavior; the existing validated `TRAVELPAYOUTS_RESOURCE_ORIGINS` setting can extend exact origins after that review.

## Verification and limits

The production build, lint, TypeScript and 552 unit tests pass. Five isolated browser regressions use an explicitly synthetic SDK with open shadow roots. They check one visible flight form, fixture-required field validation, independent age/baggage notes, origin/destination/date/passenger state across navigation, one initialization/download, conflicting legacy URLs, blocked-script reload, late rendering and button-only error placeholders. They also cover mobile layout and accessibility of Flyora’s wrapper with the fixture. The fixture’s NCE value is synthetic and is not claimed to be the WL configuration.

A separate limited test executes the actual downloaded public SDK. Cloud Chromium rejected the proxy certificate, so only public JavaScript assets were replayed through Node’s managed proxy with TLS verification retained. Provider API requests were left browser-owned and unchanged. No mock API response, price or booking link was injected. This confirmed a real shadow-root form, the expected trip controls, one entry-module request and retained departure draft/student notes after navigation through Miles Wallet, Student Benefits and Travel Checklist. No page JavaScript errors were observed.

Browser-owned font, geolocation, currency and autocomplete services failed with `ERR_TUNNEL_CONNECTION_FAILED`. Consequently, successful airport suggestion/selection, live fare search, returned offers, booking redirects, affiliate attribution and this new code’s deployed behavior remain unverified. The limited asset replay does not prove end-to-end live connectivity. All 29 retained native provider and student-tool browser tests also passed in a separate production API-demo build. Together with the five partner regressions, 34 browser cases passed; these remain distinct from live provider connectivity.

## Deployment check

Keep `FLIGHT_SEARCH_INTEGRATION=travelpayouts`, `TRAVELPAYOUTS_WHITE_LABEL_ID=23277`, `TRAVELPAYOUTS_EMBED_ENABLED=true` and `NEXT_PUBLIC_SITE_URL=https://flight-ten-steel.vercel.app`. Unset iframe-source variables for this module. Redeploy to apply the updated CSP; local environment changes do not update Vercel.

1. Open `/flights` in a fresh browser context. Confirm one partner flight form and the separate student section. Enter the trip directly in that form; check any restored preferences before searching.
2. Confirm airport suggestions/selection, future departure/return dates, traveler count and cabin using the actual partner UI.
3. Check Console/Network for CSP, access or provider failures. Review any additional required exact origins using the provider’s current documentation and actual responses.
4. Navigate to each student tool and return. The form should retain its state without another initialization or false loading error.
5. Run an actual search and verify an authorized seller handoff, final itinerary/currency/taxes/baggage and affiliate attribution without purchasing a ticket. Do not record a pending review as complete based only on mocked tests or configuration presence.

## Changed files

- [README.md](../README.md)
- [docs/deployment.md](../docs/deployment.md)
- [docs/flyora-v2-change-report.md](../docs/flyora-v2-change-report.md)
- [docs/flyora-v2.md](../docs/flyora-v2.md)
- [docs/launch-preparation.md](../docs/launch-preparation.md)
- [docs/single-flight-search.md](../docs/single-flight-search.md)
- [docs/travelpayouts-setup.md](../docs/travelpayouts-setup.md)
- [next.config.ts](../next.config.ts)
- [src/app/flights/partner-search.css](../src/app/flights/partner-search.css)
- [src/app/flyora-v2.css](../src/app/flyora-v2.css)
- [src/app/privacy/page.tsx](../src/app/privacy/page.tsx)
- [src/components/home.tsx](../src/components/home.tsx)
- [src/components/partner-flight-search.tsx](../src/components/partner-flight-search.tsx)
- [src/components/student-travel-planning.tsx](../src/components/student-travel-planning.tsx)
- [src/components/travelpayouts-widget.tsx](../src/components/travelpayouts-widget.tsx)
- [src/lib/partner-resource-origins.ts](../src/lib/partner-resource-origins.ts)
- [tests/e2e/travelpayouts-widget.spec.ts](../tests/e2e/travelpayouts-widget.spec.ts)
- [tests/unit/partner-csp.test.ts](../tests/unit/partner-csp.test.ts)

Cloud setup now saves the observed SDK hosts (`api.apistp.com`, `autocomplete.apistp.com`, `tickets-api.apistp.com`, `www.apistp.com`, `img.avs.io`, `fonts.googleapis.com`) and documentation hosts (`support.travelpayouts.com`, `www.travelpayouts.com`, `developers.travelpayouts.com`) in the environment draft, preserving the existing allowlist. Updated startup guidance records the single-form and Shadow DOM behavior. Draft saving does not apply network changes or publish the environment; review/save/publish is still required for those settings.
