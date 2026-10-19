# Student Luggage Calculator

`/luggage-calculator` extends the recovered drafts using the approved
`flyora-design-preview/previews/luggage-calculator.png` layout: compact introduction,
numbered journey/packing panels, comparison cards and a Travel Essentials sidebar.
The existing homepage, travel-cost calculator and flight-search workflow remain available.

## What users can compare

India is listed first for departures; major Indian airports and common international
student destinations are prioritised. The full existing country/airport catalog remains
available. Route ordering does not establish a carrier's coverage or student eligibility.

For one traveler, enter each checked bag separately (up to ten), optional cabin bags,
age, verification status, cabin and route. Select up to four airlines and enter each
actual ticket's allowance, per-bag limit and optional fare name. No default numeric
allowance is supplied. Confirm that each entry applies to the selected route, fare,
cabin and operating airline. Route, cabin, age, verification, fare and allowance edits
clear relevant confirmations. Editing bag weights immediately updates comparisons.

Weight rules check the total plus individual limits and any specified bag count.
Piece rules check both count and each bag; unused weight in one piece cannot offset
an overweight piece. Two entered bags of 23 kg total 46 kg. This is a user-entered
packing example, not an airline allowance. Empty checked-bag lists are supported.

Standard allowance, conditional student allowance and cabin checks stay separate.
Exceeding entered standard terms produces explicit warnings even when unknown student
terms mean the overall outcome still needs airline confirmation. No excess fee is
estimated. Dimensions, personal items, combined cabin limits, special items, interline
and codeshare rules need separate confirmation; weights alone do not establish acceptance.

## Policy verification and current limits

All six airline records are **unverified**: Air India, Qatar Airways, Emirates,
Singapore Airlines, Turkish Airlines and Lufthansa. Official student-program and
baggage-page URLs are stored in `src/lib/baggage-airlines.ts`; `program: null` means
no review date, age eligibility, standard allowance, student extra or discount is
asserted. Official sources were blocked by the cloud environment's CONNECT 403 policy
on 19 October 2026. Screenshot text and historic numbers are not verification evidence.

Ticket confirmation defaults to unchecked. Completing the form does not confirm any
ticket. Each result card explicitly labels unconfirmed details as illustrative, and
positive results require active confirmation and say “Fits your entered allowance.”
User confirmation is never presented as independent approval by an airline. Editing
ticket terms or journey details clears the relevant confirmation.

Standard results use the user's entered and confirmed ticket terms only. Generic
policies are never applied across every ticket. No official program has been activated
by entering a student ID or selecting an airline. Discounts and flexibility benefits
remain “Check with airline.”

The model accepts reviewed programs only with matching official HTTPS source, review
and expiry dates, route/cabin/fare restrictions, age requirements, valid allowance,
activation steps and airline verification. A student total is a complete eligible rule,
not an automatic addition to the standard ticket. Fictional program fixtures in unit
tests demonstrate this gate; they are never shipped as airline data. Future official
records require source review and corresponding applicability tests before publication.

## Travel Essentials

Optional server-side `TRAVEL_ESSENTIALS_SCALE_URL`, `TRAVEL_ESSENTIALS_CUBES_URL` and
`TRAVEL_ESSENTIALS_CABIN_URL` configure HTTPS affiliate destinations. Set only approved
links. The UI labels configured links as affiliate links and uses `rel=sponsored`.
Without configuration, links are explicitly labelled external Amazon retailer searches.
No payment, inventory or checkout is provided. Accessories do not increase an allowance.
User inputs stay in page memory; no account, document upload or provider request occurs.

## Validation

Run `npm test`, `npm run lint`, `npm run build`, `npm run typecheck` and
`PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`.
Unit coverage includes weight/piece systems, 2×23 kg, excess/count/individual limits,
unknown/stale policies, conditional eligibility, route order and safe retailer links.
The calculator browser suite covers desktop and 390/360-pixel layouts, accessibility,
multiple airlines, unknown policies and changes without restarting. The existing partner
suite remains a local SDK fixture, not a live-fare or booking verification.

## Review screenshots

- [Desktop calculator](previews/luggage-calculator-desktop.png)
- [Mobile calculator](previews/luggage-calculator-mobile.png)
- [Desktop entered-ticket comparison](previews/luggage-calculator-results.png)
- [Mobile entered-ticket comparison](previews/luggage-calculator-results-mobile.png)

Comparison screenshots deliberately use manually entered illustrative ticket terms:
two 23 kg bags, a two-piece/23 kg-per-piece ticket and a 30 kg-total/32 kg-per-bag ticket.
These numbers demonstrate calculation behavior and are not published airline policies.

Validated on 19 October 2026: 659 unit tests; 29 existing application browser tests;
9 calculator browser tests (including desktop accessibility and 390/360 px layouts);
7 Travelpayouts fixture browser tests; lint, TypeScript and production builds in API
demo and primary Travelpayouts modes. Final primary-mode calculator and partner tests
passed after accessibility fixes. Existing-page HTTP checks also passed. Live airline
policy, fare and booking verification remains outside these tests.

The final help-text and confirmation corrections were validated with 661 unit tests,
11 calculator browser tests, lint, TypeScript and the primary production build. The
results screenshots were refreshed to show the corrected system-specific guidance
and explicitly distinguish user-confirmed ticket inputs from airline approval.
