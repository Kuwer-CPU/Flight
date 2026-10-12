import { NextResponse } from 'next/server';
import { getFlightIntegration } from '@/lib/flight-integration';
import { getFlightConfig } from '@/lib/flight-config';

export const dynamic = 'force-dynamic';

/** Configuration only: do not expose widget source, query strings or provider credentials. */
export function GET() {
  const integration = getFlightIntegration();
  if (integration.integration === 'api') return NextResponse.json({ integration: 'api', ...getFlightConfig() }, { headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json({
    integration: 'travelpayouts',
    status: integration.status,
    configured: integration.status === 'configured',
    transport: integration.transport,
    affiliateLinks: integration.affiliateLinks,
    message: integration.status === 'configured'
      ? 'Travelpayouts interface configuration is present. Rendering, live fares, availability and booking handoffs have not been verified by this endpoint.'
      : 'The Travelpayouts interface is disabled or has invalid configuration. This endpoint does not check live fares or partner availability.',
  }, { headers: { 'Cache-Control': 'no-store' } });
}
