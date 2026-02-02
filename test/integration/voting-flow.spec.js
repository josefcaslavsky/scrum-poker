import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

// Hoist mock variables
const mockSessionApi = vi.hoisted(() => ({
  create: vi.fn(),
  join: vi.fn(),
  get: vi.fn(),
  leave: vi.fn(),
  vote: vi.fn(),
  startVoting: vi.fn(),
  reveal: vi.fn(),
  newRound: vi.fn()
}));

// Mock external dependencies
vi.mock('../../src/services/broadcasting', () => ({
  subscribeToSession: vi.fn().mockReturnValue({ listen: vi.fn().mockReturnThis() }),
  unsubscribeFromSession: vi.fn(),
  isConnected: vi.fn().mockReturnValue(true),
  reconnect: vi.fn(),
  onConnectionStateChange: vi.fn()
}));

vi.mock('../../src/services/api', () => ({ sessionApi: mockSessionApi }));

vi.mock('../../src/services/auth', () => ({
  default: { setToken: vi.fn(), clearToken: vi.fn(), getToken: vi.fn() }
}));

vi.mock('../../src/composables/useLocalStorage', () => ({
  saveSessionInfo: vi.fn(),
  clearSessionInfo: vi.fn(),
  getSessionInfo: vi.fn(),
  getUserPreferences: vi.fn().mockReturnValue({ name: 'Test', emoji: '👤' })
}));

import { useSessionStore } from '../../src/stores/sessionStore';

// Helper: set up a store as facilitator with 5 participants
function setupSession(store) {
  store.sessionCode = 'ABCDEF';
  store.inSession = true;
  store.currentUser = { id: 1, name: 'Test', emoji: '👤', isFacilitator: true };
  store.participants = [
    { id: 1, name: 'Test', emoji: '👤', hasVoted: false, vote: null, isUser: true },
    { id: 2, name: 'Alice', emoji: '👩', hasVoted: false, vote: null, isUser: false },
    { id: 3, name: 'Bob', emoji: '👨', hasVoted: false, vote: null, isUser: false },
    { id: 4, name: 'Charlie', emoji: '🧑', hasVoted: false, vote: null, isUser: false },
    { id: 5, name: 'Diana', emoji: '💃', hasVoted: false, vote: null, isUser: false }
  ];
}

// Helper: simulate AI votes on non-user participants
function simulateAiVotes(store, votes = [3, 5, 8, 5]) {
  store.participants.filter(p => !p.isUser).forEach((p, i) => {
    p.hasVoted = true;
    p.vote = votes[i] ?? 3;
  });
}

describe('Voting Flow Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.clearAllMocks();

    mockSessionApi.startVoting.mockResolvedValue({ data: {} });
    mockSessionApi.reveal.mockResolvedValue({ data: {} });
    mockSessionApi.newRound.mockResolvedValue({ data: {} });
    mockSessionApi.vote.mockResolvedValue({ data: {} });
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
    simulateAiVotes(store);

    expect(store.votedCount).toBe(5);

    // Reveal cards
    await store.revealCards();

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

    // Let timer expire (15 seconds)
    vi.advanceTimersByTime(15000);
    // revealCards is async, flush microtasks
    await vi.advanceTimersByTimeAsync(0);

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

    // Advance only 5 seconds
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
    simulateAiVotes(store);
    await store.revealCards();

    expect(store.isRevealed).toBe(true);

    // Round 2
    await store.startNewRound();

    expect(store.currentRound).toBe(2);
    expect(store.isVoting).toBe(true);
    expect(store.isRevealed).toBe(false);
    expect(store.userCard).toBeNull();
    expect(store.votedCount).toBe(0);

    await store.selectCard(8);
    simulateAiVotes(store);
    await store.revealCards();

    expect(store.isRevealed).toBe(true);
  });

  it('resets participant votes between rounds', async () => {
    const store = useSessionStore();
    setupSession(store);

    // Round 1
    await store.startVoting();
    await store.selectCard(3);
    simulateAiVotes(store);

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
    store.stopTimer();

    const currentSeconds = store.timerSeconds;

    // Advance time - timer should not change
    vi.advanceTimersByTime(5000);

    expect(store.timerSeconds).toBe(currentSeconds);
  });
});
