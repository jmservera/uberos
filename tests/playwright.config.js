// Playwright configuration for the UberOS WP-15 acceptance suite.
// The stack must already be running (`docker compose up -d`) before these tests
// execute. Tests target the single proxy ingress at UBEROS_PORT (default 8080).
import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.UBEROS_PORT || '8080';
const BASE_URL = process.env.UBEROS_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './acceptance',
  // S4 waits up to 30s for a rendered VNC frame; give each test headroom.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
