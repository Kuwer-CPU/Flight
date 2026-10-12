import type { MetadataRoute } from 'next';
import { canIndexSite, getSiteConfig } from '@/lib/site-config';
import { getFlightConfig } from '@/lib/flight-config';
import { getFlightIntegration } from '@/lib/flight-integration';
export const dynamic = 'force-dynamic';
export default function robots(): MetadataRoute.Robots {
  if (!canIndexSite(getFlightConfig(), getSiteConfig(), getFlightIntegration())) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/'] }, sitemap: getSiteConfig().siteUrl + '/sitemap.xml' };
}
