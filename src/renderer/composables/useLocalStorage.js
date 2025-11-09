import { ref, watch } from 'vue'

/**
 * Composable for managing localStorage with reactive updates
 */
export function useLocalStorage(key, defaultValue) {
  // Try to load from localStorage
  const storedValue = localStorage.getItem(key)
  const value = ref(storedValue ? JSON.parse(storedValue) : defaultValue)

  // Watch for changes and sync to localStorage
  watch(
    value,
    (newValue) => {
      localStorage.setItem(key, JSON.stringify(newValue))
    },
    { deep: true }
  )

  return value
}

/**
 * Get user preferences from localStorage with defaults
 */
export function getUserPreferences() {
  const defaultPrefs = {
    name: 'Anonymous',
    emoji: '👤'
  }

  const storedPrefs = localStorage.getItem('userPreferences')
  return storedPrefs ? JSON.parse(storedPrefs) : defaultPrefs
}

/**
 * Save user preferences to localStorage
 */
export function saveUserPreferences(preferences) {
  localStorage.setItem('userPreferences', JSON.stringify(preferences))
}

/**
 * Get saved session info from localStorage
 */
export function getSessionInfo() {
  const storedSession = localStorage.getItem('sessionInfo')
  return storedSession ? JSON.parse(storedSession) : null
}

/**
 * Save session info to localStorage
 */
export function saveSessionInfo(sessionCode, participantId, isFacilitator) {
  const sessionInfo = {
    sessionCode,
    participantId,
    isFacilitator
  }
  localStorage.setItem('sessionInfo', JSON.stringify(sessionInfo))
}

/**
 * Clear session info from localStorage
 */
export function clearSessionInfo() {
  localStorage.removeItem('sessionInfo')
}
