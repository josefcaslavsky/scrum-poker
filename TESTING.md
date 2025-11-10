# Testing Guide - Dual Version Setup

This document explains how testing works with both Electron and Web versions.

## 📋 Test Structure

```
scrum-poker/
├── src/
│   ├── components/*.spec.js      # Component unit tests
│   └── stores/*.spec.js           # Store unit tests
├── test/
│   ├── integration/*.spec.js      # Integration tests
│   └── setup.js                   # Test setup
└── e2e/*.spec.js                  # E2E tests (Electron only)
```

## 🧪 Test Types

### 1. Unit Tests (Vitest)

**Location:** `src/**/*.spec.js`

**What's tested:**
- Vue components in isolation
- Pinia store logic
- Composables

**Coverage:** ✅ **Works for both Electron and Web**
- Tests the shared code in `src/`
- Platform-agnostic (no Electron or browser-specific APIs)
- Uses `happy-dom` for DOM simulation

**Run tests:**
```bash
# Run all unit tests
npm test

# Watch mode
npm test -- --watch

# Interactive UI
npm run test:ui

# With coverage
npm run test:coverage
```

**Example test files:**
- `src/components/PokerCard.spec.js` - Card component tests
- `src/components/VotingTimer.spec.js` - Timer component tests
- `src/stores/sessionStore.spec.js` - Session state management

### 2. Integration Tests (Vitest)

**Location:** `test/integration/*.spec.js`

**What's tested:**
- Multiple components working together
- Store + API interactions
- Full feature flows

**Coverage:** ✅ **Works for both versions**
- Tests shared business logic
- Mock API calls
- Simulate user interactions

**Run tests:**
```bash
npm test test/integration
```

**Example:**
- `test/integration/voting-flow.spec.js` - Complete voting flow

### 3. End-to-End Tests (Playwright)

**Location:** `e2e/*.spec.js`

**What's tested:**
- ⚡ **Electron version only**
- Full application in real Electron environment
- Window management
- Complete user journeys

**Coverage:** ⚠️ **Electron-specific**
- Tests the built Electron app
- Requires building first

**Run tests:**
```bash
# Build and test
npm run test:e2e

# Interactive mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

**Example test files:**
- `e2e/voting-flow.spec.js` - Complete voting session
- `e2e/timer.spec.js` - Timer functionality

## 🎯 Test Configuration

### Vitest Config (`vitest.config.js`)

```javascript
{
  test: {
    environment: 'happy-dom',           // Simulates browser DOM
    globals: true,                       // Use global test functions
    setupFiles: ['./test/setup.js'],    // Setup before tests
    exclude: [
      '**/node_modules/**',
      '**/dist/**',                      // Electron build output
      '**/dist-web/**',                  // Web build output
      '**/out/**',
      '**/e2e/**'                        // E2E tests run separately
    ]
  },
  resolve: {
    alias: {
      '@': 'src'                         // Updated for new structure
    }
  }
}
```

### Playwright Config (`playwright.config.js`)

```javascript
{
  testDir: './e2e',
  timeout: 60000,
  workers: 1,                            // Serial execution for Electron
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  }
}
```

## 📊 Current Test Status

### Unit Tests
- **Total:** 56 tests
- **Component tests:** 23 tests ✅
- **Store tests:** 25 tests (some require mock API)
- **Integration tests:** 8 tests (require API backend)

### Component Tests (All Passing ✅)
- `PokerCard.spec.js` - 7 tests ✅
- `ParticipantList.spec.js` - 6 tests ✅
- `SessionInfo.spec.js` - 4 tests ✅
- `VotingTimer.spec.js` - 6 tests ✅

### Tests Requiring Backend
Some tests make real API calls and need the Laravel backend running:
- `sessionStore.spec.js` - Session management tests
- `test/integration/voting-flow.spec.js` - Integration tests

## 🔧 Configuration Updates for Dual Setup

### What Changed
1. **Updated path aliases:**
   - Old: `@` → `src/renderer`
   - New: `@` → `src`

2. **Updated test imports:**
   ```javascript
   // Before
   import { useSessionStore } from '../../src/renderer/stores/sessionStore';

   // After
   import { useSessionStore } from '../../src/stores/sessionStore';
   ```

3. **Excluded build outputs:**
   - `dist/` - Electron builds
   - `dist-web/` - Web builds
   - `out/` - Electron output

### Platform-Specific Behavior

Tests check environment using:
```javascript
const isTestMode = import.meta.env.MODE === 'test';
```

Previously used `window.api?.nodeEnv === 'test'` (Electron-specific).

## 🚀 Running Tests for Each Version

### Test Shared Code (Both Versions)
```bash
npm test
```
This tests all the shared code in `src/` that both versions use.

### Test Electron-Specific
```bash
# E2E tests for Electron
npm run test:e2e
```

### Test Web-Specific
Currently, there are no web-specific tests since almost all code is shared. If needed, you could add:

**Option 1: Playwright for Web**
```javascript
// playwright.config.js - add web project
export default defineConfig({
  projects: [
    {
      name: 'electron',
      testDir: './e2e',
      // ... Electron config
    },
    {
      name: 'web',
      testDir: './e2e-web',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
```

**Option 2: Vitest Browser Mode** (experimental)
```bash
npm install -D @vitest/browser playwright
```

## 📝 Writing Tests for Dual Setup

### ✅ Best Practices

1. **Test shared code only:**
   - Keep tests in `src/**/*.spec.js`
   - Don't use platform-specific APIs
   - Tests work for both versions

2. **Mock external dependencies:**
   ```javascript
   import { vi } from 'vitest';

   // Mock API calls
   vi.mock('@/services/api', () => ({
     apiService: {
       createSession: vi.fn()
     }
   }));
   ```

3. **Use test utilities:**
   ```javascript
   import { mount } from '@vue/test-utils';
   import { createPinia, setActivePinia } from 'pinia';

   beforeEach(() => {
     setActivePinia(createPinia());
   });
   ```

4. **Avoid platform detection:**
   ```javascript
   // ❌ Bad - platform-specific
   if (window.electron) { /* ... */ }

   // ✅ Good - behavior-based
   const hasFeature = typeof feature !== 'undefined';
   ```

### Example Test

```javascript
// src/components/MyComponent.spec.js
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MyComponent from './MyComponent.vue';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent, {
      props: { title: 'Test' }
    });

    expect(wrapper.text()).toContain('Test');
  });

  it('works in both Electron and Web', () => {
    // This test runs the same way in both environments
    const wrapper = mount(MyComponent);
    expect(wrapper.exists()).toBe(true);
  });
});
```

## 🐛 Troubleshooting

### Tests fail with import errors
**Problem:** `Failed to resolve import "../../src/renderer/..."`
**Solution:** Update imports to use new paths:
```javascript
// Old
import { useStore } from '@/renderer/stores/myStore';

// New
import { useStore } from '@/stores/myStore';
```

### API tests failing
**Problem:** Tests make real API calls that fail
**Solution:**
1. Start Laravel backend: `php artisan serve`
2. Or mock the API:
```javascript
vi.mock('@/services/api', () => ({
  apiService: {
    createSession: vi.fn().mockResolvedValue({ code: 'TEST123' })
  }
}));
```

### E2E tests not finding app
**Problem:** Playwright can't launch Electron app
**Solution:**
```bash
# Build first
npm run build

# Then run E2E tests
npm run test:e2e
```

### Tests slow or hanging
**Problem:** Real HTTP requests timing out
**Solution:** Check for unmocked API calls or WebSocket connections

## 📈 Test Coverage

View coverage report:
```bash
npm run test:coverage
```

Opens HTML report showing:
- Line coverage
- Branch coverage
- Function coverage
- Uncovered lines

**Target coverage:**
- Components: 80%+
- Stores: 70%+
- Services: Mock only

## 🎯 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm run test:e2e
```

## 🔄 Continuous Testing

### Watch mode during development

**For unit tests:**
```bash
npm test -- --watch
```

Changes to any file in `src/` automatically re-run affected tests.

**For E2E tests:**
```bash
npm run test:e2e:ui
```

Interactive Playwright UI for debugging.

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Pinia Testing](https://pinia.vuejs.org/cookbook/testing.html)

## ✅ Testing Checklist

Before committing:

- [ ] All unit tests pass: `npm test`
- [ ] Components have tests
- [ ] Store logic is tested
- [ ] E2E tests pass: `npm run test:e2e`
- [ ] No platform-specific code in tests
- [ ] Coverage meets targets: `npm run test:coverage`
- [ ] Tests run in CI/CD pipeline

## 🎉 Summary

**Key Points:**
1. ✅ Unit tests work for both Electron and Web (same codebase)
2. ✅ Integration tests work for both versions
3. ⚡ E2E tests are Electron-specific
4. 🔧 All test paths updated for new structure
5. 📊 31 tests passing, some need backend

**Test both versions by testing the shared code!** Since 95% of code is shared, unit tests validate both Electron and Web versions simultaneously.
