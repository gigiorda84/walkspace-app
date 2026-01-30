# iOS App - Next Steps Implementation Plan

**Goal:** Enhance the iOS app with image loading, refresh functionality, and tour detail fetching

---

## Quick Wins (15-30 min)

### 1. Fix Image URLs
**Problem:** Backend returns relative paths like `/media/images/cover.jpg`
**Solution:** Prepend base URL to make them absolute
**Files:** `Views/Discovery/TourCardView.swift`, `Views/TourDetail/TourDetailView.swift`
**Impact:** Tour images will display instead of placeholders

### 2. Add Pull-to-Refresh
**Problem:** No way to manually reload tours
**Solution:** Add SwiftUI `.refreshable` modifier
**Files:** `Views/Discovery/DiscoveryView.swift`
**Impact:** Users can swipe down to refresh tour list

### 3. Cache Tour List
**Problem:** Tours reload every time you open Discovery
**Solution:** Store tours in UserDefaults/Cache
**Files:** `Services/APIService.swift` or new `CacheManager.swift`
**Impact:** Faster load times, offline viewing of previously loaded tours

---

## Core Features (30-60 min each)

### 4. Fetch Tour Detail with Points
**Problem:** Tour detail doesn't show GPS points
**Solution:**
- Implement `GET /tours/:id` endpoint call
- Update Tour model to include full points array
- Display points in TourDetailView

**Files:**
- `Services/APIService.swift` - Add `fetchTourDetail(id:)` method
- `Views/TourDetail/TourDetailView.swift` - Call API on appear
- Possibly update `Models/Tour.swift` if response differs

**Impact:** Users can see all tour points before starting

### 5. Add Search Functionality
**Problem:** Can't search for specific tours
**Solution:** Add search bar above category filters
**Files:** `Views/Discovery/DiscoveryView.swift`
**Impact:** Easier to find tours in larger lists

---

## Major Features (2-4 hours each)

### 6. Build PlayerView Foundation
**Problem:** "Coming Soon" placeholder when starting tour
**Solution:** Create basic PlayerView with:
- Map display (MapKit)
- Tour points as pins
- Current location indicator
- Basic audio controls UI (play/pause)

**Files:**
- Create `Views/Player/PlayerView.swift`
- Create `Views/Player/MapView.swift`
- Create `Views/Player/AudioControlsView.swift`
- Update `TourDetailView.swift` to navigate to PlayerView

**Impact:** Users can see the tour route on a map

### 7. Implement GPS Point Triggering
**Problem:** No actual tour playback with GPS
**Solution:**
- Integrate LocationManager with PlayerView
- Monitor proximity to tour points
- Trigger audio when entering point radius
- Show visual feedback for active point

**Files:**
- `Views/Player/PlayerView.swift`
- `Services/LocationManager.swift` (already exists, enhance)
- `Services/AudioPlayerManager.swift` (already exists, integrate)

**Impact:** Core tour experience works!

### 8. Complete Welcome/Registration Form
**Problem:** Welcome screen just has "Get Started" button
**Solution:** Add form fields per DESIGN_REFERENCE.md:
- Name input
- Email input
- Language selector (IT/EN/FR)
- Mailing list opt-in checkbox
- Store in UserDefaults
- Optional: Send to backend API

**Files:** `Views/Welcome/WelcomeView.swift`

**Impact:** Collect user data for personalization

---

## Order of Implementation

**Recommended sequence:**

1. ✅ **Fix image URLs** (5 min) - Quick visual win
2. ✅ **Add pull-to-refresh** (10 min) - Better UX
3. ✅ **Fetch tour detail** (30 min) - Enables next features
4. ⏸️ **Build PlayerView foundation** (2 hours) - Big visual milestone
5. ⏸️ **GPS point triggering** (2 hours) - Core functionality
6. ⏸️ **Complete Welcome form** (1 hour) - Polish
7. ⏸️ **Add search** (30 min) - Nice to have
8. ⏸️ **Cache tour list** (30 min) - Performance

---

## Let's Start!

I'll begin with the quick wins to get immediate improvements, then move to the bigger features.

**Ready to proceed?**
