# Flyora 2.0 launch preparation

Flyora can be installed, built and used for student planning without a paid flight API. The primary customer flight search is Travelpayouts White Label **23277**, with the retained Amadeus/Skyscanner experience available only through explicit API mode. A configured module is not proof of account approval, live results or successful booking.

## Prepared without payments or private API credentials

| Work | What is prepared |
| --- | --- |
| Product experience | Student travel homepage, worldwide route-planning form and links to four planning tools |
| Primary flight-search integration | Fixed Travelpayouts module source, initialization/failure states, retained search surface across SPA navigation and customer privacy/affiliate notices |
| Student benefits | Structured directory, official-source links, honest policy-review states and eligibility fields; initial terms remain unverified |
| Travel budget | Manual 2–4 option calculator, validated costs, exact-cent totals, pending unknown bag charges and an explicitly hypothetical example |
| Miles Wallet | Validated manual loyalty records, browser-local persistence, expiry reminders and cash-versus-miles calculation |
| Checklist | General trip reminders, editable items, completion progress, custom reminders, printing and browser-local persistence/clear controls |
| Release checks | Repeatable lint, unit, production build, TypeScript and browser checks; SDK fixtures do not need live provider secrets |
| Deployment inspection | Read-only public-page/header/configuration checks that do not request flight offers or enter payment details |
| Launch audit | Offline configuration and genuine recorded-evidence checks; missing owner or approval records remain blockers |
| Business readiness | Contact configuration, privacy and booking boundaries, preview indexing controls and saved-data clear controls |
| External review preparation | [Provider brief](provider-application.md), [student policy review procedure](student-policy-review.md) and an unverified airline worksheet; no account applications submitted by this work |

The SDK and the intended deployed URL could not be inspected from this cloud environment: the CONNECT proxy returned HTTP 403. Module browser tests use an intercepted fixture. A passing fixture, local response check or build does not establish real third-party rendering, current fares, affiliate attribution or deployed behavior.

## Configure Vercel, then redeploy

Use these values under **Project → Settings → Environment Variables** for the deployment environment:

```env
NEXT_PUBLIC_SITE_URL=https://flight-ten-steel.vercel.app
FLIGHT_SEARCH_INTEGRATION=travelpayouts
TRAVELPAYOUTS_WHITE_LABEL_ID=23277
TRAVELPAYOUTS_EMBED_ENABLED=true
TRAVELPAYOUTS_AFFILIATE_LINKS=true
FLYORA_ALLOW_INDEXING=false
```

Affiliate use must be permitted by the actual agreement; otherwise set `TRAVELPAYOUTS_AFFILIATE_LINKS=false`. Confirm the account and domain authorization for White Label 23277. These settings enable the intended source but do not prove authorization or revenue eligibility.

Remove `TRAVELPAYOUTS_WHITE_LABEL_URL` and `TRAVELPAYOUTS_WIDGET_CODE` or leave both unset for the primary script transport. A populated source switches to separate iframe compatibility mode. Amadeus credentials are unnecessary for the primary module, local tools or production builds.

Add the actual `FLYORA_BUSINESS_NAME` and a working `FLYORA_CONTACT_EMAIL` before a public commercial launch. The contact page does not create an inbox or send mail; test receiving mail yourself. These details are optional for builds and cannot be invented by the application.

**Local `.env.local` values do not update Vercel. Rebuild/redeploy after changing Vercel settings**, including the public origin, business/contact information, indexing and search transport. Build-time metadata and CSP must match the intended runtime configuration.

## Run the audits

From the repository folder, use Node.js 24 or at least 22.18:

```bash
npm ci
npm run launch:check
npm run check:deployment -- https://flight-ten-steel.vercel.app --expect-integration=travelpayouts
```

The launch audit reads production `.env` files through Next.js's environment loader and the committed [launch-review.json](launch-review.json). It performs no provider or hosting requests. Exit **1** means remaining prerequisites; **2** means invalid/unreadable audit inputs. `npm run launch:check -- --json` emits the report as JSON.

Review records contain `status`, `reviewedOn` and `evidence`. Mark a record complete only after the actual check has occurred, using a real date and a non-secret reference. Do not store credentials, passenger details or confidential partner documents in the committed review file. The audit validates configuration and evidence shape; it does not authenticate evidence, certify legal compliance or guarantee ticket availability.

The deployment checker inspects public routes, all four tool pages, baseline headers, indexing and safe `/api/integration-status` configuration. It checks the separate `/api/status` provider response only for explicit API mode. It does not load the real SDK in a browser, search flights, open seller checkout or enter payment details. A failure from the current cloud proxy does not establish whether the website works for an ordinary visitor; perform the same check from an allowed environment and use a browser for real module verification.

## Remaining owner and external checks

| Priority | Required check | Evidence needed |
| --- | --- | --- |
| 1 | Intended Travelpayouts account/module and domain authorization | White Label 23277 belongs to the intended account; current display, booking, affiliate and market permissions are confirmed |
| 2 | Real production module and booking handoffs | Route, dates, full traveler count, actual fares, seller links, baggage/fees and mobile rendering checked without purchasing a ticket |
| 3 | Operator identity and support | Actual business/operator name, jurisdiction and working contact inbox published |
| 4 | Hosting and privacy | Deployed HTTPS origin, commercial/affiliate use allowed by the host's plan, current partner tracking/cookie behavior and jurisdiction-specific privacy/terms reviewed |
| 5 | Student rules | Official current route/fare/age/verification/registration/booking-channel conditions reviewed before showing concrete benefits or savings |
| 6 | Operational limits | Provider/partner quotas, host limits, alerting, log retention, rate protection and any actual spending reviewed |

Keep indexing disabled during preview. Turn `FLYORA_ALLOW_INDEXING=true` on only after the real launch review; eligible configured production settings and business details are necessary but not independent verification. `/flights` search URLs and private profile/query context should remain out of search indexes.

The retained API experience has separate approval and credential requirements. Process-local API caches and limits do not establish shared protection or a global cost cap for a multi-instance deployment. The module uses partner-managed results, but host limits and the partner agreement still need review.

A native database, login, cross-device wallet, custom domain and on-site payments are unnecessary for the current planning-and-handoff model. Affiliate monetization requires the actual permitted agreement and correct attribution. On-site ticket payments or issuance would require a separate booking, payment and customer-support stack.

See [deployment.md](deployment.md), [Travelpayouts setup](travelpayouts-setup.md), [Flyora 2.0 behavior](flyora-v2.md) and the [commercial launch checklist](launch-checklist.md).
