import type { FlightConnection } from './types';

/** Public business details only. Provider credentials never belong in this object. */
export interface SiteConfig {
  siteUrl: string;
  publicOrigin: boolean;
  businessName?: string;
  contactEmail?: string;
  indexingRequested: boolean;
}

function publicHostname(value: string) {
  const labels = value.toLowerCase().split('.');
  return value.length <= 253 && labels.length >= 2 &&
    labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) &&
    /^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/.test(labels.at(-1)!);
}

export function publicSiteOrigin(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      url.pathname !== '/' || (url.port && url.port !== '443') ||
      !publicHostname(url.hostname) ||
      /(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/.test(url.hostname) ||
      /(?:^|\.)example\.(?:com|net|org)$/.test(url.hostname)) return undefined;
    return url.origin;
  } catch { return undefined; }
}

export function businessContactEmail(value: string | undefined): string | undefined {
  const email = value?.trim();
  if (!email || email.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(email)) return undefined;
  const [localPart, rawDomain] = email.split('@');
  const domain = rawDomain.toLowerCase();
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..') ||
    !publicHostname(domain) || /(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/.test(domain) ||
    /(?:^|\.)example\.(?:com|net|org)$/.test(domain)) return undefined;
  return email;
}

export function getSiteConfig(): SiteConfig {
  const origin = publicSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  const name = process.env.FLYORA_BUSINESS_NAME?.trim();
  return {
    siteUrl: origin ?? 'http://localhost:3000',
    publicOrigin: !!origin,
    businessName: name && name.length <= 160 && !/[\r\n]/.test(name) ? name : undefined,
    contactEmail: businessContactEmail(process.env.FLYORA_CONTACT_EMAIL),
    indexingRequested: process.env.FLYORA_ALLOW_INDEXING === 'true',
  };
}

/** Explicit opt-in after launch review; presence of credentials is not live verification. */
export function canIndexSite(connection: FlightConnection, site = getSiteConfig()) {
  return site.indexingRequested && site.publicOrigin && !!site.businessName && !!site.contactEmail &&
    connection.mode === 'live' && connection.status === 'configured' && connection.environment === 'production';
}
