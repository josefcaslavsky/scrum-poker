import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Make Pusher available globally for Laravel Echo
window.Pusher = Pusher

// Broadcasting configuration
const WEBSOCKET_HOST = 'localhost'
const WEBSOCKET_PORT = 8081
const APP_KEY = '3xmj8ojoufvlr6xuiaka'

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
    forceTLS: false,
    encrypted: false,
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

  console.log('[WebSocket] Subscribing to channel:', channelName)

  const channel = echo.channel(channelName)

  // Log channel subscription
  channel.subscription.bind('pusher:subscription_succeeded', () => {
    console.log('[WebSocket] Successfully subscribed to channel:', channelName)
  })

  channel.subscription.bind('pusher:subscription_error', (error) => {
    console.error('[WebSocket] Subscription error:', error)
  })

  // Participant joined
  if (callbacks.onParticipantJoined) {
    console.log('[WebSocket] Registering ParticipantJoined listener')
    channel.listen('ParticipantJoined', (data) => {
      console.log('[WebSocket] ParticipantJoined event received:', data)
      callbacks.onParticipantJoined(data)
    })
  }

  // Participant left
  if (callbacks.onParticipantLeft) {
    console.log('[WebSocket] Registering ParticipantLeft listener')
    channel.listen('ParticipantLeft', (data) => {
      console.log('[WebSocket] ParticipantLeft event received:', data)
      callbacks.onParticipantLeft(data)
    })
  }

  // Voting started
  if (callbacks.onVotingStarted) {
    console.log('[WebSocket] Registering VotingStarted listener')
    channel.listen('VotingStarted', (data) => {
      console.log('[WebSocket] VotingStarted event received:', data)
      callbacks.onVotingStarted(data)
    })
  }

  // Vote submitted
  if (callbacks.onVoteSubmitted) {
    console.log('[WebSocket] Registering VoteSubmitted listener')
    channel.listen('VoteSubmitted', (data) => {
      console.log('[WebSocket] VoteSubmitted event received:', data)
      callbacks.onVoteSubmitted(data)
    })
  }

  // Votes revealed
  if (callbacks.onVotesRevealed) {
    console.log('[WebSocket] Registering CardsRevealed listener')
    channel.listen('CardsRevealed', (data) => {
      console.log('[WebSocket] CardsRevealed event received:', data)
      callbacks.onVotesRevealed(data)
    })
  }

  // New round started
  if (callbacks.onNewRound) {
    console.log('[WebSocket] Registering NextRoundStarted listener')
    channel.listen('NextRoundStarted', (data) => {
      console.log('[WebSocket] NextRoundStarted event received:', data)
      callbacks.onNewRound(data)
    })
  }

  // Session ended (host left)
  if (callbacks.onSessionEnded) {
    console.log('[WebSocket] Registering SessionEnded listener')
    channel.listen('SessionEnded', (data) => {
      console.log('[WebSocket] SessionEnded event received:', data)
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
