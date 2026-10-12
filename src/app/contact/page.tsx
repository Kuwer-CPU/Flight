import type { Metadata } from 'next';
import { getSiteConfig } from '@/lib/site-config';

export const metadata: Metadata = { title: 'Contact Flyora' };
export default function Page() {
  const site = getSiteConfig();
  return <article className="container legal-page">
    <div className="eyebrow">HERE TO HELP</div><h1>Contact Flyora.<br />Before you fly.</h1>
    <p className="legal-intro">Flyora helps you compare flights and find the right booking site.</p>
    <h2>Questions about Flyora</h2>
    {site.businessName && <p>Flyora is operated by {site.businessName}.</p>}
    {site.contactEmail ? <p>For website issues, privacy questions or a student-program correction, email <a className="text-link" href={'mailto:' + encodeURIComponent(site.contactEmail)}>{site.contactEmail}</a>. Include the page or airline involved; please leave out passport details, payment information and student documents.</p> : <p>Flyora is being prepared for launch. A support address will be published here before the public launch.</p>}
    <h2>Bookings, changes and refunds</h2><p>Contact the airline or travel agency named on your booking confirmation. That seller handles payment, tickets, changes, cancellations and refunds. Flyora cannot access or change your booking.</p>
    <h2>Saved flights</h2><p>Your shortlist stays in your browser. Open Saved and choose “Clear all saved flights” to remove it, or clear this website’s browser data.</p>
    <a className="text-link" href="/">Back to Flyora →</a>
  </article>;
}
