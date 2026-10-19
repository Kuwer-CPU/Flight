import type { Metadata, Viewport } from 'next';
import { Header, Footer, SavedFlights } from '@/components/shell';
import { SavedProvider } from '@/components/saved-provider';
import { FlightSearchSurface } from '@/components/flight-search-surface';
import { canIndexSite, getSiteConfig } from '@/lib/site-config';
import { getFlightConfig } from '@/lib/flight-config';
import { getFlightIntegration } from '@/lib/flight-integration';
import './globals.css';
import './student-comparison.css';
import './airport-search.css';
import './booking-offers.css';
import './flights/partner-search.css';
import './flyora-v2.css';

export function generateMetadata(): Metadata { return {
  metadataBase: new URL(getSiteConfig().siteUrl),
  title: { default: 'Flyora — Search flights. Compare student benefits. Travel smarter.', template: '%s | Flyora' },
  description: 'Search flights, discover official student programs, compare your entered travel costs, plan your journey and track your manually entered airline miles.',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  openGraph: { title: 'Flyora — Smarter flights for students worldwide.', description: 'Search flights. Compare student benefits. Travel smarter.', type: 'website', locale: 'en_GB', siteName: 'Flyora' },
  robots: { index: canIndexSite(getFlightConfig(), getSiteConfig(), getFlightIntegration()), follow: true },
  other: {
  'mitgo-verification': '08c88822-be96-4dbc-9919-58716884be28',
},
}; }
export const viewport: Viewport = { themeColor: '#f7f8f2', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const site = getSiteConfig();
  return <html lang="en" data-scroll-behavior="smooth"><body><SavedProvider><a className="skip-link" href="#main">Skip to content</a><Header /><main id="main"><FlightSearchSurface config={getFlightIntegration()}>{children}</FlightSearchSurface></main><Footer businessName={site.businessName} /><SavedFlights /></SavedProvider></body></html>;
}
