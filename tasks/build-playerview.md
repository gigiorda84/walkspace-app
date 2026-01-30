# Task: Build PlayerView for Tour Playback

## Goal
Create the core tour playback experience with map display, tour points, current location, and audio controls.

## Plan

### Phase 1: PlayerView Foundation
- [ ] Create PlayerView.swift - Main container view
- [ ] Set up view state management (current point, playing status, location)
- [ ] Add navigation from TourDetailView

### Phase 2: MapView Integration
- [ ] Create MapView.swift with MapKit
- [ ] Display tour route as polyline
- [ ] Show tour points as custom pins/annotations
- [ ] Show user's current location
- [ ] Center map on tour route
- [ ] Add map styling (follows system dark/light mode)

### Phase 3: Subtitle Overlay
- [ ] Create SubtitlesView.swift
- [ ] Parse .srt subtitle files
- [ ] Sync subtitles with audio playback time
- [ ] Display at bottom of map with glassmorphic background
- [ ] Handle subtitle toggling (show/hide)
- [ ] Smooth fade in/out animations

### Phase 4: Audio Controls UI
- [ ] Create AudioControlsView.swift
- [ ] Play/pause button with animation
- [ ] Progress bar showing audio playback
- [ ] Skip forward/backward buttons (±10s)
- [ ] Current point title and description
- [ ] Time remaining display

### Phase 5: State Management
- [ ] Create PlayerViewModel (or use @State)
- [ ] Track current point index
- [ ] Track playback state (playing, paused, stopped)
- [ ] Track user location updates
- [ ] Track current subtitle text
- [ ] Calculate distance to next point

### Phase 6: Integration
- [ ] Connect LocationManager to PlayerView
- [ ] Connect AudioPlayerManager to PlayerView
- [ ] Sync subtitle updates with audio time
- [ ] Handle point progression (manual for now, GPS-triggered later)
- [ ] Update UI based on location/playback state

## Technical Details

### MapView Requirements
- Use MapKit with SwiftUI (Map view)
- Display polyline from tour route data
- Custom annotations for tour points
- User location enabled
- Initial camera position: centered on tour route
- Map controls: zoom, compass, user location button

### Audio Controls Requirements
- Glassmorphic card design (matching app style)
- Big play/pause button (orange gradient)
- Progress slider with current time / total time
- Point number indicator (e.g., "Point 2 of 5")
- Smooth animations

### PlayerView Layout
```
┌─────────────────────────────┐
│                             │
│         MapView             │
│    (tour route + pins)      │
│                             │
│   ┌─────────────────────┐   │
│   │  Subtitle Text      │   │ ← Overlay at bottom of map
│   │  (glassmorphic)     │   │
│   └─────────────────────┘   │
├─────────────────────────────┤
│   AudioControlsView         │
│   ┌───────────────────┐     │
│   │ Point 2 of 5      │     │
│   │ Historic Square   │     │
│   │ ▶ ━━━━●━━━ 2:34  │     │
│   └───────────────────┘     │
└─────────────────────────────┘
```

### Data Flow
1. User taps "Start Tour" in TourDetailView
2. Navigate to PlayerView with tour data and points
3. PlayerView requests location permission (if needed)
4. Map displays tour route and points
5. Audio controls show first point (not playing yet)
6. User taps play → audio starts
7. LocationManager monitors user position
8. (Future) When near next point → auto-advance

## Files to Create

1. **mobile-app/ios/SonicWalkscape/Views/Player/PlayerView.swift**
   - Main container view
   - Manages tour state
   - Coordinates map, subtitles, and audio controls

2. **mobile-app/ios/SonicWalkscape/Views/Player/MapView.swift**
   - MapKit integration
   - Route polyline display
   - Point annotations
   - User location

3. **mobile-app/ios/SonicWalkscape/Views/Player/SubtitlesView.swift**
   - Subtitle text display
   - Glassmorphic overlay design
   - Fade in/out animations
   - .srt file parsing

4. **mobile-app/ios/SonicWalkscape/Views/Player/AudioControlsView.swift**
   - Audio UI controls
   - Progress tracking
   - Point information display

5. **mobile-app/ios/SonicWalkscape/Utilities/SubtitleParser.swift** (optional)
   - Parse .srt subtitle files
   - Time code matching
   - Subtitle data structure

## Files to Modify

1. **mobile-app/ios/SonicWalkscape/Views/TourDetail/TourDetailView.swift**
   - Update "Start Tour" button to navigate to PlayerView
   - Pass tour data and points

## Dependencies

**Already Available:**
- ✅ LocationManager.swift - GPS tracking
- ✅ AudioPlayerManager.swift - Audio playback
- ✅ TourPoint model - Point data structure
- ✅ Tour model - Tour data

**Need to Handle:**
- Tour route polyline (need to decode from tour version data)
- Audio file URLs (from point localizations)
- Map annotations (custom pin design)

## Success Criteria

- [ ] Map displays with tour route visible
- [ ] All tour points show as pins on map
- [ ] User location shows on map (if permission granted)
- [ ] Subtitles display synced with audio playback
- [ ] Subtitle overlay has glassmorphic design
- [ ] Subtitles fade in/out smoothly
- [ ] Audio controls visible and functional
- [ ] Can play/pause audio
- [ ] Progress bar updates during playback
- [ ] Can skip forward/backward
- [ ] Shows current point information
- [ ] Clean navigation from TourDetail to Player

## Notes

- Keep it simple for v1 - manual point progression
- GPS-triggered auto-advance will be Phase 2
- Focus on UI/UX polish with glassmorphic design
- Handle permission requests gracefully
- Add loading states for audio files

---

**Ready to implement?**
