<template>
  <div class="profile-page">
    <div class="profile-container">
      <h1 class="page-title">Welcome to Scrum Poker!</h1>
      <p class="page-subtitle">Let's set up your profile first</p>

      <UserProfileSetup
        v-model:name="userName"
        v-model:emoji="userEmoji"
      />

      <button class="btn btn-primary btn-continue" @click="saveAndContinue">
        Continue
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import UserProfileSetup from './UserProfileSetup.vue';
import { saveUserPreferences, getUserPreferences } from '../composables/useLocalStorage';

const emit = defineEmits(['profile-saved']);

// Load existing preferences if any
const prefs = getUserPreferences();
const userName = ref(prefs.name);
const userEmoji = ref(prefs.emoji);

function saveAndContinue() {
  saveUserPreferences({
    name: userName.value,
    emoji: userEmoji.value
  });
  emit('profile-saved');
}
</script>

<style scoped>
.profile-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}

.profile-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  max-width: 600px;
  width: 100%;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  margin: 0;
  text-align: center;
}

.page-subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin: -1rem 0 0 0;
  text-align: center;
}

.btn-continue {
  width: 100%;
  max-width: 500px;
  padding: 1rem 2rem;
  font-size: 1.1rem;
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

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.btn:active {
  transform: translateY(0);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
</style>
