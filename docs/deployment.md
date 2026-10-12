# Prepare and preview Flyora without a paid account

The repository can be installed, built, tested and previewed locally without a hosting account, domain purchase or flight-provider credentials. This verifies the application with labeled demo fares. A public deployment and real flight pricing are separate steps.

## Run the production demo on your computer

Install Node.js 24, extract the code, then open a terminal in the folder containing `package.json`.

```bash
npm ci
```

Create `.env.local` in that folder with:

```env
FLIGHT_DATA_MODE=demo
FLIGHT_PROVIDER=amadeus
AMADEUS_ENVIRONMENT=production
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Leave provider keys and secrets unset. Then run:

```bash
npm test
npm run build
npm run typecheck
npm start
```

Open `http://localhost:3000` and leave the terminal running. The demo contains fictional fares and explicitly labeled student-benefit examples. It does not issue tickets or take payments. Press Ctrl+C to stop the server.

With the website still running, a second terminal can check its HTTP responses:

```bash
node scripts/check-deployment.mjs http://localhost:3000 --expect-mode=demo
```

This checks the home, flight-search, student-perks, privacy, terms and contact pages; `robots.txt` and `sitemap.xml`; the public `/api/status` response; and the application's baseline security headers, including `Referrer-Policy: no-referrer` and CSP frame restrictions. With `--expect-mode=demo`, it also checks that demo pages are marked `noindex`, crawling is blocked and sitemap page URLs are omitted. It never requests `/api/flights`, contacts a flight provider, opens a seller checkout or enters payment details. A passing check describes those responses only. Provider configuration reported as `configured` means credentials are present, not that authentication succeeded.

## Repeat browser checks

Install the browser once:

```bash
npx playwright install chromium
```

Use the production demo server for these checks. In a second terminal, run:

```bash
npm run test:e2e
```

On a computer with an existing server, Playwright reuses port 3000. Stop an old server and rebuild after code changes so the browser checks exercise the latest application. Linux machines may need Playwright's documented system dependencies; the GitHub workflow installs them on its disposable runner.

## GitHub validation

`.github/workflows/ci.yml` checks pushes to `main`, pull requests and manual runs. It uses Node.js 24, `npm ci`, unit tests, a production build, TypeScript checks, and Chromium browser tests against explicit demo mode. It then starts a production demo server for the read-only HTTP checker. Its official GitHub actions are pinned to full commit hashes and use the Node.js 24 action runtime. The workflow has repository read permission, references no provider credentials and does not deploy a site.

GitHub Actions requires a GitHub repository/account. Available runner minutes and storage depend on repository visibility and the account's current plan. The workflow does not enroll you in a paid service; review your account's usage settings before enabling repeated runs.

## Put a public preview online when you choose a host

Use a host that runs Next.js 16 on Node.js 24 with server-side route handlers. A static-only host cannot run Flyora's `/api/status` and `/api/flights` routes.

For a host supporting this deployment model, use `npm ci` to install, `npm run build` to build, and `npm start` to serve the application. Some Next.js hosts manage the start command themselves. Set `FLIGHT_DATA_MODE=demo` and leave API credentials unset for a public demonstration. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS site origin before the production build, then rebuild or redeploy; this value is used in site metadata.

Hosting requires your own account and acceptance of the host's terms. A provider-issued subdomain may be sufficient for a preview, depending on the chosen service. A custom domain requires a domain you own and may incur registration/renewal costs. Check traffic limits, build quotas, privacy terms and whether commercial or affiliate use is permitted by the chosen plan. Do not assume a free plan permits this business model; in particular, verify Vercel's current Hobby/commercial-use rules rather than treating Hobby as a commercial launch plan.

After deployment, check the canonical public HTTPS origin:

```bash
node scripts/check-deployment.mjs https://your-site.example --expect-mode=demo
```

Use an origin without credentials, paths, query parameters or fragments. The checker follows no redirects and sends no cookies or authentication tokens, so login-protected previews should be checked locally or after the host supplies an accessible preview. It has a 10-second timeout per response and a 2 MiB body limit. Change the timeout when needed with `--timeout-ms=15000`.

## Real fares and commercial launch remain separate

Live pricing needs a provider account with approved production access and private server credentials. Amadeus integration returns provider fares; airline search links do not guarantee that the airline website has the same price. Seller comparisons require approved Skyscanner partner access and confirmation of the contracted price basis. Review provider charges, data-use rights and affiliate eligibility before enabling live traffic. See [live-flight-search.md](live-flight-search.md) and [seller-price-comparison.md](seller-price-comparison.md).

The operator must also supply working contact information, review legal/privacy text, verify any published student offers from official airline terms, and test the actual provider and booking handoffs once authorized accounts are available. The local tests and HTTP checker do not certify these items or declare the site universally ready to launch. See [launch-checklist.md](launch-checklist.md).
