import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

// Mock all external dependencies
vi.mock('../../src/services/api', () => ({
  sessionApi: {
    create: vi.fn(),
    join: vi.fn(),
    leave: vi.fn(),
    get: vi.fn(),
    startVoting: vi.fn(),
    vote: vi.fn(),
    reveal: vi.fn(),
    newRound: vi.fn(),
    endSession: vi.fn(),
    removeParticipant: vi.fn(),
  }
}));

vi.mock('../../src/services/auth', () => ({
  default: {
    setToken: vi.fn(),
    getToken: vi.fn(),
    clearToken: vi.fn(),
  }
}));

vi.mock('../../src/services/broadcasting', () => ({
  subscribeToSession: vi.fn(() => ({})),
  unsubscribeFromSession: vi.fn(),
}));

vi.mock('../../src/composables/useLocalStorage', () => ({
  saveSessionInfo: vi.fn(),
  clearSessionInfo: vi.fn(),
  getUserPreferences: vi.fn(() => ({ name: 'Test', emoji: '👤' })),
  getSessionInfo: vi.fn(),
}));

import { useSessionStore } from '../../src/stores/sessionStore';
import { sessionApi } from '../../src/services/api';

/**
 * Helper: set up an active session with 5 participants.
 * The current user (id: 1) is facilitator.
 */
function setupSession(store) {
  store.sessionCode = 'TEST01';
  store.inSession = true;
  store.currentUser = { id: 1, name: 'Test', emoji: '👤', isFacilitator: true };
  store.participants = [
    { id: 1, name: 'Test', emoji: '👤', hasVoted: false, vote: null, isUser: true },
    { id: 2, name: 'Alice', emoji: '👩', hasVoted: false, vote: null, isUser: false },
    { id: 3, name: 'Bob', emoji: '👨', hasVoted: false, vote: null, isUser: false },
    { id: 4, name: 'Charlie', emoji: '🧑', hasVoted: false, vote: null, isUser: false },
    { id: 5, name: 'Diana', emoji: '👸', hasVoted: false, vote: null, isUser: false },
  ];
}

describe('Voting Flow Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();

    sessionApi.startVoting.mockResolvedValue({});
    sessionApi.vote.mockResolvedValue({});
    sessionApi.reveal.mockResolvedValue({});
    sessionApi.newRound.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('completes a full voting round with user selection', async () => {
    const store = useSessionStore();
    setupSession(store);

    // Start voting round
    await store.startVoting();

    expect(store.isVoting).toBe(true);
    expect(store.timerSeconds).toBe(15);
    expect(store.votedCount).toBe(0);

    // User selects a card
    await store.selectCard(5);

    expect(store.userCard).toBe(5);
    expect(store.votedCount).toBe(1);

    // Simulate AI participants voting
    store.simulateParticipantVote(2, 3);
    store.simulateParticipantVote(3, 5);
    store.simulateParticipantVote(4, 8);
    store.simulateParticipantVote(5, 5);

    expect(store.votedCount).toBe(5);

    // Timer expires and facilitator auto-reveals
    await vi.advanceTimersByTimeAsync(15000);

    expect(store.isRevealed).toBe(true);
    expect(store.isVoting).toBe(false);

    // Check statistics
    expect(store.averageVote).toBeDefined();
    expect(store.consensus).toBeDefined();
    expect(store.mostVoted).toBeDefined();
  });

  it('auto-reveals when timer expires', async () => {
    const store = useSessionStore();
    setupSession(store);

    await store.startVoting();

    expect(store.isVoting).toBe(true);
    expect(store.isRevealed).toBe(false);

    // User votes
    await store.selectCard(3);

    // Let timer expire (15 seconds) — facilitator auto-reveals
    await vi.advanceTimersByTimeAsync(15000);

    expect(store.timerSeconds).toBe(0);
    expect(store.isRevealed).toBe(true);
    expect(store.isVoting).toBe(false);
  });

  it('can force reveal before timer expires', async () => {
    const store = useSessionStore();
    setupSession(store);

    await store.startVoting();

    expect(store.isVoting).toBe(true);

    // User votes
    await store.selectCard(5);

    // Advance 5 seconds — not yet expired
    vi.advanceTimersByTime(5000);

    expect(store.isRevealed).toBe(false);

    // Force reveal
    await store.revealCards();

    expect(store.isRevealed).toBe(true);
    expect(store.isVoting).toBe(false);
  });

  it('can start multiple rounds', async () => {
    const store = useSessionStore();
    setupSession(store);

    // Round 1
    expect(store.currentRound).toBe(1);
    await store.startVoting();
    await store.selectCard(5);
    await vi.advanceTimersByTimeAsync(15000);

    expect(store.isRevealed).toBe(true);
    expect(store.currentRound).toBe(1);

    // Round 2
    await store.startNewRound();

    expect(store.currentRound).toBe(2);
    expect(store.isVoting).toBe(true);
    expect(store.isRevealed).toBe(false);
    expect(store.userCard).toBeNull();
    expect(store.votedCount).toBe(0);

    await store.selectCard(8);
    await vi.advanceTimersByTimeAsync(15000);

    expect(store.isRevealed).toBe(true);
  });

  it('resets participant votes between rounds', async () => {
    const store = useSessionStore();
    setupSession(store);

    // Round 1
    await store.startVoting();
    await store.selectCard(3);
    store.simulateParticipantVote(2, 5);
    store.simulateParticipantVote(3, 8);
    store.simulateParticipantVote(4, 3);
    store.simulateParticipantVote(5, 5);

    const firstRoundVotes = store.participants.map(p => p.vote);
    expect(firstRoundVotes.every(v => v !== null)).toBe(true);

    // Round 2
    await store.startNewRound();

    // All votes should be reset
    expect(store.participants.every(p => p.vote === null)).toBe(true);
    expect(store.participants.every(p => !p.hasVoted)).toBe(true);
  });

  it('calculates statistics correctly after reveal', async () => {
    const store = useSessionStore();
    setupSession(store);

    await store.startVoting();

    // Manually set votes for predictable test
    store.participants[0].hasVoted = true;
    store.participants[0].vote = 3;
    store.participants[1].hasVoted = true;
    store.participants[1].vote = 3;
    store.participants[2].hasVoted = true;
    store.participants[2].vote = 5;
    store.participants[3].hasVoted = true;
    store.participants[3].vote = 3;
    store.participants[4].hasVoted = true;
    store.participants[4].vote = 8;

    await store.revealCards();

    expect(store.isRevealed).toBe(true);

    // Average = (3 + 3 + 5 + 3 + 8) / 5 = 4.4
    expect(store.averageVote).toBe('4.4');

    // Most voted = 3 (appears 3 times)
    expect(store.mostVoted).toBe(3);

    // Consensus should be "Spread" (difference between 8 and 3 is 5)
    expect(store.consensus).toBe('Spread 🤔');
  });

  it('handles special votes (? and ☕) correctly', async () => {
    const store = useSessionStore();
    setupSession(store);

    await store.startVoting();

    // Set votes with special values
    store.participants[0].hasVoted = true;
    store.participants[0].vote = 3;
    store.participants[1].hasVoted = true;
    store.participants[1].vote = 5;
    store.participants[2].hasVoted = true;
    store.participants[2].vote = -1; // ?
    store.participants[3].hasVoted = true;
    store.participants[3].vote = 8;
    store.participants[4].hasVoted = true;
    store.participants[4].vote = -2; // ☕

    await store.revealCards();

    // Average should exclude ? and ☕
    // Average = (3 + 5 + 8) / 3 = 5.3
    expect(store.averageVote).toBe('5.3');
  });

  it('stops timers on cleanup', async () => {
    const store = useSessionStore();
    setupSession(store);

    await store.startVoting();

    expect(store.isVoting).toBe(true);

    store.stopTimer();

    const currentSeconds = store.timerSeconds;
    vi.advanceTimersByTime(5000);

    // Timer should not advance after stopTimer
    expect(store.timerSeconds).toBe(currentSeconds);
  });
});
