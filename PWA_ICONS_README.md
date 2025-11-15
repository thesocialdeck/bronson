# PWA Icons

The PWA requires two icon files in the `/public` directory:

## Required Icons

1. **icon-192.png** (192x192 pixels)
   - Standard app icon
   - Used for home screen, app launcher
   - Should be maskable (safe zone in center 80%)

2. **icon-512.png** (512x512 pixels)
   - High-resolution app icon
   - Used for splash screens, high-DPI displays
   - Should be maskable (safe zone in center 80%)

## Icon Design Guidelines

**Brand Colors:**
- Primary: Purple (#9333ea)
- Secondary: Pink (#ec4899)
- Background: White (#ffffff)

**Design Recommendations:**
- Use a simple, recognizable symbol (calendar, family, or "B" monogram)
- Ensure good contrast against both light and dark backgrounds
- Keep important elements in the center 80% (maskable safe zone)
- Test on both iOS and Android devices

## Creating Icons

### Option 1: Use a Design Tool
- Figma, Sketch, Adobe Illustrator
- Create artboard at 512x512
- Export as PNG at 1x (512x512) and 0.375x (192x192)

### Option 2: Use an Icon Generator
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/

### Option 3: Simple Placeholder (for testing)
```bash
# Create simple colored squares as placeholders
convert -size 192x192 xc:"#9333ea" /public/icon-192.png
convert -size 512x512 xc:"#9333ea" /public/icon-512.png
```

## Installing Icons

1. Create the two PNG files as specified above
2. Place them in the `/public` directory
3. The app will automatically use them (already configured in manifest.json)

## Maskable Icons

A maskable icon means the icon adapts to different shapes:
- Circle (Android Oreo+)
- Squircle (iOS)
- Square (Windows)

Ensure critical content stays within the safe zone:
```
┌─────────────────┐
│     [192px]     │  Full canvas
│  ┌───────────┐  │
│  │           │  │
│  │  [154px]  │  │  Safe zone (80%)
│  │  CONTENT  │  │  Keep logo/text here
│  │   HERE    │  │
│  │           │  │
│  └───────────┘  │
└─────────────────┘
```

## Testing

After adding icons:
1. Build the app: `npm run build`
2. Serve the app: `npm run dev`
3. Open in Chrome DevTools > Application > Manifest
4. Verify icons appear correctly
5. Try "Install App" prompt (desktop Chrome)
6. Test on mobile device for home screen icon

## Current Status

⚠️ **Placeholder icons needed** - Add icon-192.png and icon-512.png to /public/ directory before deploying.
