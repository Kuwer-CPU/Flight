import { NextResponse } from 'next/server';
import { getFlightConfig } from '@/lib/flight-config';
export const dynamic = 'force-dynamic';
export function GET() { return NextResponse.json(getFlightConfig(), { headers: { 'Cache-Control': 'no-store' } }); }
