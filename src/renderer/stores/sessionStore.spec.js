import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSessionStore } from './sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('has correct initial values', () => {
      const store = useSessionStore();

      expect(store.sessionCode).toBe('ABC123');
      expect(store.currentRound).toBe(1);
      expect(store.participants).toHaveLength(5);
      expect(store.userCard).toBeNull();
      expect(store.timerSeconds).toBe(15);
      expect(store.isRevealed).toBe(false);
      expect(store.isVoting).toBe(false);
    });

    it('has 5 participants with correct structure', () => {
      const store = useSessionStore();

      expect(store.participants).toHaveLength(5);

      const user = store.participants[0];
      expect(user.id).toBe(1);
      expect(user.name).toBe('You');
      expect(user.isUser).toBe(true);
      expect(user.hasVoted).toBe(false);
      expect(user.vote).toBeNull();
    });
  });

  describe('Computed Properties', () => {
    it('calculates allVoted correctly', () => {
      const store = useSessionStore();

      expect(store.allVoted).toBe(false);

      // Mark all participants as voted
      store.participants.forEach(p => {
        p.hasVoted = true;
      });

      expect(store.allVoted).toBe(true);
    });

    it('calculates votedCount correctly', () => {
      const store = useSessionStore();

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
    it('selectCard updates user vote', () => {
      const store = useSessionStore();
      store.isVoting = true;

      store.selectCard(5);

      expect(store.userCard).toBe(5);
      const user = store.participants.find(p => p.isUser);
      expect(user.hasVoted).toBe(true);
      expect(user.vote).toBe(5);
    });

    it('selectCard does not work when not voting', () => {
      const store = useSessionStore();
      store.isVoting = false;

      store.selectCard(5);

      expect(store.userCard).toBeNull();
    });

    it('selectCard auto-reveals when all voted', () => {
      const store = useSessionStore();
      store.isVoting = true;

      // Mark 4 participants as voted
      for (let i = 1; i < 5; i++) {
        store.participants[i].hasVoted = true;
        store.participants[i].vote = 3;
      }

      expect(store.isRevealed).toBe(false);

      // User votes last
      store.selectCard(5);

      expect(store.isRevealed).toBe(true);
    });

    it('startVoting resets state and starts timer', () => {
      const store = useSessionStore();

      // Set some initial state
      store.userCard = 5;
      store.isRevealed = true;
      store.participants[0].hasVoted = true;

      store.startVoting();

      expect(store.userCard).toBeNull();
      expect(store.isRevealed).toBe(false);
      expect(store.isVoting).toBe(true);
      expect(store.timerSeconds).toBe(15);
      expect(store.participants[0].hasVoted).toBe(false);
    });

    it('timer counts down correctly', () => {
      const store = useSessionStore();

      store.startVoting();

      expect(store.timerSeconds).toBe(15);

      vi.advanceTimersByTime(1000);
      expect(store.timerSeconds).toBe(14);

      vi.advanceTimersByTime(5000);
      expect(store.timerSeconds).toBe(9);
    });

    it('timer auto-reveals at 0', () => {
      const store = useSessionStore();

      store.startVoting();

      expect(store.isRevealed).toBe(false);

      vi.advanceTimersByTime(15000);

      expect(store.timerSeconds).toBe(0);
      expect(store.isRevealed).toBe(true);
      expect(store.isVoting).toBe(false);
    });

    it('revealCards updates state correctly', () => {
      const store = useSessionStore();
      store.isVoting = true;

      store.revealCards();

      expect(store.isRevealed).toBe(true);
      expect(store.isVoting).toBe(false);
    });

    it('startNewRound increments round and resets', () => {
      const store = useSessionStore();

      expect(store.currentRound).toBe(1);

      store.startNewRound();

      expect(store.currentRound).toBe(2);
      expect(store.isVoting).toBe(true);
      expect(store.userCard).toBeNull();
    });

    it('simulateParticipantVote updates participant', () => {
      const store = useSessionStore();
      store.isVoting = true;

      store.simulateParticipantVote(2, 5);

      const participant = store.participants.find(p => p.id === 2);
      expect(participant.hasVoted).toBe(true);
      expect(participant.vote).toBe(5);
    });

    it('simulateParticipantVote does not update user', () => {
      const store = useSessionStore();
      store.isVoting = true;

      store.simulateParticipantVote(1, 5); // ID 1 is the user

      const user = store.participants.find(p => p.id === 1);
      expect(user.hasVoted).toBe(false);
      expect(user.vote).toBeNull();
    });

    it('stopTimer clears interval', () => {
      const store = useSessionStore();

      store.startVoting();
      store.stopTimer();

      const currentSeconds = store.timerSeconds;
      vi.advanceTimersByTime(5000);

      // Timer should not advance
      expect(store.timerSeconds).toBe(currentSeconds);
    });
  });
});
