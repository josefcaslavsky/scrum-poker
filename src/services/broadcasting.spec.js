import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Shared state for mock
const mockState = {
  connectionState: 'connected',
  bindCalls: [],
  disconnectCalls: 0,
  connectCalls: 0,
  echoDisconnectCalls: 0
};

// Mock the modules before importing
vi.mock('laravel-echo', () => {
  return {
    default: class MockEcho {
      constructor() {
        this.connector = {
          pusher: {
            connection: {
              get state() { return mockState.connectionState; },
              bind: (event, handler) => {
                mockState.bindCalls.push({ event, handler });
              }
            },
            disconnect: () => { mockState.disconnectCalls++; },
            connect: () => { mockState.connectCalls++; }
          }
        };
        this.channel = vi.fn().mockReturnValue({
          subscription: { bind: vi.fn() },
          listen: vi.fn().mockReturnThis()
        });
        this.leave = vi.fn();
        this.disconnect = () => { mockState.echoDisconnectCalls++; };
      }
    }
  };
});

vi.mock('pusher-js', () => ({
  default: vi.fn()
}));

// Import after mocking
import {
  getEcho,
  isConnected,
  getConnectionState,
  reconnect,
  onConnectionStateChange,
  disconnectEcho
} from './broadcasting';

describe('broadcasting service', () => {
  beforeEach(() => {
    // Reset mock state
    mockState.connectionState = 'connected';
    mockState.bindCalls = [];
    mockState.disconnectCalls = 0;
    mockState.connectCalls = 0;
    mockState.echoDisconnectCalls = 0;
    // Ensure clean state
    disconnectEcho();
  });

  afterEach(() => {
    disconnectEcho();
  });

  describe('isConnected', () => {
    it('returns false when Echo instance does not exist', () => {
      expect(isConnected()).toBe(false);
    });

    it('returns true when connection state is connected', () => {
      getEcho(); // Initialize Echo
      mockState.connectionState = 'connected';
      expect(isConnected()).toBe(true);
    });

    it('returns false when connection state is disconnected', () => {
      getEcho(); // Initialize Echo
      mockState.connectionState = 'disconnected';
      expect(isConnected()).toBe(false);
    });

    it('returns false when connection state is connecting', () => {
      getEcho(); // Initialize Echo
      mockState.connectionState = 'connecting';
      expect(isConnected()).toBe(false);
    });

    it('returns false when connection state is unavailable', () => {
      getEcho(); // Initialize Echo
      mockState.connectionState = 'unavailable';
      expect(isConnected()).toBe(false);
    });
  });

  describe('getConnectionState', () => {
    it('returns null when Echo instance does not exist', () => {
      expect(getConnectionState()).toBeNull();
    });

    it('returns current connection state', () => {
      getEcho(); // Initialize Echo
      mockState.connectionState = 'connecting';
      expect(getConnectionState()).toBe('connecting');
    });
  });

  describe('reconnect', () => {
    it('does nothing when Echo instance does not exist', () => {
      reconnect(); // Should not throw
      expect(mockState.disconnectCalls).toBe(0);
      expect(mockState.connectCalls).toBe(0);
    });

    it('disconnects and reconnects when Echo instance exists', () => {
      getEcho(); // Initialize Echo
      reconnect();

      expect(mockState.disconnectCalls).toBe(1);
      expect(mockState.connectCalls).toBe(1);
    });
  });

  describe('onConnectionStateChange', () => {
    it('does nothing when Echo instance does not exist', () => {
      const callback = vi.fn();
      onConnectionStateChange(callback);
      expect(mockState.bindCalls.length).toBe(0);
    });

    it('binds callback to state_change event', () => {
      getEcho(); // Initialize Echo
      const callback = vi.fn();
      onConnectionStateChange(callback);

      const stateChangeBind = mockState.bindCalls.find(c => c.event === 'state_change');
      expect(stateChangeBind).toBeDefined();
    });

    it('calls callback with current and previous state when state changes', () => {
      getEcho(); // Initialize Echo
      const callback = vi.fn();
      onConnectionStateChange(callback);

      // Find and trigger the bound handler
      const stateChangeBind = mockState.bindCalls.find(c => c.event === 'state_change');
      stateChangeBind.handler({ current: 'connected', previous: 'connecting' });

      expect(callback).toHaveBeenCalledWith('connected', 'connecting');
    });
  });

  describe('getEcho', () => {
    it('creates Echo instance on first call', () => {
      const echo1 = getEcho();
      expect(echo1).toBeDefined();
    });

    it('returns same instance on subsequent calls', () => {
      const echo1 = getEcho();
      const echo2 = getEcho();
      expect(echo1).toBe(echo2);
    });
  });

  describe('disconnectEcho', () => {
    it('clears Echo instance so isConnected returns false', () => {
      getEcho(); // Initialize Echo
      mockState.connectionState = 'connected';
      expect(isConnected()).toBe(true);

      disconnectEcho();
      expect(isConnected()).toBe(false);
    });

    it('calls disconnect on echo instance', () => {
      getEcho(); // Initialize Echo
      const callsBefore = mockState.echoDisconnectCalls;
      disconnectEcho();
      expect(mockState.echoDisconnectCalls).toBe(callsBefore + 1);
    });
  });
});
