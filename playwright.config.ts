import { defineConfig, devices } from '@playwright/test';
const partnerE2e = process.env.FLYORA_PARTNER_E2E === '1';
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: partnerE2e ? '**/travelpayouts-widget.spec.ts' : undefined,
  testIgnore: partnerE2e ? undefined : '**/travelpayouts-widget.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || (partnerE2e ? 'http://127.0.0.1:3001' : 'http://127.0.0.1:3000'),
    trace: 'retain-on-failure',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: partnerE2e ? undefined : {
    command: process.env.PLAYWRIGHT_WEB_SERVER_COMMAND || 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    env: { FLIGHT_DATA_MODE: 'demo', FLIGHT_SEARCH_INTEGRATION: 'api' },
  },
});
