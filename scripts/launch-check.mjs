#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import nextEnv from '@next/env';
import { getFlightConfig } from '../src/lib/flight-config.ts';
import { getFlightIntegration } from '../src/lib/flight-integration.ts';
import { getSiteConfig, canIndexSite } from '../src/lib/site-config.ts';

// Offline configuration/evidence audit. No provider calls, account creation or payments.
const manualChecks = {
  provider_contract: 'Approved production access, current API contract and rights to display/cache/link quotes',
  live_seller_quotes: 'Real multi-traveler airline/agency prices and checkout handoffs verified',
  student_rules: 'Official student terms reviewed and applicable rules implemented for the selected seller',
  business_and_legal: 'Business identity, working contact and jurisdiction-specific privacy/terms review',
  hosting_https: 'Production host, HTTPS, domain/origin and deployed response checks verified',
  monitoring_and_limits: 'API quotas/spend alerts, host limits, log retention and rate-limit protection reviewed',
};

export function validEvidence(value) {
  if (!value || typeof value !== 'object' || value.status !== 'complete' ||
    typeof value.reviewedOn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.reviewedOn) ||
    typeof value.evidence !== 'string' || !value.evidence.trim()) return false;
  const date = new Date(value.reviewedOn + 'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value.reviewedOn &&
    value.reviewedOn <= new Date().toISOString().slice(0, 10);
}

export function assessLaunch(review) {
  const config = getFlightConfig();
  const integration = getFlightIntegration();
  const partner = integration.integration === 'travelpayouts';
  const site = getSiteConfig();
  const checks = [];
  const add = (id, pass, description) => checks.push({ id, status: pass ? 'pass' : 'blocked', description });
  add('production_configuration', partner ? integration.status === 'configured' : config.mode === 'live' && config.environment === 'production' && config.status === 'configured',
    partner ? 'The selected Travelpayouts interface must have valid enabled configuration. Configuration does not verify deployed rendering, live fares or successful booking handoffs.'
      : 'Selected feed must use configured production credentials. Presence does not verify authentication.');
  add('seller_comparison_feed', partner ? integration.status === 'configured' : config.provider === 'skyscanner',
    partner ? 'The selected Travelpayouts interface is configured. Its actual seller coverage and booking handoffs require separate verification; Amadeus keys are not required for this integration.'
      : 'This release uses the approved seller partner feed for airline/agency comparison; ordinary Amadeus fares alone do not supply it.');
  add('public_origin', site.publicOrigin, 'Set NEXT_PUBLIC_SITE_URL to the real HTTPS site origin, without a path, query or placeholder domain.');
  add('business_identity', !!site.businessName, 'Set FLYORA_BUSINESS_NAME to the actual operator name.');
  add('business_contact', !!site.contactEmail, 'Set FLYORA_CONTACT_EMAIL to a working support address; verify delivery yourself.');
  const exposedSecretNames = Object.keys(process.env).filter(name => /^NEXT_PUBLIC_.*(?:SECRET|TOKEN|PASSWORD|API_KEY|PRIVATE_KEY)/i.test(name) && !!process.env[name]);
  add('private_credentials', exposedSecretNames.length === 0,
    'Keys, tokens, secrets and passwords must never use NEXT_PUBLIC_ variables.');
  add('indexing_configuration', !site.indexingRequested || canIndexSite(config, site, integration),
    'Indexing is optional for a limited launch and stays off by default. Opt-in requires a configured selected integration, valid origin and business contact.');
  const evidence = review?.schemaVersion === 1 && review?.checks && typeof review.checks === 'object' ? review.checks : {};
  const selectedManualChecks = partner ? {
    ...manualChecks,
    provider_contract: 'Travelpayouts account/interface ownership, partner terms, permitted commercial use and booking-link rights reviewed',
    live_seller_quotes: 'The deployed Travelpayouts interface renders and real multi-traveler searches, seller prices and booking handoffs have been manually verified',
    monitoring_and_limits: 'Partner usage conditions, host limits, log retention and monitoring reviewed',
  } : manualChecks;
  for (const [id, description] of Object.entries(selectedManualChecks)) add(id, validEvidence(evidence[id]), description);
  return {
    audit: 'offline launch preparation',
    integration: integration.integration,
    provider: partner ? 'travelpayouts' : config.provider,
    mode: partner ? 'partner-interface' : config.mode,
    configurationStatus: partner ? integration.status : config.status,
    blocked: checks.filter(check => check.status === 'blocked').length,
    checks,
    limitations: 'Recorded manual evidence is not independently verified by this checker. Passing does not certify legal compliance, API access, prices or successful ticket issuance. Partner configuration alone does not verify widget rendering, availability, account ownership or booking handoffs.',
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Usage: npm run launch:check [-- --json]\nReads production .env files and docs/launch-review.json locally; performs no network calls. Exit1 means outstanding blockers.');
    return;
  }
  if (args.some(argument => argument !== '--json')) throw new Error('Use only --json or --help.');
  nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() { throw new Error('Unable to read local environment configuration.'); } });
  const review = JSON.parse(await readFile(new URL('../docs/launch-review.json', import.meta.url), 'utf8'));
  const report = assessLaunch(review);
  if (args.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else {
    console.log('Flyora launch preparation — offline audit');
    console.log('Integration: ' + report.integration + '; provider: ' + report.provider + '; mode: ' + report.mode + '; configuration: ' + report.configurationStatus + '.');
    for (const check of report.checks) console.log('[' + check.status.toUpperCase() + '] ' + check.id + ': ' + check.description);
    console.log('\n' + report.blocked + ' blockers remain. Record real, non-secret review evidence in docs/launch-review.json only after completing each check.');
    console.log(report.limitations);
  }
  process.exitCode = report.blocked ? 1 : 0;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(() => { console.error('Launch audit could not read its configuration. Check arguments and local files; no secret values are printed.'); process.exitCode = 2; });
}
