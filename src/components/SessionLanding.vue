<template>
  <div class="session-landing">
    <h1 class="app-title">Scrum Poker</h1>

    <div class="user-info">
      <span class="user-avatar">{{ userEmoji }}</span>
      <span class="user-name">{{ userName }}</span>
      <button class="btn-edit-profile" @click="$emit('edit-profile')" title="Edit profile">
        ⚙️
      </button>
    </div>

    <div class="session-actions">
      <div class="action-card">
        <h3>Start New Session</h3>
        <p>Create a new planning poker session and invite your team</p>
        <button class="btn btn-primary" @click="createSession">
          Create Session
        </button>
      </div>

      <div class="divider">
        <span>OR</span>
      </div>

      <div class="action-card">
        <h3>Join Existing Session</h3>
        <p>Enter a session code to join an ongoing session</p>
        <div class="join-form">
          <input
            v-model="sessionIdInput"
            type="text"
            placeholder="Enter session code"
            maxlength="6"
            @keyup.enter="joinSession"
          />
          <button
            class="btn btn-secondary"
            :disabled="!sessionIdInput.trim()"
            @click="joinSession"
          >
            Join Session
          </button>
        </div>
        <p v-if="joinError" class="error-message">{{ joinError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUserPreferences } from '../composables/useLocalStorage'

const emit = defineEmits(['create-session', 'join-session', 'edit-profile'])

// Load user preferences from localStorage
const userName = ref('')
const userEmoji = ref('')
const sessionIdInput = ref('')
const joinError = ref('')

// Load preferences on mount
onMounted(() => {
  const prefs = getUserPreferences()
  userName.value = prefs.name
  userEmoji.value = prefs.emoji
})

function createSession() {
  emit('create-session', {
    name: userName.value || 'Anonymous',
    emoji: userEmoji.value
  })
}

function joinSession() {
  const sessionId = sessionIdInput.value.trim()

  if (!sessionId) {
    joinError.value = 'Please enter a session code'
    return
  }

  joinError.value = ''
  emit('join-session', {
    sessionId,
    name: userName.value || 'Anonymous',
    emoji: userEmoji.value
  })
}
</script>

<style scoped>
.session-landing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  min-height: 100vh;
  justify-content: center;
}

.app-title {
  font-size: 3.5rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  margin: 0;
  text-align: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem 1.5rem;
  border-radius: 50px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.user-avatar {
  font-size: 2rem;
}

.user-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
}

.btn-edit-profile {
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s;
}

.btn-edit-profile:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: scale(1.1);
}

.session-actions {
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 1100px;
  width: 100%;
}

.action-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  flex: 1;
  min-width: 300px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-card h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.action-card p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.join-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.join-form input {
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  text-transform: uppercase;
  transition: border-color 0.3s;
}

.join-form input:focus {
  outline: none;
  border-color: #2193b0;
}

.btn {
  padding: 0.875rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-secondary {
  background: linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%);
  color: white;
}

.error-message {
  color: #e74c3c;
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
}

@media (max-width: 768px) {
  .session-landing {
    padding: 1rem 1rem;
    gap: 1.25rem;
    min-height: 100vh;
    justify-content: flex-start;
    padding-top: 2rem;
  }

  .app-title {
    font-size: 2.5rem;
    margin-bottom: 0;
  }

  .user-info {
    padding: 0.75rem 1.25rem;
    gap: 0.75rem;
  }

  .user-avatar {
    font-size: 1.5rem;
  }

  .user-name {
    font-size: 1rem;
  }

  .btn-edit-profile {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .session-actions {
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    padding: 0;
  }

  .action-card {
    min-width: 100%;
    max-width: 100%;
    padding: 1.5rem;
    gap: 0.875rem;
  }

  .action-card h3 {
    font-size: 1.25rem;
  }

  .action-card p {
    font-size: 0.85rem;
  }

  .divider {
    width: 100%;
    font-size: 1rem;
    margin: 0;
    text-align: center;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .session-landing {
    padding: 0.75rem 0.75rem;
    gap: 1rem;
    padding-top: 1.5rem;
  }

  .app-title {
    font-size: 2rem;
  }

  .user-info {
    padding: 0.625rem 1rem;
    gap: 0.625rem;
  }

  .user-avatar {
    font-size: 1.25rem;
  }

  .user-name {
    font-size: 0.9rem;
  }

  .action-card {
    padding: 1.25rem;
    gap: 0.75rem;
  }

  .action-card h3 {
    font-size: 1.125rem;
  }

  .action-card p {
    font-size: 0.8rem;
    line-height: 1.4;
  }

  .join-form input {
    font-size: 0.9rem;
    padding: 0.625rem 0.875rem;
  }

  .btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.9rem;
  }

  .divider {
    font-size: 0.9rem;
    text-align: center;
  }
}
</style>
