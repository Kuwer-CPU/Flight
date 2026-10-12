# Student policy review worksheet

These are review leads copied from the application's existing airline links. Every policy is **unverified**, and every policy review date is blank. The restricted cloud network did not allow current airline terms to be read, so no eligibility rule, benefit amount or offer availability is established here. A URL on an airline domain is a starting point, not proof that the page still works or that the policy applies to a particular ticket.

Open [student-policy-template.csv](student-policy-template.csv) in a spreadsheet to fill the evidence fields. The spreadsheet contains 14 airline leads and blank factual fields. Completing it does not automatically change the website or apply benefits to live offers.

## Prioritized review leads

Priority is an implementation order, not a claim about traffic, market share or the size of any benefit. P1 starts with existing student-program entries; P2 completes that current directory; P3 checks four other airlines already in the product for broader comparison coverage.

| Priority | Airline | Existing program label or discovery lead | Existing official-domain URL | Review status | Actual review date |
| --- | --- | --- | --- | --- | --- |
| P1 | Qatar Airways (QR) | Student Club | https://www.qatarairways.com/en/student-club.html | needs-review | |
| P1 | Emirates (EK) | Student offers | https://www.emirates.com/english/special-offers/student-special-fares/ | needs-review | |
| P1 | Turkish Airlines (TK) | Student discounts | https://www.turkishairlines.com/en-int/student/ | needs-review | |
| P1 | Air India (AI) | Student offers | https://www.airindia.com/in/en/book/special-offers/student-offers.html | needs-review | |
| P1 | Singapore Airlines (SQ) | Student privileges | https://www.singaporeair.com/en_UK/sg/plan-travel/promotions/student-privileges/ | needs-review | |
| P2 | Lufthansa (LH) | Student fares; existing link uses the India locale | https://www.lufthansa.com/in/en/student-fares | needs-review | |
| P2 | Etihad Airways (EY) | Student offers | https://www.etihad.com/en/book/special-offers/promo/student-special-offer | needs-review | |
| P2 | Cathay Pacific (CX) | Student fares; existing link uses the US locale | https://www.cathaypacific.com/cx/en_US/offers/collection/student-fares.html | needs-review | |
| P2 | KLM (KL) | Student fares | https://www.klm.com/information/ticket-services/student-fares | needs-review | |
| P2 | Finnair (AY) | Student offers | https://www.finnair.com/en/flight-offers/student-flight-offers | needs-review | |
| P3 | Air France (AF) | Homepage discovery only; program not identified in the app | https://www.airfrance.com/ | needs-review | |
| P3 | British Airways (BA) | Homepage discovery only; program not identified in the app | https://www.britishairways.com/ | needs-review | |
| P3 | Air Canada (AC) | Homepage discovery only; program not identified in the app | https://www.aircanada.com/ | needs-review | |
| P3 | Qantas (QF) | Homepage discovery only; program not identified in the app | https://www.qantas.com/ | needs-review | |

The program labels above are copied from `src/lib/airlines.ts`; they have not been checked as current official program names. Homepage-only leads do not imply that an offer exists or that no offer exists.

## Evidence to record for each applicable policy

| Field | What the reviewer must establish |
| --- | --- |
| Official source and locale | Final airline URL after any redirect, relevant booking country/market, linked full terms and any effective date shown |
| Actual review date and reviewer | Date the official terms were actually read, and who read them; leave blank if blocked or unavailable |
| Eligibility | Age minimum/maximum, current enrollment, eligible institution/study country, and any passport/residence restrictions |
| Routes and carriers | Eligible origins/destinations, domestic/international scope, marketing/operating carrier and codeshare exclusions |
| Fares | Applicable fare families/booking classes, minimum stay, exclusions and whether the offer is a dedicated student fare |
| Booking channel | Direct airline website, membership login, promo code, approved agent, or another required channel; establish whether an OTA quote qualifies |
| Registration and verification | Registration requirement, when verification occurs, documents required and any verification expiry |
| Extra checked baggage | Exact additional kg or pieces, segment/itinerary scope, per-piece limits, and whether this replaces a fare allowance rather than adding to it |
| Traveler scope | Whether the benefit applies to each verified passenger or the booking; establish each traveler's eligibility in a multi-adult search |
| Standard baggage | The allowance already included in the particular fare and its source; avoid adding a benefit that the fare already includes |
| Other price/conditions | Exact discount exclusions, taxes/fees, changes/refunds, and separately quoted baggage costs if relevant |
| Validity | Booking window, travel window, policy effective date and exceptions |
| Evidence | Short exact quotation of the applicable terms and a permitted local evidence reference; avoid recording passenger documents or membership credentials |
| Recheck | Reviewer-selected next check date, plus triggers such as policy change, expired offer, broken URL or a contradictory seller quote |

Keep a separate row when terms differ by market, route, fare or channel. A global marketing page should not be flattened into one unconditional worldwide rule.

## Review statuses

- **needs-review:** no current official evidence. This is the status of every initial row.
- **verified-active:** current official terms establish a policy, with its conditions recorded. This still does not establish eligibility for every seller quote.
- **verified-conditional:** some current terms are established, but an essential applicability detail is unresolved. Display the unresolved condition; do not calculate a guaranteed allowance.
- **officially-unavailable:** an official source explicitly establishes that the relevant offer is unavailable for the recorded scope. An unsuccessful search or a missing program link is not enough.
- **expired/withdrawn:** recorded validity ended or current official evidence contradicts the previously recorded claim. Stop applying the affected benefit until reviewed again.

These are worksheet statuses for a future verified-policy model. The current application stores only `needs-review`; changing a spreadsheet cell does not mark the live product verified.

## Preserve uncertainty in the comparison

A reviewer should not fill a blank with zero simply because a benefit was not found. Unknown extra baggage stays unknown. Record kg and pieces separately: one extra piece must not be converted into an invented weight allowance. A policy that gives a total student-fare allowance is different from an additional allowance; applying both can double-count baggage.

Student registration by itself does not establish that an ordinary Amadeus fare or an agency's quote is eligible. A benefit may require a direct airline channel, a specific student fare, an eligible route and successful verification. Those requirements must be matched to the **selected seller and fare** before an eligible total or student savings can be calculated. If that connection is absent, show the official programme link and pending eligibility instead.

The current search has one student profile for the group. That is not evidence that every adult in a multi-traveler booking meets an airline's requirements. Record the benefit's traveler scope and check individual eligibility before applying any future verified rule to the whole party.

Flight time, currency, passenger count and quoted baggage charges also have to agree before a comparable-cost score is meaningful. The current fictional demo bonuses and add-on prices are not evidence for any real airline.

## Record a policy without making a purchase

1. Read the relevant current official page and its full terms for the selected market. If unavailable, keep `needs-review` and leave review date and policy facts blank.
2. Fill exact conditions and an evidence quotation. Distinguish an offer's booking/travel dates from the date of the review.
3. Check the required booking channel and fare scope against a real provider quote only when permitted provider access exists. Stop before purchase; a paid ticket is not necessary to document the policy.
4. Keep partial or conflicting evidence conditional. Have the recorded rule checked before it changes live baggage totals or discounts.
5. Retain the applicable source and actual review date beside any published claim, and schedule a recheck appropriate to the offer's validity.

The worksheet does not certify student status, send registration documents, make bookings or establish an affiliate relationship. Current official sources must be verified through an authorized network/account when available; cached GitHub descriptions and third-party summaries are not airline terms.
