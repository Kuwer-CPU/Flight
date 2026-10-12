# Travelpayouts White Label 23277

The owner supplied this White Label module and its required containers:

```html
<div id="tpwl-search"></div>
<div id="tpwl-tickets"></div>
<script type="module" src="https://tpwidg.com/wl_web/main.js?wl_id=23277"></script>
```

Flyora now uses that specific approved source as its default customer flight-search integration. White Label ID `23277` is public configuration, not an API secret. The code uses Next.js `Script`, with `type="module"`, `strategy="afterInteractive"` and `crossOrigin="anonymous"`; matching the framework preload and module CORS mode avoids a duplicate download. It does not render arbitrary pasted HTML or JavaScript. The real module, additional resource hosts, returned offers and booking behavior have not been exercised in this restricted environment. Browser tests use a clearly labeled mock SDK, without invented fares.

## Default settings

```env
FLIGHT_SEARCH_INTEGRATION=travelpayouts
TRAVELPAYOUTS_EMBED_ENABLED=true
TRAVELPAYOUTS_WHITE_LABEL_ID=23277
TRAVELPAYOUTS_WHITE_LABEL_URL=
TRAVELPAYOUTS_WIDGET_CODE=
TRAVELPAYOUTS_AFFILIATE_LINKS=false
NEXT_PUBLIC_SITE_URL=https://flight-ten-steel.vercel.app
```

The integration, enabled flag and ID above are the defaults. A different `TRAVELPAYOUTS_WHITE_LABEL_ID` must be a positive identifier of 1–12 decimal digits without a leading zero, supplied by the owner. It only changes the `wl_id` value in the fixed `https://tpwidg.com/wl_web/main.js` URL. It cannot select another script, endpoint, protocol or executable string. Set `TRAVELPAYOUTS_EMBED_ENABLED=false` to disable partner loading and show the clean student-tool placeholder.

Leave the optional iframe source variables blank for the supplied module integration. Rebuild/redeploy after changing configuration so runtime settings and the build-time CSP agree. Restart development after changing local environment settings. Do not paste provider secrets or airline account credentials into any public URL or widget code.

## Persistent App Router lifecycle

The root layout mounts one `FlightSearchSurface` inside `<main>`. On the first `/flights` visit, that client surface renders the partner page, creates exactly one `tpwl-search` and one `tpwl-tickets`, then loads the module once. The `/flights` server page returns no second copy of those containers in configured script mode.

When the traveler opens Miles Wallet or another student tool, the surface hides only its own wrapper and retains the SDK containers and contents. The normal route content remains visible. Returning to `/flights` shows the same DOM and script state. Flyora neither removes/rebuilds the vendor's child nodes nor calls an undocumented reinitialization API. Full page reload is the clean restart after a failed initialization.

A script load event alone is not a success signal. A structural observer checks for visible search controls in `tpwl-search`; it reads no prices, booking data or vendor labels. Until that UI appears, the page keeps its bootstrap notice. A script error or 20-second rendering timeout shows **Flight search could not load.** and a **Reload flight search** button. Rendered controls do not prove that fares, account access or bookings work; those still need production verification.

The local Flyora form and route summary remain a planning aid. This integration appends no guessed route/date/passenger/student parameters and invokes no guessed API. Travelers must enter or check their itinerary inside the White Label. Unverified student benefits never alter the partner's fare.

## Privacy, affiliate disclosure and CSP

Unlike the optional cross-origin iframe boundary, this module runs in Flyora's page context and may use cookies or read page information. Flyora's code adds no student fields to the script URL, uses a no-referrer policy on its script request and extracts no widget fare data. That is not a guarantee that the vendor's JavaScript cannot read the page URL, DOM or browser context. Verify actual vendor behavior and current privacy/consent requirements before commercial launch.

The page discloses that eligible partner bookings may earn Flyora a commission and that booking/result ordering is handled by the partner. No commission, free ticket or extra-cost claim is guaranteed. `TRAVELPAYOUTS_AFFILIATE_LINKS=true` adds `sponsored` to an optional iframe-interface outbound link only after owner confirmation; it does not modify the module's booking links or suppress the disclosure.

The safe configuration exposes the fixed `scriptOrigin` `https://tpwidg.com`. Root CSP should permit the supplied module and only separately reviewed dependency origins. This environment could not discover the live SDK's other script, style, image, frame or connection destinations. Do not guess API endpoints or replace narrow policy with arbitrary wildcards. Use deployment browser diagnostics and current provider documentation to review any required additional origins.

`getFlightIntegration()` returns `{ integration: 'api' }` for explicit API mode, or safe partner fields including `status`, `transport`, `affiliateLinks`, and either `whiteLabelId`/`scriptUrl`/`scriptOrigin` or `frameUrl`/`frameOrigin`. Raw widget code, provider keys and credential-looking iframe query parameters are not emitted. `configured` means the local integration settings are valid, not that live fares have been verified.

## Optional approved iframe interface

For a separately approved hosted iframe interface, configure exactly one of:

- `TRAVELPAYOUTS_WHITE_LABEL_URL`: the approved public HTTPS hosted interface.
- `TRAVELPAYOUTS_WIDGET_CODE`: one empty iframe element with a quoted source.

Providing a source selects the optional `iframe` transport; leave `TRAVELPAYOUTS_WHITE_LABEL_ID` as normal public configuration. Both source variables together are rejected. The iframe parser extracts only its source and rejects scripts, surrounding HTML, inline events, `srcdoc`, duplicates and malformed snippets. It never executes a pasted script, even when its text resembles the supported module.

Public-domain HTTPS validation rejects URL user credentials, credential query names such as `api_key`, `secret`, `token` and `password`, IP/local/reserved hosts, nonstandard ports and the application's own configured origin. Public `marker`, `wl_id` and `trs` values may remain as approved affiliate configuration. The iframe loads only after the customer chooses **Load partner search**; it uses the fixed forms/scripts/same-origin/popups sandbox, exact reviewed frame origin and no-referrer navigation. The frame URL is not a provider's server-side API.

## Explicit legacy API mode

`FLIGHT_SEARCH_INTEGRATION=api` retains the existing results component for a separately approved Amadeus or Skyscanner feed. It is not the primary customer flow and is never selected automatically after widget failure. The old production-access and quote-contract checks still apply. Deliberate demo mode in that branch remains visibly labeled; it never supplies bookable sample fares to the White Label page.

## Verify the deployed integration without buying a ticket

| Check | Expected outcome |
| --- | --- |
| First flight-page visit | One module request, one search container, one tickets container, no duplicate SDK instance |
| Module/UI distinction | An empty or failed module load does not remove the bootstrap notice or claim live fares work |
| SPA navigation | Other student pages remain visible; returning to Flights retains the same partner UI and initialization count |
| Itinerary | Correct route, dates, adult count and cabin are checked inside the actual partner interface |
| Search and handoff | Real offers and permitted booking links belong to the owner-provided White Label; final price/fees/conditions are confirmed there |
| Student benefits | No unverified allowance, discount or fictional comparison is applied to partner results |
| Privacy/CSP | Actual cookies, tracking and dependency origins match reviewed provider terms and deployed policy |
| Error recovery | Blocked script/dependency or initialization timeout gives a clear reload action, without a fake fare or API fallback |

Record actual deployment/provider verification separately from mocked tests. No application, paid booking or account creation is performed by this code preparation.
