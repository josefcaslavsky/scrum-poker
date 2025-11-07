import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run tests serially for Electron
  reporter: [['list'], ['html', { open: 'never' }]], // Don't auto-open HTML report
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
