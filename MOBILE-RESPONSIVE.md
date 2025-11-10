# Mobile Responsive Design Guide

This document outlines the mobile responsive improvements made to the Scrum Poker app for both Electron and Web versions.

## 📱 Overview

The app is now fully responsive and optimized for mobile devices, tablets, and desktop screens. All components adapt seamlessly to different screen sizes.

## 🎯 Breakpoints

We use three main breakpoints:

```css
/* Tablet and small desktop */
@media (max-width: 768px) { }

/* Mobile devices */
@media (max-width: 480px) { }

/* Desktop (default) */
/* No media query needed */
```

## ✅ What's Been Optimized

### Landing Page (`SessionLanding.vue`)
**Desktop:**
- Large title (3rem)
- Side-by-side action cards
- Spacious padding (2rem)
- Large profile section

**Mobile (≤768px):**
- Reduced title (2rem)
- Stacked action cards
- Reduced padding (1.5rem)
- Smaller profile section

**Small Mobile (≤480px):**
- Smaller title (1.75rem)
- Compact padding (1rem)
- Optimized button sizes
- Better use of screen space

### Session View (`App.vue` + `style.css`)
**Desktop:**
- Large poker cards in grid
- Side-by-side action buttons
- Large title (3.5em)

**Mobile:**
- Smaller poker cards (60-70px)
- Stacked buttons (full width)
- Reduced title (1.75-2.25em)
- Optimized spacing

### Profile Setup (`ProfileSetupPage.vue`)
**Desktop:**
- Large welcome title (2.5rem)
- Spacious form layout

**Mobile:**
- Responsive title (1.75-2rem)
- Compact form
- Touch-friendly buttons

### Global Elements (`style.css`)
- Responsive padding
- Flexible card grids
- Touch-friendly buttons
- Optimized font sizes

## 📐 Design Principles

### 1. Touch Targets
All interactive elements meet minimum touch target sizes:
- Buttons: Minimum 44x44px
- Input fields: Comfortable padding
- Cards: Easy to tap

### 2. Typography Scale
Font sizes scale down proportionally:
```
Desktop → Tablet → Mobile
3.5em   → 2.25em → 1.75em   (Main titles)
1.3em   → 1.05em → 0.95em   (Subtitles)
1.1em   → 1em    → 0.95em   (Buttons)
```

### 3. Spacing System
Reduced spacing on smaller screens:
```
Desktop → Tablet → Mobile
2rem    → 1.5rem → 1rem     (Container padding)
2rem    → 1.5rem → 1rem     (Gap between elements)
```

### 4. Layout Adaptation
- **Desktop:** Multi-column layouts
- **Tablet:** Flexible columns that stack if needed
- **Mobile:** Single-column, vertical stack

## 🎨 Component-Specific Changes

### SessionLanding
```css
/* Action cards */
Desktop: Side by side (flex-row)
Mobile:  Stacked (flex-column)

/* Card width */
Desktop: min-width: 300px, max-width: 400px
Mobile:  min-width: 100%, max-width: 100%

/* User info */
Desktop: padding: 1rem 1.5rem, avatar: 2rem
Mobile:  padding: 0.625rem 1rem, avatar: 1.25rem
```

### App Container
```css
/* Leave button */
Desktop: top: 1rem, right: 1rem, font: 0.875rem
Mobile:  top: 0.5rem, right: 0.5rem, font: 0.75rem

/* Waiting message */
Desktop: font-size: 1.25rem
Mobile:  font-size: 1rem
```

### Card Grid
```css
/* Poker cards */
Desktop: minmax(80px, 1fr), gap: 12px
Tablet:  minmax(70px, 1fr), gap: 10px
Mobile:  minmax(60px, 1fr), gap: 8px
```

### Buttons
```css
/* Primary/Secondary buttons */
Desktop: padding: 15px 30px, font: 1.1em
Tablet:  padding: 12px 24px, font: 1em, width: 100%
Mobile:  padding: 10px 20px, font: 0.95em, width: 100%
```

## 🧪 Testing on Mobile

### Using Browser DevTools
1. Open Chrome DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select a device or custom size
4. Test interactions:
   - Profile creation
   - Session joining
   - Card selection
   - Voting flow

### Common Test Devices
- iPhone SE (375x667) - Smallest modern phone
- iPhone 12/13 Pro (390x844) - Standard iPhone
- Pixel 5 (393x851) - Android
- iPad Mini (768x1024) - Tablet
- iPad Pro (1024x1366) - Large tablet

### Real Device Testing
Access from phone on same network:
```bash
# Start dev server
npm run dev:web

# Access from phone
http://192.168.0.5:3001
```

## 📱 PWA Mobile Experience

The web version includes PWA features for better mobile experience:

### Install to Home Screen
**iOS Safari:**
1. Tap Share button
2. Tap "Add to Home Screen"
3. App opens in standalone mode

**Android Chrome:**
1. Tap menu (⋮)
2. Tap "Install app"
3. App opens in standalone mode

### Standalone Mode
When installed as PWA:
- Full-screen experience
- No browser UI
- App-like navigation
- Splash screen

## 🎯 Responsive Checklist

Use this checklist when adding new features:

- [ ] Test on mobile viewport (≤480px)
- [ ] Test on tablet viewport (768px)
- [ ] Test on desktop (≥1024px)
- [ ] Touch targets ≥44px
- [ ] Text readable without zooming
- [ ] Images scale properly
- [ ] Forms usable on mobile
- [ ] Buttons full-width on mobile (if appropriate)
- [ ] No horizontal scrolling
- [ ] Fast load time on mobile networks

## 🔧 Common Issues and Fixes

### Issue: Text too small on mobile
```css
/* Add media query */
@media (max-width: 480px) {
  .element {
    font-size: 0.9rem; /* Reduce but keep readable */
  }
}
```

### Issue: Elements overflow on small screens
```css
/* Add mobile-specific width */
@media (max-width: 480px) {
  .element {
    max-width: 100%;
    padding: 0 0.75rem;
  }
}
```

### Issue: Touch targets too small
```css
/* Increase button/link size */
@media (max-width: 768px) {
  .btn {
    padding: 0.75rem 1.5rem; /* Bigger touch area */
    width: 100%; /* Full width easier to tap */
  }
}
```

### Issue: Layout broken on mobile
```css
/* Stack elements vertically */
@media (max-width: 768px) {
  .container {
    flex-direction: column;
    gap: 1rem;
  }
}
```

## 📊 Performance Tips

### Mobile-Specific Optimizations
1. **Reduce animation complexity** on mobile
2. **Lazy load** large images
3. **Minimize** re-renders
4. **Cache** assets with service worker (PWA)

### Example: Conditional Animations
```javascript
const isMobile = window.innerWidth <= 768;

if (!isMobile) {
  // Run expensive animations only on desktop
  confetti();
}
```

## 🌐 Browser Support

Tested and working on:
- ✅ iOS Safari 14+
- ✅ Android Chrome 90+
- ✅ Desktop Chrome/Edge/Firefox
- ✅ Samsung Internet

## 📝 Future Enhancements

Potential mobile improvements:
- [ ] Swipe gestures for card selection
- [ ] Pull-to-refresh for session updates
- [ ] Vibration feedback on vote submission
- [ ] Mobile-optimized confetti animations
- [ ] Landscape mode optimizations
- [ ] Dark mode toggle
- [ ] Accessibility improvements (larger text options)

## 🎓 Best Practices

1. **Mobile-first approach:** Design for mobile, enhance for desktop
2. **Test early:** Check mobile layout as you build
3. **Use relative units:** rem/em instead of px when appropriate
4. **Touch-friendly:** Make all interactive elements easy to tap
5. **Performance:** Keep mobile experience fast and smooth
6. **Progressive enhancement:** Core features work everywhere, enhanced on capable devices

## 📚 Resources

- [MDN: Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [Touch Target Sizes](https://web.dev/accessible-tap-targets/)

## ✨ Summary

The app is now fully responsive across all screen sizes:
- 📱 **Mobile-first design** for all pages
- 🎯 **Touch-optimized** interactions
- 📐 **Flexible layouts** that adapt seamlessly
- ⚡ **Fast performance** on mobile devices
- 🎨 **Consistent experience** across platforms

Test it on your phone and enjoy Scrum Poker anywhere! 🎉
