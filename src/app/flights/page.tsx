import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Results } from '@/components/results';
import { PartnerFlightSearch } from '@/components/partner-flight-search';
import { getFlightIntegration } from '@/lib/flight-integration';
import './partner-search.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Find your flight', robots: { index: false, follow: true } };
export default function Page() {
  const config = getFlightIntegration();
  // The root FlightSearchSurface owns persistent SDK containers in module mode.
  if (config.integration === 'travelpayouts' && config.status === 'configured' && config.transport === 'script') return null;
  return <Suspense fallback={<div className="container page-loading">Preparing your flight search…</div>}>
    {config.integration === 'api' ? <Results /> : <PartnerFlightSearch config={config} />}
  </Suspense>;
}
