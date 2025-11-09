# API Integration Guide

## Overview

The Scrum Poker app has been integrated with a Laravel backend API for real-time collaborative planning poker sessions.

## Configuration

### API Endpoints

- **REST API Base URL**: `http://localhost:8000/api`
- **WebSocket URL**: `ws://localhost:8081`
- **App Key**: `3xmj8ojoufvlr6xuiaka`
- **Channel Format**: `session.{code}` (e.g., `session.ABC123`)

These can be modified in:
- REST API: `/src/renderer/services/api.js`
- WebSocket: `/src/renderer/services/broadcasting.js`

## Architecture

### Services

#### 1. API Service (`/src/renderer/services/api.js`)

Handles all HTTP REST API calls using Axios.

**Available Methods:**
- `sessionApi.create(data)` - Create a new session
- `sessionApi.join(sessionCode, data)` - Join an existing session
- `sessionApi.get(sessionCode)` - Get session details
- `sessionApi.leave(sessionCode, userId)` - Leave a session
- `sessionApi.startVoting(sessionCode)` - Start a voting round (facilitator only)
- `sessionApi.vote(sessionCode, data)` - Submit a vote
- `sessionApi.reveal(sessionCode)` - Reveal all votes (facilitator only)
- `sessionApi.newRound(sessionCode)` - Start a new round (facilitator only)

#### 2. Broadcasting Service (`/src/renderer/services/broadcasting.js`)

Handles real-time WebSocket connections using Laravel Echo and Pusher.

**Available Functions:**
- `getEcho()` - Get or create Echo instance
- `subscribeToSession(sessionCode, callbacks)` - Subscribe to session events
- `unsubscribeFromSession(sessionCode)` - Unsubscribe from session
- `disconnectEcho()` - Disconnect WebSocket

**WebSocket Events:**
- `participant.joined` - When a participant joins
- `participant.left` - When a participant leaves
- `voting.started` - When facilitator starts voting
- `vote.submitted` - When a participant submits a vote
- `votes.revealed` - When facilitator reveals votes
- `round.started` - When a new round begins

### State Management

The session store (`/src/renderer/stores/sessionStore.js`) has been updated to:

1. Call API endpoints for all actions (create, join, vote, etc.)
2. Subscribe to WebSocket events when joining/creating a session
3. Update local state based on WebSocket events for real-time sync
4. Handle optimistic UI updates (update locally first, then sync via WebSocket)

## Expected API Response Format

### Create Session Response

```json
{
  "data": {
    "code": "ABC123",
    "current_round": 1,
    "is_voting": false,
    "is_revealed": false,
    "user": {
      "id": 1,
      "name": "John Doe",
      "emoji": "🚀"
    },
    "participants": [
      {
        "id": 1,
        "name": "John Doe",
        "emoji": "🚀"
      }
    ]
  }
}
```

### Join Session Response

```json
{
  "data": {
    "code": "ABC123",
    "current_round": 1,
    "is_voting": true,
    "is_revealed": false,
    "user": {
      "id": 2,
      "name": "Jane Smith",
      "emoji": "🎯",
      "is_facilitator": false
    },
    "participants": [
      {
        "id": 1,
        "name": "John Doe",
        "emoji": "🚀",
        "has_voted": false,
        "vote": null
      },
      {
        "id": 2,
        "name": "Jane Smith",
        "emoji": "🎯",
        "has_voted": false,
        "vote": null
      }
    ]
  }
}
```

### Votes Revealed Event

```json
{
  "votes": [
    {
      "user_id": 1,
      "vote": 5
    },
    {
      "user_id": 2,
      "vote": 8
    }
  ]
}
```

## Development Notes

### Testing with Mock API

The mock API (`/src/renderer/composables/useMockApi.js`) is still available for testing without a backend. To switch between real and mock API:

1. **Using Real API**: The app now uses real API by default
2. **Using Mock API**: Update `App.vue` to use `useMockApi()` instead of calling store actions directly

### WebSocket Connection

The WebSocket connection is established when:
- A user creates a new session
- A user joins an existing session

The connection is closed when:
- A user leaves the session
- The app is closed

### Error Handling

API errors are logged to console and the UI is reverted to previous state. Consider adding user-facing error notifications for:
- Network failures
- Invalid session codes
- API errors

## Testing

Before testing, ensure:
1. Laravel backend is running on `http://localhost:8000`
2. WebSocket server is running on `ws://localhost:8081`
3. Database migrations are run
4. CORS is properly configured on the backend

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if WebSocket server is running
   - Verify port 8081 is not blocked by firewall
   - Check browser console for connection errors

2. **API Calls Failing**
   - Verify backend is running on port 8000
   - Check CORS configuration
   - Verify API endpoints match backend routes

3. **Participants Not Syncing**
   - Check WebSocket connection status
   - Verify channel name format matches backend
   - Check browser console for event logs

## Next Steps

Consider implementing:
- Reconnection logic for WebSocket
- Loading states for API calls
- User-facing error notifications
- Session persistence (rejoin after refresh)
- Authentication/authorization
