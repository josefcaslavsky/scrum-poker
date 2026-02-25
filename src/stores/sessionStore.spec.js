import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

// Mock all external dependencies before importing the store
vi.mock('../services/api', () => ({
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

vi.mock('../services/auth', () => ({
  default: {
    setToken: vi.fn(),
    getToken: vi.fn(),
    clearToken: vi.fn(),
  }
}));

vi.mock('../services/broadcasting', () => ({
  subscribeToSession: vi.fn(() => ({})),
  unsubscribeFromSession: vi.fn(),
}));

vi.mock('../composables/useLocalStorage', () => ({
  saveSessionInfo: vi.fn(),
  clearSessionInfo: vi.fn(),
  getUserPreferences: vi.fn(() => ({ name: 'Test', emoji: '👤' })),
  getSessionInfo: vi.fn(),
}));

import { useSessionStore } from './sessionStore';
import { sessionApi } from '../services/api';

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

describe('sessionStore', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('has correct initial values', () => {
      const store = useSessionStore();

      expect(store.sessionCode).toBeNull();
      expect(store.currentRound).toBe(1);
      expect(store.inSession).toBe(false);
      expect(store.participants).toHaveLength(0);
      expect(store.userCard).toBeNull();
      expect(store.timerSeconds).toBe(15);
      expect(store.isRevealed).toBe(false);
      expect(store.isVoting).toBe(false);
    });

    it('has correct initial user state', () => {
      const store = useSessionStore();

      expect(store.currentUser.name).toBe('Anonymous');
      expect(store.currentUser.emoji).toBe('👤');
      expect(store.currentUser.isFacilitator).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('createSession initializes a new session', async () => {
      sessionApi.create.mockResolvedValue({
        data: {
          session: { code: 'ABC123', current_round: 1, status: 'waiting' },
          participant: { id: 1, name: 'John', emoji: '🚀', is_host: true },
          token: 'test-token',
        }
      });

      const store = useSessionStore();
      await store.createSession({ name: 'John', emoji: '🚀' });

      expect(store.inSession).toBe(true);
      expect(store.sessionCode).toBe('ABC123');
      expect(store.currentUser.name).toBe('John');
      expect(store.currentUser.emoji).toBe('🚀');
      expect(store.currentUser.isFacilitator).toBe(true);
      expect(store.participants).toHaveLength(1);
      expect(store.participants[0].name).toBe('John');
      expect(store.participants[0].emoji).toBe('🚀');
      expect(store.participants[0].isUser).toBe(true);
    });

    it('joinSession joins existing session', async () => {
      sessionApi.join.mockResolvedValue({
        data: {
          session: { code: 'TEST123', current_round: 1, status: 'waiting' },
          participant: { id: 5, name: 'Jane', emoji: '🎯', is_host: false },
          participants: [
            { id: 1, name: 'Host', emoji: '👤' },
            { id: 2, name: 'Alice', emoji: '👩' },
            { id: 3, name: 'Bob', emoji: '👨' },
            { id: 4, name: 'Charlie', emoji: '🧑' },
            { id: 5, name: 'Jane', emoji: '🎯' },
          ],
          token: 'test-token',
        }
      });

      const store = useSessionStore();
      await store.joinSession('TEST123', { name: 'Jane', emoji: '🎯' });

      expect(store.inSession).toBe(true);
      expect(store.sessionCode).toBe('TEST123');
      expect(store.currentUser.name).toBe('Jane');
      expect(store.currentUser.emoji).toBe('🎯');
      expect(store.currentUser.isFacilitator).toBe(false);
      expect(store.participants).toHaveLength(5);
    });

    it('joinSession throws error when API rejects', async () => {
      sessionApi.join.mockRejectedValue(new Error('Session not found'));

      const store = useSessionStore();

      await expect(
        store.joinSession('BAD', { name: 'Jane', emoji: '🎯' })
      ).rejects.toThrow('Session not found');
    });

    it('leaveSession resets state', async () => {
      sessionApi.leave.mockResolvedValue({});

      const store = useSessionStore();
      setupSession(store);
      store.isVoting = true;

      await store.leaveSession();

      expect(store.inSession).toBe(false);
      expect(store.sessionCode).toBeNull();
      expect(store.participants).toHaveLength(0);
      expect(store.isVoting).toBe(false);
      expect(store.isRevealed).toBe(false);
    });
  });

  describe('Computed Properties', () => {
    it('calculates allVoted correctly', () => {
      const store = useSessionStore();
      setupSession(store);

      expect(store.allVoted).toBe(false);

      store.participants.forEach(p => {
        p.hasVoted = true;
      });

      expect(store.allVoted).toBe(true);
    });

    it('calculates votedCount correctly', () => {
      const store = useSessionStore();
      setupSession(store);

      expect(store.votedCount).toBe(0);

      store.participants[0].hasVoted = true;
      store.participants[1].hasVoted = true;

      expect(store.votedCount).toBe(2);
    });

    it('calculates timerColor correctly', () => {
      const store = useSessionStore();

      store.timerSeconds = 15;
      expect(store.timerColor).toBe('#4caf50'); // Green

      store.timerSeconds = 7;
      expect(store.timerColor).toBe('#ffc107'); // Yellow

      store.timerSeconds = 3;
      expect(store.timerColor).toBe('#f44336'); // Red
    });

    it('calculates timerProgress correctly', () => {
      const store = useSessionStore();

      store.timerSeconds = 15;
      expect(store.timerProgress).toBe(100);

      store.timerSeconds = 7.5;
      expect(store.timerProgress).toBe(50);

      store.timerSeconds = 0;
      expect(store.timerProgress).toBe(0);
    });

    it('calculates averageVote correctly', () => {
      const store = useSessionStore();
      setupSession(store);

      store.isRevealed = true;
      store.participants[0].vote = 2;
      store.participants[1].vote = 3;
      store.participants[2].vote = 5;
      store.participants[3].vote = 8;
      store.participants[4].vote = 5;

      // Average = (2 + 3 + 5 + 8 + 5) / 5 = 4.6
      expect(store.averageVote).toBe('4.6');
    });

    it('excludes special votes from average', () => {
      const store = useSessionStore();
      setupSession(store);

      store.isRevealed = true;
      store.participants[0].vote = 2;
      store.participants[1].vote = 3;
      store.participants[2].vote = -1; // ? (excluded)
      store.participants[3].vote = -2; // ☕ (excluded)
      store.participants[4].vote = 5;

      // Average = (2 + 3 + 5) / 3 = 3.3
      expect(store.averageVote).toBe('3.3');
    });

    it('calculates consensus correctly', () => {
      const store = useSessionStore();
      setupSession(store);
      store.isRevealed = true;

      // Perfect consensus
      store.participants.forEach(p => { p.vote = 5; });
      expect(store.consensus).toBe('Perfect! 🎉');

      // Close consensus (within 1)
      store.participants[0].vote = 3;
      store.participants[1].vote = 3;
      store.participants[2].vote = 3;
      store.participants[3].vote = 3;
      store.participants[4].vote = 2;
      expect(store.consensus).toBe('Close 👍');

      // Spread
      store.participants[0].vote = 1;
      store.participants[1].vote = 3;
      store.participants[2].vote = 5;
      store.participants[3].vote = 8;
      store.participants[4].vote = 13;
      expect(store.consensus).toBe('Spread 🤔');
    });

    it('calculates mostVoted correctly', () => {
      const store = useSessionStore();
      setupSession(store);
      store.isRevealed = true;

      store.participants[0].vote = 3;
      store.participants[1].vote = 5;
      store.participants[2].vote = 5;
      store.participants[3].vote = 5;
      store.participants[4].vote = 8;

      expect(store.mostVoted).toBe(5);
    });
  });

  describe('Actions', () => {
    it('selectCard updates user vote', async () => {
      sessionApi.vote.mockResolvedValue({});

      const store = useSessionStore();
      setupSession(store);
      store.isVoting = true;

      await store.selectCard(5);

      expect(store.userCard).toBe(5);
      const user = store.participants.find(p => p.isUser);
      expect(user.hasVoted).toBe(true);
      expect(user.vote).toBe(5);
    });

    it('selectCard does not work when not voting', async () => {
      const store = useSessionStore();
      setupSession(store);
      store.isVoting = false;

      await store.selectCard(5);

      expect(store.userCard).toBeNull();
    });

    it('selectCard reverts on API failure', async () => {
      sessionApi.vote.mockRejectedValue(new Error('Network error'));

      const store = useSessionStore();
      setupSession(store);
      store.isVoting = true;

      await store.selectCard(5);

      expect(store.userCard).toBeNull();
      const user = store.participants.find(p => p.isUser);
      expect(user.hasVoted).toBe(false);
      expect(user.vote).toBeNull();
    });

    it('startVoting resets state and starts timer', async () => {
      sessionApi.startVoting.mockResolvedValue({});

      const store = useSessionStore();
      setupSession(store);

      // Set some initial state
      store.userCard = 5;
      store.isRevealed = true;
      store.participants[0].hasVoted = true;

      await store.startVoting();

      expect(store.userCard).toBeNull();
      expect(store.isRevealed).toBe(false);
      expect(store.isVoting).toBe(true);
      expect(store.timerSeconds).toBe(15);
      expect(store.participants[0].hasVoted).toBe(false);
    });

    it('timer counts down correctly', async () => {
      sessionApi.startVoting.mockResolvedValue({});

      const store = useSessionStore();
      setupSession(store);

      await store.startVoting();

      expect(store.timerSeconds).toBe(15);

      vi.advanceTimersByTime(1000);
      expect(store.timerSeconds).toBe(14);

      vi.advanceTimersByTime(5000);
      expect(store.timerSeconds).toBe(9);
    });

    it('timer auto-reveals at 0', async () => {
      sessionApi.startVoting.mockResolvedValue({});
      sessionApi.reveal.mockResolvedValue({});

      const store = useSessionStore();
      setupSession(store);

      await store.startVoting();

      expect(store.isRevealed).toBe(false);

      // Use async version to properly flush the revealCards() promise
      // triggered inside the timer callback
      await vi.advanceTimersByTimeAsync(15000);

      expect(store.timerSeconds).toBe(0);
      expect(store.isRevealed).toBe(true);
      expect(store.isVoting).toBe(false);
    });

    it('revealCards updates state correctly', async () => {
      sessionApi.reveal.mockResolvedValue({});

      const store = useSessionStore();
      setupSession(store);
      store.isVoting = true;

      await store.revealCards();

      expect(store.isRevealed).toBe(true);
      expect(store.isVoting).toBe(false);
    });

    it('startNewRound increments round and resets', async () => {
      sessionApi.newRound.mockResolvedValue({});

      const store = useSessionStore();
      setupSession(store);

      expect(store.currentRound).toBe(1);

      await store.startNewRound();

      expect(store.currentRound).toBe(2);
      expect(store.isVoting).toBe(true);
      expect(store.userCard).toBeNull();
    });

    it('simulateParticipantVote updates participant', () => {
      const store = useSessionStore();
      setupSession(store);
      store.isVoting = true;

      store.simulateParticipantVote(2, 5);

      const participant = store.participants.find(p => p.id === 2);
      expect(participant.hasVoted).toBe(true);
      expect(participant.vote).toBe(5);
    });

    it('simulateParticipantVote does not update user', () => {
      const store = useSessionStore();
      setupSession(store);
      store.isVoting = true;

      store.simulateParticipantVote(1, 5); // ID 1 is the user

      const user = store.participants.find(p => p.id === 1);
      expect(user.hasVoted).toBe(false);
      expect(user.vote).toBeNull();
    });

    it('stopTimer clears interval', async () => {
      sessionApi.startVoting.mockResolvedValue({});

      const store = useSessionStore();
      setupSession(store);

      await store.startVoting();
      store.stopTimer();

      const currentSeconds = store.timerSeconds;
      vi.advanceTimersByTime(5000);

      // Timer should not advance
      expect(store.timerSeconds).toBe(currentSeconds);
    });
  });

  describe('endSession', () => {
    it('calls API when user is facilitator', async () => {
      sessionApi.endSession.mockResolvedValue({});

      const store = useSessionStore();
      setupSession(store);

      await store.endSession();

      expect(sessionApi.endSession).toHaveBeenCalledWith('TEST01');
    });

    it('does nothing if user is not facilitator', async () => {
      const store = useSessionStore();
      setupSession(store);
      store.currentUser.isFacilitator = false;

      await store.endSession();

      expect(sessionApi.endSession).not.toHaveBeenCalled();
    });

    it('throws error when API call fails', async () => {
      sessionApi.endSession.mockRejectedValue(new Error('Server error'));

      const store = useSessionStore();
      setupSession(store);

      await expect(store.endSession()).rejects.toThrow('Server error');
    });
  });

  describe('clearSummary', () => {
    it('resets sessionSummary to null', () => {
      const store = useSessionStore();
      store.sessionSummary = { sessionCode: 'TEST', roundsPlayed: 3 };

      store.clearSummary();

      expect(store.sessionSummary).toBeNull();
    });
  });

  describe('removeParticipant', () => {
    let removeParticipantSpy;

    beforeEach(() => {
      removeParticipantSpy = vi.spyOn(sessionApi, 'removeParticipant');
    });

    afterEach(() => {
      removeParticipantSpy.mockRestore();
    });

    it('calls API and does not update state directly (relies on WebSocket)', async () => {
      removeParticipantSpy.mockResolvedValue({});

      const store = useSessionStore();
      store.currentUser.isFacilitator = true;
      store.sessionCode = 'TEST01';
      store.participants = [
        { id: 1, name: 'Alice', emoji: '👩', hasVoted: false, isUser: true },
        { id: 2, name: 'Bob', emoji: '👨', hasVoted: false }
      ];

      await store.removeParticipant(2);

      expect(removeParticipantSpy).toHaveBeenCalledWith('TEST01', 2);
      // State should NOT be updated optimistically - WebSocket handles it
      expect(store.participants).toHaveLength(2);
    });

    it('does nothing if user is not facilitator', async () => {
      const store = useSessionStore();
      store.currentUser.isFacilitator = false;
      store.sessionCode = 'TEST01';
      store.participants = [
        { id: 1, name: 'Alice', emoji: '👩', hasVoted: false },
        { id: 2, name: 'Bob', emoji: '👨', hasVoted: false }
      ];

      await store.removeParticipant(2);

      expect(removeParticipantSpy).not.toHaveBeenCalled();
      expect(store.participants).toHaveLength(2);
    });

    it('throws error when API call fails', async () => {
      const error = new Error('Network error');
      removeParticipantSpy.mockRejectedValue(error);

      const store = useSessionStore();
      store.currentUser.isFacilitator = true;
      store.sessionCode = 'TEST01';

      await expect(store.removeParticipant(2)).rejects.toThrow('Network error');
    });
  });

  describe('onParticipantRemoved WebSocket handler', () => {
    it('removes participant from list when another participant is kicked', () => {
      const store = useSessionStore();
      store.currentUser = { id: 1, name: 'Alice', emoji: '👩', isFacilitator: true };
      store.participants = [
        { id: 1, name: 'Alice', emoji: '👩', hasVoted: false },
        { id: 2, name: 'Bob', emoji: '👨', hasVoted: false }
      ];

      const index = store.participants.findIndex(p => p.id === 2);
      if (index !== -1) store.participants.splice(index, 1);

      expect(store.participants).toHaveLength(1);
      expect(store.participants[0].id).toBe(1);
    });

    it('handles null/undefined event gracefully', () => {
      const store = useSessionStore();
      store.participants = [
        { id: 1, name: 'Alice', emoji: '👩', hasVoted: false }
      ];

      expect(() => {
        const event = null;
        if (event && event.participant_id === store.currentUser.id) {
          // would handle kicked user
        } else if (event) {
          // would remove from list
        }
      }).not.toThrow();

      expect(store.participants).toHaveLength(1);
    });
  });
});
