import { NextResponse } from 'next/server';
import { dataMode } from '@/lib/amadeus';
export const dynamic = 'force-dynamic';
export function GET() { return NextResponse.json({ mode: dataMode() }, { headers: { 'Cache-Control': 'no-store' } }); }
