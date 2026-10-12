import type { Metadata } from 'next';
import { StudentBenefits } from '@/components/student-benefits';
import '../student-benefits/benefits.css';
export const metadata: Metadata = { title: 'Student airline benefits', description: 'Explore airline student programs and check current fare, baggage and eligibility rules directly with each airline.', alternates: { canonical: '/student-benefits' } };
export default function Page() { return <StudentBenefits today={new Date().toISOString().slice(0, 10)} />; }
