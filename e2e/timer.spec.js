import { test, expect } from '@playwright/test';
import {
  launchElectronApp,
  closeElectronApp,
  clickCard,
  getTimerValue
} from './helpers.js';

test.describe('Timer E2E', () => {
  let electronApp, window;

  test.beforeEach(async () => {
    const app = await launchElectronApp();
    electronApp = app.electronApp;
    window = app.window;
  });

  test.afterEach(async () => {
    await closeElectronApp(electronApp);
  });

  test('voting status updates correctly', async () => {
    // Start voting
    await window.click('text=Start Voting Round');
    await window.waitForSelector('.voting-status');

    // Initial status should be 0/5
    let status = await window.locator('.voting-status').textContent();
    expect(status).toContain('0 / 5 voted');

    // User votes
    await clickCard(window, '3');
    await window.waitForTimeout(500);

    // Status should be 1/5
    status = await window.locator('.voting-status').textContent();
    expect(status).toContain('1 / 5 voted');

    // Voting status component should be visible and functional
    const statusElement = await window.locator('.voting-status');
    expect(await statusElement.isVisible()).toBe(true);

    // The format should be correct (X / 5 voted)
    expect(status).toMatch(/\d+ \/ 5 voted/);
  });
});
