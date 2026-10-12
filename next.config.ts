import type { NextConfig } from 'next';
import { getFlightIntegration } from './src/lib/flight-integration';
import { partnerResourceOrigins, TRAVELPAYOUTS_RESOURCES } from './src/lib/partner-resource-origins';

const config: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    const development = process.env.NODE_ENV === 'development';
    const integration = getFlightIntegration();
    const frameOrigin = integration.integration === 'travelpayouts' && integration.status === 'configured' ? integration.frameOrigin : undefined;
    const widgetOrigins = integration.integration === 'travelpayouts' && integration.status === 'configured' && integration.transport === 'script'
      ? [integration.scriptOrigin!, ...partnerResourceOrigins(process.env.TRAVELPAYOUTS_RESOURCE_ORIGINS)] : [];
    const widgetSources = widgetOrigins.length ? ' ' + [...new Set(widgetOrigins)].join(' ') : '';
    const sdk = widgetOrigins.length > 0;
    const connectSources = widgetSources + (sdk ? ' ' + TRAVELPAYOUTS_RESOURCES.connect.join(' ') : '');
    const styleSources = widgetSources + (sdk ? ' ' + TRAVELPAYOUTS_RESOURCES.style.join(' ') : '');
    const fontSources = widgetSources + (sdk ? ' ' + TRAVELPAYOUTS_RESOURCES.font.join(' ') : '');
    const imageSources = widgetSources + (sdk ? ' ' + TRAVELPAYOUTS_RESOURCES.image.join(' ') : '');
    const frames = [...new Set([...widgetOrigins, ...(frameOrigin ? [frameOrigin] : [])])];
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'" + (development ? " 'unsafe-eval'" : '') + widgetSources,
      "style-src 'self' 'unsafe-inline'" + styleSources, "img-src 'self' data:" + imageSources, "font-src 'self'" + fontSources,
      "connect-src 'self'" + (development ? ' ws: wss:' : '') + connectSources,
      "object-src 'none'", "base-uri 'self'", "form-action 'self'" + widgetSources, "frame-ancestors 'none'",
      'frame-src ' + (frames.length ? frames.join(' ') : "'none'"),
    ].join('; ');
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Content-Security-Policy', value: csp },
        ...(!development ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }] : []),
      ],
    }, { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, nosnippet' }] },
    { source: '/flights', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, nosnippet' }] }];
  },
};
export default config;
