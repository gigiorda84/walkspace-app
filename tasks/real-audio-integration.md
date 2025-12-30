# Real Audio Integration - Phase 2, Task 3

## Overview
Connect GPS-triggered audio system to backend API to fetch and play real audio files when users enter tour points.

## Current State

### ✅ What We Have
- GPS triggering works (sequential point detection)
- AudioPlayerManager with `play(audioURL: String)` method
- Backend manifest endpoint: `GET /tours/{id}/manifest?language=en`
- Backend returns audio URLs per point with signed URLs

### ❌ What's Missing
- TourManifest model to parse backend response
- API method to fetch manifest
- Connection between GPS trigger → audio playback
- Audio loading states (loading, error, ready)
- Error handling for network/audio failures

## Backend Manifest Response

```json
{
  "tourId": "...",
  "language": "en",
  "version": 1,
  "audio": [
    {
      "pointId": "d1fe07dc-fd45-4d82-8a6a-3647f3d21c51",
      "order": 1,
      "fileUrl": "/media//media/audio/intro.mp3",
      "fileSizeBytes": 1024000
    }
  ],
  "images": [],
  "subtitles": [
    {
      "pointId": "...",
      "language": "en",
      "fileUrl": "/media//media/subtitles/intro-en.srt",
      "fileSizeBytes": 5000
    }
  ],
  "offlineMap": { ... }
}
```

## Implementation Plan

### 1. Create TourManifest Model ⏳

**File**: `Models/TourManifest.swift` (new file)

**Purpose**: Parse manifest response from backend

```swift
struct TourManifest: Codable {
    let tourId: String
    let language: String
    let version: Int
    let audio: [AudioFile]
    let images: [ImageFile]
    let subtitles: [SubtitleFile]
    let offlineMap: OfflineMap?

    struct AudioFile: Codable {
        let pointId: String
        let order: Int
        let fileUrl: String
        let fileSizeBytes: Int
    }

    struct ImageFile: Codable {
        let pointId: String?
        let fileUrl: String
        let fileSizeBytes: Int
    }

    struct SubtitleFile: Codable {
        let pointId: String
        let language: String
        let fileUrl: String
        let fileSizeBytes: Int
    }

    struct OfflineMap: Codable {
        let tilesUrlTemplate: String
        let bounds: Bounds
        let recommendedZoomLevels: [Int]

        struct Bounds: Codable {
            let north: Double
            let south: Double
            let east: Double
            let west: Double
        }
    }
}
```

**Complexity**: Simple - just model matching backend schema

---

### 2. Add Manifest Fetching to APIService ⏳

**File**: `Services/APIService.swift`

**Changes**: Add new method

```swift
func fetchTourManifest(tourId: String, language: String = "en") async throws -> TourManifest {
    let urlString = "\(Constants.API.fullURL)/tours/\(tourId)/manifest?language=\(language)"

    guard let url = URL(string: urlString) else {
        throw APIError.invalidURL
    }

    do {
        let (data, response) = try await URLSession.shared.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        let decoder = JSONDecoder()
        let manifest = try decoder.decode(TourManifest.self, from: data)
        return manifest
    } catch let error as DecodingError {
        throw APIError.decodingError(error)
    } catch {
        throw APIError.networkError(error)
    }
}
```

**Complexity**: Simple - copy existing pattern

---

### 3. Add Audio URL Mapping to PlayerView ⏳

**File**: `Views/Player/PlayerView.swift`

**Changes**:
1. Add manifest state
2. Fetch manifest on setup
3. Map audio URLs to points
4. Play audio when GPS triggers

```swift
// Add state
@State private var manifest: TourManifest?
@State private var audioURLsByPointId: [String: String] = [:]
@State private var isLoadingManifest = false
@State private var manifestError: String?

private func setupPlayer() {
    locationManager.setTourPoints(tourPoints)
    locationManager.requestPermission()
    locationManager.startTracking()

    // Fetch manifest
    Task {
        await fetchManifest()
    }

    loadSubtitlesForCurrentPoint()
    startProgressTimer()

    print("🎬 Player setup complete. Fetching audio manifest...")
}

private func fetchManifest() async {
    isLoadingManifest = true
    manifestError = nil

    do {
        let manifest = try await APIService.shared.fetchTourManifest(
            tourId: tour.id,
            language: "en" // TODO: Use user's selected language
        )

        // Map audio URLs by point ID for quick lookup
        var urlMap: [String: String] = [:]
        for audio in manifest.audio {
            // Convert relative URL to full URL
            let fullURL = "\(Constants.API.baseURL)\(audio.fileUrl)"
            urlMap[audio.pointId] = fullURL
        }

        await MainActor.run {
            self.manifest = manifest
            self.audioURLsByPointId = urlMap
            self.isLoadingManifest = false
            print("✅ Manifest loaded: \(manifest.audio.count) audio files")
        }
    } catch {
        await MainActor.run {
            self.manifestError = error.localizedDescription
            self.isLoadingManifest = false
            print("❌ Failed to load manifest: \(error)")
        }
    }
}

private func handlePointTriggered(_ point: TourPoint?) {
    guard let triggeredPoint = point else { return }
    print("📍 GPS Trigger: Point \(triggeredPoint.order) - \(triggeredPoint.title)")

    if let index = tourPoints.firstIndex(where: { $0.id == triggeredPoint.id }) {
        currentPointIndex = index
    }

    loadSubtitlesForCurrentPoint()

    // Auto-play audio if URL is available
    if let audioURL = audioURLsByPointId[triggeredPoint.id] {
        print("🎵 Playing audio: \(audioURL)")
        audioManager.play(audioURL: audioURL)
    } else {
        print("⚠️ No audio URL found for point \(triggeredPoint.id)")
    }
}
```

**Complexity**: Medium - async/await, error handling, URL mapping

---

### 4. Fix AudioPlayerManager Synchronous Download Issue ⏳

**File**: `Services/AudioPlayerManager.swift`

**Problem**: Current `play()` method uses synchronous `Data(contentsOf:)` which:
- Blocks UI thread
- Won't work for remote URLs (only works for local files)
- Causes app freeze while downloading

**Solution**: Use async URLSession download

```swift
func play(audioURL: String) {
    guard let url = URL(string: audioURL) else {
        print("Invalid audio URL")
        return
    }

    // Download audio file asynchronously
    Task {
        do {
            let (data, _) = try await URLSession.shared.data(from: url)

            await MainActor.run {
                do {
                    player = try AVAudioPlayer(data: data)
                    player?.delegate = self
                    player?.volume = settings.volume
                    player?.prepareToPlay()

                    duration = player?.duration ?? 0

                    if settings.autoPlay {
                        player?.play()
                        isPlaying = true
                        startTimer()
                    }

                    print("✅ Audio ready: \(duration)s")
                } catch {
                    print("❌ Failed to initialize audio player: \(error.localizedDescription)")
                }
            }
        } catch {
            print("❌ Failed to download audio: \(error.localizedDescription)")
        }
    }
}
```

**Complexity**: Simple - convert to async/await pattern

---

### 5. Add Loading States to UI (Optional Enhancement) ⏳

**File**: `Views/Player/AudioControlsView.swift`

**Changes**: Show loading indicator while audio downloads

```swift
if isLoadingAudio {
    ProgressView()
        .progressViewStyle(CircularProgressViewStyle(tint: .brandCream))
} else {
    // Existing play/pause button
}
```

**Complexity**: Simple - add loading state UI

---

## Testing Strategy

### 1. Simulator Testing
- Use existing tour: `44bafd9f-077d-4cbc-b90d-e0116dc3b1f5`
- Navigate to tour detail
- Tap "Start Tour"
- Check console for manifest fetch logs
- Simulate GPS location to trigger point
- Verify audio plays automatically

### 2. Console Logging
Expected logs:
```
🎬 Player setup complete. Fetching audio manifest...
✅ Manifest loaded: 2 audio files
📍 GPS Trigger: Point 1 - Historic Square
🎵 Playing audio: http://localhost:3000/media/audio/intro.mp3
✅ Audio ready: 45.2s
```

### 3. Error Scenarios
- [ ] Network error during manifest fetch
- [ ] Invalid audio URL (404)
- [ ] Corrupted audio file
- [ ] Missing audio for point

---

## Edge Cases to Handle

1. **Manifest fetch fails**: Show error in UI, allow retry
2. **Audio URL missing for point**: Log warning, continue to next point
3. **Audio download fails**: Show error, allow manual retry
4. **Multiple rapid triggers**: Queue audio, play sequentially
5. **User skips while loading**: Cancel download, load next audio

---

## Success Criteria

✅ Manifest fetched successfully on player setup
✅ Audio URLs mapped to tour points by ID
✅ GPS trigger automatically plays audio
✅ Audio plays without blocking UI
✅ Console logs show clear debugging info
✅ Errors handled gracefully

---

## Files to Create/Modify

### New Files (1)
1. `Models/TourManifest.swift` - Manifest response model

### Modified Files (3)
1. `Services/APIService.swift` - Add fetchTourManifest method
2. `Services/AudioPlayerManager.swift` - Fix synchronous download issue
3. `Views/Player/PlayerView.swift` - Fetch manifest, map URLs, trigger audio

---

## Estimated Complexity: Medium

- TourManifest model: ~60 lines (simple)
- APIService addition: ~25 lines (simple)
- AudioPlayerManager fix: ~15 lines changed (medium - async conversion)
- PlayerView integration: ~60 lines (medium - async/await, state management)

**Total**: ~2 hours of focused work

---

## Known Limitations (Future Work)

❌ **Offline Support**: Audio downloads on-demand (not cached)
❌ **Language Selection**: Hardcoded to English
❌ **Subtitle Integration**: Manifest has subtitle URLs but not connected
❌ **Progress Indicators**: No download progress for large audio files
❌ **Download Cancellation**: Can't cancel in-progress downloads

These will be addressed in later phases (Offline Download Manager, Language Selection).

---

## Ready to Implement?

All technical details confirmed:
- ✅ Backend manifest endpoint tested
- ✅ Response schema documented
- ✅ Implementation approach clear
- ✅ Edge cases identified

**Next step**: Get user approval, then proceed with implementation!
