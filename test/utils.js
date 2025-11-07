import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

/**
 * Create a fresh Pinia instance for testing
 */
export function createTestingPinia() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return pinia;
}

/**
 * Mount a component with Pinia support
 */
export function mountWithPinia(component, options = {}) {
  const pinia = createTestingPinia();

  return mount(component, {
    global: {
      plugins: [pinia],
      ...options.global
    },
    ...options
  });
}

/**
 * Wait for next tick and all promises to resolve
 */
export async function flushPromises() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Mock timers helper
 */
export function useFakeTimers() {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  return {
    advanceTime: (ms) => vi.advanceTimersByTime(ms),
    runAllTimers: () => vi.runAllTimers()
  };
}
