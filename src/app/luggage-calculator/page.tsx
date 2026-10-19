import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { StudentBaggageCalculator } from '@/components/student-baggage-calculator';
import { travelEssentials } from '@/lib/travel-essentials';
import './luggage.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Student luggage calculator',
  description: 'Compare individual bag weights against your ticket allowances, with India-first routes and separately checked student airline benefits.',
  alternates: { canonical: '/luggage-calculator' },
};
export default function Page() {
  return <div className="container luggage-page">
    <header className="luggage-header"><span className="eyebrow">Your ticket. Your bags. A clearer comparison.</span><h1>Your student baggage<br /><em>advantage.</em></h1><p>Start with your journey from India or anywhere in the world. Compare each airline’s quoted allowance before counting on a student extra.</p><Link className="text-link" href="/student-benefits">Compare airline benefits →</Link></header>
    <div className="luggage-assurance"><ShieldCheck size={22} aria-hidden="true" /><p><strong>Ticket-specific allowances. Clear student conditions.</strong><span>Standard baggage comes from your actual quote, not an airline-wide assumption. Current student policies are unverified; check the official source before relying on an offer.</span></p></div>
    <StudentBaggageCalculator essentials={travelEssentials()} today={new Date().toISOString().slice(0, 10)} />
  </div>;
}
