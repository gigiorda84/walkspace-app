# Automated store uploads (Play service account + App Store Connect API key)

## Goal
Let Claude upload release builds from the command line: Android AAB → Play Console (Gradle Play
Publisher, already configured in `app/build.gradle.kts`), iOS archive → App Store Connect / TestFlight
(`xcodebuild -exportArchive` with an App Store Connect API key, Xcode 26.3).

## Decisions
- Secrets live OUTSIDE the repo (the repo is in iCloud Drive and would sync them):
  - Play JSON key: `~/.config/sonicwalkscape/play-service-account.json`
  - Apple key: `~/.appstoreconnect/private_keys/AuthKey_<KEYID>.p8` (xcodebuild/altool default dir)
  - Apple Key ID + Issuer ID (identifiers, not secrets): `~/.appstoreconnect/sonicwalkscape.env`
- Claude never reads/prints the key files; it only passes their paths to the tools.
- Every actual upload/release still gets an explicit OK in chat (outward-facing action).

## User steps (consoles — only the account owner can do these)
- [x] Google Cloud service account + JSON key → saved at `~/.config/sonicwalkscape/play-service-account.json`.
- [ ] Play Console → Users and permissions → service-account e-mail invited with app permissions
      (to be confirmed by the first upload).
- [x] App Store Connect team key `YP9WJ4XJR2` → `~/.appstoreconnect/private_keys/AuthKey_YP9WJ4XJR2.p8`.
- [x] Issuer ID → `ASC_ISSUER_ID` in `~/.appstoreconnect/sonicwalkscape.env`.

## Claude steps (local, small)
- [x] `android-app/app/build.gradle.kts` `play {}`: also look for the key at
      `~/.config/sonicwalkscape/play-service-account.json` (repo path keeps working).
- [x] `android-app/PUBLISHING.md`: current console steps + key path + "upload a pre-built AAB"
      (`--artifact-dir`, a dir with ONLY that AAB) + promote internal → production.
- [x] iOS: `mobile-app/ios/SonicWalkscape/ExportOptions-AppStore.plist` (destination `upload`) +
      `mobile-app/ios/upload-to-app-store.sh <archive> [--dry-run]` (bash -n + plutil -lint OK).
- [x] `mobile-app/TESTFLIGHT-DEPLOYMENT.md`: "Automated upload" section.
- [x] `~/.appstoreconnect/sonicwalkscape.env` with `ASC_KEY_ID=YP9WJ4XJR2` (chmod 600).
- [ ] Verify once keys exist (each with OK): Android → upload vc26 to `internal`, then promote to
      production; iOS → export-only dry run (signing check), then upload 1.7 (16).

---

# URGENT: audio clips play back to back regardless of GPS (report 23 Oct 2026)

## Problem (field report, group walk)
- Users heard every point's audio one after another with no pause, regardless of where they
  were (at map point 5 the app was already playing audio 8). Reinstalling does not help.

## Root cause (confirmed in code + git history)
- Commit `4f74f95` (26 Mar 2026, "Simplify advanceToNextPoint", Android 1.1.4 / iOS build 11)
  removed the `wasQueued` check in `advanceToNextPoint()` on **both** platforms.
- Since then, whenever ANY point's audio ends, the app immediately auto-plays the next point,
  even if the user hasn't reached it → chain reaction 1→2→3→… racing ahead of the walk.
- The intended rule (CLAUDE.md + the comment still in `PlayerViewModel`): auto-play the next
  point only if the user entered its radius while the current audio was playing ("queued");
  otherwise wait for GPS to trigger it on arrival.
- Why "those who downloaded" noticed it most: local files start instantly; in streaming mode a
  weak connection stalls/fails the next clip, which breaks the chain.

## Fix plan
Plan confirmed by user: core fix + safeguards (+ hide iOS debug icon, reported in the same message).

Core (restores the pre-March logic, both platforms):
- [x] Android `services/LocationManager.kt` `advanceToNextPoint()`: auto-trigger the next point
      only if `wasQueued`; otherwise just move the index and wait for GPS.
- [x] iOS `Services/LocationManager.swift` `advanceToNextPoint()`: same (`isPointActive=false`,
      `nearbyPoint=nil` when not queued, so GPS triggers it on arrival).

Safeguards for the "walking to the next point" state, which this fix brings back (it never
appeared while the chain bug was live):
- [x] Only the current point's audio finishing advances the tour. Otherwise replaying the
      finished clip (Android: rewind after the end; iOS: lock-screen play) would skip the next
      point or end the tour early.
      Android `PlayerViewModel.onPlaybackCompleted` / iOS `PlayerView` `didFinishPlaying`.
- [x] Play button while waiting = play the upcoming point (same as before point 1). Today it
      does nothing on Android and replays the old clip on iOS. This is also the recovery path
      if someone's GPS misses a point ("Next" would skip it, because the index already moved on).
      Android `PlayerViewModel.togglePlayPause` / iOS `PlayerView.togglePlayPause`.

iOS debug icon (user report, same message):
- [x] The "ant" debug toggle in the player was visible to everyone → wrapped in `#if DEBUG`
      (it is the only way to open the debug overlay, so the overlay is hidden too).

Release (state of 1.1.12 / 1.6(15) uploads unknown → versions that are valid either way):
- [x] Android → 1.1.13 / vc26; Play release notes (it/en/fr) mention the fix.
- [x] iOS → 1.7 (16) (a new marketing version works whether or not 1.6 was approved).
- [x] Android signed release AAB (build dir outside iCloud) → BUILD SUCCESSFUL, versionName 1.1.13,
      copied to `android-app/app/build/outputs/bundle/release/app-release-1.1.13-vc26.aab`.
- [x] iOS simulator build → BUILD SUCCEEDED; archive → `mobile-app/ios/SonicWalkscape/build/
      SonicWalkscape-1.7-16.xcarchive` (ARCHIVE SUCCEEDED, 1.7 (16)).
- [x] iOS GPS harness (real `LocationManager.swift` run on the simulator, simulated walk along the
      8 points of "PRESENTI MAI ASSENTI"): new code 11/11 PASS; old code reproduces the field bug
      (audio 2 starts while still at point 1, then restarts on arrival at point 2).
- [x] Android `advanceToNextPoint()` diffed against the pre-`4f74f95` version: identical except log lines.
- [x] Android end-to-end on emulator (debug build, analytics switched off + network off during
      setup so no test events reach production analytics).
- [ ] Commit (awaiting user OK); upload to Play Console + App Store Connect (manual: no Play service
      account / ASC key here).

## Addendum (user request): last point must never be lost + analytics must reach the CMS
History: Feb `2601e4f` fixed "completion screen shown when the PENULTIMATE audio ended, last point
never heard". The March regression (`4f74f95`) most likely tried to force the last point to play,
which created the chain bug. With the queue logic restored, these paths can still lose the last point:
1. Group already standing on the last point when the penultimate audio ends → no new GPS fix
   (5 m / 10 m distance filter) → app waits forever. Fix: re-check the last known position right
   after advancing (both platforms).
2. "Next" while waiting for the last point → `moveToNextPoint` completes the tour WITHOUT playing
   the last audio (both platforms). Fix: while waiting for a point that hasn't played yet, Next (and
   Play) play THAT point instead of skipping it.
3. iOS only: Next/Previous don't update the GPS index → after one manual press GPS keeps waiting
   for a point the group already passed → last point never checked. Fix: sync it like Android
   (`setPointIndex`), and like Android never re-trigger an already-played point (no restart).
4. Content: "PRESENTI MAI ASSENTI" uses 15 m radii (CLAUDE.md recommends 100–300 m) → easy GPS
   misses. Fix in CMS (no code).

Analytics (CMS uses tour_started, tour_completed{durationMinutes,triggerType}, tour_abandoned,
point_triggered count per session):
5. Android keeps unsent events ONLY in memory (iOS persists them). Tour ends without signal (mountains)
   + app closed → tour_completed lost → missing in CMS. Fix: persist the queue (SharedPreferences +
   Gson, like iOS UserDefaults) and flush once at startup.
6. Android doesn't send point_triggered for manual plays (iOS does, as "manual") → session point
   counts differ by platform. Fix: send it from the manual-play path.

Status: items 1–3, 5, 6 implemented (approved); item 4 is content (CMS).
- [x] 1 re-check after advance (Android `LocationManager.advanceToNextPoint`, iOS same)
- [x] 2 Next/Play play the awaited point (Android `PlayerViewModel.isAwaitingCurrentPoint/playCurrentPoint`,
      iOS `PlayerView.playCurrentPoint` + `moveToNextPoint`)
- [x] 3 iOS `LocationManager.setPointIndex` + never re-trigger an already-played point
- [x] 5 Android analytics queue persisted (SharedPreferences + Gson) + flush at startup
- [x] 6 Android manual plays send `point_triggered`

## Addendum 2 (user request): "Scopri" map — tap the dot AND the label
- Android root cause: the label+dot marker (`MarkerComposable`) had no click handler ("label display
  only"); only an invisible pin over the dot was tappable, plus a "within 500 m" map-click fallback
  that at Discovery zoom is a few pixels. Long labels were mostly untappable.
- [x] Android `DiscoveryScreen.TourMarker`: `onClick` on the `MarkerComposable` → whole label + dot tappable.
- iOS: label + dot were already tappable (verified on the simulator with the original code: label
  centre, label ends, long label far end, dot → all open the tour). No iOS change.

## Review
### Root cause
`4f74f95` (26 Mar 2026) removed the "queued" check from `advanceToNextPoint()` on both platforms →
every audio end auto-played the next point → chain racing ahead of the walk. Most likely added to
force the last point to play; with the queue logic restored, the last point is now protected by
re-checking the last GPS fix after each audio, and by Next/Play playing (not skipping) the awaited point.

### Files changed
- Android: `services/LocationManager.kt` (queue check restored + re-check), `ui/player/PlayerViewModel.kt`
  (completion guard, `isAwaitingCurrentPoint`/`playCurrentPoint`, Next/Previous via it + analytics),
  `services/AnalyticsService.kt` (persisted queue), `ui/discovery/DiscoveryScreen.kt` (marker onClick),
  `build.gradle.kts` (1.1.13 / vc26), Play release notes ×3.
- iOS: `Services/LocationManager.swift` (queue check restored + re-check + `setPointIndex` + no
  re-trigger), `Views/Player/PlayerView.swift` (`playingPointId`, completion guard, `playCurrentPoint`,
  Next doesn't skip awaited point, debug icon `#if DEBUG`), `project.pbxproj` (1.7 (16)).

### Verification
- iOS harness (real `LocationManager.swift` on the simulator): walk scenarios 11/11, last-point
  scenarios 8/8 PASS; the first version of the fix fails 4 last-point scenarios (stuck when standing
  still at the end, stuck after a missed penultimate point, restarts on jitter / after manual play);
  the original code reproduces the field bug.
- Android emulator, downloaded UNSEEN tour, simulated GPS, analytics off: no chain; queue works;
  rewind of a finished clip doesn't skip; Play/Next while waiting play the awaited point; group
  standing at the last point with no new GPS fix → last point plays; Next while waiting for the last
  point plays it; completion + `tour_completed` after the last audio; `tour_abandoned` on exit.
- Android release APK (R8): unsent events reloaded after the app is killed offline ("Loaded 1 pending").
- Android map: old APK, long label far end → 3 taps, nothing; fixed APK → 6/6 first-tap opens.
- iOS simulator (downloaded tour): Next ×8, audio 8 ends → "Waiting for point 9" (no chain); Next →
  plays 9 (not completion); Next during 9 → completion screen.

### Incident during testing (needs cleanup)
- The iOS simulator player test sent 11 test events to PRODUCTION analytics (analytics opt-out write
  went to the wrong defaults domain): 1 tour_started, 9 point_triggered, 1 tour_completed, tour UNSEEN,
  24 Oct 2026 ~17:17–17:20 UTC, device `ios-iPhone`, anonymous_id `F5EBE32B-165D-4ED6-BCC6-0823DA344231`
  (simulator-only ID). Removal: `DELETE FROM analytics_events WHERE anonymous_id = 'F5EBE32B-165D-4ED6-BCC6-0823DA344231';`
  (expect 11 rows). Android tests sent nothing.

### Release artifacts
- Android: `android-app/app/build/outputs/bundle/release/app-release-1.1.13-vc26.aab` → Play Console upload.
- iOS: `mobile-app/ios/SonicWalkscape/build/SonicWalkscape-1.7-16.xcarchive` → Xcode Organizer → Distribute.
- Content: consider raising the 15 m radii of "PRESENTI MAI ASSENTI" in the CMS (CLAUDE.md: 100–300 m).

### Build-environment notes
- `.git/index` vanished mid-session (iCloud); rebuilt with `git read-tree HEAD` (index only, no file
  touched). Git commands are very slow in this iCloud folder.

---

# Analytics end-to-end verification & fixes

## Goal
Make sure both apps (Android + iOS) send correct analytics to the CMS, that the CMS
dashboard displays the relevant data, and that all tour started / completed / donation
data can be saved (exported).

## What already works (verified this session)
- Both apps POST to `https://walkspace-api.onrender.com/analytics/events` with matching
  field names (`anonymousId`, `tourId`, `pointId`, `language`, `device`, `osVersion`,
  `timestamp`, `properties`) and matching event-name strings.
- Backend ingests + stores every event (`AnalyticsEvent` table, JSONB `properties`).
- Backend aggregates via `/admin/analytics/{overview,duration,engagement,tours,sessions}`.
- CMS dashboard (`cms/src/app/analytics/page.tsx`) shows: starts, completions, completion
  rate, unique devices, platform split, trigger split, duration analytics, contact-channel
  breakdown, donation provider breakdown, per-tour table, recent sessions.
- CSV/JSON export of raw events already exists (`/admin/analytics/export`).

## Confirmed gaps (root causes)
1. **Android sends NO post-tour engagement events.**
   - iOS fires `follow_us_clicked` and `contact_clicked` (channel = instagram/facebook/
     website/email). Android's "Follow Us" button (TourCompletionScreen.kt:287) + the four
     social buttons in `ConnectBottomSheet` (WelcomeScreen.kt:301-328) fire nothing.
   - Effect: CMS engagement/contact breakdown reflects iOS users only.
2. **CMS never displays `follow_us_clicked`.**
   - Backend returns `followUsClicks` / `followUsPercent` in the engagement DTO, but the
     dashboard doesn't render them.
3. **(Consistency) `tour_started` triggerType differs by platform.**
   - Android always sends `triggerType:"gps"` on start; iOS sends `"manual"` initially.
     Skews the start-time "Trigger Method" split. Completion triggerType is correct on both.
4. **(Enhancement) Donation amount not captured.**
   - Both apps let the user pick €3/€5/€10/custom but only send `provider`, not the amount.

## Plan (CONFIRMED — full scope, Android now, add summary export)
### Android (new build required)
- [ ] Fire `follow_us_clicked` from `TourCompletionScreen` "Follow Us" button.
- [ ] Fire `contact_clicked` (channel = instagram/facebook/website/email) from the four
      `ConnectBottomSheet` social buttons (only when opened from the completion screen,
      matching iOS which tracks only when a tourId is present).
- [ ] Add donation `amount` (€) to `donation_link_clicked` properties (Android has the
      amount chips; iOS has none, so amount stays Android-only + optional server-side).

### Backend
- [ ] Engagement: aggregate donation amount (total raised + avg + per-provider total).
- [ ] Make the GPS/Manual trigger split authoritative: compute overview + per-tour trigger
      breakdown from `tour_completed` events (real primary trigger) instead of the
      provisional `tour_started` placeholder. No app discontinuity, platform-independent.
- [ ] Add aggregated **summary** export (overview + per-tour + donations) via
      `/admin/analytics/export?type=summary`, alongside the existing raw export.

### CMS
- [ ] Show Follow-Us clicks (+ % of completions) in Post-Tour Engagement.
- [ ] Show donation amount (total raised + avg) and per-provider amount in Donations.
- [ ] Add "Export Summary" button (CSV/JSON).
- [ ] Note the trigger split is "among completed tours".

### Not doing (documented follow-ups)
- iOS donation-amount selector: iOS uses a fixed PayPal NCP link with no amount field, so
  adding amount there needs a UI + payment-link change — out of scope, flagged for later.

## Review
All changes implemented and compile-verified (backend `tsc` clean, CMS `tsc` clean,
Android `compileDebugKotlin` exit 0). iOS needed no changes — it already fires the
engagement events correctly.

### Android (needs a new Play build to take effect)
- `TourCompletionViewModel`: `trackDonationClicked` now takes an optional `amount`;
  added `trackFollowUsClicked()` and `trackContactClicked(channel)`.
- `TourCompletionScreen`: "Follow Us" now fires `follow_us_clicked`; donation buttons pass
  the selected amount; the Connect sheet receives a contact callback.
- `WelcomeScreen.ConnectBottomSheet`: added optional `onContactClick(channel)` fired by the
  Instagram/Facebook/Website/Email buttons (no-op when opened outside the completion flow,
  matching iOS which only tracks contacts with a tour context).

### Backend
- `getEngagementAnalytics`: aggregates donation amount — per-provider `totalAmount`, plus
  `totalDonationAmount`, `donationsWithAmount`, `avgDonationAmount`. Amount is optional, so
  iOS clicks (no amount) are simply excluded from money totals.
- `getOverview` + `getTourAnalytics`: GPS/Manual split now computed from `tour_completed`
  (the authoritative "primary trigger type") instead of the provisional `tour_started`
  placeholder — meaningful and platform-independent, with no historical discontinuity.
- Added `exportSummary()` + `type=summary` on `/admin/analytics/export`: aggregated CSV/JSON
  report (overview + per-tour + donations) alongside the existing raw export. Read-only.
- DTOs updated to match.

### CMS
- Donations card shows total € raised and average when amounts are present, plus per-provider €.
- Contact & Social card now shows Follow-Us clicks.
- "Export Summary" button (aggregated report) added next to the raw CSV/JSON buttons.
- Trigger Method card labelled "How completed tours were experienced".

### Verification
- backend `npx tsc --noEmit`: clean.
- cms `npx tsc --noEmit`: clean.
- android `./gradlew compileDebugKotlin`: exit 0.
- Live browser check of /analytics not run: page is auth-gated and renders only from a
  running backend + seeded data, which isn't available in this session.

### Deploy notes
- Backend + CMS changes deploy immediately (Render / CMS host).
- Android engagement + donation-amount events require a new versionCode build + Play release.
- iOS donation amount is NOT captured (no amount selector; fixed PayPal NCP link). Documented
  as a follow-up if per-amount donation reporting is wanted on iOS too.

---

# Sentry ANDROID-2: CameraUpdateFactory NPE crash

## Problem
- Sentry issue ANDROID-2: `NullPointerException: CameraUpdateFactory is not initialized`
  (26 events / 15 users, first seen 15 Jun 2026, still live on release 1.1.9+22).
- Culprit: `DiscoveryScreen.kt:95` — the fit-to-bounds `LaunchedEffect(tourLocations)` called
  `CameraUpdateFactory.newLatLngBounds()` as soon as tours loaded, which on slow devices ran
  before the Google Map finished initializing the factory → crash on the discovery screen.

## Fix (todo)
- [x] Add `mapLoaded` state, set from `GoogleMap(onMapLoaded = { mapLoaded = true })`.
- [x] Gate the animation: `LaunchedEffect(tourLocations, mapLoaded)` runs only when
      `mapLoaded && tourLocations.isNotEmpty()`.
- [x] Verify: `./gradlew :app:compileDebugKotlin` — clean.
- [ ] Ship in next Android build (1.1.10 / next versionCode) + Play release.
- [ ] Resolve ANDROID-2 in Sentry once the fix is confirmed live.

## Review
- One file changed (`DiscoveryScreen.kt`), ~5 lines. Fit-to-bounds behavior preserved; it now
  waits for the map to be ready so `CameraUpdateFactory` is guaranteed initialized.

---

# Sentry cleanup: test-crash triggers + issue triage

## Context
Reviewed all remaining Sentry issues. Only ANDROID-2 was a real recurring crash (fixed above).
Two "issues" were deliberate test crashes; two were single-event ANRs on old builds.

## Actions taken
- [x] Android: gated the "Test crash" button in `DebugScreen.kt` behind `if (BuildConfig.DEBUG)`
      so it no longer ships in production release builds. (`compileDebugKotlin` clean.)
- [x] iOS: no change needed — the test-crash trigger was already removed from
      `DebugOverlayView.swift` in a later build (crash came from old build 1.4+12).
- [x] Resolved ANDROID-1 (test crash) and APPLE-IOS-1 (test crash) in Sentry.

## Left open (monitor, not actionable)
- ANDROID-3 (Background ANR) and ANDROID-4 (ANR): 1 event each, builds 1.1.5/1.1.6, generic
  native `future::get` stack with no in-app frame. Revisit only if they recur on 1.1.9+ with a
  clearer stack.

## Note
- Android diagnostics screen is still reachable in prod via 5-taps-on-version gesture in Settings
  (intentional). Only the crash button is now debug-only; the rest of the diagnostics stay.

---

# Sentry APPLE-IOS-2: "App Hang Fully Blocked" (iOS) + Sentry sweep

## Diagnosis (root cause — NOT an app bug)
- Issue: https://bandite.sentry.io/issues/135635194/ — `App Hang Fully Blocked`, 3 events / 2 users,
  release `1.5 (14)`, iOS 26.5 / 26.6. Reported durations: 5.7–6.5 s and **64 s**.
- Every event: main thread is **idle** at the top-level run loop
  (`UIApplicationMain → __CFRunLoopRun → __CFRunLoopServiceMachPort → mach_msg2_trap`) — no app
  code on the stack, nothing blocked. Hang always starts within seconds of the
  `background → foreground → active` transition (e.g. 11:14 background, 11:55:50 active,
  "hang" 11:55:50.8 → 11:55:57).
- sentry-cocoa 9.17.1 hard-wires App Hang Tracking **V2** on iOS
  (`SentryDependencyContainer.swift:379`). V2 (`SentryANRTrackerV2.m`) infers a hang **purely from
  missing CADisplayLink frames** (`getFramesDelay` → "ongoing frame" ≥ 2 s with
  `framesContributingToDelayCount == 1` ⇒ "fully blocked"). There is no main-thread heartbeat.
  So any window where the process is alive, `applicationIsInForeground == true`, but the phone
  scene isn't rendering (locked screen while audio/location keep the process running, then unlock)
  is reported as a fully-blocking hang.
- This app has `UIBackgroundModes = audio, location` and `allowsBackgroundLocationUpdates = true`
  (`LocationManager.swift:31`) — exactly the non-CarPlay case confirmed in upstream issue
  getsentry/sentry-cocoa#8317 ("background location tracking alone reproduced similar false
  positives"). The upstream fix (PR #8840, adds a main-queue heartbeat) is still an **open draft**,
  so there is no SDK version to upgrade to.
- The 9.x option `enableAppHangTrackingV2` no longer exists; the remaining knobs are
  `enableAppHangTracking`, `enableReportNonFullyBlockingAppHangs`, `appHangTimeoutInterval`.
  Raising the timeout doesn't help (64 s event).

## Plan
- [x] `SonicWalkscapeApp.swift`: set `options.enableAppHangTracking = false` (one line + comment
      linking sentry-cocoa#8317 / PR #8840, re-enable once the heartbeat fix ships). Consistent
      with the existing intent "Crash reporting only". Crash reporting is unaffected.
- [x] Build check: `xcodebuild -scheme SonicWalkscape -sdk iphonesimulator build` → BUILD SUCCEEDED.
- [x] Bumped iOS to `1.6 (15)` (`MARKETING_VERSION` + `CURRENT_PROJECT_VERSION` in both configs of
      `project.pbxproj`). NOTE: App Store Connect rejected `1.5 (15)` — version 1.5 is already
      approved, so its train is closed ("Invalid Pre-Release Train"); a new marketing version is
      required, not just a new build number.
- [ ] Upload 1.6 (15) to TestFlight / App Store: open
      `mobile-app/ios/SonicWalkscape/build/SonicWalkscape-1.6-15.xcarchive` → Organizer → Distribute App.
- [ ] Sentry: mark APPLE-IOS-2 resolved once the new build is live (old 1.5 (14) installs can still
      emit it until then).
- [x] Sentry sweep — ANDROID-4 archived (`archived_forever`).

## Review
- 2 files changed: `SonicWalkscapeApp.swift` (+6 lines: one option + comment) and
  `project.pbxproj` (1.5 (14) → 1.6 (15)). No app logic touched; crash reporting still on.
- Root cause is upstream (sentry-cocoa V2 has no main-thread heartbeat). Re-enable
  `enableAppHangTracking` once a sentry-cocoa release includes PR #8840.
- Sentry is otherwise clean: no other open issues in either project.

## Sentry sweep (both projects, all time)
| Issue | Status | Events | Last seen | Verdict |
|---|---|---|---|---|
| APPLE-IOS-2 App Hang Fully Blocked | unresolved | 3 / 2 users | 2026-09-02 | SDK false positive — fix above |
| ANDROID-2 CameraUpdateFactory NPE | resolved | 27 | 2026-07-03 | Fixed in 1.1.10; no recurrence in 70+ days ✓ |
| ANDROID-4 ApplicationNotResponding | unresolved | 1 | 2026-06-18 | Single ANR on old build, no recurrence in 3 months → archive |
| ANDROID-1, ANDROID-3, APPLE-IOS-1 | deleted | — | — | Gone (test crashes / old ANR) |
- Nothing else in either project. **No new issues in the last 90 days besides APPLE-IOS-2.**


---

# Google Play policy warning: target Android 16 (API 36) by Nov 1, 2026

## Problem
- Play Console → Policy status: "App must target Android 16 (API level 36) or higher. Fix by
  Nov 1 (extension granted). App updates with these issues will be rejected." Highest
  non-compliant target: API 35 (current `targetSdk = 35`, `compileSdk = 35`, 1.1.11 / vc24).
- Not blocking today (app stays live), but **no further Android update can be published after
  Nov 1** until a production release targets 36.

## Readiness check (done)
- Edge-to-edge: already `enableEdgeToEdge()` in `MainActivity.kt:42`, no opt-out flags → OK.
- Predictive back (default-on at target 36): no `onBackPressed` overrides; Compose nav → OK.
- Foreground service `location|mediaPlayback` → unchanged on 16 → OK.
- 16 KB pages: no bundled `.so` (sentry-android-core only, comment at build.gradle.kts:177) → OK.
- Toolchain: AGP 8.3.2 / Gradle 8.7 / Kotlin 2.0.0 / JDK 17. AGP officially supports API 36
  only from **8.10.0** (needs Gradle 8.11.1+). compileSdk 35 already runs on 8.3.2 with a
  "newer AGP recommended" warning; 36 may also just warn — or fail.
- Blocker for any Android build: 4 untracked iCloud duplicates
  `data/models/{AudioSettings,TourDetailResponse,TourPoint,User} 2.kt` — byte-identical to the
  tracked originals → Kotlin "Redeclaration" errors. Must be deleted first.

## Plan (confirmed)
- [x] Deleted the 4 identical ` 2.kt` duplicates (re-verified byte-identical before each rm).
- [x] `app/build.gradle.kts`: `compileSdk = 36`, `targetSdk = 36`; bumped to 1.1.12 / vc25.
- [x] `./gradlew :app:compileDebugKotlin` on current AGP 8.3.2 → BUILD SUCCESSFUL. Only the
      pre-existing "AGP 8.3.2 was tested up to compileSdk 34" advisory (same as with 35) plus
      unrelated icon/statusBarColor deprecation warnings. **No AGP/Gradle bump needed.**
- [x] `./gradlew :app:bundleRelease` → BUILD SUCCESSFUL (2m 21s). R8 minify, resource shrink,
      signing (SONICWAL key), Sentry mapping upload all OK. Bundle manifest verified:
      `targetSdkVersion=36`, `versionCode=25`, `versionName=1.1.12`, `minSdkVersion=26`.
      NOTE: first attempt inside the iCloud folder failed with `AAPT2 … Link timed out` after
      10 min — `fileproviderd` (iCloud) + `mds_stores` (Spotlight) were thrashing on `build/`
      output. Rebuilt with a one-off init script (scratchpad) that redirects
      `layout.buildDirectory` outside iCloud → clean pass. Nothing in the project changed for this.
- [ ] Manual smoke test on a device/emulator (edge-to-edge insets, back navigation, tour playback
      with screen locked) — target-36 behaviour changes are runtime, not compile-time.
- [ ] Publish to internal testing → production before Nov 1; Play then clears the warning.

## Review
- 1 file changed: `android-app/app/build.gradle.kts` — `compileSdk` 35→36, `targetSdk` 35→36,
  `versionCode` 24→25, `versionName` 1.1.11→1.1.12. No code changes needed; toolchain untouched.
- 4 untracked iCloud duplicates (`… 2.kt`) deleted after byte-for-byte comparison with originals.
- Build environment: the repo living in iCloud Drive makes Gradle 3–5× slower and can time out
  aapt2. Long-term fix = move the checkout out of `~/Documents` (or exclude `build/` from sync);
  short-term, build the release AAB with the init script above or from a non-iCloud clone.
- AGP 8.3.2 still emits "tested up to compileSdk 34" — advisory only; builds are clean. Bumping
  to AGP ≥ 8.10 can be done later, independently.

---

# Donation entry points beyond the completion screen (A: Connect & Support, C: early-exit ask)

## Why
- Today the donation card exists only on `TourCompletionScreen` / `TourCompletionView`, reached only
  when the LAST point triggers. Anyone who leaves the player early (GPS miss, time, weather) pops
  back to Tour Detail and never sees an ask. There is no persisted "completed tours" state, so any
  other placement must be context-free (A) or in-the-moment (C).
- Decision (confirmed): build **A** (always-reachable, 1 tap from Welcome) + **C** (moment of
  intent, once per tour session). Skip Settings/Discovery/TourDetail placements.

## Design decisions (apply to both platforms)
- Reuse the existing hero card (title "Support the project" + PayPal/Satispay; Android also keeps
  the €3/€5/€10/free chips). The card is extracted into ONE shared component; completion screen
  keeps its exact current look (ask text stays outside the card, as today).
- Keep it a link-out to PayPal/Satispay in the browser (same mechanism already approved on both
  stores). No in-app payment UI.
- Analytics: `donation_link_clicked` gains `source` = `completion` | `connect` | `exit`
  (+ existing `provider`, Android `amount`). Backend needs nothing (JSONB). CMS breakdown = phase 3.
- Connect sheet: donation block goes FIRST (above socials + newsletter/feedback). Pill/sheet title
  renamed "Connect" → "Connect & Support". When the same sheet is opened from the completion
  screen ("Follow Us"), the donation block is hidden (card is already on that screen).
- Exit ask: shown only if at least one point has played (no ask to someone who left while
  "waiting for location"), and at most once per player session. Dismiss / "Not now" / system back
  → exits exactly as today (`stopTour()` + back, `tour_abandoned` still fires). Tapping a provider
  opens the link and leaves the sheet up; the user exits when they come back. Audio keeps playing
  while the sheet is up.
- Strings (EN / IT / FR — please confirm wording):
  - `connect`: "Connect & Support" / "Contatti e sostegno" / "Contact et soutien"
  - `exit_thanks_title`: "Thanks for walking with us" / "Grazie per aver camminato con noi" /
    "Merci d'avoir marché avec nous"
  - `not_now`: "Not now" / "Non ora" / "Pas maintenant"
  - reuse `donation_ask` for the ask text in both new places.

## Plan — Android
- [x] New `ui/components/DonationCard.kt`: move the bordered card, `AmountChip`, `DonationButton`
      and the two URLs out of `TourCompletionScreen.kt` (currently private there).
      `DonationCard(onDonate: (provider: String, amount: Int?) -> Unit)`.
- [x] `TourCompletionScreen.kt`: use `DonationCard`; pass `showDonation = false` to its
      `ConnectBottomSheet`. `TourCompletionViewModel.trackDonationClicked` adds `source = "completion"`.
- [x] `WelcomeScreen.kt` → `ConnectBottomSheet(showDonation: Boolean = true, onDonate)`: title,
      `donation_ask` text, `DonationCard`, then the existing socials row + newsletter form.
- [x] `WelcomeViewModel`: inject `AnalyticsService`; add `trackDonationClicked(provider, amount)`
      with `source = "connect"` (no tourId).
- [x] `PlayerViewModel`: add `trackDonationClicked(provider, amount)` with `source = "exit"` + tourId.
- [x] `PlayerScreen.kt`: `requestExit()` = if `currentPoint != null && !exitAskShown` → show
      `ExitDonationSheet` (ModalBottomSheet: `exit_thanks_title`, `donation_ask`, `DonationCard`,
      "Not now"); else `viewModel.stopTour(); onBack()`. Close button + new `BackHandler` both call
      `requestExit()`. `exitAskShown` is `rememberSaveable`.
- [x] `strings.xml` (values, values-it, values-fr): update `connect`, add `exit_thanks_title`, `not_now`.
- [x] Verify: `./gradlew :app:compileDebugKotlin` → BUILD SUCCESSFUL (38s, build dir outside iCloud).

## Plan — iOS
- [x] New `Views/Components/DonationCard.swift`: move the hero card + `DonationButton` (+ unused
      `AmountChip`) + URLs out of `TourCompletionView.swift`. `DonationCard(onDonate: (String) -> Void)`.
- [x] `TourCompletionView.swift`: use `DonationCard`; its `FollowUsModal(showDonation: false)`;
      completion `openDonation` passes `source: "completion"`.
- [x] `FollowUsModal` (lives in TourCompletionView.swift): add `showDonation: Bool = true` +
      donation block first (`donationAsk` text + `DonationCard`), then socials + newsletter form.
      Welcome's `.sheet` uses the default (shown), tracking `source: "connect"`, no tourId.
- [x] `AnalyticsService.trackDonationLinkClicked(tourId: String? = nil, provider:, source:)`
      (`track()` already accepts an optional tourId).
- [x] `PlayerView.swift`: close button → `requestExit()`; gate
      `gpsTriggeredCount + manualTriggeredCount > 0 && !exitAskShown`; `.sheet` with
      `ExitDonationSheet` (`exitThanksTitle`, `donationAsk`, `DonationCard`, "Not now" → `dismiss()`);
      `source: "exit"` + tour.id.
- [x] `LocalizedStrings.swift`: update `connect`, add `exitThanksTitle`, `notNow`.
- [x] Verify: `xcodebuild -sdk iphonesimulator build` → BUILD SUCCEEDED.

## Phase 3 (recommended, small) — see which placement works in the CMS
- [x] Backend `admin-analytics.service.ts` (~10 lines next to the provider breakdown, line ~202):
      `donationBySource: [{ source, clicks, totalAmount }]` (events without `source` → `completion`
      for backwards compatibility); add to `analytics-response.dto.ts`.
- [x] CMS `analytics/page.tsx`: "Donation clicks by placement" table next to the provider table.
- (Raw CSV export already contains `properties.source`, so this is for convenience, not data.)

## Release
- Ships with Android 1.1.12 / vc25 and iOS 1.6 (15) (both built from `efba3ee`; AAB at
  `android-app/app/build/outputs/bundle/release/app-release.aab`).
- Backend + CMS deploy independently (Render / CMS host). Backend is backwards compatible:
  old app builds send no `source` → counted as `completion`.

## Review
- **Android (7 files)**: new `ui/components/DonationCard.kt` (card moved verbatim, owns amount
  state + URLs, reports `(provider, amount)`); `TourCompletionScreen.kt` now uses it (−80 lines,
  identical look) and hides donation in its Connect sheet; `WelcomeScreen.kt` `ConnectBottomSheet`
  gets `showDonation`/`onDonate` and shows ask + card first; `WelcomeViewModel` gains
  `AnalyticsService` + `trackDonationClicked` (source=connect); `PlayerViewModel.trackDonationClicked`
  (source=exit, tourId); `PlayerScreen.kt` `requestExit()` + `BackHandler` + `ExitDonationSheet`
  (once per session via `rememberSaveable`, only when `currentPoint != null`); strings ×3.
  `compileDebugKotlin` → BUILD SUCCESSFUL.
- **iOS (5 files)**: new `Views/Components/DonationCard.swift` (+ moved `DonationButton`/`AmountChip`);
  `TourCompletionView.swift` uses it and `FollowUsModal(showDonation:)` shows ask + card first;
  `PlayerView.swift` `requestExit()` (gate: `gpsTriggeredCount + manualTriggeredCount > 0`,
  once per session) + `.sheet` with `ExitDonationSheet` whose `onDismiss` calls `dismiss()`;
  `AnalyticsService.trackDonationLinkClicked(tourId: String? = nil, provider:, source:)`;
  `LocalizedStrings` `connect` renamed + `exitThanksTitle`, `notNow`. `xcodebuild` → BUILD SUCCEEDED.
- **Backend (2 files)**: `donationBySource` (source → clicks, totalAmount; missing source →
  `completion`) in `admin-analytics.service.ts` + `DonationBySourceDto`. `tsc --noEmit` clean.
- **CMS (2 files)**: `DonationBySource` type; "By placement" rows under the provider list in the
  Donations card (`Tour completion` / `Connect & Support` / `Early exit`). `tsc --noEmit` clean.
- Not changed: donation URLs, PayPal/Satispay behaviour, `tour_abandoned` tracking, completion
  screen layout. iOS exit sheet is full-height (deployment target is iOS 15, no `presentationDetents`).
- Build-environment notes: Gradle's project cache `android-app/.gradle/8.7/executionHistory`
  got corrupted by an iCloud write timeout and had to be deleted (regenerable). `node_modules`
  for backend/cms were iCloud-evicted (dataless); reading re-downloads them on demand, pre-warmed
  with a parallel `cat`. All of this goes away if the checkout moves out of `~/Documents`.

## Manual test checklist (both platforms)
- Welcome → "Connect & Support" → donation block first; PayPal/Satispay open browser; event has
  `source=connect`, no tourId. Socials + newsletter still work.
- Completion → "Follow Us" → sheet shows NO donation block (card already on screen).
- Player: leave before any point played → exits immediately, no sheet.
- Player: after ≥1 point played, tap X (and system back on Android) → sheet; "Not now" → exits,
  `tour_abandoned` fires once; audio kept playing until exit. Re-enter tour → sheet again (new session).
- Player: tap PayPal in the sheet → browser opens, event `source=exit` with tourId; back in app the
  sheet is still up; "Not now" exits.
