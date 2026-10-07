import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap { const site = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''); return ['/', '/student-perks', '/privacy', '/terms'].map(path => ({ url: site + path, changeFrequency: 'monthly' as const, priority: path === '/' ? 1 : 0.5 })); }
