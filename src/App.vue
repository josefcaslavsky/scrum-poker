<template>
  <div class="app">
    <!-- Session Summary (shown after host ends session) -->
    <SessionSummary
      v-if="store.sessionSummary"
      :session-code="store.sessionSummary.sessionCode"
      :rounds-played="store.sessionSummary.roundsPlayed"
      :participants="store.sessionSummary.participants"
      :total-story-points="store.sessionSummary.totalStoryPoints"
      @close="handleSummaryClose"
    />

    <!-- Loading State (when rejoining session) -->
    <div v-else-if="isRejoining" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Reconnecting to session...</p>
    </div>

    <!-- Loading State (when auto-joining via invite link) -->
    <div v-else-if="isAutoJoining" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Joining session...</p>
    </div>

    <!-- Profile Setup View (first time or editing profile) -->
    <ProfileSetupPage
      v-else-if="!store.inSession && showProfileSetup"
      @profile-saved="handleProfileSaved"
    />

    <!-- Landing View (when not in session and profile exists) -->
    <SessionLanding
      v-else-if="!store.inSession"
      @create-session="handleCreateSession"
      @join-session="handleJoinSession"
      @edit-profile="handleEditProfile"
    />

    <!-- Session View (when in session) -->
    <div v-else class="container">
      <!-- Header -->
      <div class="header">
        <div class="header-buttons">
          <button v-if="store.currentUser.isFacilitator" class="btn-end" @click="handleEndSession" title="End Session">
            <span class="end-text">End Session</span>
          </button>
          <button class="btn-leave" @click="handleLeaveSession" title="Leave Session">
            <span class="leave-text">Leave Session</span>
            <svg class="leave-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
        <h1 class="title">
          <span class="emoji">🃏</span>
          Scrum Poker
        </h1>
        <p class="subtitle">Let's estimate some stories!</p>
        <SessionInfo
          :session-code="store.sessionCode"
          :current-round="store.currentRound"
        />
      </div>

      <!-- Waiting State (only when truly waiting for round to start) -->
      <div v-if="!store.isVoting && !store.isRevealed" class="waiting-state">
        <p class="waiting-message">
          {{ store.currentUser.isFacilitator
            ? 'Start the voting round when everyone is ready'
            : 'Waiting for facilitator to start voting...' }}
        </p>
      </div>

      <!-- Timer (shown only during voting) -->
      <VotingTimer
        v-if="store.isVoting && !store.isRevealed"
        :seconds="store.timerSeconds"
        :progress="store.timerProgress"
        :timer-color="store.timerColor"
        :voted-count="store.votedCount"
        :total-count="store.totalCount"
      />

      <!-- Card Grid -->
      <div v-if="!store.isRevealed && store.isVoting" class="card-grid">
        <PokerCard
          v-for="card in cards"
          :key="card.value"
          :value="card.value"
          :label="card.label"
          :is-selected="store.userCard === card.value"
          :disabled="!store.isVoting"
          @select="handleCardClick"
        />
      </div>

      <!-- Results View (shown after reveal) -->
      <ResultsView
        v-if="store.isRevealed"
        :participants="store.participants"
        :average-vote="store.averageVote"
        :consensus="store.consensus"
        :most-voted="store.mostVoted"
      />

      <!-- Participants -->
      <ParticipantList
        :participants="store.participants"
        :is-facilitator="store.currentUser.isFacilitator"
        :current-user-id="store.currentUser.id"
        :removing-participant-id="removingParticipantId"
        @remove-participant="handleRemoveParticipant"
      />

      <!-- Actions (only shown to facilitator) -->
      <div v-if="store.currentUser.isFacilitator" class="actions">
        <button
          v-if="!store.isVoting && !store.isRevealed"
          class="btn btn-primary"
          @click="handleStartVoting"
        >
          Start Voting Round
        </button>
        <button
          v-if="store.isVoting && !store.isRevealed"
          class="btn btn-secondary"
          @click="handleForceReveal"
        >
          Force Reveal
        </button>
        <button
          v-if="store.isRevealed"
          class="btn btn-primary"
          @click="handleNewRound"
        >
          Start New Round
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useSessionStore } from './stores/sessionStore';
import { useMockApi } from './composables/useMockApi';
import { getUserPreferences, getSessionInfo, clearSessionInfo } from './composables/useLocalStorage';
import { getSessionCodeFromUrl, clearSessionCodeFromUrl } from './composables/useSessionLink';
import confetti from 'canvas-confetti';

// Import components
import ProfileSetupPage from './components/ProfileSetupPage.vue';
import SessionLanding from './components/SessionLanding.vue';
import PokerCard from './components/PokerCard.vue';
import VotingTimer from './components/VotingTimer.vue';
import ParticipantList from './components/ParticipantList.vue';
import ResultsView from './components/ResultsView.vue';
import SessionInfo from './components/SessionInfo.vue';
import SessionSummary from './components/SessionSummary.vue';

const store = useSessionStore();
const mockApi = useMockApi();

// Check if user has completed profile setup
const hasProfile = localStorage.getItem('userPreferences') !== null;
const showProfileSetup = ref(!hasProfile);
const isRejoining = ref(false);
const pendingJoinCode = ref(null);
const isAutoJoining = ref(false);
const removingParticipantId = ref(null);

const cards = [
  { value: 0, label: '0' },
  { value: 0.5, label: '½' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 5, label: '5' },
  { value: 8, label: '8' },
  { value: 13, label: '13' },
  { value: 21, label: '21' },
  { value: -1, label: '?' },
  { value: -2, label: '☕' }
];

const autoJoinSession = async (code) => {
  isAutoJoining.value = true;
  try {
    const prefs = getUserPreferences();
    await store.joinSession(code, { name: prefs.name, emoji: prefs.emoji });
  } catch (error) {
    console.error('Failed to auto-join session:', error);
    if (error.response?.status === 404) {
      alert('Session not found. It may have expired.');
    } else {
      alert(error.message || 'Failed to join session. Please try again.');
    }
  } finally {
    isAutoJoining.value = false;
  }
};

const handleProfileSaved = () => {
  showProfileSetup.value = false;
  if (pendingJoinCode.value) {
    const code = pendingJoinCode.value;
    pendingJoinCode.value = null;
    autoJoinSession(code);
  }
};

const handleEditProfile = () => {
  showProfileSetup.value = true;
};

const handleCreateSession = async (userData) => {
  try {
    await store.createSession(userData);
  } catch (error) {
    console.error('Failed to create session:', error);
    alert('Failed to create session. Please try again.');
  }
};

const handleJoinSession = async ({ sessionId, name, emoji }) => {
  try {
    await store.joinSession(sessionId, { name, emoji });
  } catch (error) {
    console.error('Failed to join session:', error);
    alert(error.message || 'Failed to join session. Please try again.');
  }
};

const handleEndSession = async () => {
  if (confirm('End the session for everyone? This will show the summary screen.')) {
    try {
      await store.endSession();
    } catch (error) {
      console.error('Failed to end session:', error);
      alert('Failed to end session. Please try again.');
    }
  }
};

const handleSummaryClose = () => {
  store.clearSummary();
};

const handleLeaveSession = () => {
  if (confirm('Are you sure you want to leave this session?')) {
    store.leaveSession();
    mockApi.cleanup();
  }
};

const handleCardClick = (value) => {
  if (!store.isVoting || store.isRevealed) return;
  store.selectCard(value);
};

const handleStartVoting = async () => {
  try {
    await store.startVoting();
  } catch (error) {
    if (error.response?.status === 403) {
      alert('Only the host can start voting');
    } else {
      console.error('Failed to start voting:', error);
      alert('Failed to start voting. Please try again.');
    }
  }
};

const handleForceReveal = async () => {
  try {
    await store.revealCards();
    triggerConfetti();
  } catch (error) {
    if (error.response?.status === 403) {
      alert('Only the host can reveal cards');
    } else {
      console.error('Failed to reveal cards:', error);
      alert('Failed to reveal cards. Please try again.');
    }
  }
};

const handleNewRound = async () => {
  try {
    await store.startNewRound();
  } catch (error) {
    if (error.response?.status === 403) {
      alert('Only the host can start a new round');
    } else {
      console.error('Failed to start new round:', error);
      alert('Failed to start new round. Please try again.');
    }
  }
};

const handleRemoveParticipant = async (participantId) => {
  const participant = store.participants.find(p => p.id === participantId);
  const participantName = participant?.name || 'this participant';

  if (confirm(`Are you sure you want to remove ${participantName} from the session?`)) {
    removingParticipantId.value = participantId;
    try {
      await store.removeParticipant(participantId);
    } catch (error) {
      if (error.response?.status === 403) {
        alert('Only the host can remove participants');
      } else {
        console.error('Failed to remove participant:', error);
        alert('Failed to remove participant. Please try again.');
      }
    } finally {
      removingParticipantId.value = null;
    }
  }
};

const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
};

// Multi-burst confetti for session summary celebration
const triggerSummaryConfetti = () => {
  // First burst - center
  setTimeout(() => {
    confetti({ particleCount: 80, spread: 100, origin: { x: 0.5, y: 0.4 } });
  }, 0);
  // Second burst - left
  setTimeout(() => {
    confetti({ particleCount: 50, spread: 60, angle: 60, origin: { x: 0.2, y: 0.6 } });
  }, 400);
  // Third burst - right
  setTimeout(() => {
    confetti({ particleCount: 50, spread: 60, angle: 120, origin: { x: 0.8, y: 0.6 } });
  }, 800);
  // Final burst - big center
  setTimeout(() => {
    confetti({ particleCount: 120, spread: 120, origin: { x: 0.5, y: 0.5 }, startVelocity: 45 });
  }, 1200);
};

// Watch for automatic reveals to trigger confetti
let previousRevealed = false;
const checkRevealChange = setInterval(() => {
  if (store.isRevealed && !previousRevealed) {
    triggerConfetti();
  }
  previousRevealed = store.isRevealed;
}, 100);

// Handle authentication errors
const handleUnauthorized = () => {
  console.warn('[App] Authentication token expired or invalid');
  alert('Your session has expired. Please rejoin.');
  store.leaveSession();
  clearSessionInfo();
};

const handleForbidden = (event) => {
  const message = event.detail?.message || 'Action not allowed';
  console.warn('[App] Forbidden action:', message);
  alert(message);
};

// Trigger confetti when session summary appears
watch(() => store.sessionSummary, (newVal) => {
  if (newVal) {
    setTimeout(triggerSummaryConfetti, 1000);
  }
});

onMounted(async () => {
  // Listen for auth errors from API interceptor
  window.addEventListener('auth:unauthorized', handleUnauthorized);
  window.addEventListener('auth:forbidden', handleForbidden);

  // Capture and clean invite link from URL immediately
  const joinCode = getSessionCodeFromUrl();
  clearSessionCodeFromUrl();

  // Check for saved session and attempt to rejoin
  const savedSession = getSessionInfo();

  if (savedSession && !store.inSession) {
    isRejoining.value = true;

    try {
      await store.rejoinSession(savedSession);
    } catch (error) {
      console.error('[App] Failed to rejoin session:', error);
      // Clear invalid session info
      clearSessionInfo();
      // Show appropriate view based on profile status
      if (!hasProfile) {
        showProfileSetup.value = true;
      }
    } finally {
      isRejoining.value = false;
    }
  }

  // Handle invite link join code
  if (joinCode) {
    // If already in a different session, leave it first
    if (store.inSession && store.sessionCode !== joinCode) {
      await store.leaveSession();
    }

    if (!store.inSession) {
      if (hasProfile) {
        autoJoinSession(joinCode);
      } else {
        pendingJoinCode.value = joinCode;
        showProfileSetup.value = true;
      }
    }
  }
});

onUnmounted(() => {
  mockApi.cleanup();
  clearInterval(checkRevealChange);
  // Remove auth event listeners
  window.removeEventListener('auth:unauthorized', handleUnauthorized);
  window.removeEventListener('auth:forbidden', handleForbidden);
});
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 1.5rem;
  font-size: 1.2rem;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.header {
  position: relative;
  text-align: center;
}

.header-buttons {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-end {
  padding: 0.5rem 1rem;
  background: rgba(244, 67, 54, 0.25);
  color: white;
  border: 1px solid rgba(244, 67, 54, 0.5);
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-end:hover {
  background: rgba(244, 67, 54, 0.4);
  border-color: rgba(244, 67, 54, 0.7);
}

.btn-leave {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-leave:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.leave-icon {
  display: none;
  width: 18px;
  height: 18px;
}

.leave-text {
  display: inline;
}

.waiting-state {
  padding: 2rem;
  text-align: center;
  animation: fadeIn 0.5s;
}

.waiting-message {
  font-size: 1.25rem;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin: 2rem 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .btn-end {
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;
  }

  .btn-leave {
    padding: 0.5rem;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    justify-content: center;
  }

  .leave-text {
    display: none;
  }

  .leave-icon {
    display: block;
    width: 18px;
    height: 18px;
  }

  .waiting-message {
    font-size: 1.1rem;
    margin: 1.5rem 0;
  }

  .loading-text {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .btn-end .end-text {
    display: none;
  }

  .btn-end::before {
    content: '⏹';
  }

  .btn-end {
    padding: 0.4rem;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-leave {
    padding: 0.4rem;
    width: 32px;
    height: 32px;
  }

  .leave-icon {
    width: 16px;
    height: 16px;
  }

  .waiting-state {
    padding: 1.5rem 1rem;
  }

  .waiting-message {
    font-size: 1rem;
    margin: 1rem 0;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
  }

  .loading-text {
    font-size: 0.9rem;
    margin-top: 1rem;
  }
}
</style>
