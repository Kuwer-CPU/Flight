'use client';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import type { TravelpayoutsIntegration } from '@/lib/flight-integration';

type Phase = 'loading' | 'script-loaded' | 'rendered' | 'error' | 'timeout';

/** The SDK owns only the contents of these persistent containers. No vendor data is read. */
export function TravelpayoutsWidget({ config, active = true }: { config: TravelpayoutsIntegration; active?: boolean }) {
  const search = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  useEffect(() => {
    if (!active) return;
    const container = search.current;
    if (!container) return;
    const inspect = () => {
      const controls = container.querySelectorAll('input:not([type="hidden"]), select, button, [role="combobox"], iframe');
      const rendered = [...controls].some(control => {
        const style = getComputedStyle(control);
        return !control.closest('[hidden], [aria-hidden="true"]') && style.display !== 'none' &&
          style.visibility !== 'hidden' && style.opacity !== '0' && control.getClientRects().length > 0;
      });
      if (rendered) setPhase('rendered');
    };
    const observer = new MutationObserver(inspect);
    observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'] });
    const resize = new ResizeObserver(inspect);
    resize.observe(container);
    const timeout = setTimeout(() => setPhase(current => current === 'rendered' || current === 'error' ? current : 'timeout'), 20_000);
    inspect();
    return () => { observer.disconnect(); resize.disconnect(); clearTimeout(timeout); };
  }, [active, config.scriptUrl]);

  const failed = phase === 'error' || phase === 'timeout';
  return <div className="travelpayouts-widget" data-widget-phase={phase}>
    {phase !== 'rendered' && <div className={'travelpayouts-bootstrap' + (failed ? ' travelpayouts-bootstrap-error' : '')} role={failed ? 'alert' : 'status'}>
      <strong>{failed ? 'Flight search could not load.' : 'Preparing partner flight search…'}</strong>
      <p>{failed ? 'Reload this page to try again. No flight prices have been confirmed here.' : 'Waiting for the partner search interface. Prices and availability must be checked in its results.'}</p>
      {failed && <button type="button" className="button" onClick={() => window.location.reload()}>Reload flight search</button>}
    </div>}
    <div id="tpwl-search" ref={search} className="travelpayouts-search-container" />
    <div id="tpwl-tickets" className="travelpayouts-tickets-container" />
    <Script id="flyora-travelpayouts-white-label" src={config.scriptUrl} type="module" strategy="afterInteractive" crossOrigin="anonymous" referrerPolicy="no-referrer"
      onLoad={() => setPhase(current => current === 'loading' ? 'script-loaded' : current)}
      onError={() => setPhase('error')} />
  </div>;
}
