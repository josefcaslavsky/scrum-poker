# Application Resources

This directory contains assets used during the application build process.

## Required Icons

### icon.icns (macOS)
- **Format**: Apple Icon Image format (.icns)
- **Source**: 1024x1024px PNG image
- **Contains**: Multiple sizes (512, 256, 128, 64, 32, 16px at 1x and 2x)
- **Path**: `resources/icon.icns`

**How to create:**
1. Create a 1024x1024px PNG icon
2. Use online converter (e.g., https://cloudconvert.com/png-to-icns)
3. Or use macOS `iconutil` command

### icon.ico (Windows)
- **Format**: Windows Icon (.ico)
- **Source**: 256x256px PNG image
- **Contains**: Multiple sizes (256, 128, 64, 48, 32, 16px)
- **Path**: `resources/icon.ico`

**How to create:**
1. Create a 256x256px PNG icon
2. Use online converter (e.g., https://cloudconvert.com/png-to-ico)
3. Or use tools like GIMP, IcoFX, or Photoshop

### icons/ (Linux, optional)
- **Format**: PNG files
- **Sizes**: 16, 32, 48, 64, 128, 256, 512px
- **Naming**: `16x16.png`, `32x32.png`, etc.
- **Path**: `resources/icons/`

## Icon Design Guidelines

### Design Suggestions
- Theme: Scrum Planning Poker
- Style: Playful, modern
- Colors: Blue gradient (matching app theme: #667eea to #4f46e5)
- Element: Playing card with poker symbols or Fibonacci numbers

### Technical Requirements
- **Minimum size**: 1024x1024px (scale down for other sizes)
- **Format**: PNG with transparency
- **Background**: Transparent or colored (avoid pure white)
- **Simple design**: Must be recognizable at 16x16px
- **Clear edges**: Avoid thin lines that disappear when scaled

### Design Elements
Consider including:
- 🃏 Playing card shape
- Fibonacci sequence (1, 2, 3, 5, 8, 13)
- Poker chip
- Scrum/Agile symbols

## Current Status

⚠️ **Icons not yet created** - Using default Electron icon

The application will build successfully without icons, but will use the default Electron icon. For production releases, custom icons are strongly recommended.

## Creating Icons

### Quick Start (Free Tools)

1. **Design the icon** (Canva, Figma, or any graphics editor)
   - Create 1024x1024px canvas
   - Use blue gradient theme
   - Add playing card or poker elements
   - Export as PNG with transparency

2. **Convert to platform formats**
   - macOS: https://cloudconvert.com/png-to-icns
   - Windows: https://cloudconvert.com/png-to-ico
   - Save files in this directory

3. **Test the build**
   ```bash
   npm run build:mac  # or build:win
   ```

### Example Icon Concept

```
┌─────────────────────┐
│     🃏              │  Simple playing card
│                     │  with centered number
│        5            │  on blue gradient
│                     │  background
│                     │
└─────────────────────┘
```

## Additional Resources

- Any other build resources (splash screens, backgrounds, etc.) can be placed here
- DMG background images (optional)
- Installer graphics (optional)

## Notes

- This directory is referenced in `package.json` under `build.directories.buildResources`
- Files here are only used during build time, not included in the app bundle
- Keep file sizes reasonable (< 1MB per icon file)
