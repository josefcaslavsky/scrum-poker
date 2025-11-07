<template>
  <div class="timer-section">
    <div class="timer-display">
      <span class="timer-label">Time remaining:</span>
      <span class="timer-value" :style="{ color: timerColor }">
        {{ seconds }}s
      </span>
    </div>
    <div class="timer-bar">
      <div
        class="timer-progress"
        :style="{
          width: progress + '%',
          backgroundColor: timerColor
        }"
      ></div>
    </div>
    <div class="voting-status">
      {{ votedCount }} / {{ totalCount }} voted
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  seconds: {
    type: Number,
    required: true
  },
  progress: {
    type: Number,
    required: true
  },
  timerColor: {
    type: String,
    required: true
  },
  votedCount: {
    type: Number,
    required: true
  },
  totalCount: {
    type: Number,
    required: true
  }
});
</script>

<style scoped>
.timer-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: fadeInUp 0.6s ease-out;
}

.timer-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 1.5em;
}

.timer-label {
  color: #333;
  font-weight: 600;
}

.timer-value {
  font-size: 1.8em;
  font-weight: bold;
  transition: color 0.3s ease;
}

.timer-bar {
  width: 100%;
  height: 12px;
  background: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 10px;
}

.timer-progress {
  height: 100%;
  transition: width 1s linear, background-color 0.3s ease;
  border-radius: 6px;
}

.voting-status {
  text-align: center;
  font-size: 1.1em;
  color: #666;
  font-weight: 600;
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
