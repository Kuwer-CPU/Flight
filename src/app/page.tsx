import { Home } from '@/components/home';
import { defaults } from '@/lib/search';
import { getFlightConfig } from '@/lib/flight-config';
export const dynamic = 'force-dynamic';
export default function Page() { return <Home initialQuery={defaults()} connection={getFlightConfig()} />; }
