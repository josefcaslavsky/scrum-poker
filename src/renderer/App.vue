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
        <div class="session-info">
          <span class="session-code">Session: {{ store.sessionCode }}</span>
          <span class="round-info">Round {{ store.currentRound }}</span>
        </div>
      </div>

      <!-- Timer (shown only during voting) -->
      <div v-if="store.isVoting && !store.isRevealed" class="timer-section">
        <div class="timer-display">
          <span class="timer-label">Time remaining:</span>
          <span class="timer-value" :style="{ color: store.timerColor }">
            {{ store.timerSeconds }}s
          </span>
        </div>
        <div class="timer-bar">
          <div
            class="timer-progress"
            :style="{
              width: store.timerProgress + '%',
              backgroundColor: store.timerColor
            }"
          ></div>
        </div>
        <div class="voting-status">
          {{ store.votedCount }} / {{ store.totalCount }} voted
        </div>
      </div>

      <!-- Card Grid -->
      <div v-if="!store.isRevealed" class="card-grid">
        <div
          v-for="card in cards"
          :key="card.value"
          class="poker-card"
          :class="{
            selected: store.userCard === card.value,
            disabled: !store.isVoting
          }"
          @click="handleCardClick(card.value)"
        >
          <div class="card-inner">
            <div class="card-front">
              <span class="card-value">{{ card.label }}</span>
            </div>
            <div class="card-back">
              <span class="card-pattern">🃏</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Results View (shown after reveal) -->
      <div v-if="store.isRevealed" class="results-section">
        <h2 class="results-title">Results 🎯</h2>

        <div class="results-cards">
          <div
            v-for="participant in store.participants"
            :key="participant.id"
            class="result-card"
          >
            <div class="result-participant">
              <span class="result-emoji">{{ participant.emoji }}</span>
              <span class="result-name">{{ participant.name }}</span>
            </div>
            <div class="result-vote">
              {{ getCardLabel(participant.vote) }}
            </div>
          </div>
        </div>

        <div class="results-stats">
          <div class="stat-card">
            <div class="stat-label">Average</div>
            <div class="stat-value">{{ store.averageVote || 'N/A' }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Consensus</div>
            <div class="stat-value">{{ store.consensus }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Most Voted</div>
            <div class="stat-value">{{ getCardLabel(store.mostVoted) }}</div>
          </div>
        </div>
      </div>

      <!-- Participants -->
      <div class="participants">
        <h3>Participants ({{ store.participants.length }})</h3>
        <div class="participant-list">
          <div
            v-for="participant in store.participants"
            :key="participant.id"
            class="participant"
            :class="{ voted: participant.hasVoted }"
          >
            <div class="participant-avatar">{{ participant.emoji }}</div>
            <div class="participant-name">{{ participant.name }}</div>
            <div class="participant-status">
              {{ participant.hasVoted ? '✓' : '⏱' }}
            </div>
          </div>
        </div>
      </div>

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

const getCardLabel = (value) => {
  if (value === null) return 'N/A';
  const card = cards.find(c => c.value === value);
  return card ? card.label : 'N/A';
};

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
