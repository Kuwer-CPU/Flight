import type { Metadata } from 'next';
import { ToolPage } from '@/components/tool-page';
import { TravelChecklist } from '@/components/travel-checklist';
import './checklist.css';

export const metadata: Metadata = {
  title: 'Student travel checklist',
  description: 'Build and edit a student travel checklist for documents, baggage, university enrolment and arrival. Save your progress in this browser.',
  alternates: { canonical: '/travel-checklist' },
};
export default function Page() {
  return <ToolPage eyebrow="A LITTLE PREPARATION. MORE PEACE OF MIND." title="Your journey, checked." description="Build a practical checklist, make it your own and keep track of the little things before you fly."><TravelChecklist /></ToolPage>;
}
