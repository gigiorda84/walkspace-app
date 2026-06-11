# Android Debug Report Fixes (v1.1.4-beta build 12)

## Bug 1: "Failed to load tours: Unable to resolve host walkspace-api.onrender.com"

**Root cause:** The device temporarily lost internet (DNS resolution failed). The app itself
can't prevent that — the real bug is that `DiscoveryViewModel.loadTours()` has no offline
fallback. When the network call throws, the tour list goes empty and an error is shown,
even though the app is supposed to be offline-first and the user may have tours fully
downloaded on disk.

**Fix (minimal):** Cache the last successful tours response to a JSON file
(`filesDir/tours_cache.json`) using Gson (already a dependency). On network failure, load
the cached list instead of showing an error. Only show the error if there is no cache.
All changes contained in `DiscoveryViewModel.kt`.

## Bug 2: "[AUDIO] Player ready" logged ~60x/second

**Root cause:** In `PlayerScreen.kt`, the progress slider calls
`onValueChange = { onSeekTo(it.toLong()) }` — this fires on *every frame* while the user
drags the thumb (~every 17ms). Each call hits `ExoPlayer.seekTo()`, which causes a
BUFFERING→READY state transition, which logs "Player ready, duration: …" each time.
Hundreds of seeks per drag also causes audio stutter and the log spam seen in the report.

**Fix (minimal):** Make the slider stateful during drag: keep the dragged position in a
local `remember` state, update the UI only while dragging, and call `onSeekTo()` once in
`onValueChangeFinished`. All changes contained in the `AudioControlsPanel` composable in
`PlayerScreen.kt`.

## Todo

- [x] 1. Update CLAUDE.md: project is no longer "planning phase" — document actual repo
      structure (android-app, mobile-app/ios, backend, cms) and current state
- [x] 2. Fix Bug 2: slider drag → single seek on release (PlayerScreen.kt)
- [x] 3. Fix Bug 1: cache tours list, fall back to cache on network failure
      (DiscoveryViewModel.kt)
- [x] 4. Compile the Android app to verify both fixes build

## Review

All three changes complete; `:app:compileDebugKotlin` passes with no errors.

1. **CLAUDE.md** — replaced the stale "planning phase" status with the actual state
   (all components deployed; Android in production beta on Play, versionCode 15), added
   a Repository Structure section mapping the monorepo directories and the key Android
   packages, and corrected the tech stack (native Kotlin/Compose Android app, Prisma
   backend on Render).

2. **PlayerScreen.kt (Bug 2 — "Player ready" log spam)** — the progress slider was
   calling `seekTo()` on every drag frame (~60×/sec), each one forcing an ExoPlayer
   BUFFERING→READY transition that logged "Player ready" and stuttered playback.
   The slider now holds the drag position in local compose state and issues a single
   `seekTo()` in `onValueChangeFinished`. The elapsed-time label follows the thumb
   while dragging.

3. **DiscoveryViewModel.kt (Bug 1 — tours fail with DNS error when offline)** — the
   DNS failure itself was the device losing internet; the app bug was having no offline
   fallback. The tour list is now cached to `filesDir/tours_cache.json` (Gson, already
   a dependency) after each successful load. On any network failure or API error the
   cached list is shown instead of an error; the error message only appears when there
   is no cache. Download status is recomputed from disk when loading from cache.

Not changed: nothing else. Both fixes are self-contained in their respective files.
