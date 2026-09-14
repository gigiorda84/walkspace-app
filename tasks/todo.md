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
