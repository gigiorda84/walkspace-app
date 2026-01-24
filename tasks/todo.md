# Plan: Improve Audio Loading UX for Download vs Stream Modes

## Problem
When streaming (not downloading), the first point's audio takes time to download but shows no progress indicator. Users see "Player not ready" which is confusing. Also, subsequent points have no pre-loading.

## Requirements
1. **Download mode**: Already works - downloads all files before tour starts with progress
2. **Stream mode**:
   - Show download progress indicator while first point's audio is loading
   - Pre-download the next point in the background (silently) while current plays

## Tasks

### AudioPlayerManager.swift
- [x] 1. Add `isLoading` and `loadingProgress` published properties
- [x] 2. Add `audioCache` dictionary for pre-downloaded audio data
- [x] 3. Modify `play()` method to check cache first and track loading progress
- [x] 4. Add `preloadAudio()` method for background pre-downloading

### PlayerView.swift
- [x] 5. Create `AudioLoadingOverlayView` component
- [x] 6. Add loading overlay that shows when `audioManager.isLoading && !setupConfig.isDownloaded`
- [x] 7. Add `preloadNextPoint()` method
- [x] 8. Add `.onChange` observer to trigger preload when audio starts playing

### Testing
- [ ] 9. Test download mode (should work same as before)
- [ ] 10. Test stream mode with loading indicator
- [ ] 11. Test preloading behavior

## Files Modified
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Services/AudioPlayerManager.swift`
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Player/PlayerView.swift`

---

## Review

### Summary of Changes

**AudioPlayerManager.swift:**
- Added `@Published var isLoading: Bool` - tracks when audio is being downloaded
- Added `@Published var loadingProgress: Double` - tracks download progress (0.0-1.0)
- Added `audioCache: [String: Data]` - stores pre-downloaded audio data
- Modified `play()` method to:
  - Check cache first (for instant playback of pre-downloaded audio)
  - Use `URLSession.shared.bytes()` for streaming download with progress tracking
  - Update `isLoading` and `loadingProgress` during download
- Added new `playFromData()` helper method to play audio from cached Data
- Added `preloadAudio(audioURL:)` method for background pre-downloading
- Added `clearCache()` method to clean up cached audio

**PlayerView.swift:**
- Added `AudioLoadingOverlayView` component showing:
  - Circular progress indicator with percentage
  - "Loading audio..." text
  - Semi-transparent dark background
- Added loading overlay that shows only in stream mode (`!setupConfig.isDownloaded`)
- Added `preloadNextPoint()` method to preload next point's audio
- Added `.onChange(of: audioManager.isPlaying)` observer to trigger preload when audio starts

### How It Works

1. **Stream Mode (isDownloaded = false):**
   - When audio loads, progress overlay appears with percentage
   - When audio starts playing, next point's audio pre-downloads silently
   - When user advances to next point, cached audio plays instantly

2. **Download Mode (isDownloaded = true):**
   - No change - uses local files as before
   - Loading overlay never shows (audio loads instantly from disk)

### Testing Notes
- Test with "Stream Only" option in TourSetupView
- Loading overlay should appear while first point downloads
- Skip to point 2, then back to point 1 - should be faster (cached)
- Check debug logs for "Preloading next audio" and "Playing from cache" messages
