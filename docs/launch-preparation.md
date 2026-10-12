# Flyora launch preparation

The application can be built and explored without a paid service or provider key. That is different from opening a working commercial flight comparison to travelers. This release prepares the independent work and records the remaining external prerequisites.

## Prepared without an account or payment

| Work | What is prepared |
| --- | --- |
| Release checks | GitHub workflow for locked installation, unit tests, production build, TypeScript, browser tests and response checks; no provider secrets or live searches |
| Deployment inspection | `npm run check:deployment -- <site-origin>` checks public pages, headers, indexing and safe provider status without calling a flight API |
| Launch audit | `npm run launch:check` reports missing production/business configuration and actual review evidence; `-- --json` produces a machine-readable report |
| Preview indexing | Indexing is disabled by default. Demo, sandbox, invalid configurations and missing public/operator settings cannot enable it |
| Support and privacy | Contact page, configurable operator/contact, accurate search URL/history/log disclosures and a clear-all saved-flight control |
| Flight data reliability | Invalid saved records are isolated; Amadeus fares must match currency, route, dates and reported cabin, with a bounded overall search deadline |
| Provider application | [Prepared brief and enquiry](provider-application.md), with owner fields blank; nothing submitted |
| Student policies | [Review procedure](student-policy-review.md) and a [14-airline worksheet](student-policy-template.csv); all initial policy facts and review dates remain unverified |

The GitHub workflow is prepared in source. A successful local run does not prove the hosted Actions run or a deployed Vercel site has passed. Hosting quotas and account permissions remain controlled by those services.

Local validation on 12 October 2026 passed: 302 unit tests, 23 Chromium browser tests, TypeScript and the production build. The read-only checker passed on nine routes in both explicit demo and missing-key live configurations. Live and sandbox startup checks confirmed that fictional student examples are absent and missing credentials return 503 without sample fares. The production dependency audit reported no known vulnerabilities. None of these checks authenticated a provider or established real ticket availability.

## Run the audit

Use Node.js 24, or at least 22.18, from the repository folder:

```bash
npm ci
npm run launch:check
```

The command reads production `.env` files through Next.js's environment loader and reads [launch-review.json](launch-review.json). It performs no network calls. Exit code **1** means there are outstanding launch prerequisites; **2** means the command could not read its inputs. A blocked audit is expected while credentials and owner details are absent. Do not disable the checks to make it pass.

Review records use `status`, `reviewedOn` and `evidence`. Set a record to `complete` only after the corresponding work has actually happened, with a real calendar review date and a non-secret reference. Do not store credentials, passenger data or private partner documents in this committed file. The checker can validate record shape and dates; it cannot authenticate evidence, certify legal compliance or guarantee ticket availability.

The audit requires the seller feed because airline/agency price comparison is the intended launch product. Amadeus remains available for ordinary fare searches, but those alone do not complete the requested seller comparison.

## Configure the public business details

Add these values to ignored `.env.local` or the host's environment settings:

| Setting | Value to supply |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Actual public HTTPS origin, without a path, query, credentials or placeholder domain |
| `FLYORA_BUSINESS_NAME` | Actual operator name to publish |
| `FLYORA_CONTACT_EMAIL` | Working support/privacy inbox to publish; test receiving mail yourself |
| `FLYORA_ALLOW_INDEXING` | Leave `false` for previews; opt into `true` only after real launch review |

The contact page does not create an inbox, send mail or collect documents. Without contact configuration it honestly says the support address will be published before public launch. Indexing opt-in also needs a configured production feed, origin and contact; credential presence is not evidence that the provider works. Enabling it is an owner decision after the external checks.

**Rebuild/redeploy after changing public origin, business information or indexing settings.** Some pages and metadata are generated at build time. Changing only a runtime variable can leave previously built contact pages or metadata unchanged.

## Items requiring the owner or external access

| Priority | Missing item | Why it cannot be completed from code |
| --- | --- | --- |
| 1 | Approved seller API account, contract and credentials | Provider eligibility, price rights, budget and private credentials must come from the account holder |
| 2 | Business/operator name, operating jurisdiction and contact inbox | These are real identity and business choices, not values the application can invent |
| 3 | Hosting account and public HTTPS origin | The owner must accept the host's terms and choose a plan permitting the intended commercial use; a custom domain is optional for a preview |
| 4 | Official student-rule verification | Airline documentation is outside the current cloud network allowlist. Saved network drafts must be applied before research here can proceed; a worksheet is not verification |
| 5 | Real quote and seller checkout verification | Requires approved access. Confirm group prices, taxes, fees, baggage, ticket/transfer conditions and booking links without purchasing a ticket |
| 6 | Legal/privacy and operations review | Depends on jurisdiction, chosen provider/host agreements, log retention, rate limits and actual API spend controls |

The configured server caches and IP limits are process-local. A production host with multiple instances needs shared limits or equivalent edge/host protection, plus provider quotas and budget alerts. This code does not establish a global API cost cap. The response checker can support monitoring, but no external uptime/alert service is activated.

Start with a limited audience after these items are met. A database, user accounts, on-site payment integration and a custom domain are not required for the current comparison-and-handoff model. Affiliate monetization needs a separate permitted agreement; search access does not automatically generate commission.

See [deployment.md](deployment.md) for local and hosting steps and [launch-checklist.md](launch-checklist.md) for the commercial prerequisites. Payment or ticket issuance on Flyora would require a separate operational booking stack.
