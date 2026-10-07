import { Home } from '@/components/home';
import { defaults } from '@/lib/search';
import { dataMode } from '@/lib/amadeus';
export const dynamic = 'force-dynamic';
export default function Page() { return <Home initialQuery={defaults()} mode={dataMode()} />; }
