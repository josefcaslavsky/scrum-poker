import { useSessionStore } from '../stores/sessionStore';

// Card values for simulation
const CARD_VALUES = [
  { value: 0, weight: 5 },
  { value: 0.5, weight: 3 },
  { value: 1, weight: 8 },
  { value: 2, weight: 15 },
  { value: 3, weight: 20 },
  { value: 5, weight: 20 },
  { value: 8, weight: 15 },
  { value: 13, weight: 8 },
  { value: 21, weight: 3 },
  { value: -1, weight: 2 }, // ?
  { value: -2, weight: 1 }  // ☕
];

// Participant voting personalities
const PARTICIPANT_PROFILES = {
  2: { name: 'Alice', minDelay: 2000, maxDelay: 4000 },   // Fast voter
  3: { name: 'Bob', minDelay: 4000, maxDelay: 8000 },     // Medium voter
  4: { name: 'Charlie', minDelay: 8000, maxDelay: 12000 }, // Slow voter
  5: { name: 'Diana', minDelay: 2000, maxDelay: 12000 }   // Random voter
};

export function useMockApi() {
  const sessionStore = useSessionStore();
  const activeTimeouts = [];

  /**
   * Get a weighted random card value
   */
  const getRandomCard = () => {
    const totalWeight = CARD_VALUES.reduce((sum, card) => sum + card.weight, 0);
    let random = Math.random() * totalWeight;

    for (const card of CARD_VALUES) {
      random -= card.weight;
      if (random <= 0) {
        return card.value;
      }
    }

    return 3; // Fallback
  };

  /**
   * Get random delay for a participant
   */
  const getRandomDelay = (participantId) => {
    const profile = PARTICIPANT_PROFILES[participantId];
    if (!profile) return 5000;

    const min = profile.minDelay;
    const max = profile.maxDelay;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  /**
   * Simulate a participant voting
   */
  const simulateParticipantVote = (participantId) => {
    const delay = getRandomDelay(participantId);

    const timeout = setTimeout(() => {
      // Only vote if still in voting phase and participant hasn't voted
      const participant = sessionStore.participants.find(p => p.id === participantId);
      if (participant && !participant.hasVoted && sessionStore.isVoting) {
        const cardValue = getRandomCard();
        sessionStore.simulateParticipantVote(participantId, cardValue);
      }
    }, delay);

    activeTimeouts.push(timeout);
  };

  /**
   * Start voting round - trigger AI participants
   */
  const startVotingRound = () => {
    // Clear any existing timeouts
    clearAllTimeouts();

    // Start the voting in the store
    sessionStore.startVoting();

    // Simulate votes for all non-user participants
    const aiParticipants = sessionStore.participants
      .filter(p => !p.isUser)
      .map(p => p.id);

    aiParticipants.forEach(participantId => {
      simulateParticipantVote(participantId);
    });
  };

  /**
   * Clear all active timeouts
   */
  const clearAllTimeouts = () => {
    activeTimeouts.forEach(timeout => clearTimeout(timeout));
    activeTimeouts.length = 0;
  };

  /**
   * Force reveal cards
   */
  const forceReveal = () => {
    clearAllTimeouts();
    sessionStore.revealCards();
  };

  /**
   * Start a new round
   */
  const startNewRound = () => {
    clearAllTimeouts();
    sessionStore.startNewRound();

    // Simulate votes for all non-user participants
    const aiParticipants = sessionStore.participants
      .filter(p => !p.isUser)
      .map(p => p.id);

    aiParticipants.forEach(participantId => {
      simulateParticipantVote(participantId);
    });
  };

  /**
   * Cleanup on unmount
   */
  const cleanup = () => {
    clearAllTimeouts();
    sessionStore.stopTimer();
  };

  return {
    startVotingRound,
    forceReveal,
    startNewRound,
    cleanup
  };
}
