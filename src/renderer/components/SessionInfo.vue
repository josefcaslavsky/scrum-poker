<template>
  <div class="session-info">
    <span class="session-code">Session: {{ sessionCode }}</span>
    <span class="round-info">Round {{ currentRound }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  sessionCode: {
    type: String,
    required: true
  },
  currentRound: {
    type: Number,
    required: true
  }
});
</script>

<style scoped>
.session-info {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 15px;
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.8);
}

.session-code,
.round-info {
  background: rgba(255, 255, 255, 0.2);
  padding: 5px 15px;
  border-radius: 15px;
  font-weight: 600;
}
</style>
