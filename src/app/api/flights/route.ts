import { NextRequest, NextResponse } from 'next/server';
import { parseSearch, SearchValidationError } from '@/lib/search';
import { searchFlights } from '@/lib/flight-search';
import { FlightProviderError } from '@/lib/amadeus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const requests = new Map<string, { count: number; reset: number }>();
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const now = Date.now();
  for (const [key, value] of requests) if (value.reset <= now) requests.delete(key);
  if (requests.size > 5000) requests.clear();
  const bucket = requests.get(ip) ?? { count: 0, reset: now + 60_000 };
  bucket.count++;
  requests.set(ip, bucket);
  if (bucket.count > 30) return NextResponse.json({ error: 'Too many searches. Please try again in a minute.' }, { status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } });
  try {
    const query = parseSearch(request.nextUrl.searchParams);
    return NextResponse.json(await searchFlights(query), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof SearchValidationError) return NextResponse.json({ error: error.message }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    if (error instanceof FlightProviderError) return NextResponse.json({ error: error.message }, { status: error.status, headers: { 'Cache-Control': 'no-store', ...(error.status === 429 ? { 'Retry-After': '60' } : {}) } });
    return NextResponse.json({ error: 'Flight search is unavailable. Please try again.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
