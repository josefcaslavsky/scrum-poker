import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia } from 'pinia';
import App from './App.vue';

// Mock dependencies
vi.mock('./composables/useSessionLink', () => ({
  getSessionCodeFromUrl: vi.fn(() => null),
  clearSessionCodeFromUrl: vi.fn(),
  buildSessionLink: vi.fn((code) => `https://example.com/?join=${code}`)
}));

vi.mock('./composables/useLocalStorage', () => ({
  getUserPreferences: vi.fn(() => ({ name: 'Test User', emoji: '🎯' })),
  getSessionInfo: vi.fn(() => null),
  clearSessionInfo: vi.fn(),
  saveSessionInfo: vi.fn(),
  saveUserPreferences: vi.fn()
}));

vi.mock('./composables/useMockApi', () => ({
  useMockApi: vi.fn(() => ({
    cleanup: vi.fn(),
    startVotingRound: vi.fn(),
    forceReveal: vi.fn(),
    startNewRound: vi.fn()
  }))
}));

vi.mock('./services/api', () => ({
  sessionApi: {
    create: vi.fn(),
    join: vi.fn(),
    get: vi.fn(),
    leave: vi.fn(),
    vote: vi.fn(),
    startVoting: vi.fn(),
    reveal: vi.fn(),
    newRound: vi.fn()
  }
}));

vi.mock('./services/auth', () => ({
  default: {
    setToken: vi.fn(),
    getToken: vi.fn(),
    clearToken: vi.fn()
  }
}));

vi.mock('./services/broadcasting', () => ({
  subscribeToSession: vi.fn(() => ({})),
  unsubscribeFromSession: vi.fn()
}));

import { getSessionCodeFromUrl, clearSessionCodeFromUrl } from './composables/useSessionLink';
import { getUserPreferences, getSessionInfo, clearSessionInfo } from './composables/useLocalStorage';
import { sessionApi } from './services/api';

// Flush all pending promises (multiple rounds to handle chained awaits:
// rejoinSession has 2 awaits, leaveSession has 1, joinSession has 1, etc.)
async function flushAll() {
  for (let i = 0; i < 10; i++) {
    await flushPromises();
  }
}

function mountApp() {
  return mount(App, {
    global: {
      plugins: [createPinia()]
    }
  });
}

// Helper to build a fake API response for joinSession
function fakeJoinResponse(sessionCode) {
  return {
    data: {
      session: { code: sessionCode, current_round: 1, status: 'waiting' },
      participant: { id: 99, name: 'Test User', emoji: '🎯', is_host: false },
      participants: [
        { id: 1, name: 'Host', emoji: '👑' },
        { id: 99, name: 'Test User', emoji: '🎯' }
      ],
      token: 'new-token'
    }
  };
}

// Helper to build a fake API response for rejoinSession (sessionApi.get)
function fakeGetResponse(sessionCode, participantId = 42) {
  return {
    data: {
      code: sessionCode,
      current_round: 1,
      status: 'waiting',
      participants: [
        { id: participantId, name: 'Test User', emoji: '🎯' },
        { id: 2, name: 'Other', emoji: '🎈' }
      ]
    }
  };
}

describe('App - invite link session switching', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();

    // Stub alert (not available in happy-dom)
    vi.stubGlobal('alert', vi.fn());

    // Default: user has a profile
    localStorage.setItem('userPreferences', JSON.stringify({ name: 'Test User', emoji: '🎯' }));
    getUserPreferences.mockReturnValue({ name: 'Test User', emoji: '🎯' });
  });

  afterEach(async () => {
    await flushAll();
    vi.restoreAllMocks();
  });

  it('joins new session via invite link when not in any session', async () => {
    getSessionCodeFromUrl.mockReturnValue('NEW123');
    getSessionInfo.mockReturnValue(null);
    sessionApi.join.mockResolvedValue(fakeJoinResponse('NEW123'));

    mountApp();
    await flushAll();

    expect(clearSessionCodeFromUrl).toHaveBeenCalled();
    expect(sessionApi.join).toHaveBeenCalledWith('NEW123', { name: 'Test User', emoji: '🎯' });
  });

  it('leaves current session and joins new one when invite link differs', async () => {
    const savedSession = { sessionCode: 'OLD111', participantId: 42, isFacilitator: false };
    getSessionCodeFromUrl.mockReturnValue('NEW222');
    getSessionInfo.mockReturnValue(savedSession);

    sessionApi.get.mockResolvedValue(fakeGetResponse('OLD111', 42));
    sessionApi.leave.mockResolvedValue({});
    sessionApi.join.mockResolvedValue(fakeJoinResponse('NEW222'));

    mountApp();
    await flushAll();

    // Should have rejoined old session first, then left it, then joined new
    expect(sessionApi.get).toHaveBeenCalledWith('OLD111');
    expect(sessionApi.leave).toHaveBeenCalledWith('OLD111');
    expect(sessionApi.join).toHaveBeenCalledWith('NEW222', { name: 'Test User', emoji: '🎯' });
  });

  it('stays in current session when invite link matches', async () => {
    const savedSession = { sessionCode: 'SAME11', participantId: 42, isFacilitator: false };
    getSessionCodeFromUrl.mockReturnValue('SAME11');
    getSessionInfo.mockReturnValue(savedSession);

    sessionApi.get.mockResolvedValue(fakeGetResponse('SAME11', 42));

    mountApp();
    await flushAll();

    // Should rejoin existing session
    expect(sessionApi.get).toHaveBeenCalledWith('SAME11');
    // Should NOT leave or join again
    expect(sessionApi.leave).not.toHaveBeenCalled();
    expect(sessionApi.join).not.toHaveBeenCalled();
  });

  it('does nothing special when no invite link is present', async () => {
    const savedSession = { sessionCode: 'ABC123', participantId: 42, isFacilitator: false };
    getSessionCodeFromUrl.mockReturnValue(null);
    getSessionInfo.mockReturnValue(savedSession);

    sessionApi.get.mockResolvedValue(fakeGetResponse('ABC123', 42));

    mountApp();
    await flushAll();

    // Should rejoin saved session
    expect(sessionApi.get).toHaveBeenCalledWith('ABC123');
    // Should not leave or join
    expect(sessionApi.leave).not.toHaveBeenCalled();
    expect(sessionApi.join).not.toHaveBeenCalled();
  });

  it('shows profile setup when no profile exists and invite link present', async () => {
    localStorage.removeItem('userPreferences');
    getSessionCodeFromUrl.mockReturnValue('NEW123');
    getSessionInfo.mockReturnValue(null);

    const wrapper = mountApp();
    await flushAll();

    // Should not auto-join yet (needs profile first)
    expect(sessionApi.join).not.toHaveBeenCalled();
    // Should show profile setup
    expect(wrapper.findComponent({ name: 'ProfileSetupPage' }).exists()).toBe(true);
  });

  it('joins via invite link after failed rejoin of saved session', async () => {
    const savedSession = { sessionCode: 'DEAD11', participantId: 42, isFacilitator: false };
    getSessionCodeFromUrl.mockReturnValue('NEW123');
    getSessionInfo.mockReturnValue(savedSession);

    sessionApi.get.mockRejectedValue(new Error('Session not found'));
    sessionApi.join.mockResolvedValue(fakeJoinResponse('NEW123'));

    mountApp();
    await flushAll();

    // Failed rejoin clears session info
    expect(clearSessionInfo).toHaveBeenCalled();
    // Then joins the new session from the invite link
    expect(sessionApi.join).toHaveBeenCalledWith('NEW123', { name: 'Test User', emoji: '🎯' });
  });
});
