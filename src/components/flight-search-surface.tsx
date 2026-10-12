'use client';
import { Suspense, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type { FlightIntegration, TravelpayoutsIntegration } from '@/lib/flight-integration';
import { PartnerFlightSearch } from './partner-flight-search';

/** One root-layout instance preserves the SDK's containers across App Router navigation. */
export function FlightSearchSurface({ config, children }: { config: FlightIntegration; children: ReactNode }) {
  const pathname = usePathname();
  const flights = pathname === '/flights' || pathname === '/flights/';
  const enabled = config.integration === 'travelpayouts' && config.transport === 'script' && config.status === 'configured';
  const current = enabled && config.integration === 'travelpayouts' ? config : undefined;
  const [retained, setRetained] = useState<TravelpayoutsIntegration | undefined>(flights ? current : undefined);
  // Guarded state adjustment commits the first flight surface once, without a
  // mount/unmount effect cycle that could discard the SDK's initialized DOM.
  if (flights && current && !retained) setRetained(current);
  const mounted = retained ?? (flights ? current : undefined);
  const showPartner = flights && enabled;
  return <>
    <div hidden={showPartner} data-flight-page-children>{children}</div>
    {mounted && <div hidden={!showPartner} data-persistent-flight-search>
      <Suspense fallback={<div className="container page-loading">Preparing partner flight search…</div>}>
        <PartnerFlightSearch config={mounted} active={showPartner} />
      </Suspense>
    </div>}
  </>;
}
