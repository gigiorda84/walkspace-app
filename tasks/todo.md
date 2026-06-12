# Automatic crash reporting — Sentry on Android + iOS

## Goal

When the app crashes on any user's phone (Android or iOS), a report with full stack
trace, device info, and app version is automatically sent to Sentry, which emails
gc.giorda@gmail.com. No user action required. Works for offline crashes too
(events are cached on-device and sent when network returns).

## Why Sentry (decided 2026-06-12)

- iOS app is fully native SwiftUI — no webview/JS layer, so we need native SDKs only.
- Sentry: one dashboard for both platforms, EU data region (GDPR), free tier
  (~5k events/month, plenty for a beta), email alerts on new issues out of the box.
- Simpler than Firebase Crashlytics (no google-services.json, no Google plugins).

## Prerequisites (USER — must happen first)

- [x] 0. Create free Sentry account at sentry.io (EU region) + two projects.
      DSNs received 2026-06-12 and wired into both apps.

## Todo — Android (native Kotlin)

- [x] 1. Sentry Android Gradle plugin 5.8.0 added (root + app build.gradle.kts).
      Tracing instrumentation disabled, telemetry off. Mapping upload is
      conditional on `android-app/sentry.properties` existing (gitignored),
      so builds never break. Verified: `:app:compileDebugKotlin` passes.
- [x] 2. DSN added as `io.sentry.dsn` meta-data in AndroidManifest.xml.
- [x] 3. `android-app/sentry.properties` created (org bandite, project android,
      org auth token; gitignored). VERIFIED 2026-06-12: `assembleRelease`
      uploaded 1 mapping file to Sentry.
- [x] 4. "Test crash" button added to Diagnostics screen (DebugScreen.kt).
      VERIFIED 2026-06-12: crash triggered on emulator, event reached Sentry,
      alert email received at gc.giorda@gmail.com.

## Todo — iOS (native SwiftUI)

- [x] 5. `sentry-cocoa` 9.17.1 added via SPM (pbxproj edited manually:
      package reference + product dependency + Frameworks link).
- [x] 6. `SentrySDK.start` with DSN in SonicWalkscapeApp.swift init
      (tracesSampleRate = 0). Added "Upload dSYMs to Sentry" Release-only build
      phase — skips with a warning if sentry-cli or sentry.properties missing.
      Note: ENABLE_USER_SCRIPT_SANDBOXING set NO so the script can run.
      DONE: sentry-cli 3.5.0 installed via brew;
      `mobile-app/ios/SonicWalkscape/sentry.properties` created (project
      apple-ios; gitignored). VERIFIED 2026-06-12: Release build + manual
      `sentry-cli debug-files upload` — app dSYM uploaded to Sentry.
- [x] 7. "💥 Test crash" button added to the GPS debug overlay (toggleable from
      the player screen). VERIFIED 2026-06-12: crash triggered on physical
      iPhone 15 (launched via devicectl, no debugger), event reached Sentry,
      alert email received. Caveat for future tests: crashes are NOT captured
      while Xcode's debugger is attached.

## Follow-ups (not code)

- [ ] 8. Add one line to the privacy policy: crash diagnostics collected via
      Sentry (EU-hosted) for app stability (legitimate interest).
- [ ] 9. App Store privacy labels: declare "Diagnostics → Crash Data" on both
      App Store Connect and Google Play Data Safety form before next release.

## Notes / constraints

- Keep changes minimal: no custom event tracking, no performance monitoring,
  no session replay — crashes only (set `tracesSampleRate` to 0 / leave perf off).
- Existing analytics (AnalyticsService) is untouched; Sentry is diagnostics-only.
- Test crash buttons must only be visible in the existing debug screens, same
  visibility rules as the rest of the debug UI.

## Review (completed 2026-06-12)

Both apps now report crashes to Sentry (EU region) automatically; alert emails
go to gc.giorda@gmail.com on every new issue. Both builds verified compiling.

Files changed:
- `android-app/build.gradle.kts` — Sentry Gradle plugin 5.8.0 declared
- `android-app/app/build.gradle.kts` — plugin applied + sentry {} config
  (tracing off, telemetry off, mapping upload only if sentry.properties exists)
- `android-app/app/src/main/AndroidManifest.xml` — io.sentry.dsn meta-data
- `android-app/app/src/main/java/.../ui/debug/DebugScreen.kt` — test crash button
- `android-app/.gitignore`, `.gitignore` — sentry.properties ignored
- `mobile-app/ios/.../SonicWalkscape.xcodeproj/project.pbxproj` — sentry-cocoa
  9.17.1 via SPM, "Upload dSYMs to Sentry" Release build phase (self-skipping),
  ENABLE_USER_SCRIPT_SANDBOXING = NO
- `mobile-app/ios/.../SonicWalkscapeApp.swift` — SentrySDK.start (crashes only)
- `mobile-app/ios/.../Views/Debug/DebugOverlayView.swift` — test crash button

Remaining USER steps:
1. Test crash on each platform (launch app NOT via Xcode debugger; report
   sends on next app launch).
2. Create org auth token in Sentry (Settings → Auth Tokens) and the two
   sentry.properties files (templates in chat) for readable release traces.
3. Privacy policy line + App Store / Play Store "Crash Data" declarations
   before next release.
