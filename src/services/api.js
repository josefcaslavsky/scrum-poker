import axios from 'axios'
import authService from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL
const API_KEY = import.meta.env.VITE_API_KEY

if (!API_BASE_URL || !API_KEY) {
  console.error('Missing required environment variables: VITE_API_URL and/or VITE_API_KEY')
}

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Add request interceptor for auth
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getToken()
    const url = config.url || ''

    // Add API key to create and join endpoints
    if ((url === '/sessions' && config.method === 'post') ||
        (url.includes('/join') && config.method === 'post')) {
      config.headers['X-API-Key'] = API_KEY
    }

    // Add Bearer token to all other authenticated endpoints
    if (token &&
        !(url === '/sessions' && config.method === 'post') &&
        !url.includes('/join')) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)

    // Handle 401 - Unauthorized (token expired/invalid)
    if (error.response?.status === 401) {
      authService.clearToken()
      // Dispatch event for components to handle redirect
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }

    // Handle 403 - Forbidden (not authorized for action)
    if (error.response?.status === 403) {
      window.dispatchEvent(new CustomEvent('auth:forbidden', {
        detail: { message: error.response?.data?.error || 'Action not allowed' }
      }))
    }

    return Promise.reject(error)
  }
)

/**
 * Session API
 */
export const sessionApi = {
  /**
   * Create a new session
   */
  create(data) {
    return apiClient.post('/sessions', data)
  },

  /**
   * Join an existing session
   */
  join(sessionCode, data) {
    return apiClient.post(`/sessions/${sessionCode}/join`, data)
  },

  /**
   * Get session details
   */
  get(sessionCode) {
    return apiClient.get(`/sessions/${sessionCode}`)
  },

  /**
   * Leave session
   */
  leave(sessionCode) {
    return apiClient.delete(`/sessions/${sessionCode}/leave`)
  },

  /**
   * Start voting round
   */
  startVoting(sessionCode) {
    return apiClient.post(`/sessions/${sessionCode}/start`)
  },

  /**
   * Submit vote
   */
  vote(sessionCode, data) {
    return apiClient.post(`/sessions/${sessionCode}/vote`, data)
  },

  /**
   * Reveal votes
   */
  reveal(sessionCode) {
    return apiClient.post(`/sessions/${sessionCode}/reveal`)
  },

  /**
   * Start new round
   */
  newRound(sessionCode) {
    return apiClient.post(`/sessions/${sessionCode}/next-round`)
  },

  /**
   * Remove a participant from session (host only)
   */
  removeParticipant(sessionCode, participantId) {
    return apiClient.delete(`/sessions/${sessionCode}/participants/${participantId}`)
  }
}

export default apiClient
