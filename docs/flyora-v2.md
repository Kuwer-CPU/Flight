# Flyora 2.0 implementation guide

Flyora combines worldwide flight search with four student travel tools. Its primary integration is Travelpayouts White Label **23277**. Flight results, seller ordering, booking and final terms are handled by the external partner flow. The native Amadeus/Skyscanner experience is retained behind `FLIGHT_SEARCH_INTEGRATION=api`.

## Pages and data boundaries

| Feature | Implemented behavior | Boundary |
| --- | --- | --- |
| Flight search | A direct homepage action opens the single Travelpayouts search interface on `/flights`; separate student/baggage notes and four tool links follow it | Enter route, dates, cabin and travelers in the partner UI. Flyora does not use an undocumented custom-form submission or prefill contract |
| Student benefits | Search and filter a structured airline directory; show official-source links, review state, baggage, discount, verification, age and booking-channel fields | Initial policy leads remain unverified, unknown facts are displayed as “Confirm with airline,” and review dates are not invented |
| Travel calculator | Compare 2–4 manually entered quotes: ticket, standard checked kg, additional kg, quoted bag charge, transfer, insurance and other expenses | All prices use one selected EUR/INR/GBP/USD currency; no FX conversion, provider fetching or automatic student adjustment |
| Miles Wallet | Manually record loyalty program, balance, optional expiry and notes; estimate cash-versus-miles value with award taxes/fees | Browser-local records, no airline authentication, automatic sync or guaranteed redemption availability |
| Travel checklist | Generate general reminders from departure/destination, travel date, optional university date and purpose; edit/check/add/remove/print/clear | Preparation reminders do not establish immigration, visa, residence or student eligibility |

The calculator starts with empty prices. Additional baggage must be entered explicitly, using 0 if none is required. A required but unknown bag charge leaves the option pending and unable to win the comparison. Optional transfer, insurance and other blank costs count as 0 with visible guidance. Monetary inputs are validated and rounded to integer cents before addition. Changing currency clears prices rather than converting or silently reusing them.

The optional calculator illustration compares 480 + 110 = 590 with a 530 option including the needed baggage. It is labeled hypothetical and claims no actual airline/student benefit or bookable fare. The student directory does not apply benefits to either the partner search or a manually entered cost.

Primary-mode homepage destination cards are route inspiration: they open `/flights` without route-prefill queries. Optional student age, checked baggage needed and a manually entered confirmed included allowance below the search produce only a local kilogram shortfall. They are separate from the partner search and never alter its itinerary or fare. The native Flyora route form is retained only in explicit API mode.

## Browser storage and privacy

Saved flights, Miles Wallet records and checklist state use browser-local storage. Each feature provides a clear control; wallet/checklist records can also be removed through the browser's site-data settings. There is no cloud account, server-side wallet database or cross-device backup. Invalid persisted records are bounded and validated before display. Storage failures are shown to visitors instead of claiming a successful save.

Travel-calculator values are kept in component state only. They disappear after a reload and are not sent by Flyora to a provider. Avoid entering passport numbers, airline passwords or student documents in notes or reminders.

The primary Travelpayouts SDK is third-party JavaScript running in the application page context. It can access browser/page context and may use partner cookies or tracking under its terms. The script is mounted on the first visit to `/flights`; the retained search surface is hidden rather than discarded during SPA navigation and restored on return. Hiding that surface does not unload the already loaded script. No account-approval, cookie-consent or commission rights are established by a configuration flag.

The application does not add guessed prefill parameters or send student eligibility as an invented partner API request. This does not guarantee that third-party JavaScript cannot read the current page URL or other available page context. Review actual SDK behavior and current privacy requirements in a browser before opening the site to customers.

## Exact Vercel settings for the primary module

In Vercel **Project → Settings → Environment Variables**, set the following for the environment you will deploy:

```env
NEXT_PUBLIC_SITE_URL=https://flight-ten-steel.vercel.app
FLIGHT_SEARCH_INTEGRATION=travelpayouts
TRAVELPAYOUTS_WHITE_LABEL_ID=23277
TRAVELPAYOUTS_EMBED_ENABLED=true
TRAVELPAYOUTS_AFFILIATE_LINKS=true
FLYORA_ALLOW_INDEXING=false
```

The affiliate flag may be true only where the current agreement permits this use; otherwise set it to false. Confirm White Label 23277 belongs to the intended account and is approved for the domain and markets. The ID is public and is not an API credential.

Remove `TRAVELPAYOUTS_WHITE_LABEL_URL` and `TRAVELPAYOUTS_WIDGET_CODE` from Vercel, or leave both unset. Populating either selects the optional hosted/iframe transport; populating both is rejected. Those variables are not needed for the SDK source `https://tpwidg.com/wl_web/main.js?wl_id=23277`.

Use Node.js 24, repository root, install command `npm ci` and build command `npm run build`. No Amadeus key or secret is required to build or use this primary module. The page tools also need no provider credential. Retained API-mode searches have their separate credentials/access requirements.

Supply the real `FLYORA_BUSINESS_NAME` and working `FLYORA_CONTACT_EMAIL` before public commercial launch. These values and the public origin are used by metadata/contact pages. Indexing stays disabled until explicitly enabled after real launch review; configuration presence alone is not evidence of working fares.

**Changing `.env.local` changes your local machine only.** Saving Vercel values alone does not update an existing build. Redeploy after environment changes so public metadata and integration CSP match the selected transport. Keep Production and Preview settings appropriate to the environment actually being tested.

## Module loading and failure behavior

The script transport loads the fixed SDK source with a validated numeric White Label ID. It is not an iframe and has no manual “Load partner search” button. The public SDK attaches an open Shadow DOM root to its search host. Flyora discovers and observes that root as well as the ordinary container, and waits for visible search fields before hiding the initialization notice. A script load event or a retry button alone is insufficient. A 20-second initialization timeout gives a full-page **Reload flight search** action; observation continues so a late usable interface can recover. The page never substitutes fabricated flight cards.

The optional approved URL/iframe mode uses a separate controlled frame and requires a customer load action. Its iframe restrictions and no-referrer boundary differ from the primary page-context SDK. Consult [Travelpayouts setup](travelpayouts-setup.md) for the current implementation details and reviewed CSP origins; do not replace the official module with arbitrary pasted scripts or loosen CSP to all domains.

## What verification proves

Unit tests exercise configuration, manual financial math, invalid saved data, policy-display guards and checklist behavior. Browser tests exercise the native API demo and local tools. The primary-module tests intercept the SDK request with a fixture so mounting, navigation, accessible controls and failure/reload behavior can be tested without contacting a real provider.

The public SDK asset and deployed page were retrieved successfully with HTTP 200 through the inherited proxy. Inspection identified the open Shadow DOM host and specific resource categories; the corresponding readiness and CSP fixes were made. The inspected public White Label configuration had blank route fields and no hard-coded NCE origin. The SDK may restore browser/URL or geolocation defaults, but the source of any particular preselected airport was not confirmed.

Official help/developer pages returned CONNECT HTTP 403. No supported custom-form submission contract was verified, and Flyora does not use internal `TPWL_CONFIGURATION` or event hooks as an integration contract. Direct Chromium access encountered the proxy CA error `net::ERR_CERT_AUTHORITY_INVALID`; certificate checks were not disabled. Five Shadow DOM fixture cases passed, including late attachment, hidden controls and retry-only failure.

A separate local initialization check replayed only public JavaScript assets retrieved by Node with TLS verification. Browser API requests stayed browser-owned and untouched. The actual SDK created one visible search form in its open Shadow DOM, with origin, destination, departure, return and passenger controls; Flyora's phase reached `rendered`, with no separate Flyora search form or page errors. Browser-owned font and API requests remained blocked with `net::ERR_TUNNEL_CONNECTION_FAILED`. This verifies that limited initialization and readiness behavior, not city lookup, live fares, seller coverage, bookings, attribution or the deployment of this updated code.

Use `npm run launch:check` for offline configuration/evidence review and `npm run check:deployment -- https://flight-ten-steel.vercel.app --expect-integration=travelpayouts` for read-only public-response checks where network access permits. `/api/integration-status` reports the safe selected integration state; `/api/status` describes the separate API provider and is checked only in API mode. The response checker never executes the SDK, performs flight searches or enters payment details. Passing either command is not certification of provider approval, legal compliance, ticket availability or student eligibility.

Before public launch, confirm the intended module/account, real route/date/passenger handling, several actual result and seller handoffs, mobile behavior, affiliate/privacy disclosures, the business inbox and the host's commercial-use terms. Record genuine, non-secret evidence in the launch review after the checks occur. See [launch preparation](launch-preparation.md).
