/**
 * Utilities for session invite links via URL query params
 */

/**
 * Read and validate the ?join= query param from the current URL.
 * Returns the 6-char alphanumeric session code, or null.
 */
export function getSessionCodeFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('join')
  if (code && /^[A-Za-z0-9]{6}$/.test(code)) {
    return code.toUpperCase()
  }
  return null
}

/**
 * Build a full invite URL for the given session code.
 */
export function buildSessionLink(sessionCode) {
  const url = new URL(window.location.origin + window.location.pathname)
  url.searchParams.set('join', sessionCode)
  return url.toString()
}

/**
 * Remove the ?join= param from the browser URL bar without reloading
 * or creating a back-button history entry.
 */
export function clearSessionCodeFromUrl() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('join')) return
  url.searchParams.delete('join')
  window.history.replaceState(window.history.state, '', url.toString())
}
