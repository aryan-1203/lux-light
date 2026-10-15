import { defineConfig, devices } from '@playwright/test';

/**
 * E2E runtime (PLAN §5): backend on :8000 started by QA with
 * `ENV=test OTP_DEV_ECHO=true PAYMENT_PROVIDER=mock uvicorn app.main:app --port 8000`
 * on a freshly reset + seeded DB; the frontend is built and served by `vite preview` (:4173)
 * which proxies /api, /media, /sitemap.xml and /robots.txt to the backend.
 * Set E2E_START_BACKEND=1 to let Playwright start uvicorn too.
 */
const PORT = 4173;
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

const webServer: NonNullable<Parameters<typeof defineConfig>[0]['webServer']> = [
  {
    command: 'npm run build && npm run preview',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { VITE_API_MOCK: 'false' },
  },
];

if (process.env.E2E_START_BACKEND === '1') {
  webServer.unshift({
    command: '.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000',
    cwd: '../backend',
    url: 'http://127.0.0.1:8000/api/v1/health',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { ENV: 'test', OTP_DEV_ECHO: 'true', PAYMENT_PROVIDER: 'mock' },
  });
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer,
});
