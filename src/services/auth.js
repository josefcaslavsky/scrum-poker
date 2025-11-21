/**
 * Authentication Service
 * Manages session authentication tokens
 */

const TOKEN_KEY = 'auth_token'

class AuthService {
  constructor() {
    this.token = null
  }

  /**
   * Store the authentication token
   * @param {string} token - The authentication token
   */
  setToken(token) {
    this.token = token
    localStorage.setItem(TOKEN_KEY, token)
  }

  /**
   * Retrieve the authentication token
   * @returns {string|null} The authentication token or null
   */
  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem(TOKEN_KEY)
    }
    return this.token
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if token exists
   */
  isAuthenticated() {
    return !!this.getToken()
  }

  /**
   * Clear the authentication token
   */
  clearToken() {
    this.token = null
    localStorage.removeItem(TOKEN_KEY)
  }
}

// Export a singleton instance
export default new AuthService()
