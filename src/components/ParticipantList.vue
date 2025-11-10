<template>
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
</template>

<script setup>
const props = defineProps({
  participants: {
    type: Array,
    required: true
  }
});
</script>

<style scoped>
.participants {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: fadeInUp 1s ease-out;
}

.participants h3 {
  color: #4facfe;
  margin-bottom: 15px;
  font-size: 1.3em;
}

.participant-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.participant {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background: #f5f5f5;
  border-radius: 25px;
  transition: all 0.3s ease;
}

.participant.voted {
  background: #e8f5e9;
  border: 2px solid #4caf50;
}

.participant-avatar {
  font-size: 1.5em;
}

.participant-name {
  font-weight: 600;
  color: #333;
}

.participant-status {
  font-size: 1.2em;
  margin-left: 5px;
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
