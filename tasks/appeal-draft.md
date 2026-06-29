# Google Play appeal — Inadequate Prominent Disclosure (Sonic Walkscape)

Issue: Prominent Disclosure and Consent Requirement — Inadequate Prominent Disclosure
Rejected build under appeal: versionCode 20 (1.1.7)

## Appeal text (paste into the appeal form)

We believe this rejection was made on outdated evidence and that the submitted
build is compliant.

1) The evidence screenshot attached to this decision (IN_APP_EXPERIENCE-1778.png)
shows our app's Settings screen reporting "Version 1.0.1 / Build 2". The build we
submitted for review is versionName 1.1.7 / versionCode 20. Version 1.0.1 / Build 2
is an old build that predates all of our disclosure changes and is not the version
under review. The screenshot therefore does not reflect the submitted app.

2) The submitted build presents a full-screen in-app Prominent Disclosure for
location BEFORE any location permission is requested and before any location is
accessed. It appears on the app's first-run flow (Welcome → intro → Location
disclosure → main screen). It states that the app collects the user's location,
including in the background during a tour, that the location is used only to
automatically play audio narration when the user reaches GPS waypoints along the
tour route, and that location data is never stored on our servers or shared with
third parties. It requires affirmative user action ("Continue") to proceed, offers
a "Cancel" option, and links to our privacy policy
(https://walkspace-api.onrender.com/privacy), which fully discloses foreground and
background location use.

3) We have also just submitted a further update (versionCode 21 / 1.1.8) in which
the Settings screen — the screen shown in the evidence — now itself contains the
full written location-data disclosure and a privacy-policy link, replacing the
previous short label.

We respectfully request a re-review of the actual submitted build. We are happy to
provide a screen recording of the in-app disclosure flow if helpful.

## Supporting facts (for our own reference)
- Privacy policy (live, discloses background location): https://walkspace-api.onrender.com/privacy
- First-launch disclosure: LocationDisclosureScreen.kt (added in vc20).
- Settings disclosure: SettingsScreen.kt Location section (added in vc21).
- Rejected-evidence version 1.0.1/build 2 matches no submitted build (live=12, prior=17/19, rejected=20).
