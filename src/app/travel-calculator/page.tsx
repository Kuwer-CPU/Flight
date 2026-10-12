import type { Metadata } from 'next';
import { ToolPage } from '@/components/tool-page';
import { TravelCalculator } from '@/components/travel-calculator';
import './calculator.css';

export const metadata: Metadata = {
  title: 'Travel cost calculator',
  description: 'Compare ticket, quoted extra baggage, transfers and other costs from your own travel quotes in one currency.',
  alternates: { canonical: '/travel-calculator' },
};

export default function Page() {
  return <ToolPage eyebrow="Every cost, in one place" title="The fare is only the start." description="Compare your own travel quotes, including luggage and the journey beyond the airport. See which complete option costs less.">
    <TravelCalculator />
  </ToolPage>;
}
