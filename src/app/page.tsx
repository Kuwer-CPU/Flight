import { Home } from '@/components/home';
import { defaults } from '@/lib/search';
import { getFlightConfig } from '@/lib/flight-config';
import { getFlightIntegration } from '@/lib/flight-integration';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { alternates: { canonical: '/' } };
export default function Page() { return <Home initialQuery={defaults()} connection={getFlightConfig()} integration={getFlightIntegration()} />; }
import type { Metadata } from 'next';
