<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Product and development

Flyora is a flight-search and booking-handoff website, with student baggage and fare benefits as a differentiator. Keep flight search as the primary experience.

Use the existing checkout. Cloud tasks are isolated; do not create worktrees unless the user requests one.

Keep sample flights and Amadeus sandbox responses visibly labeled. Never substitute them for failed live searches or simulate ticket issuance. Booking currently completes on external airline websites.

Never put credentials in source or NEXT_PUBLIC variables. Student program terms are unverified: do not invent review dates, discounts, age eligibility or actual airline additional baggage. Fictional student-benefit illustrations are allowed in demo mode only, must be clearly labeled as examples rather than airline terms, and must never enter live or sandbox comparisons.

Run npm run typecheck, npm test, npm run test:e2e, and npm run build for changes to the flight-search workflow. In this cloud environment, use PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium for browser tests.
