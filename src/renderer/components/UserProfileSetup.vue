<template>
  <div class="profile-setup">
    <h2>Your Profile</h2>

    <div class="profile-form">
      <div class="form-group">
        <label for="username">Name</label>
        <input
          id="username"
          v-model="localName"
          type="text"
          placeholder="Enter your name"
          maxlength="20"
          @input="$emit('update:name', localName)"
        />
      </div>

      <div class="form-group">
        <label>Choose your emoji</label>
        <div class="emoji-grid">
          <button
            v-for="emoji in availableEmojis"
            :key="emoji"
            type="button"
            class="emoji-btn"
            :class="{ selected: localEmoji === emoji }"
            @click="selectEmoji(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </div>

      <div class="profile-preview">
        <span class="preview-emoji">{{ localEmoji }}</span>
        <span class="preview-name">{{ localName || 'Anonymous' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  name: {
    type: String,
    default: 'Anonymous'
  },
  emoji: {
    type: String,
    default: '👤'
  }
})

const emit = defineEmits(['update:name', 'update:emoji'])

const localName = ref(props.name)
const localEmoji = ref(props.emoji)

const availableEmojis = [
  '👤', '😀', '😎', '🤓', '🚀',
  '💻', '🎯', '⚡', '🔥', '✨',
  '🎨', '🎭', '🎪', '🦄', '🐱',
  '🐶', '🦊', '🐼', '🐨', '🦁'
]

function selectEmoji(emoji) {
  localEmoji.value = emoji
  emit('update:emoji', emoji)
}
</script>

<style scoped>
.profile-setup {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

h2 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
  text-align: center;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

input {
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #2193b0;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
}

.emoji-btn {
  background: #f5f5f5;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 0.5rem;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  min-width: 0;
  overflow: hidden;
}

.emoji-btn:hover {
  background: #e0e0e0;
  transform: scale(1.1);
}

.emoji-btn.selected {
  border-color: #2193b0;
  background: #e3f2fd;
}

.profile-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin-top: 0.5rem;
}

.preview-emoji {
  font-size: 2.5rem;
}

.preview-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}
</style>
