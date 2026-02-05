# Fix: Autoplay Failures + App Slowness

## Bug Analysis (from user debug logs)

### BUG 1 (CRITICAL): "Player ready" spam → app feels slow
**Root cause**: `playPointAudio()` is called multiple times for the same point. Each call does `setMediaItem()` + `prepare()` + `play()` on ExoPlayer, even if the same file is already playing. This resets the player each time, firing STATE_READY repeatedly (50+ times in 2 seconds on Motorola).

**Why it happens**: Manual skip (`setPointIndex`) doesn't add the point to `triggeredPoints`, so GPS re-triggers the same point seconds later, calling `playPointAudio` again.

**Evidence**:
- Xiaomi log: Manual skip to point 3 at 16:28:55, then GPS re-triggers point 3 at 16:28:59 (audio restarts)
- Motorola log: 50+ "Player ready, duration: 847344ms" events in 2 seconds

### BUG 2 (HIGH): Double tour initialization resets progress
**Root cause**: `loadAndStartTour()` has no guard. It can be called again if the screen recomposes, which calls `setTourPoints()` → clears `triggeredPoints` → all point progress lost.

**Evidence**: Xiaomi log shows "Manifest loaded: 9 audio, 7 subtitles" + "Set 9 tour points" at both 15:58:00 AND 15:58:06 (6 seconds apart).

### BUG 3 (MEDIUM): Service bound multiple times
**Root cause**: `startTour()` calls `startForegroundService()` + `bindService()` without checking `serviceBound`.

## Plan

### 1. Add guard in `AudioPlayerManager.playFile()` to skip re-prepare if same point already playing
- [x] In `playFile()`: if `_currentPointId.value == pointId` and `_isPlaying.value`, skip setMediaItem/prepare/play
- [x] Same guard in `playUrl()`

### 2. Fix `setPointIndex()` to mark points as triggered
- [x] In `LocationManager.setPointIndex()`: add point to `triggeredPoints` so GPS doesn't re-trigger it

### 3. Guard `loadAndStartTour` against double initialization
- [x] Add a `currentTourId` field; skip if already started for same tourId
- [x] Reset `currentTourId` in `stopTour()` so re-starting works

### 4. Guard service binding in `startTour`
- [x] Check `serviceBound` before calling `startForegroundService` + `bindService`

## Review

### Changes Summary
All 4 fixes are minimal guards (1-4 lines each) that prevent redundant operations without changing any core logic.

### Files Modified
| File | Change |
|------|--------|
| `AudioPlayerManager.kt` | Added early return in `playFile()` and `playUrl()` if same pointId is already playing |
| `LocationManager.kt` | Added `triggeredPoints.add()` in `setPointIndex()` so manual skips are tracked |
| `PlayerViewModel.kt` | Added `currentTourId` guard to prevent double init; added `serviceBound` check before binding |

### What each fix addresses
1. **AudioPlayerManager guard** → Eliminates "Player ready" spam (50+ events → 1 event). Directly fixes app slowness.
2. **setPointIndex triggeredPoints** → Prevents GPS from re-triggering manually-skipped points. Fixes autoplay failures where audio restarts from beginning.
3. **loadAndStartTour guard** → Prevents double initialization that wipes point trigger history mid-tour.
4. **serviceBound guard** → Prevents redundant service binding.

### Note on trigger radius
Both users' tours use 15-25m trigger radii. The PRD recommends 100-300m for reliability. Small radii contribute to missed triggers (user walks past while previous audio plays). This is a data/configuration issue, not a code fix.
