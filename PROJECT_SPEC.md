# 🃏 Scrum Poker Desktop App – Updated Project Specification

## ✅ Overview

A lightweight cross-platform **Scrum Poker desktop application** built using **Electron** with a **Vue.js frontend**. The app allows team members to estimate story points in agile ceremonies with a playful, gamified interface.

**Current Phase**: Mock/Prototype Version (Single-user simulation with fake participants)
**Future Phase**: Full multi-user version with Laravel API backend

---

## 🎯 Goals

* Provide an intuitive, playful desktop interface for story point estimation
* Simulate real-time voting experience with AI participants
* Keep UI focused on card selection and reveal with engaging animations
* Build architecture ready for future Laravel API integration
* Support cross-platform deployment (Windows & macOS)

---

## 🧱 Tech Stack

| Layer              | Tech                                          | Status      |
| ------------------ | --------------------------------------------- | ----------- |
| Frontend Framework | Vue.js 3 (Composition API)                    | ✅ Setup    |
| State Management   | Pinia                                         | ✅ Setup    |
| Build Tool         | electron-vite                                 | ✅ Setup    |
| Desktop Framework  | Electron                                      | ✅ Setup    |
| Animations         | CSS 3D Transforms + canvas-confetti           | ✅ Setup    |
| Packaging          | Electron Builder                              | ✅ Setup    |
| Backend (Future)   | Laravel RESTful API (not in current phase)    | 📋 Planned  |
| Communication      | Mock polling (1s intervals) → Real API later  | 🚧 Pending  |

---

## 🎮 UI Features (Playful/Gamified Style)

### Current Implementation

#### Main App Screen
* **Blue gradient background** (#2193b0 → #6dd5ed)
* **Header** with "🃏 Scrum Poker" title and subtitle
* **Card grid** displaying 11 Fibonacci cards:
  * 0, ½, 1, 2, 3, 5, 8, 13, 21, ?, ☕
  * 3D flip animation on selection
  * White front with blue borders
  * Pink gradient back pattern
* **Participant list** showing 5 members:
  * You (👤)
  * Alice (👩)
  * Bob (👨)
  * Charlie (🧑)
  * Diana (👱‍♀️)
  * Visual indicator: ⏱ (waiting) or ✓ (voted)
* **Action buttons**:
  * "Start New Round" (primary blue)
  * "Reveal Cards" (secondary white)

### Animations & Polish
* Smooth card flip on selection (CSS 3D transforms)
* Fade-in animations for UI sections
* Hover effects on cards (translateY)
* Scale effect on selected cards
* Color transitions on participant status

### To Be Implemented

#### Voting Flow
* 15-second countdown timer with visual progress bar
  * Green → Yellow → Red color transitions
  * Auto-reveal when timer expires OR all participants vote
* Simulated participant voting:
  * Random delays between 2-12 seconds
  * Random card selections
* Mock polling system (1-second intervals to check vote status)

#### Results Screen
* Reveal all cards with animation
* Show consensus/average calculation
* Confetti animation on reveal (canvas-confetti)
* Display statistics:
  * Most voted value
  * Average (excluding ? and ☕)
  * Consensus indicator (all same vs. spread)

#### Session Management
* Display mock session code (e.g., "ABC123")
* "New Round" button to reset and play again
* Keep same participants across rounds

---

## 🏗️ Architecture

### Current Structure

```
/scrum-poker
  /src
    /main
      index.js              # Electron main process
    /preload
      index.js              # IPC bridge (minimal for now)
    /renderer
      /components           # Vue components (to be created)
      /views               # View containers
      /stores              # Pinia stores
      /composables         # Mock API & utilities
      /assets
        style.css          # Global styles
      App.vue              # Root component
      main.js              # Vue app initialization
      index.html           # Entry HTML
  /resources             # App icons (to be added)
  electron.vite.config.js
  package.json
```

### State Management (Pinia)

**Session Store** (to be created):
```javascript
{
  sessionCode: string,
  currentRound: number,
  participants: Array<Participant>,
  userCard: number | null,
  timerSeconds: number,
  isRevealed: boolean,
  votes: Map<participantId, cardValue>
}
```

### Mock API Composable

**useMockApi.js** (to be created):
* Simulates 4 AI participants
* Random voting delays (2-12 seconds)
* Random card selections (weighted towards common values)
* Polling mechanism with 1-second intervals
* Auto-reveal logic after 15 seconds OR all voted
* Reset functionality for new rounds

---

## 🎯 Implementation Phases

### ✅ Phase 1: Project Setup (COMPLETED)
- [x] Install dependencies (Vue 3, Pinia, electron-vite, canvas-confetti, electron-builder)
- [x] Configure electron-vite for Electron + Vue integration
- [x] Set up project folder structure
- [x] Create basic Vue app with initial UI
- [x] Update package.json with build scripts
- [x] Apply playful blue theme styling

### 🚧 Phase 2: Core Architecture (NEXT)
- [ ] Create Pinia store for session state management
- [ ] Build mock API composable (useMockApi.js)
  - [ ] Simulate 4 fake participants with random vote timing
  - [ ] Implement polling mechanism (1s intervals)
  - [ ] Session creation/reset logic
- [ ] Implement 15-second countdown timer with auto-reveal

### 📋 Phase 3: UI Components
- [ ] Refactor into proper components:
  - [ ] HomeView.vue (session start screen)
  - [ ] PokerCard.vue (individual card component)
  - [ ] ParticipantList.vue (participant avatars & status)
  - [ ] VotingTimer.vue (countdown with progress bar)
  - [ ] CardReveal.vue (results screen with statistics)
  - [ ] SessionInfo.vue (session code display)

### 📋 Phase 4: Game Logic & Polish
- [ ] Implement complete voting flow
- [ ] Add confetti animation on reveal
- [ ] Create "New Round" functionality
- [ ] Add smooth state transitions
- [ ] Display consensus/average calculations
- [ ] Add optional sound effects
- [ ] Polish micro-interactions

### 📋 Phase 5: Packaging & Distribution
- [ ] Test on Windows and macOS
- [ ] Create app icons for both platforms
- [ ] Configure electron-builder settings
- [ ] Generate installers (NSIS for Windows, DMG for macOS)
- [ ] Test installation flows

### 📋 Phase 6: Future API Integration
- [ ] Replace mock API with real Laravel endpoints
- [ ] Implement real session management
- [ ] Upgrade polling to WebSockets for true real-time
- [ ] Add authentication (optional)
- [ ] Multi-device synchronization

---

## 🔮 Detailed Feature Specs

### Voting Timer (15 seconds)
* Visual countdown display
* Progress bar with color coding:
  * 15-10s: Green (#4caf50)
  * 9-5s: Yellow (#ffc107)
  * 4-0s: Red (#f44336)
* Pause timer until first vote (optional enhancement)
* Auto-reveal when:
  * Timer reaches 0, OR
  * All 5 participants have voted

### Participant Simulation
* 4 AI participants with unique personalities:
  * Fast voter (2-4s delay)
  * Medium voter (4-8s delay)
  * Slow voter (8-12s delay)
  * Random voter (2-12s delay)
* Weighted card selection:
  * Higher probability: 2, 3, 5, 8 (common estimates)
  * Lower probability: 0, 1, 13, 21
  * Rare: ?, ☕

### Results & Statistics
* Show all revealed cards in a row
* Calculate and display:
  * **Average**: Mean of numeric values (exclude ? and ☕)
  * **Consensus**: "Perfect!" if all same, "Close" if within 1 card, "Spread" otherwise
  * **Most Voted**: The value with most votes
* Visual representation with colored badges

### Session Code
* Generate random 6-character code (e.g., "A1B2C3")
* Display prominently at top of screen
* Copy-to-clipboard functionality (for future real sessions)

---

## 🎨 Design System

### Colors
* **Primary Blue**: #4facfe → #00f2fe (gradient)
* **Background**: #2193b0 → #6dd5ed (dark blue gradient)
* **Card Border**: #4facfe
* **Card Back**: #f093fb → #f5576c (pink gradient)
* **Success Green**: #4caf50
* **Warning Yellow**: #ffc107
* **Error Red**: #f44336
* **White**: #ffffff
* **Light Gray**: #f5f5f5

### Typography
* **Font Family**: System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto)
* **Title**: 3.5em, bold, white
* **Subtitle**: 1.3em, white with 90% opacity
* **Card Value**: 2.5em, bold, primary blue
* **Body**: 1em, #333

### Animations
* **Card Flip**: 0.6s transform with preserve-3d
* **Card Hover**: 0.3s translateY(-10px)
* **Button Hover**: 0.3s with shadow increase
* **Fade In Down**: 0.6s for header
* **Fade In Up**: 0.8-1.2s for content sections

---

## 🔌 Future Backend API Endpoints (Laravel)

**Not implemented in current phase** – Architecture ready for integration:

### Planned Endpoints
* `POST /api/session` – Create new session
* `POST /api/session/join` – Join session with name
* `POST /api/session/{id}/vote` – Submit card vote
* `GET /api/session/{id}/votes` – Get all current votes
* `POST /api/session/{id}/reveal` – Force reveal
* `POST /api/session/{id}/reset` – Reset current round
* `DELETE /api/session/{id}` – End session
* `WebSocket /ws/session/{id}` – Real-time updates

### Data Models
```typescript
Session {
  id: string,
  code: string,
  hostId: string,
  createdAt: datetime,
  currentRound: number
}

Participant {
  id: string,
  sessionId: string,
  name: string,
  emoji: string,
  isHost: boolean
}

Vote {
  id: string,
  sessionId: string,
  participantId: string,
  round: number,
  cardValue: number,
  votedAt: datetime
}
```

---

## 📦 Build Configuration

### Package Scripts
* `npm run dev` – Start Electron in development mode with hot-reload
* `npm run build` – Build for production
* `npm run preview` – Preview production build
* `npm run build:win` – Build Windows installer (NSIS)
* `npm run build:mac` – Build macOS app (DMG)

### Platform Targets
* **Windows**: NSIS installer (.exe)
* **macOS**: DMG disk image (.dmg)
* **Future**: Linux AppImage (optional)

### App Configuration
```json
{
  "appId": "com.scrumpoker.app",
  "productName": "Scrum Poker",
  "category": "public.app-category.developer-tools"
}
```

---

## 🧪 Testing Strategy (Future)

* **Unit Tests**: Pinia stores, composables, utility functions
* **Component Tests**: Individual Vue components
* **E2E Tests**: Full voting flows with Playwright/Spectron
* **Manual Testing**: Cross-platform UI/UX validation

---

## 📝 Notes & Decisions

### Why 15-second timeout?
* User preference for quick iteration
* Visual countdown prevents surprise reveals
* Can be made configurable later via settings

### Why fixed Fibonacci cards?
* Covers 99% of Scrum poker use cases
* Simpler UX without configuration overhead
* Can add custom decks in future version

### Why mock API instead of real backend now?
* Faster prototyping and UI development
* Test full user experience without infrastructure
* Architecture designed for easy swap to real API

### Why Pinia over Vuex?
* Official Vue 3 state management
* Simpler API, less boilerplate
* Better TypeScript support
* Lighter weight for this use case

### Why electron-vite?
* Official Electron + Vite integration
* Better DX with hot reload for both main and renderer
* Simpler configuration than manual setup
* Active maintenance and community support

---

## 🚀 Success Metrics

* App launches in < 3 seconds
* Voting round completes smoothly with animations
* Cards flip without lag on both platforms
* Confetti animation performs at 60fps
* Build size < 100MB (unpacked)
* Installer size < 50MB

---

## 📅 Current Status

**Phase 1 Complete** ✅
**Ready for Phase 2** 🚀

### What's Working
* Electron app runs with hot-reload
* Vue 3 + Pinia integrated
* Playful blue-themed UI
* 11 poker cards with flip animations
* 5 participants displayed with status indicators
* Responsive layout and hover effects

### What's Next
* Build mock API system
* Implement voting timer
* Add reveal logic with confetti
* Create statistics display
* Package for Windows & macOS

---

*Last Updated: 2025-11-07*
