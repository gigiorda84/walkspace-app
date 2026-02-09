# Fix: Tour completion triggers too early / crash at point 8-9 transition

## Analysis from user logs

Three devices reported issues during the "UNSEEN" tour (9 points):

1. **Xiaomi 2311DRK48G (Android 15)** — Logs cut off mid-line. Audio state shows "Paused 3:28/3:28" (finished). Has background location.
2. **Nothing A142 (Android 14)** — Audio "Paused 9:50/9:51". Has **no background location permission** — location updates stop when screen locks.
3. **Motorola moto g34 (Android 14)** — Only 3 log entries: went straight to completion screen "Loaded tour for completion: UNSEEN" with "No audio loaded". Has background location.

## Root Cause

**Critical bug in `PlayerViewModel.kt` lines 110-124: `onPlaybackCompleted` callback.**

The current code:
```kotlin
audioPlayerManager.onPlaybackCompleted = {
    locationManager.advanceToNextPoint()       // Advances index, may auto-trigger next point
    if (!locationManager.hasMorePoints) {      // Checks AFTER advance
        _isTourComplete.value = true           // Marks tour complete!
    }
}
```

The problem: `hasMorePoints` is checked **AFTER** `advanceToNextPoint()`. When point 8's audio (index 7) finishes:

- `advanceToNextPoint()` sets `currentPointIndex` to 8 (the last index)
- If point 9 was queued, it fires `onPointTriggered` which starts loading audio **asynchronously**
- Back in `onPlaybackCompleted`, `hasMorePoints` = `8 < 8` = **false**
- Tour is marked complete **immediately**, before point 9's audio has a chance to play
- UI navigates to completion screen, ViewModel gets cleared, audio stops

This happens in TWO scenarios:
- **Queued**: User reached point 9's radius while point 8 was playing → point 9 audio starts but tour immediately marked complete
- **Not queued**: User hasn't reached point 9 yet → tour marked complete without point 9 ever playing

**The fix**: Check `hasMorePoints` BEFORE calling `advanceToNextPoint()`. If we're already on the last point and its audio just finished → mark complete. Otherwise → advance (which may auto-trigger the next queued point, whose audio will eventually complete and re-enter this callback).

## Tasks

- [x] 1. Fix the `onPlaybackCompleted` callback ordering in `PlayerViewModel.kt` — check `hasMorePoints` BEFORE calling `advanceToNextPoint()`
- [x] 2. Verify `advanceToNextPoint()` bounds are safe — confirmed: advanceToNextPoint() is now only called when hasMorePoints=true, so index is always valid
- [x] 3. Fix app defaulting to English instead of device language — `UserPreferencesManager.kt`
- [x] 4. Bump version to 1.1.3-beta (versionCode 11) and build release APK

## Review

### Change: 1 file — `PlayerViewModel.kt` (lines 110-128)

Swapped the order of operations in `onPlaybackCompleted`:

**Before:** `advanceToNextPoint()` first, then check `hasMorePoints` → tour marked complete prematurely because advancing to the last index makes `hasMorePoints` return false, even if a queued point's audio just started loading.

**After:** Check `hasMorePoints` first. If already on the last point → mark complete. Otherwise → advance. This ensures the last point's audio always plays fully before the completion screen appears.

### Change 2: `UserPreferencesManager.kt`

Added a `deviceLanguage` property that reads `Locale.getDefault().language` and checks if it's in `SUPPORTED_LANGUAGES` (en, it, fr). If yes, uses it; otherwise falls back to "en".

**Before:** `preferredLanguage` and `getPreferredLanguageOnce()` defaulted to `Constants.DEFAULT_LANGUAGE` ("en") when no preference was saved.

**After:** They default to `deviceLanguage` instead. Italian phone → Italian app. French phone → French app. Unsupported language → English. Once the user explicitly sets a language in settings, that takes priority.

## Secondary observations (not fixing now, just documenting)

- **Nothing device has no background location**: Users should be warned if background location is not granted. Audio works but GPS stops when screen is off.
- **Motorola 3-log case**: Likely the app was killed and reopened, landing on completion screen from preserved nav state. The completion fix above should prevent premature completion.
