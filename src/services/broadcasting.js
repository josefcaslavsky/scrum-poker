import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Make Pusher available globally for Laravel Echo
window.Pusher = Pusher

// Broadcasting configuration
const WEBSOCKET_HOST = import.meta.env.VITE_REVERB_HOST
const WEBSOCKET_PORT = import.meta.env.VITE_REVERB_PORT
const APP_KEY = import.meta.env.VITE_REVERB_APP_KEY
const SCHEME = import.meta.env.VITE_REVERB_SCHEME || 'https'

if (!WEBSOCKET_HOST || !WEBSOCKET_PORT || !APP_KEY) {
  console.error('Missing required environment variables: VITE_REVERB_HOST, VITE_REVERB_PORT, and/or VITE_REVERB_APP_KEY')
}

/**
 * Initialize Laravel Echo instance
 */
export function createEchoInstance() {
  return new Echo({
    broadcaster: 'pusher',
    key: APP_KEY,
    wsHost: WEBSOCKET_HOST,
    wsPort: WEBSOCKET_PORT,
    wssPort: WEBSOCKET_PORT,
    forceTLS: SCHEME === 'https',
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
    cluster: 'mt1' // Required by Pusher, but not used by Laravel WebSockets
  })
}

// Global Echo instance
let echoInstance = null

/**
 * Get or create Echo instance
 */
export function getEcho() {
  if (!echoInstance) {
    echoInstance = createEchoInstance()
  }
  return echoInstance
}

/**
 * Subscribe to session channel
 * @param {string} sessionCode - The session code (e.g., 'ABC123')
 * @param {object} callbacks - Event callbacks
 */
export function subscribeToSession(sessionCode, callbacks = {}) {
  const echo = getEcho()
  const channelName = `session.${sessionCode}`

  const channel = echo.channel(channelName)

  channel.subscription.bind('pusher:subscription_error', (error) => {
    console.error('[WebSocket] Subscription error:', error)
  })

  // Participant joined
  if (callbacks.onParticipantJoined) {
    channel.listen('ParticipantJoined', (data) => {
      callbacks.onParticipantJoined(data)
    })
  }

  // Participant left
  if (callbacks.onParticipantLeft) {
    channel.listen('ParticipantLeft', (data) => {
      callbacks.onParticipantLeft(data)
    })
  }

  // Participant removed by host
  if (callbacks.onParticipantRemoved) {
    channel.listen('ParticipantRemoved', (data) => {
      callbacks.onParticipantRemoved(data)
    })
  }

  // Voting started
  if (callbacks.onVotingStarted) {
    channel.listen('VotingStarted', (data) => {
      callbacks.onVotingStarted(data)
    })
  }

  // Vote submitted
  if (callbacks.onVoteSubmitted) {
    channel.listen('VoteSubmitted', (data) => {
      callbacks.onVoteSubmitted(data)
    })
  }

  // Votes revealed
  if (callbacks.onVotesRevealed) {
    channel.listen('CardsRevealed', (data) => {
      callbacks.onVotesRevealed(data)
    })
  }

  // New round started
  if (callbacks.onNewRound) {
    channel.listen('NextRoundStarted', (data) => {
      callbacks.onNewRound(data)
    })
  }

  // Session ended (host left)
  if (callbacks.onSessionEnded) {
    channel.listen('SessionEnded', (data) => {
      callbacks.onSessionEnded(data)
    })
  }

  return channel
}

/**
 * Unsubscribe from session channel
 */
export function unsubscribeFromSession(sessionCode) {
  const echo = getEcho()
  const channelName = `session.${sessionCode}`
  echo.leave(channelName)
}

/**
 * Disconnect Echo
 */
export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect()
    echoInstance = null
  }
}

export default {
  getEcho,
  subscribeToSession,
  unsubscribeFromSession,
  disconnectEcho
}
