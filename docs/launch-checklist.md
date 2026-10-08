# Before launching Flyora

This release compares flights and hands booking to the selected seller. It does not collect payment or issue tickets. The main launch blockers are approved production price-feed access and verified student-benefit rules.

## Required for a useful public launch

1. **Approve the data source.** Obtain production access, rights to display prices and permission to use seller booking links. For multi-seller comparison, the Amadeus adapter alone is insufficient; activate and verify the partner seller feed. Confirm current API contracts, quote units/passenger basis, attribution and geographic coverage. Review usage charges, quotas and support channels.
2. **Verify the student benefit.** Record the official source URL and review date, age and enrolment requirements, eligible routes/fares, luggage units and required booking channel. Implement those rules against the particular seller's offer. Registration in an airline program does not establish eligibility for every OTA fare. Schedule periodic rechecks and withdraw expired claims.
3. **Host the application.** Use a Next.js/Node host such as Vercel, connect a domain, enable HTTPS and set the public site URL. Keep each provider credential in secure server settings. Test redeployment/restart and separate any sandbox credentials from production.
4. **Identify the business.** Add your legal business name, contact email and a support process. Have privacy/terms and any required disclosures reviewed for your business jurisdiction and the countries you serve. Explain who handles booking, payment, ticketing, refunds, changes and complaints. Do not present a comparison/handoff service as an issued-ticket merchant.
5. **Test real transactions up to handoff.** Confirm route, dates, cabin and passenger count in actual returned quotes. Check several airline and agency links against their checkout, including baggage and any added fees. Test empty results, expired links, API limits/errors and partial searches. Complete mobile/accessibility checks and verify no secrets reach HTML, browser bundles or logs.
6. **Monitor cost and reliability.** Track provider errors/latency and API spend, set alerts/budgets, and size the rate limits for expected traffic. Current caches and limits are process-local; multi-instance traffic needs shared storage/limits or equivalent infrastructure. Keep backups/version history and a way to disable a failing feed.
7. **Set up monetization separately.** Apply to permitted affiliate programs and use approved tracking/deep links with any required disclosures. Access to search data does not automatically earn commission. Check provider licensing before altering links.

Start with a limited audience after these checks. Use successful bookings and customer feedback to validate the student comparison before increasing traffic. Add analytics or marketing cookies only with a matching privacy/consent design.

## If payment and ticketing will happen on Flyora

That requires a separate booking/order integration, passenger-data handling, payments, ticketing support, cancellation/change/refund workflows and seller/agency agreements. Accreditation or a ticketing partner may be required for the chosen business model and jurisdiction. Do not accept payment until those services and responsibilities are operational.

## Current verification status

The application has automated tests and a successful production build. Provider tests and seller-comparison browser tests simulate responses. There are no approved API credentials in this cloud environment, so actual fares, seller checkout links, live coverage and booking transfers have not been validated. Student policies remain marked as needing review. These are concrete launch prerequisites, not completed checks.
