<template>
  <div class="app">
    <div class="container">
      <div class="header">
        <h1 class="title">
          <span class="emoji">🃏</span>
          Scrum Poker
        </h1>
        <p class="subtitle">Let's estimate some stories!</p>
      </div>

      <div class="card-grid">
        <div
          v-for="card in cards"
          :key="card.value"
          class="poker-card"
          :class="{ selected: selectedCard === card.value }"
          @click="selectCard(card.value)"
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

      <div class="participants">
        <h3>Participants ({{ participants.length }})</h3>
        <div class="participant-list">
          <div
            v-for="participant in participants"
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

      <div class="actions">
        <button class="btn btn-primary" @click="startVoting">
          Start New Round
        </button>
        <button class="btn btn-secondary" @click="revealCards">
          Reveal Cards
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

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

const selectedCard = ref(null);

const participants = ref([
  { id: 1, name: 'You', emoji: '👤', hasVoted: false },
  { id: 2, name: 'Alice', emoji: '👩', hasVoted: false },
  { id: 3, name: 'Bob', emoji: '👨', hasVoted: false },
  { id: 4, name: 'Charlie', emoji: '🧑', hasVoted: false },
  { id: 5, name: 'Diana', emoji: '👱‍♀️', hasVoted: false }
]);

const selectCard = (value) => {
  selectedCard.value = value;
  participants.value[0].hasVoted = true;
};

const startVoting = () => {
  selectedCard.value = null;
  participants.value.forEach(p => p.hasVoted = false);
};

const revealCards = () => {
  alert('Cards revealed! (This will show results in next phase)');
};
</script>
