import type { Metadata } from 'next';
import { StudentBenefits } from '@/components/student-benefits';
import './benefits.css';

export const metadata: Metadata = {
  title: 'Student airline benefits',
  description: 'Discover official airline student-program links and check baggage, discount, verification and booking-channel conditions before you book.',
  alternates: { canonical: '/student-benefits' },
};

export default function Page() {
  return <StudentBenefits today={new Date().toISOString().slice(0, 10)} />;
}
