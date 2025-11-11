# Scrum Poker - Ionic/Capacitor Integration

Your app now supports **three platforms** with a shared Vue 3 codebase:

1. **Electron Desktop** (Windows, macOS, Linux)
2. **Web PWA** (Browser-based, installable)
3. **Ionic Mobile** (iOS, Android native apps) ← NEW!

## Architecture Overview

All three platforms share the same `src/` directory:

```
scrum-poker/
├── src/                    # Shared Vue 3 code (100% reused)
│   ├── components/
│   ├── stores/            # Pinia stores
│   ├── services/          # API, WebSockets
│   └── App.vue
│
├── electron/              # Desktop wrapper
├── web/                   # PWA wrapper
└── ionic/                 # Mobile wrapper (NEW!)
```

## Quick Start

### Development

```bash
# Desktop (Electron)
npm run dev

# Web (PWA)
npm run dev:web

# Mobile (Ionic) - runs in browser at localhost:3001
npm run dev:ionic
```

### Building

```bash
# Desktop
npm run build          # Build Electron app
npm run build:mac      # macOS DMG/ZIP
npm run build:win      # Windows installer

# Web
npm run build:web      # Builds to dist-web/

# Mobile
npm run build:ionic    # Builds to dist-ionic/ and syncs with native platforms
```

## Mobile Development

### Testing in Browser
The easiest way to test is in your browser:
```bash
npm run dev:ionic
# Opens at http://localhost:3001
```

### Testing on iOS Simulator/Device

**Requirements:**
- macOS with Xcode installed
- CocoaPods: `sudo gem install cocoapods`

**Steps:**
```bash
# 1. Build the app
npm run build:ionic

# 2. Install iOS dependencies (first time only)
cd ios/App
pod install
cd ../..

# 3. Open in Xcode
npx cap open ios

# 4. In Xcode, select your simulator/device and click Run
```

**Live Reload (Development):**
```bash
# 1. Start the dev server
npm run dev:ionic

# 2. Update capacitor.config.ts to point to your local server:
# Uncomment these lines in capacitor.config.ts:
#   server: {
#     url: 'http://localhost:3001',
#     cleartext: true
#   }

# 3. Sync and open
npx cap sync
npx cap open ios

# Your iOS app will now load from the dev server with live reload!
```

### Testing on Android Emulator/Device

**Requirements:**
- Android Studio installed
- Java 11 or newer (Java 17 recommended)
  - Check: `java -version`
  - Install via Homebrew: `brew install openjdk@17`
  - Set JAVA_HOME: `export JAVA_HOME=/usr/local/opt/openjdk@17`

**Steps:**
```bash
# 1. Build the app
npm run build:ionic

# 2. Open in Android Studio
npx cap open android

# 3. In Android Studio:
#    - Wait for Gradle sync to complete
#    - Select your emulator/device
#    - Click Run
```

**Live Reload (Development):**
```bash
# 1. Start the dev server
npm run dev:ionic

# 2. Find your local IP address
ipconfig getifaddr en0  # macOS
# Or check System Preferences > Network

# 3. Update capacitor.config.ts:
#   server: {
#     url: 'http://YOUR_IP:3001',  # e.g., http://192.168.1.10:3001
#     cleartext: true
#   }

# 4. Sync and run
npx cap sync
npx cap open android

# Your Android app will now load from the dev server with live reload!
```

## Common Commands

### Capacitor
```bash
# Sync web assets to native platforms (run after building)
npx cap sync

# Sync specific platform
npx cap sync ios
npx cap sync android

# Open in native IDE
npx cap open ios
npx cap open android

# Add new Capacitor plugin
npm install @capacitor/camera
npx cap sync
```

### Check Platform Status
```bash
npx cap doctor
```

## Project Structure

### New Files Added
```
capacitor.config.ts          # Capacitor configuration
ionic/
  └── vite.config.js         # Ionic-specific Vite config
ios/                         # iOS native project (auto-generated)
  └── App/                   # Xcode project
android/                     # Android native project (auto-generated)
  └── app/                   # Android Studio project
dist-ionic/                  # Built web assets for mobile
```

### Build Outputs
- `dist/` - Electron desktop app
- `dist-web/` - Web PWA
- `dist-ionic/` - Mobile web assets (synced to ios/ and android/)

## Native Features

Your Vue components can now access native device features via Capacitor plugins:

### Example: Camera Access
```bash
npm install @capacitor/camera
npx cap sync
```

```javascript
// In your Vue component
import { Camera, CameraResultType } from '@capacitor/camera';

const takePicture = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri
  });

  // Use image.webPath
};
```

### Popular Plugins
- `@capacitor/camera` - Camera and photos
- `@capacitor/haptics` - Haptic feedback
- `@capacitor/push-notifications` - Push notifications
- `@capacitor/share` - Native share dialog
- `@capacitor/status-bar` - Status bar styling
- `@capacitor/keyboard` - Keyboard events
- `@capacitor/network` - Network status
- `@capacitor/geolocation` - GPS location

[Browse all official plugins](https://capacitorjs.com/docs/apis)

## Troubleshooting

### iOS Issues

**"CocoaPods not installed"**
```bash
sudo gem install cocoapods
cd ios/App
pod install
```

**"xcodebuild requires Xcode"**
- Install Xcode from App Store
- Open Xcode and accept license agreement
- Run: `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer`

### Android Issues

**"Requires JVM runtime version 11"**
```bash
# Install Java 17
brew install openjdk@17

# Set JAVA_HOME (add to ~/.zshrc or ~/.bash_profile)
export JAVA_HOME=/usr/local/opt/openjdk@17
export PATH="$JAVA_HOME/bin:$PATH"

# Reload shell
source ~/.zshrc
```

**Gradle sync fails**
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### General Issues

**"No such file or directory: dist-ionic"**
```bash
# Build the app first
npm run build:ionic
```

**Changes not showing in mobile app**
```bash
# Rebuild and sync
npm run build:ionic
# Or if using live reload, just refresh the app
```

## Deploying to App Stores

### iOS App Store

1. **Configure app in Xcode:**
   ```bash
   npx cap open ios
   ```
   - Set Bundle Identifier
   - Set app version/build number
   - Configure signing certificates
   - Add app icons (ios/App/App/Assets.xcassets/)

2. **Build for release:**
   - Select "Any iOS Device (arm64)" in Xcode
   - Product > Archive
   - Upload to App Store Connect

3. **Submit for review** via App Store Connect

### Google Play Store

1. **Configure app in Android Studio:**
   ```bash
   npx cap open android
   ```
   - Set applicationId in android/app/build.gradle
   - Set versionCode and versionName
   - Add app icons (android/app/src/main/res/)

2. **Generate signed APK/Bundle:**
   - Build > Generate Signed Bundle/APK
   - Create keystore if needed
   - Select Release build type

3. **Upload to Google Play Console** and submit for review

## Next Steps

### Recommended Enhancements

1. **Add splash screens** for iOS and Android
2. **Implement native features** like push notifications
3. **Add haptic feedback** on button interactions
4. **Optimize for mobile screens** with responsive CSS
5. **Handle network status** for offline capability
6. **Add native share** functionality

### Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Development Guide](https://capacitorjs.com/docs/ios)
- [Android Development Guide](https://capacitorjs.com/docs/android)
- [Capacitor Plugins](https://capacitorjs.com/docs/apis)
- [Vue + Capacitor Guide](https://capacitorjs.com/docs/guides/ionic-framework-app)

## Summary

Your app now runs on **5 platforms** with **one codebase**:
- ✅ macOS Desktop (Electron)
- ✅ Windows Desktop (Electron)
- ✅ Linux Desktop (Electron)
- ✅ Web Browser (PWA)
- ✅ iOS & Android (Capacitor) ← NEW!

All sharing the same Vue 3 components, Pinia stores, and business logic!
