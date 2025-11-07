# Building Scrum Poker

This document explains how to build distributable installers for Scrum Poker.

## Prerequisites

- Node.js 18+ and npm installed
- All dependencies installed (`npm install`)
- Tests passing (`npm test` and `npm run test:e2e`)

## Build Commands

### Build for Current Platform
```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Build for both platforms (macOS only)
npm run build:all
```

### Output
All build artifacts are created in the `dist/` directory:

**macOS:**
- `Scrum Poker-1.0.0.dmg` - DMG installer
- `Scrum Poker-1.0.0-mac.zip` - ZIP archive
- Builds for both Intel (x64) and Apple Silicon (arm64)

**Windows:**
- `Scrum Poker Setup 1.0.0.exe` - NSIS installer
- `Scrum Poker 1.0.0.exe` - Portable executable
- Builds for both 64-bit (x64) and 32-bit (ia32)

## Application Icons

### Required Icon Files

Place the following icon files in the `resources/` directory:

#### macOS (icon.icns)
- 1024x1024 PNG source file
- Convert to .icns format (use online converter or Xcode)
- Path: `resources/icon.icns`

#### Windows (icon.ico)
- 256x256 PNG source file
- Convert to .ico format with multiple sizes (256, 128, 64, 48, 32, 16)
- Path: `resources/icon.ico`

#### Linux (optional)
- Place PNG files in `resources/icons/` directory
- Recommended sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256, 512x512

### Icon Design Suggestions

For a Scrum Poker app, consider:
- 🃏 Playing card with Fibonacci numbers
- Blue gradient theme (matching the app UI)
- Simple, recognizable design
- Clean lines for small sizes

### Tools for Icon Creation

**Free Online Tools:**
- [CloudConvert](https://cloudconvert.com/) - PNG to ICNS/ICO conversion
- [iConvert Icons](https://iconverticons.com/) - Multi-platform icon generator
- [Canva](https://www.canva.com/) - Icon design (free tier available)

**macOS Tools:**
- Xcode's `iconutil` command-line tool
- Image2Icon app

**Windows Tools:**
- IcoFX (free for personal use)
- GIMP with ICO plugin

## Code Signing (Optional)

### macOS
To distribute outside the Mac App Store, you'll need:
1. Apple Developer account ($99/year)
2. Developer ID Application certificate
3. Update `package.json` build config:
```json
"mac": {
  "identity": "Developer ID Application: Your Name (TEAM_ID)",
  "hardenedRuntime": true,
  "entitlements": "build/entitlements.mac.plist",
  "entitlementsInherit": "build/entitlements.mac.inherit.plist"
}
```

### Windows
To avoid SmartScreen warnings:
1. Purchase code signing certificate (StartSSL, Comodo, etc.)
2. Add certificate to build config:
```json
"win": {
  "certificateFile": "path/to/certificate.pfx",
  "certificatePassword": "your-password"
}
```

## Build Configuration

The build configuration is defined in `package.json` under the `"build"` key. Key settings:

- **appId**: `com.scrumpoker.app` - Unique application identifier
- **productName**: `Scrum Poker` - Display name
- **directories.output**: `dist` - Output directory
- **files**: Only includes `out/**/*` (built application files)

### Platform-Specific Settings

**macOS:**
- Creates universal binaries (Intel + Apple Silicon)
- DMG with drag-to-Applications installer
- Dark mode support enabled
- Category: Developer Tools

**Windows:**
- NSIS installer with custom options
- Portable .exe version
- Desktop and Start Menu shortcuts
- Per-user installation (not system-wide)

## Testing Builds

Before distributing:

1. **Install and launch** the built application
2. **Test all features** (voting rounds, timer, results)
3. **Check for console errors** (DevTools should be disabled)
4. **Test on clean system** if possible

### macOS Testing
```bash
# After building
open dist/Scrum\ Poker-1.0.0.dmg
# Mount DMG, drag to Applications, test launch
```

### Windows Testing
```bash
# Run the installer
start dist/"Scrum Poker Setup 1.0.0.exe"
# Complete installation, test launch from Start Menu
```

## Troubleshooting

### Build Fails with "No icon found"
- Create placeholder icons (see Icon Requirements above)
- Or remove icon paths from `package.json` temporarily

### DMG Creation Fails on macOS
- Install Xcode Command Line Tools: `xcode-select --install`
- Grant Full Disk Access to Terminal in System Preferences

### Windows Build on macOS
- Requires wine: `brew install wine-stable`
- Or build on actual Windows machine/VM

### "Unsigned app" warnings
- Normal for development builds
- Users can bypass: macOS (Right-click > Open), Windows (Click "More info" > "Run anyway")
- For production, use code signing (see above)

## Continuous Integration

For automated builds, consider:

**GitHub Actions:**
```yaml
- name: Build/release Electron app
  uses: samuelmeuli/action-electron-builder@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    mac_certs: ${{ secrets.MAC_CERTS }}
    mac_certs_password: ${{ secrets.MAC_CERTS_PASSWORD }}
```

**Alternative CI Services:**
- CircleCI
- Travis CI
- AppVeyor (Windows)

## Distribution

### Direct Download
- Host installers on your website/server
- Provide checksums (SHA256) for verification

### GitHub Releases
- Upload to GitHub Releases page
- Tag releases with version numbers

### Mac App Store / Microsoft Store
- Requires additional configuration
- App store guidelines compliance
- Review process

## Auto-Updates (Future Enhancement)

To enable auto-updates, add to `package.json`:
```json
"build": {
  "publish": {
    "provider": "github",
    "owner": "yourusername",
    "repo": "scrum-poker"
  }
}
```

Then integrate `electron-updater` in the main process.

## Version Management

Update version before building:
```bash
# Update package.json version
npm version patch   # 1.0.0 -> 1.0.1
npm version minor   # 1.0.0 -> 1.1.0
npm version major   # 1.0.0 -> 2.0.0
```

## Resources

- [electron-builder docs](https://www.electron.build/)
- [Code Signing Guide](https://www.electron.build/code-signing)
- [Multi Platform Build](https://www.electron.build/multi-platform-build)
