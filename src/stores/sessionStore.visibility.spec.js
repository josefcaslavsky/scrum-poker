import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

// Mock the broadcasting service
const mockIsConnected = vi.fn();
const mockReconnect = vi.fn();
const mockSubscribeToSession = vi.fn();
const mockUnsubscribeFromSession = vi.fn();

vi.mock('../services/broadcasting', () => ({
  subscribeToSession: (...args) => mockSubscribeToSession(...args),
  unsubscribeFromSession: (...args) => mockUnsubscribeFromSession(...args),
  isConnected: () => mockIsConnected(),
  reconnect: () => mockReconnect(),
  onConnectionStateChange: vi.fn()
}));

// Mock the API service
const mockSessionApi = {
  create: vi.fn(),
  join: vi.fn(),
  get: vi.fn(),
  leave: vi.fn(),
  vote: vi.fn(),
  startVoting: vi.fn(),
  reveal: vi.fn(),
  newRound: vi.fn()
};

vi.mock('../services/api', () => ({
  sessionApi: mockSessionApi
}));

// Mock auth service
vi.mock('../services/auth', () => ({
  default: {
    setToken: vi.fn(),
    clearToken: vi.fn(),
    getToken: vi.fn()
  }
}));

// Mock localStorage composable
vi.mock('../composables/useLocalStorage', () => ({
  saveSessionInfo: vi.fn(),
  clearSessionInfo: vi.fn(),
  getSessionInfo: vi.fn(),
  getUserPreferences: vi.fn().mockReturnValue({ name: 'Test', emoji: '👤' })
}));

describe('sessionStore - Visibility Change Handling', () => {
  let visibilityState = 'visible';
  let visibilityListeners = [];

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Reset visibility state
    visibilityState = 'visible';
    visibilityListeners = [];

    // Mock document.visibilityState
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibilityState
    });

    // Mock addEventListener/removeEventListener for visibilitychange
    vi.spyOn(document, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'visibilitychange') {
        visibilityListeners.push(handler);
      }
    });

    vi.spyOn(document, 'removeEventListener').mockImplementation((event, handler) => {
      if (event === 'visibilitychange') {
        const index = visibilityListeners.indexOf(handler);
        if (index > -1) {
          visibilityListeners.splice(index, 1);
        }
      }
    });

    // Setup default mock responses
    mockSubscribeToSession.mockReturnValue({
      listen: vi.fn().mockReturnThis()
    });

    mockSessionApi.get.mockResolvedValue({
      data: {
        code: 'TEST01',
        status: 'waiting',
        current_round: 1,
        participants: [
          { id: 1, name: 'Host', emoji: '👤' },
          { id: 2, name: 'User', emoji: '🚀' }
        ],
        votes: []
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to trigger visibility change
  const triggerVisibilityChange = (newState) => {
    visibilityState = newState;
    visibilityListeners.forEach(listener => listener());
  };

  // Helper to setup a session state in the store
  const setupSessionState = async (store) => {
    // Manually set session state (simulating being in a session)
    store.sessionCode = 'TEST01';
    store.inSession = true;
    store.currentUser = { id: 2, name: 'User', emoji: '🚀', isFacilitator: false };
    store.participants = [
      { id: 1, name: 'Host', emoji: '👤', hasVoted: false, vote: null, isUser: false },
      { id: 2, name: 'User', emoji: '🚀', hasVoted: false, vote: null, isUser: true }
    ];

    // Trigger WebSocket setup which also sets up visibility handler
    // We need to import the store after mocks are set up
    const { useSessionStore } = await import('./sessionStore');
    return useSessionStore();
  };

  describe('visibility change listener setup', () => {
    it('registers visibilitychange listener when joining session', async () => {
      mockSessionApi.join.mockResolvedValue({
        data: {
          session: { id: 1, code: 'TEST01', status: 'waiting', current_round: 1 },
          participant: { id: 2, name: 'User', emoji: '🚀', is_host: false },
          participants: [
            { id: 1, name: 'Host', emoji: '👤' },
            { id: 2, name: 'User', emoji: '🚀' }
          ],
          token: 'test-token'
        }
      });

      const { useSessionStore } = await import('./sessionStore');
      const store = useSessionStore();

      await store.joinSession('TEST01', { name: 'User', emoji: '🚀' });

      expect(document.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });

    it('registers visibilitychange listener when creating session', async () => {
      mockSessionApi.create.mockResolvedValue({
        data: {
          session: { id: 1, code: 'TEST01', status: 'waiting', current_round: 1 },
          participant: { id: 1, name: 'Host', emoji: '👤', is_host: true },
          token: 'test-token'
        }
      });

      const { useSessionStore } = await import('./sessionStore');
      const store = useSessionStore();

      await store.createSession({ name: 'Host', emoji: '👤' });

      expect(document.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });

    it('removes visibilitychange listener when leaving session', async () => {
      mockSessionApi.join.mockResolvedValue({
        data: {
          session: { id: 1, code: 'TEST01', status: 'waiting', current_round: 1 },
          participant: { id: 2, name: 'User', emoji: '🚀', is_host: false },
          participants: [{ id: 2, name: 'User', emoji: '🚀' }],
          token: 'test-token'
        }
      });

      mockSessionApi.leave.mockResolvedValue({ data: {} });

      const { useSessionStore } = await import('./sessionStore');
      const store = useSessionStore();

      await store.joinSession('TEST01', { name: 'User', emoji: '🚀' });

      // Get the handler that was registered
      const listenerCountBefore = visibilityListeners.length;

      await store.leaveSession();

      expect(document.removeEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });
  });

  describe('visibility change behavior', () => {
    it('reconnects WebSocket when page becomes visible and connection is lost', async () => {
      mockSessionApi.join.mockResolvedValue({
        data: {
          session: { id: 1, code: 'TEST01', status: 'waiting', current_round: 1 },
          participant: { id: 2, name: 'User', emoji: '🚀', is_host: false },
          participants: [{ id: 2, name: 'User', emoji: '🚀' }],
          token: 'test-token'
        }
      });

      mockIsConnected.mockReturnValue(false); // Connection is lost

      const { useSessionStore } = await import('./sessionStore');
      const store = useSessionStore();

      await store.joinSession('TEST01', { name: 'User', emoji: '🚀' });

      // Simulate page going hidden then visible
      triggerVisibilityChange('hidden');
      triggerVisibilityChange('visible');

      // Wait for async operations
      await vi.waitFor(() => {
        expect(mockReconnect).toHaveBeenCalled();
      });
    });

    it('does not reconnect when page becomes visible but connection is still active', async () => {
      mockSessionApi.join.mockResolvedValue({
        data: {
          session: { id: 1, code: 'TEST01', status: 'waiting', current_round: 1 },
          participant: { id: 2, name: 'User', emoji: '🚀', is_host: false },
          participants: [{ id: 2, name: 'User', emoji: '🚀' }],
          token: 'test-token'
        }
      });

      mockIsConnected.mockReturnValue(true); // Connection is still active

      const { useSessionStore } = await import('./sessionStore');
      const store = useSessionStore();

      await store.joinSession('TEST01', { name: 'User', emoji: '🚀' });
      mockReconnect.mockClear(); // Clear any previous calls

      // Simulate page going hidden then visible
      triggerVisibilityChange('hidden');
      triggerVisibilityChange('visible');

      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockReconnect).not.toHaveBeenCalled();
    });

    it('refreshes session state from API when page becomes visible', async () => {
      mockSessionApi.join.mockResolvedValue({
        data: {
          session: { id: 1, code: 'TEST01', status: 'waiting', current_round: 1 },
          participant: { id: 2, name: 'User', emoji: '🚀', is_host: false },
          participants: [{ id: 2, name: 'User', emoji: '🚀' }],
          token: 'test-token'
        }
      });

      mockIsConnected.mockReturnValue(true);

      const { useSessionStore } = await import('./sessionStore');
      const store = useSessionStore();

      await store.joinSession('TEST01', { name: 'User', emoji: '🚀' });
      mockSessionApi.get.mockClear(); // Clear the call from join

      // Simulate page becoming visible
      triggerVisibilityChange('visible');

      // Wait for async operations
      await vi.waitFor(() => {
        expect(mockSessionApi.get).toHaveBeenCalledWith('TEST01');
      });
    });

    it('does not refresh when page becomes hidden', async () => {
      mockSessionApi.join.mockResolvedValue({
        data: {
          session: { id: 1, code: 'TEST01', status: 'waiting', current_round: 1 },
          participant: { id: 2, name: 'User', emoji: '🚀', is_host: false },
          participants: [{ id: 2, name: 'User', emoji: '🚀' }],
          token: 'test-token'
        }
      });

      const { useSessionStore } = await import('./sessionStore');
      const store = useSessionStore();

      await store.joinSession('TEST01', { name: 'User', emoji: '🚀' });
      mockSessionApi.get.mockClear();
      mockReconnect.mockClear();

      // Simulate page becoming hidden
      triggerVisibilityChange('hidden');

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSessionApi.get).not.toHaveBeenCalled();
      expect(mockReconnect).not.toHaveBeenCalled();
    });

    it('does not refresh when not in a session', async () => {
      const { useSessionStore } = await import('./sessionStore');
      const store = useSessionStore();

      // Not in a session
      expect(store.inSession).toBe(false);

      // Manually trigger visibility change (even though no listener should be registered)
      triggerVisibilityChange('visible');

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSessionApi.get).not.toHaveBeenCalled();
      expect(mockReconnect).not.toHaveBeenCalled();
    });

    it('updates participants list from refreshed state', async () => {
      mockSessionApi.join.mockResolvedValue({
        data: {
          session: { id: 1, code: 'TEST01', status: 'waiting', current_round: 1 },
          participant: { id: 2, name: 'User', emoji: '🚀', is_host: false },
          participants: [
            { id: 1, name: 'Host', emoji: '👤' },
            { id: 2, name: 'User', emoji: '🚀' }
          ],
          token: 'test-token'
        }
      });

      // Mock get to return additional participant (simulating someone joined while hidden)
      mockSessionApi.get.mockResolvedValue({
        data: {
          code: 'TEST01',
          status: 'waiting',
          current_round: 1,
          participants: [
            { id: 1, name: 'Host', emoji: '👤' },
            { id: 2, name: 'User', emoji: '🚀' },
            { id: 3, name: 'NewUser', emoji: '🆕' }
          ],
          votes: []
        }
      });

      mockIsConnected.mockReturnValue(true);

      const { useSessionStore } = await import('./sessionStore');
      const store = useSessionStore();

      await store.joinSession('TEST01', { name: 'User', emoji: '🚀' });

      expect(store.participants).toHaveLength(2);

      // Simulate page becoming visible
      triggerVisibilityChange('visible');

      // Wait for async operations
      await vi.waitFor(() => {
        expect(store.participants).toHaveLength(3);
      });

      // Verify new participant was added
      const newUser = store.participants.find(p => p.id === 3);
      expect(newUser).toBeDefined();
      expect(newUser.name).toBe('NewUser');
    });

    it('updates voting state from refreshed state', async () => {
      mockSessionApi.join.mockResolvedValue({
        data: {
          session: { id: 1, code: 'TEST01', status: 'waiting', current_round: 1 },
          participant: { id: 2, name: 'User', emoji: '🚀', is_host: false },
          participants: [{ id: 2, name: 'User', emoji: '🚀' }],
          token: 'test-token'
        }
      });

      // Mock get to return voting state changed to 'voting'
      mockSessionApi.get.mockResolvedValue({
        data: {
          code: 'TEST01',
          status: 'voting',
          current_round: 1,
          participants: [{ id: 2, name: 'User', emoji: '🚀' }],
          votes: []
        }
      });

      mockIsConnected.mockReturnValue(true);

      const { useSessionStore } = await import('./sessionStore');
      const store = useSessionStore();

      await store.joinSession('TEST01', { name: 'User', emoji: '🚀' });

      expect(store.isVoting).toBe(false);

      // Simulate page becoming visible
      triggerVisibilityChange('visible');

      // Wait for async operations
      await vi.waitFor(() => {
        expect(store.isVoting).toBe(true);
      });
    });

    it('updates revealed votes from refreshed state', async () => {
      mockSessionApi.join.mockResolvedValue({
        data: {
          session: { id: 1, code: 'TEST01', status: 'voting', current_round: 1 },
          participant: { id: 2, name: 'User', emoji: '🚀', is_host: false },
          participants: [
            { id: 1, name: 'Host', emoji: '👤' },
            { id: 2, name: 'User', emoji: '🚀' }
          ],
          token: 'test-token'
        }
      });

      // Mock get to return revealed state with votes
      mockSessionApi.get.mockResolvedValue({
        data: {
          code: 'TEST01',
          status: 'revealed',
          current_round: 1,
          participants: [
            { id: 1, name: 'Host', emoji: '👤' },
            { id: 2, name: 'User', emoji: '🚀' }
          ],
          votes: [
            { participant_id: 1, card_value: '5' },
            { participant_id: 2, card_value: '8' }
          ]
        }
      });

      mockIsConnected.mockReturnValue(true);

      const { useSessionStore } = await import('./sessionStore');
      const store = useSessionStore();

      await store.joinSession('TEST01', { name: 'User', emoji: '🚀' });

      expect(store.isRevealed).toBe(false);

      // Simulate page becoming visible
      triggerVisibilityChange('visible');

      // Wait for async operations
      await vi.waitFor(() => {
        expect(store.isRevealed).toBe(true);
      });

      // Verify votes are updated
      const hostParticipant = store.participants.find(p => p.id === 1);
      const userParticipant = store.participants.find(p => p.id === 2);

      expect(hostParticipant.vote).toBe(5);
      expect(hostParticipant.hasVoted).toBe(true);
      expect(userParticipant.vote).toBe(8);
      expect(userParticipant.hasVoted).toBe(true);
    });
  });
});
