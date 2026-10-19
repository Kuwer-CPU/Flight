import { Home } from '@/components/home';
import { defaults } from '@/lib/search';
import { getFlightIntegration } from '@/lib/flight-integration';
import './luggage-calculator/luggage.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { alternates: { canonical: '/' } };
export default function Page() { return <Home initialQuery={defaults()} integration={getFlightIntegration()} />; }
import type { Metadata } from 'next';
