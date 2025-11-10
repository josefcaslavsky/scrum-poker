import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { sessionApi } from '../services/api';
import { subscribeToSession, unsubscribeFromSession } from '../services/broadcasting';
import { saveSessionInfo, clearSessionInfo } from '../composables/useLocalStorage';

export const useSessionStore = defineStore('session', () => {
  // State
  const sessionCode = ref(null);
  const currentRound = ref(1);
  const inSession = ref(false);
  const currentUser = ref({
    id: null,
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
  const wsChannel = ref(null);

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

  // Check if we have actual vote data to display
  const hasVoteData = computed(() => {
    return participants.value.some(p => p.vote !== null);
  });

  // Actions
  // Convert numeric card values to API format
  const convertCardValue = (value) => {
    if (value === 0.5) return '1/2';
    if (value === -1) return '?';
    if (value === -2) return '☕';
    return String(value);
  };

  // Convert API card values back to numeric format
  const convertCardValueFromApi = (apiValue) => {
    if (apiValue === '1/2') return 0.5;
    if (apiValue === '?') return -1;
    if (apiValue === '☕') return -2;
    const numValue = parseFloat(apiValue);
    return isNaN(numValue) ? null : numValue;
  };

  const selectCard = async (value) => {
    if (isRevealed.value || !isVoting.value) return;

    try {
      // Submit vote to API
      await sessionApi.vote(sessionCode.value, {
        participant_id: currentUser.value.id,
        card_value: convertCardValue(value)
      });

      // Update local state immediately for responsive UI
      userCard.value = value;
      const user = participants.value.find(p => p.isUser);
      if (user) {
        user.hasVoted = true;
        user.vote = value;
      }

      // WebSocket will handle updating other participants' states
    } catch (error) {
      console.error('Failed to submit vote:', error);
      // Revert on error
      userCard.value = null;
      const user = participants.value.find(p => p.isUser);
      if (user) {
        user.hasVoted = false;
        user.vote = null;
      }
    }
  };

  const startVoting = async () => {
    if (!currentUser.value.isFacilitator) {
      console.warn('Only facilitator can start voting');
      return;
    }

    try {
      await sessionApi.startVoting(sessionCode.value);

      // Local state will be updated via WebSocket event
      // But update immediately for responsive UI
      userCard.value = null;
      isRevealed.value = false;
      isVoting.value = true;
      timerSeconds.value = 15;

      participants.value.forEach(p => {
        p.hasVoted = false;
        p.vote = null;
      });

      startTimer();
    } catch (error) {
      console.error('Failed to start voting:', error);
    }
  };

  const startTimer = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value);
    }

    timerInterval.value = setInterval(() => {
      timerSeconds.value--;

      if (timerSeconds.value <= 0) {
        clearInterval(timerInterval.value);
        // Auto-reveal when timer expires (only facilitator can reveal)
        if (currentUser.value.isFacilitator) {
          revealCards();
        }
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value);
      timerInterval.value = null;
    }
  };

  const revealCards = async () => {
    if (!currentUser.value.isFacilitator) {
      console.warn('Only facilitator can reveal cards');
      return;
    }

    try {
      await sessionApi.reveal(sessionCode.value);

      // Local state will be updated via WebSocket event
      // But update immediately for responsive UI
      isRevealed.value = true;
      isVoting.value = false;
      stopTimer();
    } catch (error) {
      console.error('Failed to reveal cards:', error);
    }
  };

  const startNewRound = async () => {
    if (!currentUser.value.isFacilitator) {
      console.warn('Only facilitator can start new round');
      return;
    }

    try {
      await sessionApi.newRound(sessionCode.value);

      // Local state will be updated via WebSocket event
      // But update immediately for responsive UI
      currentRound.value++;
      userCard.value = null;
      isRevealed.value = false;
      isVoting.value = true;
      timerSeconds.value = 15;

      participants.value.forEach(p => {
        p.hasVoted = false;
        p.vote = null;
      });

      startTimer();
    } catch (error) {
      console.error('Failed to start new round:', error);
    }
  };

  const simulateParticipantVote = (participantId, cardValue) => {
    const participant = participants.value.find(p => p.id === participantId);
    if (participant && !participant.isUser) {
      participant.hasVoted = true;
      participant.vote = cardValue;

      // Note: No auto-reveal when using real API
      // The facilitator should manually reveal or wait for timer
    }
  };

  // Helper: Setup WebSocket subscriptions
  const setupWebSocket = () => {
    console.log('[SessionStore] Setting up WebSocket for session:', sessionCode.value);
    wsChannel.value = subscribeToSession(sessionCode.value, {
      onParticipantJoined: (event) => {
        console.log('[SessionStore] Participant joined handler called:', event);
        // Add new participant to list
        const existingIndex = participants.value.findIndex(p => p.id === event.participant.id);
        if (existingIndex === -1) {
          console.log('[SessionStore] Adding new participant to list:', event.participant);
          participants.value.push({
            ...event.participant,
            hasVoted: false,
            vote: null,
            isUser: event.participant.id === currentUser.value.id
          });
        } else {
          console.log('[SessionStore] Participant already in list, skipping');
        }
      },

      onParticipantLeft: (event) => {
        console.log('Participant left:', event);
        // Remove participant from list
        const index = participants.value.findIndex(p => p.id === event.participant_id);
        if (index !== -1) {
          participants.value.splice(index, 1);
        }
      },

      onVotingStarted: (event) => {
        console.log('Voting started:', event);
        isVoting.value = true;
        isRevealed.value = false;
        userCard.value = null;
        timerSeconds.value = 15;

        participants.value.forEach(p => {
          p.hasVoted = false;
          p.vote = null;
        });

        startTimer();
      },

      onVoteSubmitted: (event) => {
        console.log('Vote submitted:', event);
        // Update participant vote status
        const participant = participants.value.find(p => p.id === event.participant_id);
        if (participant) {
          participant.hasVoted = true;
          // Don't show the actual vote until revealed
        }
      },

      onVotesRevealed: (event) => {
        console.log('[SessionStore] Votes revealed:', event);
        isRevealed.value = true;
        isVoting.value = false;
        stopTimer();

        // Update all participants with their votes
        if (event.votes) {
          event.votes.forEach(vote => {
            const participant = participants.value.find(p => p.id === vote.participant_id);
            if (participant) {
              // Convert API string value to numeric format
              participant.vote = convertCardValueFromApi(vote.card_value);
              participant.hasVoted = true;
              console.log('[SessionStore] Updated participant vote:', participant.name, participant.vote);
            }
          });
        }
      },

      onNewRound: (event) => {
        console.log('New round started:', event);
        currentRound.value = event.round;
        isVoting.value = true;
        isRevealed.value = false;
        userCard.value = null;
        timerSeconds.value = 15;

        participants.value.forEach(p => {
          p.hasVoted = false;
          p.vote = null;
        });

        startTimer();
      },

      onSessionEnded: (event) => {
        console.log('[SessionStore] Session ended - host left:', event);

        // Unsubscribe from WebSocket
        if (sessionCode.value) {
          unsubscribeFromSession(sessionCode.value);
        }
        wsChannel.value = null;

        // Clear session info from localStorage
        clearSessionInfo();

        // Reset state
        inSession.value = false;
        sessionCode.value = null;
        currentRound.value = 1;
        currentUser.value = {
          id: null,
          name: 'Anonymous',
          emoji: '👤',
          isFacilitator: false
        };
        participants.value = [];
        userCard.value = null;
        isRevealed.value = false;
        isVoting.value = false;
        stopTimer();

        // Optionally notify user
        alert('Session ended - the host has left');
      }
    });
  };

  // Create new session (user becomes facilitator)
  const createSession = async (userData) => {
    try {
      const response = await sessionApi.create({
        name: userData.name,
        emoji: userData.emoji,
        host_name: userData.name,
        host_emoji: userData.emoji
      });

      const session = response.data;

      currentUser.value = {
        id: session.participant_id,
        name: userData.name,
        emoji: userData.emoji,
        isFacilitator: true
      };

      sessionCode.value = session.code;
      currentRound.value = session.current_round || 1;
      inSession.value = true;

      // Initialize participants with just the current user for now
      // More participants will be added via WebSocket when they join
      participants.value = [{
        id: session.participant_id,
        name: userData.name,
        emoji: userData.emoji,
        hasVoted: false,
        vote: null,
        isUser: true
      }];

      // Save session info to localStorage
      saveSessionInfo(session.code, session.participant_id, true);

      // Setup WebSocket connection
      setupWebSocket();

      return session;
    } catch (error) {
      console.error('Failed to create session:', error);

      // Log validation errors if available
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
      }
      if (error.response?.data?.message) {
        console.error('Error message:', error.response.data.message);
      }

      throw error;
    }
  };

  // Join existing session
  const joinSession = async (sessionId, userData) => {
    try {
      const response = await sessionApi.join(sessionId, {
        name: userData.name,
        emoji: userData.emoji
      });

      const session = response.data;

      currentUser.value = {
        id: session.participant_id,
        name: userData.name,
        emoji: userData.emoji,
        isFacilitator: false
      };

      // Use the sessionId parameter since API doesn't return code
      sessionCode.value = sessionId;
      currentRound.value = session.current_round || 1;
      inSession.value = true;

      // Initialize participants from API response
      participants.value = session.participants.map(p => ({
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        hasVoted: false,
        vote: null,
        isUser: p.id === session.participant_id
      }));

      // Sync voting state from session
      isVoting.value = session.status === 'voting';
      isRevealed.value = session.status === 'revealed';

      if (isVoting.value && !isRevealed.value) {
        startTimer();
      }

      // Save session info to localStorage
      saveSessionInfo(sessionId, session.participant_id, false);

      // Setup WebSocket connection
      setupWebSocket();

      return session;
    } catch (error) {
      console.error('Failed to join session:', error);
      throw error;
    }
  };

  // Rejoin existing session (from localStorage)
  const rejoinSession = async (savedSessionInfo) => {
    try {
      console.log('[SessionStore] Attempting to rejoin session:', savedSessionInfo.sessionCode);

      // Get current session state from API
      const response = await sessionApi.get(savedSessionInfo.sessionCode);
      const session = response.data;

      console.log('[SessionStore] Session retrieved:', session);

      // Verify participant still exists in session
      const participantExists = session.participants.some(p => p.id === savedSessionInfo.participantId);
      if (!participantExists) {
        throw new Error('Participant no longer in session');
      }

      // Get user preferences for name and emoji
      const { getUserPreferences } = await import('../composables/useLocalStorage');
      const userPrefs = getUserPreferences();

      // Restore user state
      currentUser.value = {
        id: savedSessionInfo.participantId,
        name: userPrefs.name,
        emoji: userPrefs.emoji,
        isFacilitator: savedSessionInfo.isFacilitator
      };

      sessionCode.value = savedSessionInfo.sessionCode;
      currentRound.value = session.current_round || 1;
      inSession.value = true;

      // Initialize participants from API response
      participants.value = session.participants.map(p => ({
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        hasVoted: false,
        vote: null,
        isUser: p.id === savedSessionInfo.participantId
      }));

      // Sync voting state from session
      isVoting.value = session.status === 'voting';
      isRevealed.value = session.status === 'revealed';

      // If votes are revealed, fetch and display them
      if (isRevealed.value && session.votes) {
        session.votes.forEach(vote => {
          const participant = participants.value.find(p => p.id === vote.participant_id);
          if (participant) {
            participant.vote = convertCardValueFromApi(vote.card_value);
            participant.hasVoted = true;
          }
        });
      }

      // If voting is in progress, start timer
      if (isVoting.value && !isRevealed.value) {
        startTimer();
      }

      // Setup WebSocket connection
      setupWebSocket();

      console.log('[SessionStore] Successfully rejoined session');
      return session;
    } catch (error) {
      console.error('[SessionStore] Failed to rejoin session:', error);
      throw error;
    }
  };

  // Leave session
  const leaveSession = async () => {
    try {
      if (sessionCode.value && currentUser.value.id) {
        console.log('[SessionStore] Leaving session:', sessionCode.value, 'participant:', currentUser.value.id);
        const response = await sessionApi.leave(sessionCode.value, currentUser.value.id);
        console.log('[SessionStore] Leave response:', response.data);

        // Note: WebSocket will broadcast ParticipantLeft or SessionEnded event to other users
        // If host leaves, backend will broadcast SessionEnded to all participants
      }

      // Unsubscribe from WebSocket
      if (sessionCode.value) {
        unsubscribeFromSession(sessionCode.value);
      }
      wsChannel.value = null;

      // Clear session info from localStorage
      clearSessionInfo();

      // Reset state
      inSession.value = false;
      sessionCode.value = null;
      currentRound.value = 1;
      currentUser.value = {
        id: null,
        name: 'Anonymous',
        emoji: '👤',
        isFacilitator: false
      };
      participants.value = [];
      userCard.value = null;
      isRevealed.value = false;
      isVoting.value = false;
      stopTimer();
    } catch (error) {
      console.error('[SessionStore] Failed to leave session:', error);
      // Still reset local state even if API call fails
      clearSessionInfo();
      inSession.value = false;
      sessionCode.value = null;
      currentRound.value = 1;
      participants.value = [];
      userCard.value = null;
      isRevealed.value = false;
      isVoting.value = false;
      stopTimer();
    }
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
    hasVoteData,

    // Actions
    createSession,
    joinSession,
    rejoinSession,
    leaveSession,
    selectCard,
    startVoting,
    startNewRound,
    revealCards,
    simulateParticipantVote,
    stopTimer
  };
});
