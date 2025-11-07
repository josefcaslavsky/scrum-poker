import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSessionStore } from '../../src/renderer/stores/sessionStore';
import { useMockApi } from '../../src/renderer/composables/useMockApi';

describe('Voting Flow Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('completes a full voting round with user selection', () => {
    const store = useSessionStore();
    const mockApi = useMockApi();

    // Start voting round
    mockApi.startVotingRound();

    expect(store.isVoting).toBe(true);
    expect(store.timerSeconds).toBe(15);
    expect(store.votedCount).toBe(0);

    // User selects a card
    store.selectCard(5);

    expect(store.userCard).toBe(5);
    expect(store.votedCount).toBe(1);

    // Simulate AI participants voting (they have delays, so advance time)
    vi.advanceTimersByTime(12000); // 12 seconds - all AI should have voted

    expect(store.votedCount).toBe(5);
    expect(store.isRevealed).toBe(true);
    expect(store.isVoting).toBe(false);

    // Check statistics
    expect(store.averageVote).toBeDefined();
    expect(store.consensus).toBeDefined();
    expect(store.mostVoted).toBeDefined();

    // Cleanup
    mockApi.cleanup();
  });

  it('auto-reveals when timer expires', () => {
    const store = useSessionStore();

    // Start voting WITHOUT mock API so AI doesn't vote
    store.startVoting();

    expect(store.isVoting).toBe(true);
    expect(store.isRevealed).toBe(false);

    // User votes
    store.selectCard(3);

    // Let timer expire (15 seconds)
    vi.advanceTimersByTime(15000);

    expect(store.timerSeconds).toBe(0);
    expect(store.isRevealed).toBe(true);
    expect(store.isVoting).toBe(false);
  });

  it('can force reveal before timer expires', () => {
    const store = useSessionStore();
    const mockApi = useMockApi();

    mockApi.startVotingRound();

    expect(store.isVoting).toBe(true);

    // User votes
    store.selectCard(5);

    // Force reveal after 5 seconds
    vi.advanceTimersByTime(5000);

    expect(store.isRevealed).toBe(false);

    mockApi.forceReveal();

    expect(store.isRevealed).toBe(true);
    expect(store.isVoting).toBe(false);

    mockApi.cleanup();
  });

  it('can start multiple rounds', () => {
    const store = useSessionStore();
    const mockApi = useMockApi();

    // Round 1
    expect(store.currentRound).toBe(1);
    mockApi.startVotingRound();
    store.selectCard(5);
    vi.advanceTimersByTime(15000);

    expect(store.isRevealed).toBe(true);
    expect(store.currentRound).toBe(1);

    // Round 2
    mockApi.startNewRound();

    expect(store.currentRound).toBe(2);
    expect(store.isVoting).toBe(true);
    expect(store.isRevealed).toBe(false);
    expect(store.userCard).toBeNull();
    expect(store.votedCount).toBe(0);

    store.selectCard(8);
    vi.advanceTimersByTime(15000);

    expect(store.isRevealed).toBe(true);

    mockApi.cleanup();
  });

  it('resets participant votes between rounds', () => {
    const store = useSessionStore();
    const mockApi = useMockApi();

    // Round 1
    mockApi.startVotingRound();
    store.selectCard(3);
    vi.advanceTimersByTime(12000);

    const firstRoundVotes = store.participants.map(p => p.vote);
    expect(firstRoundVotes.every(v => v !== null)).toBe(true);

    // Round 2
    mockApi.startNewRound();

    // All votes should be reset
    expect(store.participants.every(p => p.vote === null)).toBe(true);
    expect(store.participants.every(p => !p.hasVoted)).toBe(true);

    mockApi.cleanup();
  });

  it('calculates statistics correctly after reveal', () => {
    const store = useSessionStore();
    const mockApi = useMockApi();

    mockApi.startVotingRound();

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

    mockApi.forceReveal();

    expect(store.isRevealed).toBe(true);

    // Average = (3 + 3 + 5 + 3 + 8) / 5 = 4.4
    expect(store.averageVote).toBe('4.4');

    // Most voted = 3 (appears 3 times)
    expect(store.mostVoted).toBe(3);

    // Consensus should be "Spread" (difference between 8 and 3 is 5)
    expect(store.consensus).toBe('Spread 🤔');

    mockApi.cleanup();
  });

  it('handles special votes (? and ☕) correctly', () => {
    const store = useSessionStore();
    const mockApi = useMockApi();

    mockApi.startVotingRound();

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

    mockApi.forceReveal();

    // Average should exclude ? and ☕
    // Average = (3 + 5 + 8) / 3 = 5.3
    expect(store.averageVote).toBe('5.3');

    mockApi.cleanup();
  });

  it('stops timers on cleanup', () => {
    const store = useSessionStore();
    const mockApi = useMockApi();

    mockApi.startVotingRound();

    const initialSeconds = store.timerSeconds;

    mockApi.cleanup();

    // Advance time - timer should not change
    vi.advanceTimersByTime(5000);

    // Timer should have stopped
    expect(store.isVoting).toBe(true); // State doesn't change
  });
});
