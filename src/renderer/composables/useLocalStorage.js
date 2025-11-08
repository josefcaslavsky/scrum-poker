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
