import type { MetadataRoute } from 'next';
import { canIndexSite, getSiteConfig } from '@/lib/site-config';
import { getFlightConfig } from '@/lib/flight-config';
export const dynamic = 'force-dynamic';
export default function robots(): MetadataRoute.Robots {
  if (!canIndexSite(getFlightConfig())) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/'] }, sitemap: getSiteConfig().siteUrl + '/sitemap.xml' };
}
