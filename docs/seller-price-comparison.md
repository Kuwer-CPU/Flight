# Airline and booking-provider prices

Flyora now supports several seller prices on one flight. Flight cards show a short list; flight details compare all returned prices, seller types, group totals and links to the quoted booking offers. The lowest returned price is highlighted. The comparison stays on Flyora; the selected airline or travel agency handles checkout.

## Choose a price feed

| Feed | What this integration supplies | What it does not establish |
| --- | --- | --- |
| Amadeus | Ordinary flight offers, itineraries and baggage reported by the provider | A quote from the airline's public website, or a comparison of OTA selling prices |
| Skyscanner Flights Live Prices v3 partner API | Seller pricing options associated with an itinerary, agent identities and returned booking links | Every seller worldwide, live access without approved credentials, or student benefits applying to every seller |

Using a partner API does not send travelers to a generic comparison homepage. A valid seller option uses the exact HTTPS deep link returned for that quote. If no priced booking link exists, a known airline's homepage is offered as a clearly labeled **search** handoff; the provider fare is not represented as that homepage's price. Unknown airlines with no quote link return to Flyora search.

No real seller API request has been verified. The current official Skyscanner documentation was unavailable from this cloud's allowed network. The v3 adapter is based on corroborated public SDK models, with explicit contract checks and mocked tests; its current request/response behavior must be validated against your approved partner documentation before production use. Do not infer partner eligibility, price rights or availability from a passing mocked test.

## Get approved access

Request partner access through Skyscanner's official developer/partner channels: https://developers.skyscanner.net/docs/flights-live-prices/overview. Check current eligibility, licensing, attribution, fees and rules for displaying and linking prices. An Amadeus API key is not a Skyscanner partner key. A commercial alternative needs its own adapter and documented quote contract; this site cannot scrape or invent quotes from arbitrary ticket websites.

## Configure the seller feed

Add the following in ignored `.env.local` or your host's secure settings, and restart/redeploy:

```env
FLIGHT_DATA_MODE=live
FLIGHT_PROVIDER=skyscanner
SKYSCANNER_ENVIRONMENT=production
SKYSCANNER_API_KEY=your_approved_partner_key
SKYSCANNER_MARKET=UK
SKYSCANNER_LOCALE=en-GB
SKYSCANNER_PRICE_BASIS=
```

Confirm whether the **current partner contract** quotes complete passenger-group prices or per-person prices. Set `SKYSCANNER_PRICE_BASIS=group` for complete group prices, or `per-person` for per-person prices. The integration converts the latter to a group total using the selected adult count. Searches stay blocked when this setting is unconfirmed; guessing could misstate multi-traveler prices. The displayed per-adult amount is then calculated from the complete group quote.

Choose a supported booking market and locale for your account. Prices are requested in EUR. The market affects which sellers and fares are returned; it does not limit which airport routes can be entered. There is no assumed Skyscanner sandbox endpoint in this integration. Select `FLIGHT_PROVIDER=amadeus` and matching test credentials for the separate Amadeus sandbox workflow.

`GET /api/status` identifies the selected feed, configuration status and whether its credential values are present. It never returns keys. `configured` is not proof of authentication, a valid commercial agreement or a successful live search.

## Price and booking safeguards

- Only positive prices with recognized price units and a resolved seller are accepted. Conversion preserves the provider's amount and currency; the UI shows cents rather than rounding seller prices to whole euros.
- A booking option must have one complete checkout item and a valid external HTTPS link. Split-ticket/multiple-checkout options are not supported and are not misrepresented as a single seller's total.
- Explicit provider self-transfer flags are shown beside the seller. A single checkout does not establish connection protection; confirm transfer conditions with the seller, including when no flag is supplied.
- A flight's headline price is the lowest accepted seller quote for that itinerary and passenger group. Different routes, dates, cabins or group sizes are not combined into a false comparison.
- Provider polling is bounded. Incomplete results are clearly labeled as prices returned so far, and never described as an exhaustive search or a universal best price.
- Missing keys, invalid configuration and provider failures produce errors. The server does not silently switch providers or substitute demo offers.
- Seller-specific baggage and student conditions remain unverified unless supplied through a verified fare contract. An airline program may require booking directly, so its benefits cannot automatically be added to an agency quote.
- Saved flights retain snapshots; prices and links can expire. Run a fresh search before booking, and confirm the final fare, fees and baggage at the seller's checkout.

Amadeus remains the default when `FLIGHT_PROVIDER` is omitted. Explicit `FLIGHT_DATA_MODE=demo` intentionally shows fictional sample flights, with no live seller quotes.

## Contract sources and validation

Official documentation entry point is linked above. Corroborating, **unofficial** v3 models inspected during implementation:

- https://github.com/VitaliyJ/skyscanner/blob/master/client.go
- https://github.com/VitaliyJ/skyscanner/blob/master/results.go
- https://github.com/VitaliyJ/skyscanner/blob/master/contracts.go
- https://github.com/blwsh/SkyscannerGoSDK/blob/main/pkg/types/requests/create.go

The adapter uses `queryLegs`, `sessionToken`, documented dictionaries and price-unit scales; it does not copy inconsistent naming found in those SDKs. Automated tests verify request construction, normalization, polling, price basis, seller links, missing configuration and provider failure behavior using mocked responses. Production credentials and current partner documentation are still needed to verify the actual contract and bookable coverage.
