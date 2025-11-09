import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Add request interceptor for auth token if needed
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
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
  leave(sessionCode, participantId) {
    return apiClient.delete(`/sessions/${sessionCode}/participants/${participantId}`)
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
  }
}

export default apiClient
