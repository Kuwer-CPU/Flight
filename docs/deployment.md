# Deploy and preview Flyora 2.0

Use a host running Next.js 16 with Node.js 24 and server route handlers. A static-only host cannot run the retained API endpoints. Flyora builds without Amadeus credentials; its primary search is Travelpayouts White Label 23277 and its planning tools run without a flight-provider account.

## Run locally

Install Node.js 24. Extract the repository and open a terminal in the folder containing `package.json`:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

On Windows, copy the example file using your file manager. Open the localhost address printed by Next.js. Keep the terminal running; Ctrl+C stops it. Changes to the local environment require a restart and do not change the deployed website.

To run a production build locally:

```bash
npm run build
npm run typecheck
npm start
```

The default partner experience requests third-party JavaScript when `/flights` is first visited. Actual prices appear only if the real approved module successfully renders and returns results. A local code build does not grant partner access or establish domain permissions.

## Exact Vercel setup

1. Import `Kuwer-CPU/Flight` in your Vercel account and select Next.js. Use the repository root, Node.js 24, install command `npm ci` and build command `npm run build`.
2. Open **Project → Settings → Environment Variables** and add the primary settings below for the deployment environment.
3. Remove `TRAVELPAYOUTS_WHITE_LABEL_URL` and `TRAVELPAYOUTS_WIDGET_CODE`, or leave both unset. The primary module uses the SDK and White Label ID instead of an iframe source.
4. Add the real operator and working support inbox before public commercial launch. Keep indexing disabled during preview.
5. Redeploy the latest source after changing settings. Saving a variable or editing a local `.env.local` file does not update an existing Vercel build.

```env
NEXT_PUBLIC_SITE_URL=https://flight-ten-steel.vercel.app
FLIGHT_SEARCH_INTEGRATION=travelpayouts
TRAVELPAYOUTS_WHITE_LABEL_ID=23277
TRAVELPAYOUTS_EMBED_ENABLED=true
TRAVELPAYOUTS_AFFILIATE_LINKS=true
FLYORA_ALLOW_INDEXING=false
```

Use `TRAVELPAYOUTS_AFFILIATE_LINKS=true` only if permitted by the current partner agreement; otherwise use `false`. Confirm that the intended account is authorized for White Label 23277, your public domain and markets. No Amadeus key or secret is needed for this setup or the build. Public ID 23277 is not a credential or proof of account ownership.

| Additional setting | Requirement |
| --- | --- |
| `FLYORA_BUSINESS_NAME` | Actual public operator name; optional for build, required before commercial launch |
| `FLYORA_CONTACT_EMAIL` | Working public support/privacy inbox; optional for build, required before commercial launch |
| `FLYORA_ALLOW_INDEXING` | Leave false for preview; opt in only after real launch review |

The configured origin is used in canonical metadata and sitemap behavior. The selected integration also affects build-time CSP, so rebuild/redeploy when either changes. Configure Production and Preview scope for the environment being tested. Vercel supplies `NODE_ENV` and the listening port; cloud proxy and browser-test settings are not deployment variables.

## Confirm the deployed experience

The coding cloud's CONNECT proxy returned HTTP 403 for both the real SDK and `https://flight-ten-steel.vercel.app`. Consequently, this work did not inspect the real deployed page, actual SDK, fares or booking links. Use your ordinary browser and an environment with permitted access for these checks:

1. Open the intended deployment and check homepage navigation and all four tool pages on desktop/mobile.
2. Open `/flights`. Confirm the actual Travelpayouts search controls appear, with the intended account/module and no CSP or initialization errors.
3. Check route, dates, cabin and the full traveler count inside the partner UI. Flyora does not assume a verified prefill contract.
4. Try actual searches and confirm seller handoffs, currency, taxes, fees, baggage conditions, student eligibility and final payable price without purchasing a ticket.
5. Verify privacy/affiliate notices and the current third-party cookie/tracking behavior. A script loaded in page context differs from an isolated iframe.
6. Test the working contact inbox, HTTPS origin, public metadata and preview indexing state.

A read-only terminal check is also available:

```bash
npm run check:deployment -- https://flight-ten-steel.vercel.app --expect-integration=travelpayouts
```

It inspects public pages, all four tools, indexing, headers and safe `/api/integration-status` configuration without executing the SDK, requesting flight offers or authenticating a provider. It checks the separate `/api/status` only when the selected integration is API mode; `--expect-integration=api` asserts that expectation. It follows no redirects and sends no cookies or authentication tokens. Login-protected preview URLs need an accessible preview or a local check; do not paste private tokens into the command. A passing response check does not verify module rendering, actual fares or commercial approval.

## Local API demo for retained-flow tests

The native API flow remains explicitly available. For a labeled local demonstration with fictional fares, put these values in `.env.local` and leave provider keys absent:

```env
FLIGHT_SEARCH_INTEGRATION=api
FLIGHT_DATA_MODE=demo
FLIGHT_PROVIDER=amadeus
AMADEUS_ENVIRONMENT=production
```

Restart and rebuild after switching from the partner configuration. This mode shows fictional sample fares and student illustrations; it does not issue tickets. It is not a fallback for failed primary search.

Install Chromium once with `npx playwright install chromium`. With a fresh API-demo server on port 3000, run:

```bash
npm run test:e2e
```

In the managed Linux cloud, use `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium`. The default suite exercises the retained API demo and local tools. Separate partner-module tests intercept the SDK with a fixture; consult [Travelpayouts setup](travelpayouts-setup.md) for their environment and command. Fixtures do not verify actual live results or account approval.

The GitHub workflow runs validation on pushes/pull requests without deploying a site or using private provider credentials. Runner availability, quotas and hosting commercial-use terms depend on the account and plan. Confirm that the selected hosting plan permits the intended affiliate/commercial use rather than assuming a free plan does.

## Optional live API searches

Only `FLIGHT_SEARCH_INTEGRATION=api` uses `FLIGHT_PROVIDER`, `FLIGHT_DATA_MODE`, Amadeus credentials or the optional Skyscanner partner key/price-basis settings. See [Amadeus instructions](live-flight-search.md) and [seller comparison guide](seller-price-comparison.md). Keep every secret server-side and out of `NEXT_PUBLIC_` variables.

API search access does not itself create affiliate revenue. The primary Travelpayouts configuration likewise needs genuine account, tracking and commercial permissions. Complete the [launch audit and owner requirements](launch-preparation.md) before calling the deployment commercially ready.
