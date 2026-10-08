import type { Metadata, Viewport } from 'next';
import { Header, Footer, SavedFlights } from '@/components/shell';
import { SavedProvider } from '@/components/saved-provider';
import './globals.css';
import './student-comparison.css';
import './airport-search.css';
import './booking-offers.css';

const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: 'Flyora — Compare your student flight advantage.', template: '%s | Flyora' },
  description: 'Search flights worldwide and compare your student advantage: standard baggage, student extras, eligible totals and the cost with your bags. Compare returned airline and travel-agency prices, then book with your chosen seller.',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  openGraph: { title: 'Flyora — Compare your student flight advantage.', description: 'Student journeys, worldwide. Compare fares and student baggage side by side.', type: 'website', locale: 'en_GB', siteName: 'Flyora' },
};
export const viewport: Viewport = { themeColor: '#f7f8f2', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" data-scroll-behavior="smooth"><body><SavedProvider><a className="skip-link" href="#main">Skip to content</a><Header /><main id="main">{children}</main><Footer /><SavedFlights /></SavedProvider></body></html>;
}
