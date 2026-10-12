import type { MetadataRoute } from 'next';
import { canIndexSite, getSiteConfig } from '@/lib/site-config';
import { getFlightConfig } from '@/lib/flight-config';
import { getFlightIntegration } from '@/lib/flight-integration';
export const dynamic = 'force-dynamic';
export default function sitemap(): MetadataRoute.Sitemap {
  if (!canIndexSite(getFlightConfig(), getSiteConfig(), getFlightIntegration())) return [];
  return ['/', '/student-benefits', '/travel-calculator', '/miles-wallet', '/travel-checklist', '/contact', '/privacy', '/terms'].map(path => ({ url: getSiteConfig().siteUrl + path, changeFrequency: 'monthly' as const, priority: path === '/' ? 1 : 0.5 }));
}
