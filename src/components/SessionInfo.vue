<template>
  <div class="session-info">
    <div class="session-code-wrapper">
      <span class="session-code">Session: {{ sessionCode }}</span>
      <button class="copy-btn" @click="copySessionCode" :title="copyTooltip">
        {{ copyButtonText }}
      </button>
      <button class="copy-btn" @click="shareSessionLink" title="Share invite link">
        {{ shareBtnText }}
      </button>
    </div>
    <span class="round-info">Round {{ currentRound }}</span>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { buildSessionLink } from '../composables/useSessionLink';

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

const copyButtonText = ref('📋');
const copyTooltip = ref('Copy session code');
const shareBtnText = ref('🔗');

const copySessionCode = async () => {
  try {
    await navigator.clipboard.writeText(props.sessionCode);
    copyButtonText.value = '✓';
    copyTooltip.value = 'Copied!';
    setTimeout(() => {
      copyButtonText.value = '📋';
      copyTooltip.value = 'Copy session code';
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

const shareSessionLink = async () => {
  const link = buildSessionLink(props.sessionCode);

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Join Scrum Poker', url: link });
      return;
    } catch (err) {
      // User cancelled or share failed — fall through to clipboard
      if (err.name === 'AbortError') return;
    }
  }

  try {
    await navigator.clipboard.writeText(link);
    shareBtnText.value = '✓';
    setTimeout(() => { shareBtnText.value = '🔗'; }, 2000);
  } catch (err) {
    console.error('Failed to copy link:', err);
  }
};
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

.session-code-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  padding: 5px 15px;
  border-radius: 15px;
}

.session-code {
  font-weight: 600;
}

.round-info {
  background: rgba(255, 255, 255, 0.2);
  padding: 5px 15px;
  border-radius: 15px;
  font-weight: 600;
}

.copy-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.1em;
  padding: 0;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.copy-btn:hover {
  opacity: 1;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .session-info {
    gap: 15px;
    font-size: 0.85em;
    flex-wrap: wrap;
  }

  .session-code-wrapper,
  .round-info {
    padding: 4px 12px;
    font-size: 0.95em;
  }
}

@media (max-width: 480px) {
  .session-info {
    gap: 10px;
    font-size: 0.8em;
    margin-top: 12px;
  }

  .session-code-wrapper,
  .round-info {
    padding: 4px 10px;
    font-size: 0.9em;
  }

  .copy-btn {
    font-size: 1em;
  }
}
</style>
