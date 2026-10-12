# Flyora provider application brief

This is a prepared application draft, not a submitted request or an approved partnership. No provider has been contacted, no credentials have been obtained and no paid service has been activated by this preparation. Complete the business fields below only with facts the owner can substantiate.

For configuration instructions, use [live-flight-search.md](live-flight-search.md) and [seller-price-comparison.md](seller-price-comparison.md). This document supplies the product brief, specific commercial questions and an acceptance record to use when a provider becomes available.

## Product facts suitable for an application

| Field | Prepared answer |
| --- | --- |
| Product | Flyora |
| Source repository | https://github.com/Kuwer-CPU/Flight |
| Intended audience | Students and other travelers comparing flights, baggage and seller prices |
| Product behavior | Search an itinerary, compare received quotes and continue to the selected external seller for booking |
| Route input | Worldwide airport catalog; provider availability determines which actual offers are returned |
| Search scope implemented | One-way and return trips, 1–9 adults, economy/premium economy/business, prices requested in EUR |
| Current integration | Amadeus Flight Offers Search; optional Skyscanner Flights Live Prices v3 partner adapter |
| Payment and ticketing | Handled externally; Flyora currently takes no flight payment, issues no ticket and creates no reservation |
| Student information | Official airline links are review leads. Current policies are unverified; no real student discount or extra baggage is applied |
| Search data sent to provider | Airports, travel dates, adult count and cabin; market/locale/currency for the seller feed |
| Student profile inputs | Used locally for comparison; student age and desired baggage are not sent in the implemented provider search |
| Price retention implemented | Server cache: up to 120 seconds for Amadeus, 60 seconds for completed Skyscanner results; partial seller results are not cached |
| Saved shortlists | Browser-local price/link snapshots remain until the visitor removes them or clears browser storage. They do not refresh automatically |
| Current validation | Automated tests use mocked responses. Approved production access and actual seller checkout links have not been validated |

The applicant's legal identity, deployed site, operating country, traffic, budget and commercial agreements are not established by the source repository. Do not describe tests, demo visitors or sample fares as production traffic or bookings.

## Owner fields to complete later

| Field | Owner answer |
| --- | --- |
| Applicant/contact name | |
| Legal entity or applicant status | |
| Country/jurisdiction | |
| Contact email | |
| Public HTTPS website and domain ownership | |
| Intended launch markets and languages | |
| Actual current traffic and measurement period | |
| Expected searches per day, with basis for estimate | |
| Request/API spend limit | |
| Requested start date | |
| Privacy, terms and support URLs | |

An unknown value should remain blank or be described as unknown in an application. An established company, audience size, launch date, budget or affiliate approval must not be invented.

## Copyable enquiry

**Subject:** Flyora — flight price and booking-link API access enquiry

Hello,

Flyora is a student-focused flight comparison product preparing for a limited public launch. Travelers select an itinerary, compare available fares and baggage information, and continue to an external airline or travel agency to complete booking. Flyora does not currently take flight payments, issue tickets or reserve the displayed offers.

We would like approved API access to retrieve flight itineraries and, where your product supports them, separate airline and agency seller quotes with the associated booking links. The intended display keeps the carrier and seller distinct, shows the quoted currency and passenger-group total, labels incomplete searches, and makes no claim to include every airline or the lowest fare worldwide.

Our current implementation supports one-way and return searches for adult travelers. The comparison requests prices in EUR. Student eligibility and benefits are a separate rules layer: unverified airline policies do not alter live fares or baggage allowances.

The application is implemented and tested against mocked responses. We have not validated production access, actual seller links or the current commercial/API contract. Please advise whether a product at this stage can apply, which service matches the proposed use, and whether there is an evaluation arrangement without a purchase commitment.

Please also confirm the permissions, price semantics, quota/cost terms and acceptance requirements listed below. Applicant identity, site, markets and traffic details will be supplied accurately in the application fields.

Thank you,

[Applicant name]
[Contact email]
[Public website, once available]

This draft has not been sent. Replace the bracketed fields before the owner elects to use it.

## Select the service that matches the product

| Service | Useful capability in this repository | Decision needed from the provider |
| --- | --- | --- |
| Amadeus Flight Offers Search | Itinerary fare and reported included baggage | Approved production access and display rights. This adapter supplies no quote-specific airline/OTA checkout comparison; its fare cannot be labeled as a confirmed airline-homepage price |
| Skyscanner Flights Live Prices v3 partner feed | An itinerary's accepted seller pricing options, agent identities and returned booking links | Approved partner access, permitted price/link display, current v3 contract and a confirmed group/per-person price basis |
| Another licensed seller feed | Not integrated | Published contract, commercial permission and a separately implemented/tested adapter before its quotes appear |

A data API key does not create an affiliate agreement or guarantee commission. A booking partner would be a further service if payment/ticket issuance were later brought onto Flyora.

## Questions requiring written answers

| Area | Exact question | Provider answer/reference |
| --- | --- | --- |
| Access | Which current product, credentials and account approval cover this comparison-and-handoff use? Is prototype/evaluation access available? | |
| Display rights | May Flyora publish the received prices alongside other returned seller prices and use the carrier/seller identities? What attribution is required? | |
| Passenger basis | Does each amount price all requested adults or one traveler? Does that basis change with itinerary or option type? | |
| Price units | Which amount/unit enums and currencies can be returned? What rounding and display precision are required? | |
| Fare contents | Are taxes, seller service/payment fees, checked/cabin bags and add-ons included, excluded or unknown? Where is each condition supplied? | |
| Seller/itinerary identity | What identifies the same itinerary and fare, and how must multi-item or separate-ticket bundles be handled? | |
| Booking links | Are returned links permitted for commercial handoff? How long are they valid, can they redirect through provider tracking, and may they be modified? | |
| Price freshness | How should cached quotes, retrieval times, expired offers and repricing be displayed? Is a refresh/reprice request required before handoff? | |
| Caching and saved data | Are the server TTLs and browser-local shortlist snapshots above permitted? If not, what retention/display restrictions apply? | |
| Coverage | Which markets, currencies, locales, airlines/sellers and route/fare types are supported or excluded? Is `UK` a valid market code for this account? | |
| Polling | For the seller feed, what are current create/poll limits, completion/action semantics and session lifetime? | |
| Student fares | Does the service include verified student fares, or are registration and specific direct-booking channels outside its inventory? | |
| Affiliate terms | Is commission available under a separate agreement? What tracking, disclosure and link-handling requirements apply? | |
| Costs | What are evaluation and production charges, free allowances if any, billing triggers, minimum commitments and hard budget controls? | |
| Operations | What rate limits, error meanings, support channels and contractual reporting requirements apply? | |

Do not assume an evaluation is free, that production access will be granted, or that a quoted seller fare carries an airline's student benefit. Those decisions are outside the code.

## Contract acceptance record

Complete this record against the **current approved documentation and permitted test responses** before activating a public price feed. Do not paste credentials or private partner documents into the repository. Record non-secret document/version references and sanitized evidence instead.

| Check | Required evidence | Result/reference |
| --- | --- | --- |
| Access and permissions | Approval/service scope and price/link display permission covering the deployed website | |
| Market and query fields | Accepted account market/locale/currency, airport/date objects, cabin enums and return-trip request | |
| One adult price | Raw source amount/unit, documented price basis, normalized total and seller quote agree | |
| Multiple adult price | The same check for at least two adults; `group` is unchanged, `per-person` multiplies by adult count once | |
| Return trip total | Quote covers the complete selected outbound/return itinerary and group, rather than a single leg | |
| Currency and precision | EUR request is honored; recognized scaling preserves minor units without an invented exchange rate | |
| Seller matching | Carrier is distinct from seller; resolved agent, option total and exact returned deep link refer to the selected quote | |
| Checkout handoff | Open the permitted link and compare itinerary, cabin, adults, total/fees and included bags before payment; explain differences without claiming a guaranteed checkout price | |
| Poll/update contract | Verified COMPLETE/INCOMPLETE/FAILED and REPLACED/NOT_MODIFIED/OMITTED behavior; bounded partial results are visibly partial | |
| Unsupported options | Multi-item/multi-agent bundles are excluded by this release; explicitly returned self-transfer flags are preserved without inferring protection | |
| Failure behavior | Invalid/missing credentials, rate limits, transport errors and empty results stay distinct; no demo or alternate-provider fallback | |
| Price/link retention | Provider-approved cache and browser shortlist behavior; expired snapshots are handled as required | |
| Student separation | Real seller fares receive no unverified student extra allowance, discount or score | |

The existing tests are useful preparation for these checks, but mocked responses cannot prove authentication, commercial permissions, live coverage or a seller's checkout price. Account access and any billable verification remain separate owner-controlled actions.

## Current adapter issues to resolve before activation

- The optional seller adapter was built from corroborating **unofficial** SDK models because current official documentation was inaccessible from the restricted environment. Confirm the current schema rather than treating those SDKs as provider approval.
- `configured` in `/api/status` means the selected credential values are present. It does not establish successful authentication or accepted commercial terms.
- Skyscanner price basis is deliberately required; supported market/locale membership still needs account-specific confirmation. A format-valid code is not proof that the provider accepts it.
- The seller adapter currently accepts one-item/one-agent quotes only. Skyscanner baggage is unknown in this model; seller fare-family, refund, payment-fee and student-channel differences are not normalized into a like-for-like final cost.
- Saved browser snapshots can outlive a server cache. Verify their permitted retention and freshness behavior with the provider before relying on them commercially.
- Request limits and caches are process-local. The application has no shared provider-spend cap. A scaled or multi-instance deployment needs cost/abuse controls appropriate to the approved quota.
- Amadeus now has an overall 30-second search budget including authentication waits and its single refresh. Shared OAuth requests keep their separate timeout so one expired waiter cannot cancel another search. Verify the chosen host's request-duration limit against this budget before activation.
- The Amadeus normalizer rejects non-EUR fares, wrong endpoints/departure dates, disconnected segments and explicitly reported cabin mismatches. Missing cabin details remain governed by the provider's requested-cabin contract; verify that contract with actual approved responses before promising every accepted fare matches the intended cabin.

Official entry points are [Amadeus for Developers](https://developers.amadeus.com/) and [Skyscanner Flights Live Prices documentation](https://developers.skyscanner.net/docs/flights-live-prices/overview). Those pages were not verified from this cloud environment. Implementation corroboration is documented separately in [seller-price-comparison.md](seller-price-comparison.md); it is not official policy evidence.
