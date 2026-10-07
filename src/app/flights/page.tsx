import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Results } from '@/components/results';
export const metadata: Metadata = { title: 'Find your flight', robots: { index: false, follow: true } };
export default function Page() { return <Suspense fallback={<div className="container page-loading">Finding your next chapter…</div>}><Results /></Suspense>; }
