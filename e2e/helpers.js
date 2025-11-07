import { _electron as electron } from 'playwright';
import { join } from 'path';

/**
 * Launch the Electron app for testing
 */
export async function launchElectronApp() {
  const electronApp = await electron.launch({
    args: [join(process.cwd(), 'out/main/index.js')],
    env: {
      ...process.env,
      NODE_ENV: 'test'
    }
  });

  // Wait a bit for windows to be created
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Get all windows and find the main app window
  const windows = electronApp.windows();
  let window = null;

  for (const win of windows) {
    try {
      const title = await win.title();
      if (title === 'Scrum Poker') {
        window = win;
        break;
      }
    } catch (e) {
      // Ignore errors from closed windows
    }
  }

  // If not found yet, wait for the window event
  if (!window) {
    window = await electronApp.waitForEvent('window', async (page) => {
      const title = await page.title();
      return title === 'Scrum Poker';
    });
  }

  // Wait for app to be ready
  await window.waitForLoadState('domcontentloaded');

  return { electronApp, window };
}

/**
 * Close the Electron app
 */
export async function closeElectronApp(electronApp) {
  await electronApp.close();
}

/**
 * Helper to wait for an element
 */
export async function waitForElement(window, selector, timeout = 5000) {
  return await window.waitForSelector(selector, { timeout });
}

/**
 * Helper to click a card by its label
 */
export async function clickCard(window, cardLabel) {
  const cards = await window.locator('.poker-card');
  const count = await cards.count();

  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const text = await card.locator('.card-value').textContent();
    if (text === cardLabel) {
      await card.click();
      return;
    }
  }

  throw new Error(`Card with label "${cardLabel}" not found`);
}

/**
 * Get voting status text
 */
export async function getVotingStatus(window) {
  const statusElement = await window.locator('.voting-status');
  return await statusElement.textContent();
}

/**
 * Get timer value
 */
export async function getTimerValue(window) {
  const timerElement = await window.locator('.timer-value');
  const text = await timerElement.textContent();
  return parseInt(text.replace('s', ''));
}

/**
 * Get participant count with voted status
 */
export async function getParticipantStats(window) {
  const participants = await window.locator('.participant').all();
  let voted = 0;
  let total = participants.length;

  for (const participant of participants) {
    const hasVotedClass = await participant.evaluate(el =>
      el.classList.contains('voted')
    );
    if (hasVotedClass) {
      voted++;
    }
  }

  return { voted, total };
}
