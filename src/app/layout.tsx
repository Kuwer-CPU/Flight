import type { Metadata, Viewport } from 'next';
import { Header, Footer, SavedFlights } from '@/components/shell';
import { SavedProvider } from '@/components/saved-provider';
import { canIndexSite, getSiteConfig } from '@/lib/site-config';
import { getFlightConfig } from '@/lib/flight-config';
import './globals.css';
import './student-comparison.css';
import './airport-search.css';
import './booking-offers.css';

export function generateMetadata(): Metadata { return {
  metadataBase: new URL(getSiteConfig().siteUrl),
  title: { default: 'Flyora — Compare your student flight advantage.', template: '%s | Flyora' },
  description: 'Search flights worldwide, compare returned fares and baggage, and check airline student-program eligibility before booking with your chosen seller.',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  openGraph: { title: 'Flyora — Compare your student flight advantage.', description: 'Student journeys, worldwide. Compare fares and student baggage side by side.', type: 'website', locale: 'en_GB', siteName: 'Flyora' },
  robots: { index: canIndexSite(getFlightConfig()), follow: true },
}; }
export const viewport: Viewport = { themeColor: '#f7f8f2', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const site = getSiteConfig();
  return <html lang="en" data-scroll-behavior="smooth"><body><SavedProvider><a className="skip-link" href="#main">Skip to content</a><Header /><main id="main">{children}</main><Footer businessName={site.businessName} /><SavedFlights /></SavedProvider></body></html>;
}
