import {
  essentialsProducts,
  type EssentialAffiliateNetwork,
  type ResolvedEssential,
  type VerifiedEssentialPrice,
} from './essentials-catalog';

/** Historical prices expire; the retailer always determines the current price and availability. */
export const ESSENTIAL_PRICE_MAX_AGE_DAYS = 7;
const PRICE_MAX_AGE_MS = ESSENTIAL_PRICE_MAX_AGE_DAYS * 24 * 60 * 60 * 1_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Only public HTTPS destinations; this validates configuration and never fetches a URL. */
function externalUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim() || /[\u0000-\u001f\u007f]/.test(value)) return;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return;
    const host = url.hostname.toLowerCase();
    if (!host.includes('.') || host.endsWith('.') || host.includes(':') || /^[\d.]+$/.test(host)) return;
    if (/(^|\.)(localhost|local|internal|intranet|lan|home|invalid|test)$/.test(host)) return;
    return url.href;
  } catch { return; }
}

function network(value: unknown): EssentialAffiliateNetwork | undefined {
  if (value === 'admitad' || value === 'amazon-associates' || value === 'retailer') return value;
}

function verifiedPrice(value: unknown, productUrl: string | undefined, now: Date): VerifiedEssentialPrice | undefined {
  if (!isRecord(value) || value.currency !== 'INR' || typeof value.amount !== 'number'
    || !Number.isFinite(value.amount) || value.amount <= 0 || typeof value.verifiedAt !== 'string') return;
  const paise = Math.round(value.amount * 100);
  if (!Number.isSafeInteger(paise) || paise / 100 !== value.amount) return;
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/.test(value.verifiedAt)) return;
  const checked = new Date(value.verifiedAt);
  const checkedTime = checked.getTime();
  const nowTime = now.getTime();
  if (!Number.isFinite(checkedTime) || !Number.isFinite(nowTime)
    || checked.toISOString().slice(0, 10) !== value.verifiedAt.slice(0, 10)
    || checkedTime > nowTime || nowTime - checkedTime > PRICE_MAX_AGE_MS) return;
  const sourceUrl = externalUrl(value.sourceUrl);
  if (!sourceUrl || !productUrl || sourceUrl !== productUrl) return;
  return { amount: value.amount, currency: 'INR', verifiedAt: value.verifiedAt, sourceUrl };
}

/**
 * Server-side, operator-reviewed configuration only. This does not establish affiliate approval.
 * Each row must explicitly assert approved:true after the operator verifies their program approval.
 * Unconfigured products remain clearly labelled Amazon India retailer searches, without tracking.
 */
export function resolveEssentialsCatalog(
  config: Record<string, string | undefined> = process.env,
  now: Date = new Date(),
): ResolvedEssential[] {
  let records: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(config.FLYORA_ESSENTIALS_LINKS_JSON || '{}');
    if (isRecord(parsed)) records = parsed;
  } catch { /* A malformed configuration must not break shopping or imply affiliate approval. */ }

  return essentialsProducts.map(product => {
    const fallback: ResolvedEssential = {
      ...product,
      href: `https://www.amazon.in/s?k=${encodeURIComponent(product.name)}`,
      affiliate: false,
      retailer: 'Amazon India',
    };
    const record = Object.hasOwn(records, product.id) ? records[product.id] : undefined;
    if (!isRecord(record) || record.approved !== true) return fallback;
    const href = externalUrl(record.url);
    const affiliateNetwork = network(record.network);
    const retailer = typeof record.retailer === 'string' ? record.retailer.trim() : '';
    if (!href || !affiliateNetwork || !retailer || retailer.length > 80 || /[\u0000-\u001f\u007f]/.test(retailer)) return fallback;
    const productUrl = externalUrl(record.productUrl);
    const offerTitle = typeof record.productTitle === 'string' ? record.productTitle.trim() : '';
    const hasItemIdentity = Boolean(productUrl && offerTitle && offerTitle.length <= 200
      && !/[\u0000-\u001f\u007f]/.test(offerTitle));
    const price = hasItemIdentity ? verifiedPrice(record.price, productUrl, now) : undefined;
    return {
      ...product, href, affiliate: true, retailer, network: affiliateNetwork,
      ...(hasItemIdentity ? { offerTitle } : {}),
      ...(price ? { verifiedPrice: price } : {}),
    };
  });
}
