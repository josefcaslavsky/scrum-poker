<template>
  <div class="app">
    <!-- Loading State (when rejoining session) -->
    <div v-if="isRejoining" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Reconnecting to session...</p>
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
        <h1 class="title">
          <span class="emoji">🃏</span>
          Scrum Poker
        </h1>
        <p class="subtitle">Let's estimate some stories!</p>
        <SessionInfo
          :session-code="store.sessionCode"
          :current-round="store.currentRound"
        />
        <button class="btn-leave" @click="handleLeaveSession">
          Leave Session
        </button>
      </div>

      <!-- Waiting State (when voting hasn't started) -->
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
      <div v-if="!store.isRevealed" class="card-grid">
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
      <ParticipantList :participants="store.participants" />

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
import { ref, onMounted, onUnmounted } from 'vue';
import { useSessionStore } from './stores/sessionStore';
import { useMockApi } from './composables/useMockApi';
import { getUserPreferences, getSessionInfo, clearSessionInfo } from './composables/useLocalStorage';
import confetti from 'canvas-confetti';

// Import components
import ProfileSetupPage from './components/ProfileSetupPage.vue';
import SessionLanding from './components/SessionLanding.vue';
import PokerCard from './components/PokerCard.vue';
import VotingTimer from './components/VotingTimer.vue';
import ParticipantList from './components/ParticipantList.vue';
import ResultsView from './components/ResultsView.vue';
import SessionInfo from './components/SessionInfo.vue';

const store = useSessionStore();
const mockApi = useMockApi();

// Check if user has completed profile setup
const hasProfile = localStorage.getItem('userPreferences') !== null;
const showProfileSetup = ref(!hasProfile);
const isRejoining = ref(false);

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

const handleProfileSaved = () => {
  showProfileSetup.value = false;
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
  await store.startVoting();
};

const handleForceReveal = async () => {
  await store.revealCards();
  triggerConfetti();
};

const handleNewRound = async () => {
  await store.startNewRound();
};

const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
};

// Watch for automatic reveals to trigger confetti
let previousRevealed = false;
const checkRevealChange = setInterval(() => {
  if (store.isRevealed && !previousRevealed) {
    triggerConfetti();
  }
  previousRevealed = store.isRevealed;
}, 100);

onMounted(async () => {
  // Check for saved session and attempt to rejoin
  const savedSession = getSessionInfo();

  if (savedSession && !store.inSession) {
    console.log('[App] Found saved session, attempting to rejoin:', savedSession);
    isRejoining.value = true;

    try {
      await store.rejoinSession(savedSession);
      console.log('[App] Successfully rejoined session');
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
});

onUnmounted(() => {
  mockApi.cleanup();
  clearInterval(checkRevealChange);
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
}

.btn-leave {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-leave:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
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
</style>
