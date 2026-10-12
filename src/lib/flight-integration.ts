export type TravelpayoutsIntegration = {
  integration: 'travelpayouts';
  status: 'configured' | 'disabled' | 'unconfigured' | 'invalid-configuration';
  affiliateLinks: boolean;
  transport: 'script' | 'iframe';
  frameUrl?: string;
  frameOrigin?: string;
  whiteLabelId?: string;
  scriptUrl?: string;
  scriptOrigin?: string;
};
export type FlightIntegration = { integration: 'api' } | TravelpayoutsIntegration;

function frameUrl(value: string | undefined): URL | undefined {
  const text = value?.trim();
  if (!text || text.length > 8192 || /[\u0000-\u001f\u007f]/.test(text)) return undefined;
  try {
    const url = new URL(text);
    const hostname = url.hostname.toLowerCase();
    const labels = hostname.split('.');
    const credentialNames = new Set(['apikey', 'secret', 'password', 'accesstoken', 'token', 'auth', 'authorization', 'clientsecret', 'sessiontoken']);
    if ([...url.searchParams.keys()].some(name => credentialNames.has(name.toLowerCase().replace(/[-_]/g, '')))) return undefined;
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') ||
      hostname.length > 253 || labels.length < 2 ||
      !labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) ||
      !/^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/.test(labels.at(-1)!) ||
      /(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/.test(hostname) ||
      /(?:^|\.)example\.(?:com|net|org)$/.test(hostname)) return undefined;
    return url;
  } catch { return undefined; }
}

/** Pure validation for CSP configuration; this does not establish partner approval. */
export function validatedFrameOrigin(value: string | undefined): string | undefined {
  return frameUrl(value)?.origin;
}
function decodeAttribute(value: string): string | undefined {
  if (/&[a-z][a-z0-9]*;/i.test(value.replace(/&amp;/gi, ''))) return undefined;
  return value.replace(/&amp;/gi, '&').replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (_match, code: string) => {
    const number = code[0].toLowerCase() === 'x' ? Number.parseInt(code.slice(1), 16) : Number.parseInt(code, 10);
    return number > 0 && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff) ? String.fromCodePoint(number) : '\u0000';
  });
}
function iframeSource(code: string): string | undefined {
  if (code.length > 20_000) return undefined;
  // Accept one empty iframe element only. Its HTML and attributes are never rendered.
  const match = /^<iframe((?:\s+[^<>]*)?)>\s*<\/iframe>$/i.exec(code.trim());
  if (!match) return undefined;
  const attributes = match[1];
  const allowed = new Set(['src', 'title', 'width', 'height', 'loading', 'frameborder', 'scrolling', 'allowfullscreen', 'allow', 'sandbox', 'referrerpolicy', 'style', 'class', 'id']);
  const seen = new Set<string>();
  const attribute = /\s+([a-z][a-z0-9-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/iy;
  let offset = 0;
  let source: string | undefined;
  while (offset < attributes.length) {
    if (!attributes.slice(offset).trim()) break;
    attribute.lastIndex = offset;
    const parsed = attribute.exec(attributes);
    if (!parsed) return undefined;
    const name = parsed[1].toLowerCase(), value = parsed[2] ?? parsed[3];
    if (!allowed.has(name) || seen.has(name) || (value === undefined && name !== 'allowfullscreen')) return undefined;
    seen.add(name);
    if (name === 'src') source = value === undefined ? undefined : decodeAttribute(value);
    offset = attribute.lastIndex;
  }
  return source;
}
function sameOrigin(url: URL, siteUrl: string | undefined) {
  if (!siteUrl?.trim()) return false;
  try { return new URL(siteUrl.trim()).origin === url.origin; } catch { return false; }
}

/** Server-only usage: return safe public fields, never widget HTML or provider credentials. */
export function getFlightIntegration(): FlightIntegration {
  const selected = process.env.FLIGHT_SEARCH_INTEGRATION?.trim() || 'travelpayouts';
  if (selected === 'api') return { integration: 'api' };
  const embed = process.env.TRAVELPAYOUTS_EMBED_ENABLED?.trim() || 'true';
  const affiliate = process.env.TRAVELPAYOUTS_AFFILIATE_LINKS?.trim() || 'false';
  const direct = process.env.TRAVELPAYOUTS_WHITE_LABEL_URL?.trim();
  const code = process.env.TRAVELPAYOUTS_WIDGET_CODE?.trim();
  const transport = direct || code ? 'iframe' as const : 'script' as const;
  const base = { integration: 'travelpayouts' as const, affiliateLinks: affiliate === 'true', transport };
  if (selected !== 'travelpayouts' || !['true', 'false'].includes(embed) || !['true', 'false'].includes(affiliate)) {
    return { ...base, status: 'invalid-configuration' };
  }
  if (embed !== 'true') return { ...base, status: 'disabled' };
  if (transport === 'script') {
    const whiteLabelId = process.env.TRAVELPAYOUTS_WHITE_LABEL_ID?.trim() || '23277';
    if (!/^[1-9][0-9]{0,11}$/.test(whiteLabelId)) return { ...base, status: 'invalid-configuration' };
    return { ...base, status: 'configured', whiteLabelId,
      scriptUrl: 'https://tpwidg.com/wl_web/main.js?wl_id=' + whiteLabelId, scriptOrigin: 'https://tpwidg.com' };
  }
  // Pick one approved configuration; ambiguous sources do not silently override each other.
  if (direct && code) return { ...base, status: 'invalid-configuration' };
  const url = frameUrl(direct || (code ? iframeSource(code) : undefined));
  if (!url || sameOrigin(url, process.env.NEXT_PUBLIC_SITE_URL)) return { ...base, status: 'invalid-configuration' };
  return { ...base, status: 'configured', frameUrl: url.href, frameOrigin: url.origin };
}
