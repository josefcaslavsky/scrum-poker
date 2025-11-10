import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.js'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/dist-web/**', '**/out/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.spec.js',
        '**/*.test.js',
        'electron/',
        'web/',
        'electron.vite.config.js',
        'vitest.config.js'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
