# Mobile Sonic Walkscape - Design Reference

**Purpose:** This document captures the UI/UX design from the React prototype to guide native iOS development.

**App URL:** http://localhost:3000

---

## Brand Identity

### Color Palette
```css
/* Primary Colors */
--brand-purple: #1a1625          /* Dark background */
--brand-surface-purple: #2a1f3d  /* Card/surface backgrounds */
--brand-border-purple: #3d2f52   /* Borders */
--brand-dark: #0f0b14            /* Darkest elements */

/* Accent Colors */
--brand-orange: #d95808          /* Primary CTA, active states */
--brand-yellow: #f5b400          /* Secondary accent, highlights */

/* Text Colors */
--brand-cream: #f8f5f0           /* Primary text */
--brand-muted: #9b8fb5           /* Secondary text, labels */
```

### Typography
- **Headings:** Bold, tracking-tight (tight letter spacing)
- **Body:** Medium weight, relaxed line-height
- **Labels:** Uppercase, wide tracking (0.2-0.3em)
- **Font:** System default (would use SF Pro on iOS)

### Design Principles
1. **Dark Mode First** - Purple/black backgrounds with cream text
2. **Glassmorphism** - Frosted glass effects with backdrop-blur
3. **Soft Shadows** - Multiple layered shadows for depth
4. **Rounded Corners** - 16px-40px border radius (2.5rem max)
5. **Smooth Transitions** - 300-700ms duration, scale animations
6. **Gradient Accents** - Orange-to-darker orange for CTAs

---

## Screen Flows

### 1. Welcome Screen (Onboarding)
**Route:** `/`

**Purpose:** First-time user registration

**Layout:**
- Full-screen dark purple background
- Background grid image (20% opacity, grayscale)
- Centered logo with headphone icon
- Glassmorphic card (frosted purple, 80% opacity)
- Form fields with dark inputs

**Form Fields:**
1. Name (text input)
2. Email (email input)
3. Preferred Language (dropdown: Italian, English, French)
4. Mailing list opt-in (checkbox)

**CTA Button:**
- Full-width rounded pill
- Orange gradient (from #d95808 to darker)
- "Inizia a esplorare" (Start Exploring)
- Arrow icon that shifts right on hover
- Scale animation on click (1.02 → 0.98)

**Key Features:**
- Client-side form validation
- Data stored in localStorage
- Auto-redirect to Discovery after login

---

### 2. Discovery Screen (Tour Catalog)
**Route:** `/discovery`

**Purpose:** Browse available walking tours

**Layout:**
- Header with greeting and notification bell
- Filter chips (All, Protected, Free)
- Vertical scrolling tour cards

**Tour Card Design:**
- Large cover image (800x600 aspect)
- Overlay gradient (transparent → dark)
- Bottom content area:
  - Tour title (bold, cream color)
  - City name with location pin
  - Metadata row: Duration · Distance · Stops
  - Protected badge (lock icon, orange)
  - Language flags

**Interactions:**
- Tap card → Navigate to Tour Detail
- Active filter chip: orange background
- Inactive: transparent with border

**Empty State:**
- "No tours found" message
- Filtered results show count

---

### 3. Tour Detail Screen
**Route:** `/tour/:id`

**Purpose:** View full tour information and start/download

**Layout:**
- Full-height hero image
- Back button (top-left, glassmorphic)
- Bottom sheet with tour info:
  - Title, city, description
  - Stats grid (duration, distance, stops, languages)
  - Start button (orange, full-width)

**Protection Handling:**
- If `isProtected: true`:
  - Show lock icon
  - Require voucher code input
  - Validate before allowing download

**Start Flow:**
- Tap "Start Tour" → Navigate to Settings

---

### 4. Tour Settings Screen
**Route:** `/settings/:id`

**Purpose:** Configure audio language, subtitles, offline mode

**Layout:**
- Header with tour title and back button
- Setting sections (each in a card):

**Settings:**
1. **Audio Language**
   - Radio buttons: Italian, English, French
   - Only shows available languages for tour

2. **Subtitles**
   - Dropdown: Off, Italian, English, French
   - Default: Off

3. **Offline Mode**
   - Toggle switch
   - Shows download status if enabled
   - Download progress indicator (if active)

**CTA:**
- "Continua" button (orange)
- Navigates to Player screen

---

### 5. Tour Player Screen (Active Tour)
**Route:** `/player/:id`

**Purpose:** Immersive audio playback with GPS-triggered points

**Layout:**
- **Full-screen map background:**
  - High-quality satellite/terrain imagery
  - Darkened overlay (20% opacity)
  - Top gradient fade (purple → transparent)
  - Bottom gradient fade (purple → transparent, 70% height)

- **Trail visualization:**
  - SVG path connecting points (yellow, dashed)
  - Animated dash movement

- **Point markers:**
  - Numbered circles (1, 2, 3, 4...)
  - Active point: orange with pulse animation
  - Inactive: dark gray
  - Point labels below markers

- **User location:**
  - Blue pulsing circle
  - Concentric rings for accuracy

**Header (top):**
- Back button (glassmorphic, top-left)
- Tour title (centered)
- Current stop indicator (orange dot + "Tappa 1")
- GPS recenter button (top-right)

**Footer (bottom):**
- **Narrative/Subtitle box:**
  - Glassmorphic purple card
  - Large italicized quote text
  - "Narrazione Immersiva" label
  - Rounded 2.5rem corners

- **Audio controls:**
  - Time display (current / remaining)
  - Progress bar:
    - Orange-to-yellow gradient fill
    - White circle scrubber
    - Click to seek

  - Control buttons:
    - Skip Previous (disabled at start)
    - Replay 10s
    - **Play/Pause** (large white circle, 24px size)
    - Forward 10s
    - Skip Next (disabled at end)

**Completion Modal:**
- Full-screen overlay (purple with blur)
- Success checkmark (orange, animated)
- "Capitolo Uno" heading
- Completion message
- "Continua la Salita" CTA

---

### 6. Support Screen
**Route:** `/support`

**Purpose:** Help, FAQs, contact information

**Layout:**
- Standard header with back button
- Content sections (cards)
- Links to external resources

---

## Component Patterns

### Glassmorphic Cards
```css
background: rgba(42, 31, 61, 0.8);  /* semi-transparent purple */
backdrop-filter: blur(24px);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 2.5rem;
box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
```

### Primary CTA Button
```css
background: linear-gradient(to right, #d95808, #b94807);
border-radius: 9999px;  /* full pill */
padding: 1rem 1.5rem;
font-weight: bold;
box-shadow: 0 10px 30px rgba(217, 88, 8, 0.4);
transition: all 300ms;
&:hover { scale: 1.02; }
&:active { scale: 0.98; }
```

### Icon Buttons
```css
width: 44px;
height: 44px;
border-radius: 1rem;
background: rgba(42, 31, 61, 0.4);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.1);
transition: scale 200ms;
&:active { scale: 0.9; }
```

### Input Fields
```css
background: #0f0b14;  /* dark */
border: 1px solid #3d2f52;  /* border-purple */
border-radius: 0.75rem;
height: 56px;
padding: 1rem;
color: #f8f5f0;  /* cream text */
&:focus {
  ring: 2px solid #d95808;  /* orange */
  outline: none;
}
```

---

## Animations & Transitions

### Page Transitions
- Fade in: 500ms
- Slide up: 700ms with ease-out
- Scale in: 500ms (0.95 → 1.0)

### Interactive Elements
- Hover scale: 1.02 (300ms)
- Active scale: 0.98 (200ms)
- Pulse (markers): 2s infinite

### Audio Player
- Progress bar updates: 1000ms smooth
- Waveform animation: 30s linear infinite
- Narrative text fade: 700ms

---

## Mock Data Structure

### Tour Object
```typescript
{
  id: string;
  slug: string;
  title: string;
  description: string;
  shortSummary: string;
  city: string;
  duration: number;        // minutes
  distance: number;        // kilometers
  stops: number;
  imageUrl: string;
  mapPreviewUrl: string;
  isProtected: boolean;
  languages: string[];     // ['it', 'en', 'fr']
}
```

### User Object
```typescript
{
  name: string;
  email: string;
  language: string;
  mailingList: boolean;
  isLoggedIn: boolean;
}
```

### Audio Settings
```typescript
{
  language: string;        // 'it' | 'en' | 'fr'
  subtitles: string;       // 'Off' | 'it' | 'en' | 'fr'
  offlineMode: boolean;
}
```

---

## Key Interactions

### GPS-Triggered Audio (Planned)
1. User starts tour
2. App monitors GPS location
3. When entering point radius (100-300m):
   - Marker becomes active (orange, pulsing)
   - Audio begins playing automatically
   - Narrative text displays in subtitle box
4. Sequential triggering:
   - Must complete Point 1 before Point 2 unlocks
   - If user enters Point 2 while Point 1 playing:
     - Point 1 finishes completely
     - Point 2 auto-plays after

### Offline Download Flow (Planned)
1. User toggles "Offline Mode" in Settings
2. Download begins:
   - Audio files (.mp3)
   - Images (cover, maps)
   - Subtitle files (.srt)
   - Map tiles for offline viewing
3. Progress indicator shows percentage
4. Once complete, tour is fully playable without network

---

## Native iOS Considerations

### Technologies to Use
- **SwiftUI** for declarative UI
- **MapKit** or **Mapbox SDK** for maps
- **CoreLocation** for GPS geofencing
- **AVFoundation** for audio playback
- **URLSession** for API calls
- **Core Data** or **Realm** for offline storage

### Capabilities Needed
1. **Background Location** - For GPS monitoring while screen locked
2. **Background Audio** - Continue playing when minimized
3. **Significant Location Changes** - Battery-efficient GPS
4. **FileManager** - Cache audio/images locally
5. **UserNotifications** - Alert when entering point radius

### Design System
- Use **SF Symbols** for icons (map, headphones, location, etc.)
- Implement custom **Color Assets** for brand palette
- Create **reusable ViewModifiers** for glassmorphism effect
- Build **custom SwiftUI shapes** for progress bars, markers

### State Management
- **@StateObject** for view models
- **@Published** properties for reactive data
- **Combine** for audio player state
- **@AppStorage** for user preferences

---

## Screens to Build (iOS Priority)

### Phase 1: Core Experience
1. ✅ Welcome/Onboarding
2. ✅ Tour Discovery
3. ✅ Tour Detail
4. ✅ Tour Player (with map)

### Phase 2: Essential Features
5. ✅ Tour Settings
6. ✅ GPS Point Triggering
7. ✅ Audio Playback with Lock Screen Controls

### Phase 3: Advanced
8. ✅ Offline Download Manager
9. ✅ Support/Help
10. ✅ Voucher Redemption

---

## Next Steps

1. **Extract Assets:**
   - Export color palette to Swift Color Assets
   - Document icon requirements (SF Symbols mapping)
   - List required image assets

2. **Create SwiftUI Prototypes:**
   - Build WelcomeView
   - Build TourCardView component
   - Build PlayerView with MapKit

3. **Backend Integration:**
   - Connect to `/tours` endpoint
   - Implement auth flow
   - Download manifest with signed URLs

4. **GPS Implementation:**
   - Set up CoreLocation manager
   - Create geofence monitoring
   - Implement sequential triggering logic

---

**Document Version:** 1.0
**Last Updated:** December 19, 2025
**Prototype URL:** http://localhost:3000
