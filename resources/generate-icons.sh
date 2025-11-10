#!/bin/bash
# Icon generation script for Scrum Poker app
# This script converts the SVG icon to platform-specific formats

set -e

echo "🎨 Generating icons for Scrum Poker app..."

# Check for required tools
if ! command -v rsvg-convert &> /dev/null; then
    echo "❌ rsvg-convert not found. Installing..."
    echo "   On macOS: brew install librsvg"
    echo "   On Ubuntu/Debian: sudo apt-get install librsvg2-bin"
    exit 1
fi

if ! command -v convert &> /dev/null && ! command -v magick &> /dev/null; then
    echo "❌ ImageMagick not found. Installing..."
    echo "   On macOS: brew install imagemagick"
    echo "   On Ubuntu/Debian: sudo apt-get install imagemagick"
    exit 1
fi

# Create temp directory
TEMP_DIR="$(mktemp -d)"
echo "📁 Working in: $TEMP_DIR"

# Generate high-res PNG from SVG
echo "🔄 Converting SVG to PNG (1024x1024)..."
rsvg-convert -w 1024 -h 1024 icon.svg -o "$TEMP_DIR/icon-1024.png"

# Generate PNG in various sizes
echo "🔄 Generating multiple PNG sizes..."
for size in 16 32 48 64 128 256 512; do
    rsvg-convert -w $size -h $size icon.svg -o "$TEMP_DIR/icon-${size}.png"
done

# Create Linux icons directory
echo "🐧 Creating Linux icons..."
mkdir -p icons
for size in 16 32 48 64 128 256 512; do
    cp "$TEMP_DIR/icon-${size}.png" "icons/${size}x${size}.png"
done

# Create Windows ICO file
echo "🪟 Creating Windows icon (icon.ico)..."
if command -v convert &> /dev/null; then
    convert "$TEMP_DIR/icon-16.png" "$TEMP_DIR/icon-32.png" "$TEMP_DIR/icon-48.png" \
            "$TEMP_DIR/icon-64.png" "$TEMP_DIR/icon-128.png" "$TEMP_DIR/icon-256.png" \
            icon.ico
else
    magick "$TEMP_DIR/icon-16.png" "$TEMP_DIR/icon-32.png" "$TEMP_DIR/icon-48.png" \
           "$TEMP_DIR/icon-64.png" "$TEMP_DIR/icon-128.png" "$TEMP_DIR/icon-256.png" \
           icon.ico
fi

# Create macOS ICNS file
echo "🍎 Creating macOS icon (icon.icns)..."
ICONSET_DIR="$TEMP_DIR/icon.iconset"
mkdir -p "$ICONSET_DIR"

# Generate all required sizes for macOS
rsvg-convert -w 16 -h 16 icon.svg -o "$ICONSET_DIR/icon_16x16.png"
rsvg-convert -w 32 -h 32 icon.svg -o "$ICONSET_DIR/icon_16x16@2x.png"
rsvg-convert -w 32 -h 32 icon.svg -o "$ICONSET_DIR/icon_32x32.png"
rsvg-convert -w 64 -h 64 icon.svg -o "$ICONSET_DIR/icon_32x32@2x.png"
rsvg-convert -w 128 -h 128 icon.svg -o "$ICONSET_DIR/icon_128x128.png"
rsvg-convert -w 256 -h 256 icon.svg -o "$ICONSET_DIR/icon_128x128@2x.png"
rsvg-convert -w 256 -h 256 icon.svg -o "$ICONSET_DIR/icon_256x256.png"
rsvg-convert -w 512 -h 512 icon.svg -o "$ICONSET_DIR/icon_256x256@2x.png"
rsvg-convert -w 512 -h 512 icon.svg -o "$ICONSET_DIR/icon_512x512.png"
rsvg-convert -w 1024 -h 1024 icon.svg -o "$ICONSET_DIR/icon_512x512@2x.png"

iconutil -c icns "$ICONSET_DIR" -o icon.icns

# Clean up
echo "🧹 Cleaning up..."
rm -rf "$TEMP_DIR"

echo "✅ Icons generated successfully!"
echo ""
echo "Generated files:"
echo "  ✓ icon.icns (macOS)"
echo "  ✓ icon.ico (Windows)"
echo "  ✓ icons/ directory (Linux)"
echo ""
echo "You can now build your app with: npm run build:mac or npm run build:win"
