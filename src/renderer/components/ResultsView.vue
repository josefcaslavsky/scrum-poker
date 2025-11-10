<template>
  <div class="results-section">
    <h2 class="results-title">Results 🎯</h2>

    <!-- Show message when no vote data available (late join scenario) -->
    <div v-if="!hasVoteData" class="no-results-message">
      <p>Previous round results are not available.</p>
      <p class="sub-message">Waiting for the next round to start...</p>
    </div>

    <!-- Show results when vote data is available -->
    <template v-else>
      <div class="results-cards">
        <div
          v-for="participant in participants"
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
          <div class="stat-value">{{ averageVote || 'N/A' }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Consensus</div>
          <div class="stat-value">{{ consensus }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Most Voted</div>
          <div class="stat-value">{{ getCardLabel(mostVoted) }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  participants: {
    type: Array,
    required: true
  },
  averageVote: {
    type: [String, Number],
    default: null
  },
  consensus: {
    type: String,
    default: 'N/A'
  },
  mostVoted: {
    type: Number,
    default: null
  }
});

// Compute hasVoteData locally based on participants
const hasVoteData = computed(() => {
  return props.participants.some(p => p.vote !== null);
});

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
</script>

<style scoped>
.results-section {
  animation: fadeInUp 0.8s ease-out;
  margin-bottom: 40px;
}

.results-title {
  text-align: center;
  color: white;
  font-size: 2.5em;
  margin-bottom: 30px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.no-results-message {
  text-align: center;
  padding: 3rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  margin: 2rem auto;
  max-width: 600px;
}

.no-results-message p {
  font-size: 1.5em;
  color: #333;
  margin: 0.5rem 0;
}

.no-results-message .sub-message {
  font-size: 1.2em;
  color: #666;
  margin-top: 1rem;
}

.results-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.result-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.result-card:hover {
  transform: translateY(-5px);
}

.result-participant {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.result-emoji {
  font-size: 2em;
}

.result-name {
  font-weight: 600;
  color: #333;
  font-size: 1.1em;
}

.result-vote {
  text-align: center;
  font-size: 3em;
  font-weight: bold;
  color: #4facfe;
}

.results-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 25px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.stat-label {
  font-size: 1em;
  color: #666;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.stat-value {
  font-size: 2.5em;
  font-weight: bold;
  color: #4facfe;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
