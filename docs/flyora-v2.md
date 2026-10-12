# Flyora 2.0 implementation guide

Flyora combines worldwide flight search with four student travel tools. Its primary integration is Travelpayouts White Label **23277**. Flight results, seller ordering, booking and final terms are handled by the external partner flow. The native Amadeus/Skyscanner experience is retained behind `FLIGHT_SEARCH_INTEGRATION=api`.

## Pages and data boundaries

| Feature | Implemented behavior | Boundary |
| --- | --- | --- |
| Flight search | Worldwide Flyora route-planning form plus the Travelpayouts module on `/flights` | Route/cabin/passenger prefill is unverified and not assumed; check selections in the partner UI |
| Student benefits | Search and filter a structured airline directory; show official-source links, review state, baggage, discount, verification, age and booking-channel fields | Initial policy leads remain unverified, unknown facts are displayed as “Confirm with airline,” and review dates are not invented |
| Travel calculator | Compare 2–4 manually entered quotes: ticket, standard checked kg, additional kg, quoted bag charge, transfer, insurance and other expenses | All prices use one selected EUR/INR/GBP/USD currency; no FX conversion, provider fetching or automatic student adjustment |
| Miles Wallet | Manually record loyalty program, balance, optional expiry and notes; estimate cash-versus-miles value with award taxes/fees | Browser-local records, no airline authentication, automatic sync or guaranteed redemption availability |
| Travel checklist | Generate general reminders from departure/destination, travel date, optional university date and purpose; edit/check/add/remove/print/clear | Preparation reminders do not establish immigration, visa, residence or student eligibility |

The calculator starts with empty prices. Additional baggage must be entered explicitly, using 0 if none is required. A required but unknown bag charge leaves the option pending and unable to win the comparison. Optional transfer, insurance and other blank costs count as 0 with visible guidance. Monetary inputs are validated and rounded to integer cents before addition. Changing currency clears prices rather than converting or silently reusing them.

The optional calculator illustration compares 480 + 110 = 590 with a 530 option including the needed baggage. It is labeled hypothetical and claims no actual airline/student benefit or bookable fare. The student directory does not apply benefits to either the partner search or a manually entered cost.

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

The script transport loads the fixed SDK source with a validated numeric White Label ID. It is not an iframe and has no manual “Load partner search” button. Visible structural search controls are required before hiding the initialization state; a script load event alone is not treated as a working search. Load failure or a UI initialization timeout gives a full-page **Reload flight search** action. The page never substitutes fabricated flight cards.

The optional approved URL/iframe mode uses a separate controlled frame and requires a customer load action. Its iframe restrictions and no-referrer boundary differ from the primary page-context SDK. Consult [Travelpayouts setup](travelpayouts-setup.md) for the current implementation details and reviewed CSP origins; do not replace the official module with arbitrary pasted scripts or loosen CSP to all domains.

## What verification proves

Unit tests exercise configuration, manual financial math, invalid saved data, policy-display guards and checklist behavior. Browser tests exercise the native API demo and local tools. The primary-module tests intercept the SDK request with a fixture so mounting, navigation, accessible controls and failure/reload behavior can be tested without contacting a real provider.

The coding environment's CONNECT proxy returned HTTP 403 for both the real SDK and `https://flight-ten-steel.vercel.app`. Consequently, the actual deployed page, third-party module rendering, current fares, available sellers, booking links, attribution and current partner terms were not verified. A fixture that looks like search controls does not establish any of those facts.

Use `npm run launch:check` for offline configuration/evidence review and `npm run check:deployment -- https://flight-ten-steel.vercel.app --expect-integration=travelpayouts` for read-only public-response checks where network access permits. `/api/integration-status` reports the safe selected integration state; `/api/status` describes the separate API provider and is checked only in API mode. The response checker never executes the SDK, performs flight searches or enters payment details. Passing either command is not certification of provider approval, legal compliance, ticket availability or student eligibility.

Before public launch, confirm the intended module/account, real route/date/passenger handling, several actual result and seller handoffs, mobile behavior, affiliate/privacy disclosures, the business inbox and the host's commercial-use terms. Record genuine, non-secret evidence in the launch review after the checks occur. See [launch preparation](launch-preparation.md).
