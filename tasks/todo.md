# Fix Google Play rejection: Prominent Disclosure for Location

## Problem
Google Play rejected the Android app (enforced Jun 15) for **Inadequate Prominent
Disclosure** under the User Data policy:
- The in-app prominent disclosure does not disclose the usage of accessed/collected
  Location data.
- Prominent Disclosure must require affirmative user action, presented clearly and
  unambiguously.

## Root cause
The app shows a proper full-screen prominent disclosure only for **background**
location. **Foreground (ACCESS_FINE_LOCATION)** permission is requested directly in
`onStartTourClick()` (TourDetailScreen.kt) by calling
`locationPermissionLauncher.launch(...)` with no disclosure shown first. The Settings
"Attiva Posizione" toggle Google screenshotted is not a valid prominent disclosure
(not shown before the request, no data-usage description, no affirmative accept/decline).

## Plan (minimal change, mirrors existing background-location disclosure)
- [x] Add `foreground_location_title` + `foreground_location_explanation` strings
      (values, values-it, values-fr).
- [x] Add `showForegroundLocationDisclosure` state in TourDetailScreen.
- [x] In `onStartTourClick()`: when permission not granted, show the disclosure dialog
      instead of launching the system permission directly.
- [x] Add a full-screen disclosure Dialog (copy of background pattern): icon, title,
      data-usage explanation, privacy-policy link, affirmative "Continue" button that
      launches `locationPermissionLauncher`, and a "Not now" dismiss button.

## Review
**Root cause:** Foreground `ACCESS_FINE_LOCATION` was requested directly from
`onStartTourClick()` with no in-app prominent disclosure beforehand. Google requires
the disclosure to appear before the runtime prompt, describe the data usage, and
require affirmative action. The Settings toggle Google screenshotted did not qualify.

**Changes (all in TourDetailScreen + strings):**
1. `strings.xml` (en/it/fr): added `foreground_location_title` and
   `foreground_location_explanation` clearly stating that location is collected and
   used to trigger audio at GPS waypoints, not stored/shared.
2. `TourDetailScreen.kt`: new `showForegroundLocationDisclosure` state.
3. `onStartTourClick()`: when permission is missing, shows the disclosure dialog
   instead of launching the system permission directly.
4. New full-screen disclosure Dialog mirroring the existing background-location one:
   icon, title, data-usage explanation, privacy-policy link, affirmative **Continue**
   button (which then launches the permission), and a **Cancel** button.

`PlayerScreen` only *checks* location permission and never requests it, so no change
needed there. The only foreground-location request path in the app is now gated by the
disclosure.

**Verification:** `./gradlew :app:compileDebugKotlin` → BUILD SUCCESSFUL.

**Release steps (manual):** bump `versionCode`/`versionName`, build a new AAB, upload
to Play Console, and reply to the policy issue / submit the new version for review.
