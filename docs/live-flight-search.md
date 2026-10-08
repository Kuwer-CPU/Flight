# Connect real flight search

This guide covers the default Amadeus feed. For airline and agency seller prices and quote-specific booking links, see [seller-price-comparison.md](seller-price-comparison.md).

Flyora already calls Amadeus Flight Offers Search on its server. Real searches use the selected airports, dates, adult count and cabin, and return the provider's group fare, itineraries and reported checked baggage. Prices are currently requested in EUR. Live search is the default; missing credentials and provider errors never fall back to fictional flights.

## Get credentials

1. Register at https://developers.amadeus.com/register and create an application in https://developers.amadeus.com/my-apps using Flight Offers Search.
2. Use test credentials first to validate authentication and the request flow. Sandbox results are labeled **Provider sandbox**, and are not bookable production fares.
3. Request production access through Amadeus. Complete the requirements shown in your account and review current usage charges, coverage and commercial terms. Obtain the application's production API Key and API Secret. A test key does not become a production key by changing a setting.

Provider access and pricing are controlled by Amadeus. No account or credentials are supplied by this repository.

## Run locally

Create `.env.local` in the same folder as `package.json`; copying `.env.example` is a starting point. On Windows, ensure the filename is `.env.local`, not `.env.local.txt`. Enter your credentials only on your computer or through your hosting provider's secure environment settings:

```env
FLIGHT_DATA_MODE=live
FLIGHT_PROVIDER=amadeus
AMADEUS_ENVIRONMENT=production
AMADEUS_API_KEY=your_production_api_key
AMADEUS_API_SECRET=your_production_api_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For sandbox testing, keep `FLIGHT_DATA_MODE=live`, set `AMADEUS_ENVIRONMENT=test`, and use the matching test credentials. For an intentional demonstration without an account, set `FLIGHT_DATA_MODE=demo`. Unknown mode/environment values are rejected instead of selecting another data source.

Stop the running server with Ctrl+C and restart it:

```bash
npm ci
npm run dev
```

Open the local address printed by Next.js. Search a route with future dates. Successful production results show **Live flight prices**, a retrieval timestamp and the provider's allowances; sandbox and demo results have separate labels. Results may be cached for two minutes, so the timestamp describes when the provider data was retrieved. Confirm the final fare, availability and baggage with the airline.

`.env.local` is ignored by Git. Never add keys to source files, screenshots, chat messages or variables prefixed with `NEXT_PUBLIC_`.

## Vercel or another host

Add the same four provider settings in the host's environment-variable settings and set `NEXT_PUBLIC_SITE_URL` to your site's HTTPS origin. Scope the keys to the appropriate deployment environment. Redeploy or restart after changing them. Node.js hosting uses `npm ci`, `npm run build`, then `npm start`.

## Check configuration

`GET /api/status` returns a safe configuration summary with `mode`, `provider`, `environment`, `status`, `configured` and `message`, with caching disabled. It never returns credentials or tokens.

| Status | Meaning |
| --- | --- |
| `missing-credentials` | Both credential variables are required; a search returns 503. |
| `invalid-configuration` | A mode or environment setting is invalid; a search returns 503. |
| `configured` | Both credential values are present. This does **not** establish authentication, production approval or provider connectivity; confirm with a successful search. |
| `demo` | Fictional fares are intentionally enabled. |

Use the provider environment and the matching credentials together. An authentication error can mean wrong, revoked or unapproved credentials. A 429 indicates rate limiting. Empty production results mean the provider returned no matching offers; no sample flights are substituted. Invalid provider rows are discarded individually, and incomplete baggage mappings stay unknown.

For this managed cloud environment, permit HTTPS to `api.amadeus.com` and `test.api.amadeus.com` and enter credentials through environment settings. A saved configuration draft does not apply those settings or prove provider access. Follow environment review/save/publish instructions before expecting a changed runtime. Never print the process environment or inspect credential values for debugging.

The managed cloud uses Node.js 24 and an HTTP proxy. Start its server with `NODE_USE_ENV_PROXY=1 npm start` (or `NODE_USE_ENV_PROXY=1 npm run dev`) so Node's provider fetches use the inherited proxy. Preserve proxy/CA settings and TLS verification. Ordinary local and Vercel runs do not need this cloud-specific command.

## Student benefits and booking

Amadeus ordinary fares do not automatically include an airline's student registration benefits. Live results preserve standard baggage returned by the provider, while unverified student extras remain pending. Review official airline terms for the fare, route, age, proof of enrolment, registration and eligible booking channel before implementing verified extras. Do not add the demo's fictional bonuses or baggage prices to real offers.

The current booking button opens the airline's website. It does not transfer the quoted offer into a cart, reserve it, take payment or issue tickets. Final availability and price can differ. Amadeus coverage does not include every airline, route or student fare worldwide.

## Validation limits

Automated provider tests mock HTTP responses to exercise production/test hosts, authentication, configuration, failure handling and offer normalization. Browser tests explicitly simulate production results to verify the live-results interface. Without real credentials, these tests cannot establish actual Amadeus access or real fare availability.
