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
    let watchedShadow: ShadowRoot | null = null;
    const shadowObserver = new MutationObserver(() => inspect());
    const inspect = () => {
      // The official module attaches an open shadow root to the search host.
      // Discover it without patching attachShadow or touching vendor-owned nodes.
      if (container.shadowRoot && container.shadowRoot !== watchedShadow) {
        watchedShadow = container.shadowRoot;
        shadowObserver.disconnect();
        shadowObserver.observe(watchedShadow, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'] });
      }
      // An error/retry button alone is not evidence of a usable search interface.
      const selector = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, [role="combobox"], iframe';
      const roots: Array<Element | ShadowRoot> = watchedShadow ? [container, watchedShadow] : [container];
      const controls = roots.flatMap(root => [...root.querySelectorAll(selector)]);
      const rendered = !container.closest('[hidden], [aria-hidden="true"]') && controls.some(control => {
        const style = getComputedStyle(control);
        return !control.closest('[hidden], [aria-hidden="true"]') && style.display !== 'none' &&
          style.visibility !== 'hidden' && style.opacity !== '0' && control.getClientRects().length > 0;
      });
      if (rendered) { setPhase('rendered'); clearInterval(discovery); }
    };
    const observer = new MutationObserver(inspect);
    observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'] });
    const resize = new ResizeObserver(inspect);
    resize.observe(container);
    // Shadow-root attachment does not produce a light-DOM mutation. Continue
    // discovery through a slow load so the timeout can recover when UI appears.
    const discovery = setInterval(inspect, 250);
    const timeout = setTimeout(() => setPhase(current => current === 'rendered' || current === 'error' ? current : 'timeout'), 20_000);
    inspect();
    return () => { observer.disconnect(); shadowObserver.disconnect(); resize.disconnect(); clearInterval(discovery); clearTimeout(timeout); };
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
