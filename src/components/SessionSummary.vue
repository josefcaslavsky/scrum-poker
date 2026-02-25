<template>
  <div class="session-summary">
    <!-- Trophy -->
    <div class="trophy-icon">🏆</div>

    <!-- Title -->
    <h1 class="summary-title">Session Complete!</h1>
    <p class="summary-subtitle">Session {{ sessionCode }} · {{ roundsPlayed }} rounds</p>

    <!-- Stats Row -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Rounds</div>
        <div class="stat-value">{{ animatedRounds }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total SP</div>
        <div class="stat-value">{{ animatedTotalSP }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg SP / Person</div>
        <div class="stat-value">{{ animatedAvgSP }}</div>
      </div>
    </div>

    <!-- Leaderboard -->
    <div class="leaderboard-container">
      <div
        v-for="(entry, index) in leaderboard"
        :key="entry.id"
        class="leaderboard-row"
        :class="entry.rowClass"
        :style="{ animationDelay: `${0.8 + index * 0.1}s` }"
      >
        <span class="rank">#{{ index + 1 }}</span>
        <span v-if="entry.badge" class="badge">{{ entry.badge }}</span>
        <span class="participant-emoji">{{ entry.emoji }}</span>
        <span class="participant-name">{{ entry.name }}</span>
        <span class="participant-sp">{{ entry.totalSP }} SP</span>
      </div>
    </div>

    <!-- Back to Lobby -->
    <button class="btn btn-primary btn-lobby" @click="$emit('close')">
      Back to Lobby
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  sessionCode: { type: String, required: true },
  roundsPlayed: { type: Number, required: true },
  participants: { type: Array, required: true },
  totalStoryPoints: { type: Number, required: true }
})

defineEmits(['close'])

const avgSPPerPerson = computed(() => {
  if (!props.participants || props.participants.length === 0) return 0
  return Math.round((props.totalStoryPoints / props.participants.length) * 10) / 10
})

// Animated counter values
const animatedRounds = ref(0)
const animatedTotalSP = ref(0)
const animatedAvgSP = ref(0)
const rafIds = []

const animateValue = (refVal, target, duration = 1200, decimals = 0) => {
  const start = 0
  const startTime = performance.now()

  const step = (now) => {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    // Ease out quad
    const eased = 1 - (1 - progress) * (1 - progress)
    const current = start + (target - start) * eased

    refVal.value = decimals > 0
      ? Math.round(current * Math.pow(10, decimals)) / Math.pow(10, decimals)
      : Math.round(current)

    if (progress < 1) {
      rafIds.push(requestAnimationFrame(step))
    }
  }

  rafIds.push(requestAnimationFrame(step))
}

// Leaderboard with rank highlighting
const leaderboard = computed(() => {
  if (!props.participants || props.participants.length === 0) return []

  const sorted = [...props.participants].sort((a, b) => (b.totalSP ?? 0) - (a.totalSP ?? 0))
  const lastIndex = sorted.length - 1

  return sorted.map((p, i) => {
    let rowClass = 'rank-middle'
    let badge = null

    if (i === 0) {
      rowClass = 'rank-gold'
      badge = '🏆'
    } else if (i === 1) {
      rowClass = 'rank-silver'
      badge = '🥈'
    } else if (i === 2) {
      rowClass = 'rank-bronze'
      badge = '🥉'
    }

    // Last place highlight (only beyond podium positions)
    if (i === lastIndex && lastIndex > 2) {
      rowClass = 'rank-last'
      badge = '🐢'
    }

    return { ...p, rowClass, badge }
  })
})

onMounted(() => {
  // Stagger the count-up animations
  setTimeout(() => animateValue(animatedRounds, props.roundsPlayed, 1000), 600)
  setTimeout(() => animateValue(animatedTotalSP, props.totalStoryPoints, 1200), 700)
  setTimeout(() => animateValue(animatedAvgSP, avgSPPerPerson.value, 1200, 1), 800)
})

onUnmounted(() => {
  rafIds.forEach(id => cancelAnimationFrame(id))
})
</script>

<style scoped>
.session-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  min-height: 100vh;
  gap: 1.5rem;
}

/* Trophy */
.trophy-icon {
  font-size: 5rem;
  animation: bounceIn 0.8s ease-out;
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(-40px);
  }
  50% {
    opacity: 1;
    transform: scale(1.1) translateY(0);
  }
  70% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}

/* Title */
.summary-title {
  font-size: 3rem;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  margin: 0;
  animation: fadeInDown 0.6s ease-out both;
  animation-delay: 0.2s;
}

.summary-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  animation: fadeInDown 0.6s ease-out both;
  animation-delay: 0.35s;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  width: 100%;
  max-width: 700px;
  animation: fadeInUp 0.8s ease-out both;
  animation-delay: 0.5s;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 25px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.stat-label {
  font-size: 0.875rem;
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

/* Leaderboard */
.leaderboard-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.leaderboard-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border-left: 4px solid transparent;
  animation: fadeInUp 0.6s ease-out both;
  transition: transform 0.2s;
}

.leaderboard-row:hover {
  transform: translateX(4px);
}

.rank {
  font-weight: 700;
  font-size: 1.1rem;
  color: #555;
  min-width: 2rem;
}

.badge {
  font-size: 1.3rem;
  min-width: 1.5rem;
  text-align: center;
}

.participant-emoji {
  font-size: 1.5rem;
}

.participant-name {
  font-weight: 600;
  color: #333;
  font-size: 1.1rem;
  flex: 1;
}

.participant-sp {
  font-weight: 700;
  font-size: 1.1rem;
  color: #4facfe;
  white-space: nowrap;
}

/* Rank styles */
.rank-gold {
  background: linear-gradient(135deg, #fff9e6 0%, #fff3cc 100%);
  border-left-color: #FFD700;
  animation-name: fadeInUp, goldShimmer;
  animation-duration: 0.6s, 3s;
  animation-timing-function: ease-out, ease-in-out;
  animation-fill-mode: both, none;
  animation-iteration-count: 1, infinite;
  animation-delay: 0.8s, 1.4s;
}

@keyframes goldShimmer {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(255, 215, 0, 0.2);
  }
  50% {
    box-shadow: 0 2px 16px rgba(255, 215, 0, 0.4);
  }
}

.rank-gold .rank {
  color: #b8860b;
}

.rank-gold .participant-sp {
  color: #b8860b;
}

.rank-silver {
  background: linear-gradient(135deg, #f8f8f8 0%, #efefef 100%);
  border-left-color: #C0C0C0;
}

.rank-silver .rank {
  color: #808080;
}

.rank-bronze {
  background: linear-gradient(135deg, #fdf3eb 0%, #f9e8d9 100%);
  border-left-color: #CD7F32;
}

.rank-bronze .rank {
  color: #8b5e3c;
}

.rank-last {
  background: linear-gradient(135deg, #e8f4fd 0%, #d6ecfa 100%);
  border-left-color: #4facfe;
}

.rank-last .participant-sp {
  color: #2193b0;
}

.rank-middle {
  background: #f5f5f5;
}

/* Back to Lobby Button */
.btn-lobby {
  margin-top: 0.5rem;
  animation: fadeInUp 0.6s ease-out both;
  animation-delay: 1.2s;
}

.btn {
  padding: 15px 30px;
  font-size: 1.1em;
  font-weight: 600;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.btn:active {
  transform: translateY(0);
}

.btn-primary {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .session-summary {
    padding: 1.5rem 1rem;
    gap: 1.25rem;
  }

  .trophy-icon {
    font-size: 4rem;
  }

  .summary-title {
    font-size: 2.25rem;
  }

  .summary-subtitle {
    font-size: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-card {
    padding: 18px;
  }

  .stat-value {
    font-size: 2em;
  }

  .leaderboard-container {
    padding: 1rem;
  }

  .leaderboard-row {
    padding: 0.75rem 1rem;
    gap: 0.5rem;
  }

  .participant-name {
    font-size: 1rem;
  }

  .participant-sp {
    font-size: 1rem;
  }

  .btn {
    padding: 12px 24px;
    font-size: 1em;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .session-summary {
    padding: 1rem 0.75rem;
    gap: 1rem;
  }

  .trophy-icon {
    font-size: 3.5rem;
  }

  .summary-title {
    font-size: 1.75rem;
  }

  .summary-subtitle {
    font-size: 0.9rem;
  }

  .stat-card {
    padding: 14px;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .stat-value {
    font-size: 1.75em;
  }

  .leaderboard-row {
    padding: 0.625rem 0.75rem;
    gap: 0.4rem;
  }

  .rank {
    font-size: 0.95rem;
    min-width: 1.75rem;
  }

  .badge {
    font-size: 1.1rem;
    min-width: 1.25rem;
  }

  .participant-emoji {
    font-size: 1.25rem;
  }

  .participant-name {
    font-size: 0.9rem;
  }

  .participant-sp {
    font-size: 0.9rem;
  }

  .btn {
    padding: 10px 20px;
    font-size: 0.95em;
    border-radius: 20px;
  }
}
</style>
