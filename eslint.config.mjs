import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  // Local SVG illustrations do not benefit from the Next.js image optimizer.
  { rules: { '@next/next/no-img-element': 'off' } },
  globalIgnores(['.next/**', 'node_modules/**', 'next-env.d.ts', 'playwright-report/**', 'test-results/**', 'coverage/**']),
]);
