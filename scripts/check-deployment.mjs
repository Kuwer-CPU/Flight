#!/usr/bin/env node
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Read-only HTTP checks: no cookies, credentials, flight API calls or paid services.
const paths = ['/', '/flights', '/student-perks', '/student-benefits', '/travel-calculator', '/miles-wallet', '/travel-checklist', '/privacy', '/terms', '/contact', '/robots.txt', '/sitemap.xml'];
const maximumBodyBytes = 2 * 1024 * 1024;
const modes = ['demo', 'test', 'live'];
class CheckError extends Error {}

function options(arguments_) {
  if (arguments_.length === 0 || arguments_[0] === '--help') return null;
  let origin;
  try { origin = new URL(arguments_[0]); }
  catch { throw new CheckError('Supply a valid HTTP(S) site origin.'); }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password ||
    origin.pathname !== '/' || origin.search || origin.hash) {
    throw new CheckError('Use only a site origin, without credentials, a path, query parameters or a fragment.');
  }
  let timeout = 10_000;
  let expectedMode;
  let expectedIntegration;
  for (const argument of arguments_.slice(1)) {
    if (argument.startsWith('--timeout-ms=')) {
      timeout = Number(argument.slice('--timeout-ms='.length));
      if (!Number.isInteger(timeout) || timeout < 100 || timeout > 30_000) throw new CheckError('Timeout must be an integer from 100 to 30000 milliseconds.');
    } else if (argument.startsWith('--expect-mode=')) {
      expectedMode = argument.slice('--expect-mode='.length);
      if (!modes.includes(expectedMode)) throw new CheckError('Expected mode must be demo, test or live.');
    } else if (argument.startsWith('--expect-integration=')) {
      expectedIntegration = argument.slice('--expect-integration='.length);
      if (!['api', 'travelpayouts'].includes(expectedIntegration)) throw new CheckError('Expected integration must be api or travelpayouts.');
    } else throw new CheckError('Unknown option. Use --help for usage.');
  }
  return { origin, timeout, expectedMode, expectedIntegration };
}

function securityFailures(headers) {
  const failures = [];
  if (headers.get('x-content-type-options')?.toLowerCase() !== 'nosniff') failures.push('X-Content-Type-Options must be nosniff');
  if (headers.get('referrer-policy')?.toLowerCase() !== 'no-referrer') failures.push('Referrer-Policy must be no-referrer');
  if (!['DENY', 'SAMEORIGIN'].includes(headers.get('x-frame-options')?.toUpperCase())) failures.push('X-Frame-Options must be DENY or SAMEORIGIN');
  if (!/(?:^|;)\s*frame-ancestors\s+'none'\s*(?:;|$)/i.test(headers.get('content-security-policy') || '')) failures.push("Content-Security-Policy must include frame-ancestors 'none'");
  const permissions = headers.get('permissions-policy') || '';
  for (const feature of ['camera', 'microphone', 'geolocation']) {
    if (!new RegExp('(?:^|,)\\s*' + feature + '\\s*=\\s*\\(\\s*\\)').test(permissions)) failures.push('Permissions-Policy must disable ' + feature);
  }
  if (headers.has('x-powered-by')) failures.push('X-Powered-By should be absent');
  return failures;
}

async function readBody(response) {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximumBodyBytes) {
      await reader.cancel();
      throw new CheckError('Response exceeds the smoke-check size limit.');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export function providerDescription(body, expectedMode) {
  let status;
  try { status = JSON.parse(body); }
  catch { throw new CheckError('Status endpoint did not return valid JSON.'); }
  if (!status || typeof status !== 'object' || !modes.includes(status.mode) ||
    !['amadeus', 'skyscanner'].includes(status.provider) || !['test', 'production'].includes(status.environment) ||
    !['demo', 'missing-credentials', 'invalid-configuration', 'configured'].includes(status.status) ||
    typeof status.configured !== 'boolean' || typeof status.message !== 'string' ||
    (status.status === 'configured' && !status.configured)) {
    throw new CheckError('Status endpoint does not match the public configuration contract.');
  }
  if (Object.keys(status).some(key => !['mode', 'provider', 'environment', 'status', 'configured', 'message'].includes(key))) throw new CheckError('Status endpoint exposes unexpected fields.');
  if ((status.status === 'demo') !== (status.mode === 'demo') ||
    (status.status === 'missing-credentials' && status.configured)) throw new CheckError('Status mode or credential presence conflicts with its configuration state.');
  if (expectedMode && status.mode !== expectedMode) throw new CheckError('Status mode differs from the requested expectation.');
  const explanations = {
    demo: 'fictional examples enabled; no live provider checked',
    'missing-credentials': 'credentials are missing; live search is unavailable',
    'invalid-configuration': 'configuration is invalid; live search is unavailable',
    configured: 'credential presence only; not authenticated by this check',
  };
  return `Provider configuration: ${status.provider} / ${status.mode} / ${status.status} — ${explanations[status.status]}.`;
}

export function integrationDescription(body, settings = {}) {
  let status;
  try { status = JSON.parse(body); }
  catch { throw new CheckError('Integration status endpoint did not return valid JSON.'); }
  if (!status || typeof status !== 'object' || !['api', 'travelpayouts'].includes(status.integration)) throw new CheckError('Integration status endpoint does not identify a supported integration.');
  if (settings.expectedIntegration && status.integration !== settings.expectedIntegration) throw new CheckError('Selected integration differs from the requested expectation.');
  if (status.integration === 'api') {
    const { integration, ...provider } = status;
    return { integration, description: 'Selected integration: API flight search. ' + providerDescription(JSON.stringify(provider), settings.expectedMode) };
  }
  if (!['configured', 'disabled', 'unconfigured', 'invalid-configuration'].includes(status.status) ||
    typeof status.configured !== 'boolean' || status.configured !== (status.status === 'configured') ||
    !['script', 'iframe'].includes(status.transport) || typeof status.affiliateLinks !== 'boolean' || typeof status.message !== 'string') {
    throw new CheckError('Integration status endpoint does not match the public partner configuration contract.');
  }
  if (Object.keys(status).some(key => !['integration', 'status', 'configured', 'transport', 'affiliateLinks', 'message'].includes(key))) throw new CheckError('Integration status endpoint exposes unexpected fields.');
  return { integration: 'travelpayouts', description: `Selected integration: Travelpayouts / ${status.transport} / ${status.status} — configuration only; rendering, live prices, account ownership and booking availability are not checked. Amadeus credentials are not required for this integration.` };
}

async function inspect(path, settings) {
  try {
    const response = await fetch(new URL(path, settings.origin), {
      method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(settings.timeout),
      headers: { Accept: path.startsWith('/api/') ? 'application/json' : 'text/html' },
    });
    if (response.status !== 200) throw new CheckError('Expected HTTP 200; received HTTP ' + response.status + '. Use the canonical, accessible site origin.');
    const failures = securityFailures(response.headers);
    const contentType = response.headers.get('content-type') || '';
    if (path === '/api/status' || path === '/api/integration-status') {
      if (!contentType.toLowerCase().includes('application/json')) failures.push('Status Content-Type must be JSON');
      if (!response.headers.get('cache-control')?.toLowerCase().includes('no-store')) failures.push('Status Cache-Control must include no-store');
    } else if (path === '/robots.txt') {
      if (!contentType.toLowerCase().includes('text/plain')) failures.push('Robots Content-Type must be plain text');
    } else if (path === '/sitemap.xml') {
      if (!contentType.toLowerCase().includes('xml')) failures.push('Sitemap Content-Type must be XML');
    } else if (!contentType.toLowerCase().includes('text/html')) failures.push('Page Content-Type must be HTML');
    const body = await readBody(response);
    let description;
    let integration;
    if (path === '/api/integration-status') ({ integration, description } = integrationDescription(body, settings));
    else if (path === '/api/status') description = providerDescription(body, settings.expectedMode);
    else if (path === '/robots.txt') {
      if (!/^User-agent:/im.test(body)) failures.push('Robots response must contain a user-agent rule');
      if (settings.expectedMode === 'demo' && (!/^Disallow:\s*\/\s*$/im.test(body) || /^Sitemap:/im.test(body))) failures.push('Demo robots must disallow crawling and omit sitemap advertisement');
    } else if (path === '/sitemap.xml') {
      if (!/<urlset(?:\s|>)/i.test(body)) failures.push('Sitemap response must contain a URL set');
      if (settings.expectedMode === 'demo' && /<url(?:\s|>)/i.test(body)) failures.push('Demo sitemap must not advertise page URLs');
    } else {
      if (!/<html(?:\s|>)/i.test(body) || !/<title(?:\s|>)/i.test(body)) failures.push('Page must contain HTML and a title');
      if (settings.expectedMode === 'demo' && !/<meta\s[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(body)) failures.push('Demo page must include robots noindex metadata');
    }
    if (failures.length) throw new CheckError(failures.join('; ') + '.');
    return { path, success: true, description, integration };
  } catch (error) {
    // Never print response bodies, supplied URLs, query strings, headers or fetch
    // errors (which may contain infrastructure details). Messages below are ours.
    const message = error?.name === 'TimeoutError' || error?.name === 'AbortError'
      ? 'Request timed out.'
      : error instanceof CheckError ? error.message : 'Request failed; check the address, network access and TLS.';
    return { path, success: false, message };
  }
}

async function main() {
  let settings;
  try { settings = options(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 2; return; }
  if (!settings) {
    console.log('Usage: node scripts/check-deployment.mjs <http(s)://site-origin> [--expect-integration=travelpayouts|api] [--expect-mode=demo|test|live] [--timeout-ms=10000]');
    console.log('Checks public pages, baseline headers and selected integration configuration only. --expect-mode applies to explicit API mode. Never searches flights or executes partner scripts.');
    if (process.argv.length === 2) process.exitCode = 2;
    return;
  }
  console.log('Checking public pages and configuration status. No flight searches will run.');
  if (settings.origin.protocol === 'http:') console.log('HTTP target: hosted HTTPS behavior is not checked.');
  const integration = await inspect('/api/integration-status', settings);
  // An unused API adapter is not a mandatory part of the primary partner interface.
  const selectedPaths = integration.integration === 'api' ? [...paths, '/api/status'] : paths;
  const selectedSettings = { ...settings, expectedMode: integration.integration === 'api' ? settings.expectedMode : undefined };
  const results = [integration, ...await Promise.all(selectedPaths.map(path => inspect(path, selectedSettings)))];
  for (const result of results) {
    console.log(`${result.success ? 'PASS' : 'FAIL'} ${result.path}${result.message ? ' — ' + result.message : ''}`);
    if (result.description) console.log(result.description);
  }
  if (results.some(result => !result.success)) { process.exitCode = 1; return; }
  console.log('Read-only response checks passed. Partner scripts were not executed. Widget rendering, provider authentication, live fares, booking availability and commercial-launch requirements were not tested.');
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) await main();
