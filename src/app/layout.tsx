import type { Metadata, Viewport } from 'next';
import { Header, Footer, SavedFlights } from '@/components/shell';
import { SavedProvider } from '@/components/saved-provider';
import './globals.css';

const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: 'Flyora — Big dreams. Better flights.', template: '%s | Flyora' },
  description: 'Find your next flight, compare baggage and schedules, and discover airline student programs. Compare on Flyora, book directly with the airline.',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  openGraph: { title: 'Flyora — Big dreams. Better flights.', description: 'Student journeys start with a better ticket. Search flights, compare baggage, and go further.', type: 'website', locale: 'en_GB', siteName: 'Flyora' },
};
export const viewport: Viewport = { themeColor: '#f7f8f2', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><SavedProvider><a className="skip-link" href="#main">Skip to content</a><Header /><main id="main">{children}</main><Footer /><SavedFlights /></SavedProvider></body></html>;
}
