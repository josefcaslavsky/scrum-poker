<template>
  <div class="app">
    <div class="container">
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

      <!-- Actions -->
      <div class="actions">
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
import { onMounted, onUnmounted } from 'vue';
import { useSessionStore } from './stores/sessionStore';
import { useMockApi } from './composables/useMockApi';
import confetti from 'canvas-confetti';

// Import components
import PokerCard from './components/PokerCard.vue';
import VotingTimer from './components/VotingTimer.vue';
import ParticipantList from './components/ParticipantList.vue';
import ResultsView from './components/ResultsView.vue';
import SessionInfo from './components/SessionInfo.vue';

const store = useSessionStore();
const mockApi = useMockApi();

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

const handleCardClick = (value) => {
  if (!store.isVoting || store.isRevealed) return;
  store.selectCard(value);
};

const handleStartVoting = () => {
  mockApi.startVotingRound();
};

const handleForceReveal = () => {
  mockApi.forceReveal();
  triggerConfetti();
};

const handleNewRound = () => {
  mockApi.startNewRound();
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

onMounted(() => {
  // App is ready
});

onUnmounted(() => {
  mockApi.cleanup();
  clearInterval(checkRevealChange);
});
</script>
