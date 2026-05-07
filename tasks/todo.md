# Bug: Premature autoplay of next track when GPS-triggered audio finishes

## Confirmed location of the iOS app
- Folder: `mobile-app/` (the user was right)
- Swift source: `mobile-app/ios/SonicWalkscape/SonicWalkscape/`
- Key files for this bug:
  - `Services/LocationManager.swift`
  - `Services/AudioPlayerManager.swift`
  - `Views/Player/PlayerView.swift`

## Reported behaviour
1. User enters area for Point N → audio N plays (correct).
2. As soon as audio N finishes, audio for Point N+1 starts automatically — **even though the user is not yet inside Point N+1's radius**.
3. When the user actually walks into Point N+1's area, the track is heard again "correctly" (re-triggered or restarted, depending on local vs streaming mode).

Net effect: user hears 2 tracks where only 1 should have played, and Point N+1 plays in the wrong physical location.

## Root cause (what I found in the code)

The auto-advance logic in `PlayerView` always advances to the next point as soon as the current audio file ends, with **no check whether the user is actually inside the next point's radius**.

### Trace
1. `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Player/PlayerView.swift:179-196`
   ```swift
   .onReceive(audioManager.$didFinishPlaying) { finished in
       if finished {
           if currentPointIndex >= tourPoints.count - 1 {
               showCompletionScreen = true
               ...
           } else {
               // Unconditionally advances regardless of GPS state
               locationManager.advanceToNextPoint()
           }
           audioManager.didFinishPlaying = false
       }
   }
   ```

2. `mobile-app/ios/SonicWalkscape/SonicWalkscape/Services/LocationManager.swift:124-138`
   ```swift
   func advanceToNextPoint() {
       guard currentPointIndex < tourPoints.count - 1 else { ... }
       currentPointIndex += 1
       isPointActive = true
       nextPointQueued = false
       let nextPoint = tourPoints[currentPointIndex]
       nearbyPoint = nextPoint            // <- this is the trigger
       triggeredPoints.insert(nextPoint.id)
       DebugLogger.gps("Point \(nextPoint.order) AUTO-TRIGGERED: ...")
   }
   ```
   Setting `nearbyPoint = nextPoint` immediately fires `PlayerView`'s
   `.onReceive(locationManager.$nearbyPoint)` -> `handlePointTriggered(...)` -> `playAudio(...)`.

3. The **second** playback when the user finally reaches Point N+1's radius:
   - For streaming mode (`AudioPlayerManager.streamFromURL`) the duplicate-URL guard would normally prevent a restart, **but** by then audio N+1 has often finished and the GPS check has reset `isPointActive = false`. When the user enters the radius the proximity check re-fires `nearbyPoint = pointN+1`. Audio N+1 plays again.
   - For local-file mode (`playLocalFile`) there is **no** duplicate guard — every call to `playAudio` calls `cleanupPlayers()` and starts a fresh `AVAudioPlayer.play()`, restarting from the beginning. This is the clearest "I just heard it twice" symptom for downloaded tours.

### Why the existing `nextPointQueued` flag exists but is unused
`checkSequentialPointProximity` already sets `nextPointQueued = true` only when the user has entered Point N+1's radius **while** Point N audio is still playing. That is the one and only scenario where the spec wants auto-advance after the current track ends ("If user enters next region while audio is playing: current audio finishes completely, next audio auto-plays immediately"). However `advanceToNextPoint()` ignores this flag and always advances + auto-triggers.

So the code is missing the gate: **auto-advance the audio only if `nextPointQueued == true`.**

## Plan

Keep changes minimal and localized. One small edit in one file.

- [x] **Step 1 — Gate auto-advance on `nextPointQueued`** (`Services/LocationManager.swift`)
  - Modify `advanceToNextPoint()` so it splits into two paths:
    - If `nextPointQueued == true` (user was already standing in the next radius when audio ended): increment `currentPointIndex`, keep current behaviour — set `isPointActive = true`, `nearbyPoint = nextPoint`, insert into `triggeredPoints`, log `AUTO-TRIGGERED`. Reset `nextPointQueued = false`.
    - If `nextPointQueued == false` (user is *not* in the next radius yet): increment `currentPointIndex` so the proximity loop now watches Point N+1, but **do not** set `nearbyPoint` and **do not** mark `isPointActive`. Set `isPointActive = false`, `nearbyPoint = nil`. The normal `checkSequentialPointProximity` path will trigger N+1 naturally when the user actually walks into its radius.
  - Net effect: zero new flags, no architectural change.

- [x] **Step 2 — Leave `PlayerView`'s `didFinishPlaying` handler as-is** (`Views/Player/PlayerView.swift`)
  - It can keep calling `locationManager.advanceToNextPoint()` unconditionally; the gating now lives inside `advanceToNextPoint()`. This keeps the diff minimal and avoids leaking GPS state into the view.

- [ ] **Step 3 — Manual verification scenarios** (no code; physical/sim test)
  1. Standing inside Point 1's radius, **don't** walk into Point 2 before audio ends -> after audio ends, **no** audio should start. Walking into Point 2's radius later starts Point 2 audio exactly once.
  2. Standing inside Point 1's radius, then walk into Point 2's radius **while** Point 1 audio is still playing -> expect log "Point 2 QUEUED…"; when Point 1 finishes, Point 2 starts immediately and is **not** played a second time.
  3. Last point: audio finishes -> completion screen still appears (existing branch unchanged).
  4. Manual "Next" button still works (uses `moveToNextPoint`, not the GPS path).

## What I am NOT changing (and why)
- The duplicate-URL guard in `streamFromURL` — it's correct; the bug isn't there.
- `playLocalFile`'s lack of a duplicate guard — once Step 1 lands, playback for Point N+1 happens exactly once on the correct GPS event, so the local-file double-play disappears as a side effect. Adding a guard there would be defensive cleanup beyond the scope of this fix.
- The first-point auto-play logic in `fetchManifest` — unrelated to this bug and already conditioned on the user being inside the first radius.

## Review

### What changed
One method, one file: `LocationManager.advanceToNextPoint()` in
`mobile-app/ios/SonicWalkscape/SonicWalkscape/Services/LocationManager.swift`.

The method now branches on `nextPointQueued`:
- **Queued** (user already in next radius when the previous track ended): same behaviour as before — set `isPointActive = true`, `nearbyPoint = nextPoint`, insert into `triggeredPoints`, log `AUTO-TRIGGERED (queued)`, clear `nextPointQueued`.
- **Not queued** (user not in next radius yet): increment `currentPointIndex` so `checkSequentialPointProximity` will now compare against the next point, but **do not** set `nearbyPoint` and **clear** `isPointActive`. Log `ARMED: waiting for user to enter radius`. The normal proximity check will fire `nearbyPoint` exactly once when the user actually enters the radius.

### What didn't change
- `PlayerView.swift` — keeps calling `locationManager.advanceToNextPoint()` unconditionally; the gating is centralised in `LocationManager`.
- `AudioPlayerManager.swift` — untouched. Its streaming duplicate-URL guard is fine; the local-file double-play disappears as a side effect because `playAudio` is now called once per point.
- First-point auto-play in `fetchManifest` — unrelated, already correct.

### Why this is the smallest possible fix
Only one method body changed. No new properties, no new flags, no view-layer changes, no API changes. The pre-existing `nextPointQueued` flag was already being set correctly by `checkSequentialPointProximity`; we just started honouring it.

### Pre-existing SourceKit warnings (not caused by this edit)
SourceKit reported "Cannot find type 'TourPoint' / 'DebugLogger' / 'PerformanceMonitor' in scope" on lines 11, 21, 49, 95, 102, 118, 161 of `LocationManager.swift`. Those types live in sibling files inside the Xcode project (`Models/TourPoint.swift`, `Utilities/DebugLogger.swift`, `Services/PerformanceMonitor.swift`) and resolve correctly when the project builds inside Xcode. None of them are on lines I touched and none are introduced by this fix.

### Manual verification still owed (on device or simulator)
1. Walk into Point 1, let audio finish, **don't** approach Point 2. Expect: silence after Point 1 ends; Point 2 starts only when you cross into its radius. Log shows `Point 2 ARMED:`.
2. Walk into Point 1, then into Point 2 while Point 1 is still playing. Expect: log `Point 2 QUEUED…` followed by `Point 2 AUTO-TRIGGERED (queued):` the moment Point 1 ends. Point 2 plays exactly once.
3. Last point's audio finishes → completion screen still appears (this branch in PlayerView is unchanged).
4. Manual Next/Previous buttons still work (they go through `moveToNextPoint`/`moveToPreviousPoint`, not the GPS path).
