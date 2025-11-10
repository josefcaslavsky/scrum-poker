# Scrum Poker - Dual Version Setup

This project now supports **both Electron desktop app and web app** versions, sharing the same codebase!

## 🎯 Project Structure

```
scrum-poker/
├── src/                    # Shared frontend code (Vue 3)
│   ├── components/         # Vue components (used by both versions)
│   ├── composables/        # Composables
│   ├── services/           # API & WebSocket services
│   ├── stores/             # Pinia stores
│   ├── assets/             # Styles
│   ├── public/             # PWA icons and static assets
│   ├── App.vue             # Root component
│   ├── main.js             # Vue app entry point
│   └── index.html          # HTML template
│
├── electron/               # Electron-specific code
│   ├── main/               # Electron main process
│   └── preload/            # Electron preload scripts
│
├── web/                    # Web-specific configuration
│   ├── vite.config.js      # Vite config for web version
│   ├── nginx.conf          # Nginx deployment config
│   └── DEPLOYMENT.md       # Deployment guide
│
├── electron.vite.config.js # Electron build configuration
├── package.json            # Dependencies & scripts
└── dist-web/               # Web build output (generated)
```

## 🚀 Quick Start

### Development

**Electron Desktop App:**
```bash
npm run dev
```
Opens the Electron desktop application with hot reload.

**Web App:**
```bash
npm run dev:web
```
Starts web dev server at http://localhost:3001 (or next available port).

### Production Builds

**Electron Desktop App:**
```bash
# Build for current platform
npm run build

# Build for specific platforms
npm run build:mac    # macOS (DMG + ZIP)
npm run build:win    # Windows (NSIS + Portable)
npm run build:all    # Both macOS and Windows
```

Output: `dist/` directory with installers

**Web App:**
```bash
npm run build:web
```

Output: `dist-web/` directory ready for deployment

**Preview Web Build:**
```bash
npm run preview:web
```

## 📦 What's Shared vs. Separate

### ✅ Shared (95% of code)
- All Vue components
- Pinia stores
- API services
- WebSocket integration
- Business logic
- Styling

### 🔀 Platform-Specific

**Electron Only:**
- `electron/main/` - Window management
- `electron/preload/` - Security bridge
- Desktop installers

**Web Only:**
- PWA configuration (manifest, service worker)
- Nginx configuration
- Static file serving

## 🎨 Features

### Both Versions
- ✅ Real-time voting with WebSockets
- ✅ Session management
- ✅ Profile customization
- ✅ Vote reveal animations
- ✅ Results statistics
- ✅ Persistent sessions (localStorage)

### Web Version Only
- 📱 **Progressive Web App (PWA)**
  - Install to home screen
  - Offline support for UI
  - Native app-like experience
- 🌐 **Cross-platform** (works on any device with a browser)
- 📤 **No installation required**
- 🔄 **Instant updates**

### Electron Version Only
- 💻 **Native desktop app**
- 🪟 **Window controls** (minimize, maximize, close)
- 🖥️ **Standalone application**
- 📦 **Offline installation**

## 🛠️ Technology Stack

### Core
- **Vue 3.5** - Frontend framework
- **Pinia 3.0** - State management
- **Vite 7.2** - Build tool

### Desktop
- **Electron 39** - Desktop wrapper
- **electron-vite** - Electron + Vite integration

### Web
- **vite-plugin-pwa** - PWA support
- **Workbox** - Service worker management

### Backend Integration
- **Axios** - HTTP client
- **Laravel Echo** - WebSocket client
- **Pusher.js** - Real-time communication

### Testing
- **Vitest** - Unit tests
- **Playwright** - E2E tests

## 🔧 Configuration

### API & WebSocket URLs

Located in:
- `src/services/api.js` - API base URL
- `src/services/broadcasting.js` - WebSocket config

**Default (Development):**
- API: `http://localhost:8000/api`
- WebSocket: `localhost:8081`

**For Production:** Update these files or use environment variables:

```javascript
// Example: Using environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
```

Build with:
```bash
VITE_API_URL=https://api.example.com npm run build:web
```

## 📱 PWA Features

The web version includes full PWA support:

### Installation
Users can install the web app like a native app:
- **Desktop:** Install button in browser address bar
- **Mobile:** "Add to Home Screen" prompt

### Offline Support
- ✅ UI works offline (cached)
- ⚠️ Real-time features require connection
- 🔄 Auto-updates when online

### Cache Strategy
- **UI Assets:** Cached for offline use
- **API Calls:** Network-first with 5-minute cache
- **WebSocket:** Network-only (real-time requirement)

## 🚢 Deployment

### Web App
See [web/DEPLOYMENT.md](web/DEPLOYMENT.md) for detailed instructions.

**Quick steps:**
1. Build: `npm run build:web`
2. Upload `dist-web/` to your server
3. Configure Nginx (use `web/nginx.conf`)
4. Ensure API/WebSocket are accessible

### Desktop App
Use electron-builder commands:
- macOS: Creates `.dmg` and `.zip` files
- Windows: Creates NSIS installer and portable `.exe`

Distribute installers to users or publish to app stores.

## 🧪 Testing

### Unit Tests
```bash
npm test              # Run tests
npm run test:ui       # Interactive UI
npm run test:coverage # With coverage report
```

### E2E Tests (Electron)
```bash
npm run test:e2e       # Run E2E tests
npm run test:e2e:ui    # Interactive mode
npm run test:e2e:debug # Debug mode
```

## 🔄 Migration Notes

### From Original Structure
The project was restructured to support both versions:

**Key Changes:**
1. Moved `src/main` → `electron/main`
2. Moved `src/preload` → `electron/preload`
3. Moved `src/renderer/*` → `src/*`
4. Updated `import.meta.env.MODE` instead of `window.api.nodeEnv`
5. Added PWA configuration
6. Created separate build configs

**Compatibility:**
- ✅ All existing features preserved
- ✅ No breaking changes to functionality
- ✅ Backend API unchanged
- ✅ Git history preserved

## 📊 Build Sizes

### Electron
- macOS DMG: ~150-200 MB
- Windows NSIS: ~120-170 MB
- (Includes Chromium and Node.js runtime)

### Web
- Total: ~270 KB (gzipped: ~76 KB)
- JS: ~212 KB (gzipped: ~74 KB)
- CSS: ~13 KB (gzipped: ~3 KB)
- Service Worker: ~22 KB

## 🐛 Troubleshooting

### Electron Build Issues
**Problem:** Build fails with module resolution errors
**Solution:** Check that paths in `electron.vite.config.js` are correct

### Web Version Not Loading
**Problem:** Blank page in browser
**Solution:**
- Check console for errors
- Verify API URL is correct
- Ensure backend is running

### PWA Not Installing
**Problem:** Install prompt doesn't appear
**Solution:**
- Must be served over HTTPS (or localhost)
- Check all icons exist in `src/public/`
- Verify `manifest.webmanifest` is accessible

### WebSocket Connection Failed
**Problem:** Real-time features not working
**Solution:**
- Check WebSocket server is running (port 8081)
- Verify firewall allows WebSocket connections
- Check browser console for connection errors

## 📝 Development Notes

### Adding New Features
1. Add Vue components to `src/components/`
2. Update stores in `src/stores/`
3. Features automatically work in both versions!

### Platform-Specific Code
If you need platform-specific behavior:

```javascript
// Detect environment
const isElectron = window.navigator.userAgent.includes('Electron');
const isPWA = window.matchMedia('(display-mode: standalone)').matches;

if (isElectron) {
  // Electron-specific code
} else if (isPWA) {
  // PWA-specific code
} else {
  // Regular web browser
}
```

### Hot Reload
Both versions support hot reload during development:
- Electron: Full app reload on code changes
- Web: Fast HMR (Hot Module Replacement)

## 🎯 Future Enhancements

### Potential Additions
- [ ] Mobile apps (React Native / Flutter)
- [ ] Browser extensions
- [ ] Desktop notifications (PWA Notifications API)
- [ ] Offline voting queue
- [ ] Multi-language support
- [ ] Dark mode (UI already dark, but toggle option)

### Optimization Ideas
- [ ] Code splitting for faster initial load
- [ ] Lazy loading for components
- [ ] CDN for static assets
- [ ] Server-side rendering (SSR) option

## 📄 License

MIT

## 🤝 Contributing

Both versions use the same codebase - contributions benefit both platforms!

1. Make changes in `src/` for shared features
2. Test both versions: `npm run dev` and `npm run dev:web`
3. Build both: `npm run build` and `npm run build:web`
4. Submit pull request

## 📚 Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Web Deployment Guide](web/DEPLOYMENT.md)
