import { test, expect } from '@playwright/test';
import {
  launchElectronApp,
  closeElectronApp,
  clickCard,
  getVotingStatus,
  getParticipantStats
} from './helpers.js';

test.describe('Voting Flow E2E', () => {
  let electronApp, window;

  test.beforeEach(async () => {
    const app = await launchElectronApp();
    electronApp = app.electronApp;
    window = app.window;
  });

  test.afterEach(async () => {
    await closeElectronApp(electronApp);
  });

  test('app launches and shows initial state', async () => {
    // Check title
    const title = await window.title();
    expect(title).toBe('Scrum Poker');

    // Check header is visible
    const header = await window.locator('.title').textContent();
    expect(header).toContain('Scrum Poker');

    // Check session info
    const sessionCode = await window.locator('.session-code').textContent();
    expect(sessionCode).toContain('ABC123');

    // Check round info
    const roundInfo = await window.locator('.round-info').textContent();
    expect(roundInfo).toContain('Round 1');

    // Check Start button is visible
    const startButton = await window.locator('text=Start Voting Round');
    expect(await startButton.isVisible()).toBe(true);

    // Check participants are shown
    const participants = await window.locator('.participant').count();
    expect(participants).toBe(5);
  });

  test('complete voting round with user selection', async () => {
    // Start voting
    await window.click('text=Start Voting Round');

    // Wait for timer to appear
    await window.waitForSelector('.timer-section');

    // Check timer is running
    const timerVisible = await window.locator('.timer-value').isVisible();
    expect(timerVisible).toBe(true);

    // Check voting status
    let status = await getVotingStatus(window);
    expect(status).toContain('0 / 5 voted');

    // Click a card (select "5")
    await clickCard(window, '5');

    // Wait a bit for UI to update
    await window.waitForTimeout(500);

    // Check user voted
    status = await getVotingStatus(window);
    expect(status).toContain('1 / 5 voted');

    // Wait for AI participants to vote (test mode: 2-3s each, parallel)
    // Should complete in ~3 seconds max
    await window.waitForSelector('.results-title', { timeout: 5000 });

    // Check results are shown
    const resultsTitle = await window.locator('.results-title').textContent();
    expect(resultsTitle).toContain('Results');

    // Check statistics are displayed
    const avgLabel = await window.locator('.stat-label:has-text("Average")').isVisible();
    expect(avgLabel).toBe(true);

    const consensusLabel = await window.locator('.stat-label:has-text("Consensus")').isVisible();
    expect(consensusLabel).toBe(true);

    // Check New Round button is visible
    const newRoundButton = await window.locator('text=Start New Round');
    expect(await newRoundButton.isVisible()).toBe(true);
  });

  test('force reveal before all participants vote', async () => {
    // Start voting
    await window.click('text=Start Voting Round');

    // Wait for timer
    await window.waitForSelector('.timer-section');

    // Select a card
    await clickCard(window, '3');

    // Force reveal immediately (don't wait for AI)
    await window.click('text=Force Reveal');

    // Wait for results
    await window.waitForSelector('.results-title', { timeout: 5000 });

    // Check results are shown
    const resultsVisible = await window.locator('.results-section').isVisible();
    expect(resultsVisible).toBe(true);
  });

  test('can play multiple rounds', async () => {
    // Round 1
    await window.click('text=Start Voting Round');
    await window.waitForSelector('.timer-section');
    await clickCard(window, '5');
    await window.waitForSelector('.results-title', { timeout: 5000 });

    // Check round 1
    let roundInfo = await window.locator('.round-info').textContent();
    expect(roundInfo).toContain('Round 1');

    // Start Round 2
    await window.click('text=Start New Round');
    await window.waitForSelector('.timer-section');

    // Check round 2
    roundInfo = await window.locator('.round-info').textContent();
    expect(roundInfo).toContain('Round 2');

    // Check timer restarted
    const timerVisible = await window.locator('.timer-value').isVisible();
    expect(timerVisible).toBe(true);

    // Select a card
    await clickCard(window, '8');

    // Wait for results
    await window.waitForSelector('.results-title', { timeout: 5000 });

    // Verify we're still on round 2
    roundInfo = await window.locator('.round-info').textContent();
    expect(roundInfo).toContain('Round 2');
  });

  test('all cards are clickable during voting', async () => {
    // Start voting
    await window.click('text=Start Voting Round');
    await window.waitForSelector('.timer-section');

    // Try clicking different cards
    const cardLabels = ['0', '1', '2', '3', '5', '8', '13', '?', '☕'];

    for (const label of cardLabels) {
      await clickCard(window, label);
      await window.waitForTimeout(50);

      // Verify card is selected (has 'selected' class)
      const cards = await window.locator('.poker-card');
      const count = await cards.count();

      let foundSelected = false;
      for (let i = 0; i < count; i++) {
        const card = cards.nth(i);
        const hasSelected = await card.evaluate(el =>
          el.classList.contains('selected')
        );
        if (hasSelected) {
          const text = await card.locator('.card-value').textContent();
          expect(text).toBe(label);
          foundSelected = true;
          break;
        }
      }

      expect(foundSelected).toBe(true);
    }
  });
});
