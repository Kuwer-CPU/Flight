# White Label 23277 CSP fix

The owner's live Microsoft Edge console reported that Flyora blocked these widget requests while results remained on “Searching at providers”:

- `https://tickets-api.eu-north-1.apistp.com/search/wl/results`
- `https://avsplow.com/a/j`

`next.config.ts` generates the application's response CSP through `headers()` for `/:path*`. No additional repository middleware, hosting-header file or HTML CSP was found. The live `/flights` response before this fix also omitted both hosts. Allowing `tickets-api.apistp.com` does not permit the different regional hostname.

## Narrow permissions and evidence

| Directive | Added exact HTTPS origin | Evidence |
| --- | --- | --- |
| `connect-src` | `https://tickets-api.eu-north-1.apistp.com` | Owner's actual Edge results-polling CSP violation; the SDK chooses its results host from a provider response |
| `connect-src` | `https://avsplow.com` | Owner's Edge violation, corroborated by the public SDK's analytics collector configuration |
| `font-src` | `https://fonts.gstatic.com` | Font-file URLs in the fetched Inter stylesheet referenced by the widget |

On 12 October 2026, the owner-provided SDK's public chunks, the [official widget setup guide](https://support.travelpayouts.com/hc/en-us/articles/26857907357458-Setting-up-a-White-Label-with-Widget-type), and the [referenced Inter stylesheet](https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap) returned HTTP 200 through the managed proxy with normal TLS verification. The guide documents the widget containers but supplies no exhaustive CSP endpoint list. The stylesheet references `fonts.gstatic.com`; font binaries were not fetched. These source checks did not submit flight searches or analytics events.

The two connection hosts receive no script, style, image, font, frame or form permission. The font host receives only font permission. No wildcard, general `https:` allowance, guessed region or unused documentation-example script host is added. Existing security headers and directives remain in place. Extra SDK permissions stay conditional on configured script mode, so API, disabled, invalid and approved-iframe configurations preserve their existing restrictions.

The global document header supports homepage-to-Flights client navigation: the browser retains the initial document's CSP. This fix changes no widget controls, provider integration, student tools or booking flow. It introduces no fictional fares or failure fallback. The analytics collector is separate from the results API; allowing it does not establish that analytics requests succeed or that fare retrieval is working.

## Validation

- The new connection regression assertions failed against the previous allowlist and passed after the change.
- `npm run lint`, `npm run typecheck`, `npm test` and the primary Travelpayouts production build passed. The unit suite ran 557 tests across 22 files, including 26 CSP cases.
- Seven partner browser regressions passed against the production server. Two new cases exercise Chromium's actual CSP enforcement on direct `/flights` entry and homepage-to-Flights navigation. Intercepted 204 responses demonstrate that requests to the exact results/collector URLs pass CSP; an unreviewed test host still produces a `connect-src` violation. Five existing cases preserve the single form, student-tool navigation, mobile wrapper and controlled failures.
- The read-only deployment checker passed all 13 local response checks. It performs no flight searches.

The browser SDK fixture and intercepted transport probes contain no live fares or bookings and do not contact those provider endpoints. They prove the application policy permits the evidenced destinations, rather than proving successful provider responses, airport selection, completed searches, booking handoffs or affiliate attribution.

## Deployment and live verification

No new environment variable or credential is required. Keep the existing primary script configuration: `FLIGHT_SEARCH_INTEGRATION=travelpayouts`, `TRAVELPAYOUTS_WHITE_LABEL_ID=23277`, `TRAVELPAYOUTS_EMBED_ENABLED=true`, blank iframe-source variables, and `NEXT_PUBLIC_SITE_URL=https://flight-ten-steel.vercel.app`.

Deploy the fix from GitHub `main` in Vercel. A local `.env` update does not update Vercel; the changed build-time response header requires a new deployment. Hard-reload or open a fresh Edge tab after it completes, since an already-open document retains the old CSP.

1. In Network, inspect the document response header for both `/` and `/flights`. Confirm the two exact connection entries and the `fonts.gstatic.com` font entry, without wildcard permissions. Check for an additional, more restrictive CSP added outside the repository.
2. Choose airports, future dates and passengers in the actual Travelpayouts form. Submit a search and inspect Console/Network: the regional results and collector requests should no longer be blocked by Flyora's `connect-src`. Confirm actual results or the provider's explicit error/empty state.
3. Navigate to the student tools and back. Confirm one partner form, retained controls and normal Miles Wallet, benefits and checklist access.
4. Verify the provider's permitted booking redirect without buying a ticket. Treat returned prices, seller availability and affiliate tracking as unverified until checked in the deployed interface.

Other regional results hosts and booking-related destinations are selected from provider responses and still need actual browser evidence or an authoritative current allowlist. An optional SDK ticket-detail host template mentions a regional `aviasales.ru` destination; no resolved host/request was observed, so none is allowed speculatively. Any other image, font or API destination reported by the live browser needs the same exact-origin and resource-category review. Do not use a wildcard to cover possible future endpoints.

## Files changed

- `next.config.ts`
- `src/lib/partner-resource-origins.ts`
- `tests/unit/partner-csp.test.ts`
- `tests/e2e/travelpayouts-widget.spec.ts`
- `docs/travelpayouts-setup.md`
- `docs/single-flight-search.md`
- `docs/travelpayouts-csp-fix.md`
