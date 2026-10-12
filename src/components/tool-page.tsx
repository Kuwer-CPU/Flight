import Link from 'next/link';
import type { ReactNode } from 'react';

/** Shared page frame for the student travel tools; keeps flight search one click away. */
export function ToolPage({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return <div className="container tool-page">
    <header className="tool-header"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></header>
    {children}
    <div className="tool-return"><Link className="text-link" href="/#search">Back to flight search →</Link><span>Search flights. Compare student benefits. Travel smarter.</span></div>
  </div>;
}
