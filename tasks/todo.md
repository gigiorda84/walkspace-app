# Plan: True Audio Streaming for Stream Mode

## Problem
Previously, audio was fully downloaded before playing in stream mode. User wanted true streaming - audio starts playing as soon as buffering allows.

## Solution
Replace `AVAudioPlayer` (requires full file) with `AVPlayer` (supports streaming) for remote URLs.

## Tasks

### AudioPlayerManager.swift
- [x] Replace AVAudioPlayer with AVPlayer for streaming remote URLs
- [x] Keep AVAudioPlayer for local files (downloaded mode)
- [x] Use KVO to observe player status and buffering state
- [x] Add `isBuffering` property instead of `isLoading`/`loadingProgress`
- [x] Remove preload/cache functionality (no longer needed with streaming)

### PlayerView.swift
- [x] Replace loading overlay with simpler buffering overlay
- [x] Remove preloadNextPoint() method and onChange observer
- [x] Show BufferingOverlayView when `audioManager.isBuffering`

## Files Modified
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Services/AudioPlayerManager.swift`
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Player/PlayerView.swift`

---

## Review

### Summary of Changes

**AudioPlayerManager.swift - Complete Rewrite:**
- Added `AVPlayer` + `AVPlayerItem` for streaming remote URLs
- Kept `AVAudioPlayer` for local files (downloaded mode)
- Added `isBuffering` published property (replaces `isLoading`/`loadingProgress`)
- Uses KVO observers to track:
  - Player item status (`.readyToPlay`, `.failed`)
  - Buffer state (`isPlaybackBufferEmpty`)
  - Playback completion (`AVPlayerItemDidPlayToEndTime`)
- Removed preload/cache system (streaming starts immediately)
- `isUsingStreamPlayer` flag tracks which player type is active

**PlayerView.swift:**
- Changed overlay to show only when `audioManager.isBuffering`
- Replaced `AudioLoadingOverlayView` with simpler `BufferingOverlayView`
- Removed `preloadNextPoint()` method
- Removed `.onChange` observer for preloading

### How It Works Now

**Stream Mode (no download):**
1. User enters GPS radius OR presses play
2. `AVPlayer` starts streaming immediately
3. Brief "Buffering..." overlay appears while initial data loads
4. Audio starts playing as soon as enough data is buffered
5. Continues streaming while playing

**Download Mode:**
- Uses `AVAudioPlayer` with local files (no change)
- No buffering overlay (instant playback from disk)

### Key Differences from Previous Approach
| Before | After |
|--------|-------|
| Download entire file, then play | Stream and play simultaneously |
| Progress bar (0-100%) | Simple buffering spinner |
| Preload next point's audio | No preloading needed |
| Uses AVAudioPlayer for all | AVPlayer for streaming, AVAudioPlayer for local |
