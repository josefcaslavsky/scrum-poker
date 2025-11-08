import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useSessionStore = defineStore('session', () => {
  // State
  const sessionCode = ref(null);
  const currentRound = ref(1);
  const inSession = ref(false);
  const currentUser = ref({
    name: 'Anonymous',
    emoji: '👤',
    isFacilitator: false
  });
  const participants = ref([]);
  const userCard = ref(null);
  const timerSeconds = ref(15);
  const isRevealed = ref(false);
  const isVoting = ref(false);
  const timerInterval = ref(null);

  // Computed
  const allVoted = computed(() => {
    return participants.value.every(p => p.hasVoted);
  });

  const votedCount = computed(() => {
    return participants.value.filter(p => p.hasVoted).length;
  });

  const totalCount = computed(() => {
    return participants.value.length;
  });

  const timerColor = computed(() => {
    if (timerSeconds.value >= 10) return '#4caf50'; // Green
    if (timerSeconds.value >= 5) return '#ffc107'; // Yellow
    return '#f44336'; // Red
  });

  const timerProgress = computed(() => {
    return (timerSeconds.value / 15) * 100;
  });

  const averageVote = computed(() => {
    if (!isRevealed.value) return null;

    const numericVotes = participants.value
      .map(p => p.vote)
      .filter(v => v !== null && v >= 0); // Exclude ? (-1) and ☕ (-2)

    if (numericVotes.length === 0) return null;

    const sum = numericVotes.reduce((acc, val) => acc + val, 0);
    return (sum / numericVotes.length).toFixed(1);
  });

  const consensus = computed(() => {
    if (!isRevealed.value) return null;

    const votes = participants.value
      .map(p => p.vote)
      .filter(v => v !== null && v >= 0);

    if (votes.length === 0) return 'No votes';

    const uniqueVotes = [...new Set(votes)];

    if (uniqueVotes.length === 1) return 'Perfect! 🎉';

    const max = Math.max(...votes);
    const min = Math.min(...votes);

    if (max - min <= 1) return 'Close 👍';

    return 'Spread 🤔';
  });

  const mostVoted = computed(() => {
    if (!isRevealed.value) return null;

    const votes = participants.value
      .map(p => p.vote)
      .filter(v => v !== null);

    if (votes.length === 0) return null;

    // Count occurrences
    const voteCounts = {};
    votes.forEach(v => {
      voteCounts[v] = (voteCounts[v] || 0) + 1;
    });

    // Find most common
    let maxCount = 0;
    let mostCommon = null;

    Object.entries(voteCounts).forEach(([vote, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = parseFloat(vote);
      }
    });

    return mostCommon;
  });

  // Actions
  const selectCard = (value) => {
    if (isRevealed.value || !isVoting.value) return;

    userCard.value = value;
    const user = participants.value.find(p => p.isUser);
    if (user) {
      user.hasVoted = true;
      user.vote = value;
    }

    // Check if all voted
    if (allVoted.value) {
      revealCards();
    }
  };

  const startVoting = () => {
    // Reset state
    userCard.value = null;
    isRevealed.value = false;
    isVoting.value = true;
    timerSeconds.value = 15;

    participants.value.forEach(p => {
      p.hasVoted = false;
      p.vote = null;
    });

    // Start timer
    startTimer();
  };

  const startTimer = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value);
    }

    timerInterval.value = setInterval(() => {
      timerSeconds.value--;

      if (timerSeconds.value <= 0) {
        clearInterval(timerInterval.value);
        revealCards();
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value);
      timerInterval.value = null;
    }
  };

  const revealCards = () => {
    isRevealed.value = true;
    isVoting.value = false;
    stopTimer();
  };

  const startNewRound = () => {
    currentRound.value++;
    startVoting();
  };

  const simulateParticipantVote = (participantId, cardValue) => {
    const participant = participants.value.find(p => p.id === participantId);
    if (participant && !participant.isUser) {
      participant.hasVoted = true;
      participant.vote = cardValue;

      // Check if all voted
      if (allVoted.value) {
        revealCards();
      }
    }
  };

  // Helper: Generate random session code
  const generateSessionCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Helper: Initialize participants with user
  const initializeParticipants = () => {
    participants.value = [
      {
        id: 1,
        name: currentUser.value.name,
        emoji: currentUser.value.emoji,
        hasVoted: false,
        vote: null,
        isUser: true
      },
      { id: 2, name: 'Alice', emoji: '👩', hasVoted: false, vote: null, isUser: false },
      { id: 3, name: 'Bob', emoji: '👨', hasVoted: false, vote: null, isUser: false },
      { id: 4, name: 'Charlie', emoji: '🧑', hasVoted: false, vote: null, isUser: false },
      { id: 5, name: 'Diana', emoji: '👱‍♀️', hasVoted: false, vote: null, isUser: false }
    ];
  };

  // Create new session (user becomes facilitator)
  const createSession = (userData) => {
    currentUser.value = {
      name: userData.name,
      emoji: userData.emoji,
      isFacilitator: true
    };
    sessionCode.value = generateSessionCode();
    currentRound.value = 1;
    inSession.value = true;
    initializeParticipants();
  };

  // Join existing session
  const joinSession = (sessionId, userData) => {
    // TODO: In real implementation, this would validate session ID with backend
    // For now, we'll simulate validation
    if (!sessionId || sessionId.length < 3) {
      throw new Error('Invalid session code');
    }

    currentUser.value = {
      name: userData.name,
      emoji: userData.emoji,
      isFacilitator: false
    };
    sessionCode.value = sessionId.toUpperCase();
    currentRound.value = 1;
    inSession.value = true;
    initializeParticipants();
  };

  // Leave session
  const leaveSession = () => {
    inSession.value = false;
    sessionCode.value = null;
    currentRound.value = 1;
    participants.value = [];
    userCard.value = null;
    isRevealed.value = false;
    isVoting.value = false;
    stopTimer();
  };

  return {
    // State
    sessionCode,
    currentRound,
    inSession,
    currentUser,
    participants,
    userCard,
    timerSeconds,
    isRevealed,
    isVoting,

    // Computed
    allVoted,
    votedCount,
    totalCount,
    timerColor,
    timerProgress,
    averageVote,
    consensus,
    mostVoted,

    // Actions
    createSession,
    joinSession,
    leaveSession,
    selectCard,
    startVoting,
    startNewRound,
    revealCards,
    simulateParticipantVote,
    stopTimer
  };
});
