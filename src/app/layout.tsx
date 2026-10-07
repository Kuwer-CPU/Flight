import type { Metadata, Viewport } from 'next';
import { Header, Footer, SavedFlights } from '@/components/shell';
import { SavedProvider } from '@/components/saved-provider';
import './globals.css';
import './student-comparison.css';

const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: 'Flyora — Compare your student flight advantage.', template: '%s | Flyora' },
  description: 'Compare flights with your student advantage in view: standard baggage, student extras, eligible totals and the cost with your bags. Book directly with the airline.',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  openGraph: { title: 'Flyora — Compare your student flight advantage.', description: 'Same flight. Student perks. Better deal. Compare fares and baggage side by side.', type: 'website', locale: 'en_GB', siteName: 'Flyora' },
};
export const viewport: Viewport = { themeColor: '#f7f8f2', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" data-scroll-behavior="smooth"><body><SavedProvider><a className="skip-link" href="#main">Skip to content</a><Header /><main id="main">{children}</main><Footer /><SavedFlights /></SavedProvider></body></html>;
}
