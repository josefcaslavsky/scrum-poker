# Android Development Setup - Complete

## ✅ What Was Installed

### Java Development Kit
- **Java 21** (OpenJDK 21.0.9) - Required for Capacitor 7+
- Location: `/opt/homebrew/opt/openjdk@21`
- Also installed: Java 17 (available if needed for other projects)

### Android SDK
- Location: `~/Library/Android/sdk`
- Platform Tools: Android 34 & 35
- Build Tools: 30.0.2, 34.0.0, 35.0.0
- ADB (Android Debug Bridge): v35.0.2

### Android Studio
- Installed at: `/Applications/Android Studio.app`

## ✅ What Was Configured

### Environment Variables (~/.zshrc)
```bash
# Java 21 for Android development (required for Capacitor 7+)
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export PATH="$JAVA_HOME/bin:$PATH"

# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH="$ANDROID_HOME/platform-tools:$PATH"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

### First Build Completed
- ✅ Gradle build successful
- ✅ APK generated: `android/app/build/outputs/apk/debug/app-debug.apk` (4.0MB)
- ✅ All dependencies resolved

## How to Build the Android App

### Quick Build
```bash
npm run build:ionic
```

This command:
1. Builds your Vue app to `dist-ionic/`
2. Syncs web assets to `android/` and `ios/` directories
3. Updates Capacitor plugins

### Build APK Only
```bash
cd android
./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Clean Build
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

## How to Run on Android Device/Emulator

### Method 1: Using Android Studio (Recommended)

**Step 1: Open the project**
```bash
npx cap open android
```

**Step 2: In Android Studio**
1. Wait for Gradle sync to complete
2. Click the device dropdown (top toolbar)
3. Select your device/emulator
4. Click the green "Run" button ▶️

**If you don't have an emulator:**
1. Tools > Device Manager
2. Click "Create Device"
3. Select a phone (e.g., Pixel 7)
4. Download a system image (e.g., Android 14)
5. Click "Finish"

### Method 2: Using Command Line

**With emulator:**
```bash
# List available emulators
~/Library/Android/sdk/emulator/emulator -list-avds

# Start an emulator
~/Library/Android/sdk/emulator/emulator -avd YOUR_AVD_NAME &

# Install and run app
cd android
./gradlew installDebug
~/Library/Android/sdk/platform-tools/adb shell am start -n com.scrumpoker.app/.MainActivity
```

**With physical device:**
1. Enable Developer Options on your Android device:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings > Developer Options
   - Enable "USB Debugging"

2. Connect device via USB

3. Verify connection:
```bash
~/Library/Android/sdk/platform-tools/adb devices
```

4. Install and run:
```bash
cd android
./gradlew installDebug
```

## Development Workflow

### With Live Reload

**Step 1: Start the dev server**
```bash
npm run dev:ionic
# Runs on http://localhost:3001
```

**Step 2: Get your local IP address**
```bash
ipconfig getifaddr en0
# Example output: 192.168.1.10
```

**Step 3: Update `capacitor.config.ts`**
```typescript
const config: CapacitorConfig = {
  appId: 'com.scrumpoker.app',
  appName: 'Scrum Poker',
  webDir: 'dist-ionic',
  bundledWebRuntime: false,
  server: {
    url: 'http://192.168.1.10:3001',  // Your IP here
    cleartext: true
  }
};
```

**Step 4: Sync and run**
```bash
npx cap sync android
npx cap open android
```

Now your app will load from the dev server with **live reload**! Changes in your Vue code will instantly update on the device.

**When done developing:** Remove or comment out the `server` section in `capacitor.config.ts` before building for production.

## Common Commands

### Capacitor
```bash
# Sync web assets to Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Check setup
npx cap doctor
```

### Gradle (from android/ directory)
```bash
# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Install on connected device
./gradlew installDebug

# Clean build
./gradlew clean

# List all tasks
./gradlew tasks
```

### ADB (Android Debug Bridge)
```bash
# List connected devices
adb devices

# Install APK
adb install path/to/app.apk

# Uninstall app
adb uninstall com.scrumpoker.app

# View logs
adb logcat

# View app-specific logs
adb logcat | grep "Scrum Poker"
```

## Troubleshooting

### "JAVA_HOME is not set"
```bash
source ~/.zshrc
echo $JAVA_HOME
# Should output: /opt/homebrew/opt/openjdk@21
```

If not working, open a new terminal window.

### "Gradle sync failed"
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### "No devices found"
- **Emulator:** Start an emulator from Android Studio (Tools > Device Manager)
- **Physical device:**
  - Check USB connection
  - Enable USB debugging in Developer Options
  - Run `adb devices` to verify

### "Changes not showing in app"
```bash
# Rebuild and sync
npm run build:ionic

# Or if using live reload, just refresh the app
```

### App crashes on startup
```bash
# View crash logs
adb logcat | grep -E "AndroidRuntime|ERROR"
```

## Building for Release (App Store)

### 1. Generate Signing Key
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configure Signing (android/app/build.gradle)
```gradle
android {
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword 'your-password'
            keyAlias 'my-key-alias'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. Build Release Bundle
```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### 4. Upload to Google Play Console
1. Go to https://play.google.com/console
2. Create a new app
3. Upload the `.aab` file
4. Fill in store listing, screenshots, etc.
5. Submit for review

## App Configuration

### Change App Name
Edit `capacitor.config.ts`:
```typescript
appName: 'Your App Name'
```

Then run: `npx cap sync android`

### Change Package ID
Edit `capacitor.config.ts`:
```typescript
appId: 'com.yourcompany.yourapp'
```

Also edit `android/app/build.gradle`:
```gradle
android {
    namespace = "com.yourcompany.yourapp"
    defaultConfig {
        applicationId "com.yourcompany.yourapp"
        // ...
    }
}
```

### Add App Icons
Place icons in:
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` (72x72)
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` (48x48)
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` (96x96)
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` (144x144)
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192x192)

Or use a tool like: https://romannurik.github.io/AndroidAssetStudio/

### Add Splash Screen
Place in `android/app/src/main/res/drawable/splash.png`

Configure in `android/app/src/main/res/values/styles.xml`

## Verifying Current Setup

Run these commands to verify everything is working:

```bash
# Check Java version (should be 21)
java -version

# Check environment variables
echo $JAVA_HOME
echo $ANDROID_HOME

# Check Capacitor
npx cap doctor

# Test build
npm run build:ionic

# Verify APK exists
ls -lh android/app/build/outputs/apk/debug/app-debug.apk
```

## Summary

You now have a complete Android development environment:
- ✅ Java 21 installed and configured
- ✅ Android SDK with latest platforms
- ✅ Android Studio ready to use
- ✅ First APK successfully built
- ✅ Environment variables configured
- ✅ Live reload capable

**Next Steps:**
1. Open Android Studio: `npx cap open android`
2. Create/start an emulator
3. Click Run ▶️
4. See your app running on Android!

For more information, see `README-IONIC.md` for the complete Ionic/Capacitor guide.
