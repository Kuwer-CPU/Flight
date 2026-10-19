import type { Metadata } from 'next';
import { TravelEssentialsCatalog } from '@/components/travel-essentials-catalog';
import { resolveEssentialsCatalog } from '@/lib/essentials-config';
import './essentials.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Travel essentials for Indian students',
  description: 'Explore packing, luggage, electronics and document accessories for international student journeys. Search Indian retailers or follow clearly disclosed affiliate links.',
  alternates: { canonical: '/travel-essentials' },
};
export default function Page() {
  return <div className="container essentials-page"><TravelEssentialsCatalog products={resolveEssentialsCatalog()} /></div>;
}
