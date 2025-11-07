import { vi } from 'vitest';

// Mock canvas-confetti since it relies on browser APIs
vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

// Mock Electron APIs if needed
global.window = global.window || {};
global.window.api = {
  platform: 'darwin'
};
