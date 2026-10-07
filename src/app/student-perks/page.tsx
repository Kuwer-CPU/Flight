import type { Metadata } from 'next';
import { Perks } from '@/components/perks';
export const metadata: Metadata = { title: 'Airline student programs', description: 'Explore airline student programs and check current fare, baggage and eligibility rules directly with each airline.', alternates: { canonical: '/student-perks' } };
export default function Page() { return <Perks />; }
