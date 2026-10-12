import type { NextConfig } from 'next';

const config: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    const development = process.env.NODE_ENV === 'development';
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'" + (development ? " 'unsafe-eval'" : ''),
      "style-src 'self' 'unsafe-inline'", "img-src 'self' data:", "font-src 'self'",
      "connect-src 'self'" + (development ? ' ws: wss:' : ''),
      "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
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
