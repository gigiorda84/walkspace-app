# Analytics dashboard: donations breakdown, completion/duration accuracy, export

## Obiettivo (richiesta utente)
Migliorare la pagina /analytics del CMS: (1) sezione Donations che rifletta i nuovi
pulsanti PayPal/Satispay; (2) conteggio più sensato di tour completati/interrotti
(niente in-progress eterni) e durata realistica; (3) verifica generale dei dati;
(4) MAI cancellare i dati + aggiungere export. Scope deciso: **CMS+backend ora**,
**Android preparato a parte (no release in questo ciclo, appeal 1.1.8 in corso)**.
Export: **CSV + JSON**.

## Cause radice individuate (verificate nel codice)
- **Donations senza breakdown:** le app inviano `donation_link_clicked` con
  `properties.provider` ("paypal"/"satispay"), ma il backend fa solo `count()` totale
  (admin-analytics.service.ts:186). La card mostra un solo numero.
- **In-progress eterni:** lo stato deriva dall'ASSENZA di evento terminale
  (admin-analytics.service.ts:354). L'app **Android non invia MAI `tour_abandoned`**
  (AnalyticsService.kt) → ogni tour Android non completato resta in-progress per sempre.
- **Durata troppo corta:** Android invia `tour_completed` **senza `durationMinutes` né
  `triggerType`** (AnalyticsService.kt:119). Quindi: (a) la sezione "Tour Duration"
  (bucket per triggerType) esclude Android; (b) la media per-tour divide per TUTTE le
  completion incluse quelle Android a durata 0 (service.ts:274) → media abbassata.
- **Trigger Method GPS/Manual** ignora Android (niente `triggerType` su `tour_started`).
- **Bottone "Delete All Data"** presente nel CMS → da togliere (mai cancellare).

## Piano — Backend (NestJS)  [solo letture aggregate, MAI scritture/cancellazioni sui dati grezzi]
- [ ] `getEngagementAnalytics`: aggiungere `donationBreakdown` (conteggio per
      `properties.provider`: paypal / satispay / unknown, con % sulle completion),
      mantenendo `donationClicks` totale. Aggiornare `EngagementAnalyticsDto`.
- [ ] `getSessions`: introdurre soglia anti-stallo. Se nessun evento terminale e lo
      start è più vecchio di `STALE_SESSION_HOURS` (proposta: 6h; i tour durano ~30–60min)
      → nuovo stato `'incomplete'`. `'in-progress'` resta solo per sessioni recenti.
      (Classificazione a sola lettura: i dati grezzi non vengono toccati.)
- [ ] `getTourAnalytics`: calcolare `avgDurationMinutes` solo sulle completion con
      `durationMinutes > 0` (non gonfiare il denominatore con le completion Android a 0).
      Aggiungere `completionsWithDuration` per trasparenza.
- [ ] Nuovo `exportEvents(period, format)` + endpoint `GET /admin/analytics/export`
      (`format=csv|json`) con `Content-Disposition: attachment`. Esporta gli eventi
      grezzi (CSV piatto / JSON con properties annidate). Nessuna cancellazione.

## Piano — CMS (Next.js)
- [ ] `types/api`: aggiungere `donationBreakdown`, `completionsWithDuration`, stato
      `'incomplete'`.
- [ ] `lib/api/client.ts`: aggiungere `getExportUrl()/downloadExport(format)`.
- [ ] `analytics/page.tsx`:
      - Card Donations: breakdown PayPal vs Satispay (come channelBreakdown), oltre al totale.
      - Sostituire il bottone rosso "Delete All Data" con **Export CSV / Export JSON**.
      - Rimuovere il modale di conferma cancellazione.
      - Recent Sessions: rendere il nuovo stato `incomplete` (colore/etichetta distinti).
      - Piccola nota informativa dove la durata/trigger Android non è ancora tracciata.

## Piano — Android (PREPARATO, NESSUNA release in questo ciclo)
- [ ] `AnalyticsService.kt`: `trackTourStarted(tourId, triggerType)`,
      `trackTourCompleted(tourId, durationMinutes, triggerType)`, nuovo
      `trackTourAbandoned(tourId, durationMinutes)`.
- [ ] `PlayerViewModel`: registrare timestamp di start, calcolare `durationMinutes`,
      passare `triggerType`, ed emettere `tour_abandoned` all'uscita senza completamento.
- [ ] **NON** bumpare versionCode/versionName, **NON** pubblicare. Solo compileDebugKotlin
      per verificare. Le modifiche restano pronte per la prossima release.

## Verifica finale
- [x] Backend `tsc --noEmit` → OK. CMS `tsc --noEmit` → OK. Android
      `:app:compileDebugKotlin` → BUILD SUCCESSFUL. CMS `next build` → (vedi Review).
- [x] Sezione Review qui sotto.

## Review
**Backend (NestJS)** — `admin-analytics.service.ts` + `analytics-response.dto.ts` + `admin-analytics.controller.ts`:
- `getEngagementAnalytics`: nuovo `donationBreakdown` per provider (paypal/satispay/unknown)
  con % sulle completion; `donationClicks` ora = numero eventi.
- `getTourAnalytics`: `avgDurationMinutes` calcolata SOLO sulle completion con
  `durationMinutes > 0` (+ campo `completionsWithDuration`). Le completion Android a 0
  non abbassano più la media.
- `getSessions`: costante `STALE_SESSION_HOURS = 6`. Sessioni senza evento terminale e
  più vecchie di 6h → stato `incomplete` (prima restavano `in-progress` all'infinito).
  Riclassificazione solo a lettura: i dati grezzi non sono toccati.
- `exportEvents(period, format)` + `GET /admin/analytics/export?format=csv|json` con
  `Content-Disposition: attachment`. **Endpoint DELETE rimosso** (mai cancellare).

**CMS (Next.js)** — `types/api`, `lib/api/client.ts`, `app/analytics/page.tsx`:
- Card Donations con breakdown PayPal/Satispay.
- Bottone rosso "Delete All Data" + modale → rimossi, sostituiti da **Export CSV / Export JSON**
  (scaricano via blob, rispettano il period selezionato).
- Recent Sessions: stato `incomplete` con badge grigio distinto.
- Nota nella sezione Duration sui dati Android non ancora tracciati.

**Android (PRONTO, NESSUNA release in questo ciclo — no version bump)** —
`services/AnalyticsService.kt`, `ui/player/PlayerViewModel.kt`:
- `tour_started` ora invia `triggerType="gps"` (app GPS-first, parte sempre il tracking).
- `tour_completed` ora invia `durationMinutes` (now − start) e `triggerType`
  (`primaryTriggerType`: "manual" finché un punto non viene triggerato via GPS → "gps").
- Nuovo `tour_abandoned` emesso da `stopTour()` (Close button) quando si esce da un
  tour iniziato e non completato, con `durationMinutes`.
- `compileDebugKotlin` OK. **Da verificare su device prima della prossima release**
  (in particolare la consegna dell'evento abbandono all'uscita), poi bump versione.

**Deploy:** le migliorie CMS/backend richiedono il deploy del backend su Render e del
CMS su Vercel. La pagina /analytics riflette i nuovi dati dopo il deploy. Lato dati
storici: le sessioni Android vecchie restano senza durata/trigger (non riscrivibili),
ma da ora in poi (post-release Android) saranno complete.

---

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

---

# Round 2: rejected AGAIN (versionCode 19) — same Settings screenshot

## Problem
Google re-rejected with the identical "Inadequate Prominent Disclosure" verdict and
again attached a screenshot of the **Settings → Enable Location** row, not the
Start-Tour flow.

## Root cause (round 2)
The round-1 disclosure is only reachable by tapping **Start Tour** on a tour when
location isn't already granted. A reviewer who can't start a tour (tours are
voucher-gated/protected; the Render free-tier backend cold-starts and may return an
empty/erroring tour list during review) never sees it. The only location UI they
reliably reach is **Settings → "Enable Location"**, which just opens OS settings and
shows a hardcoded green check — not a prominent disclosure. Privacy policy page was
verified OK (discloses location + background use). Note: reviewer screenshot shows
v1.0.1/build 2 — user to confirm in Play Console which build was actually reviewed.

## Plan (first-launch disclosure — guaranteed reachable)
- [x] Constants: add `KEY_LOCATION_DISCLOSURE_ACCEPTED`.
- [x] UserPreferencesManager: add `locationDisclosureAccepted` Flow +
      `setLocationDisclosureAccepted()`.
- [x] WelcomeViewModel: expose accepted flag + `acceptLocationDisclosure()`.
- [x] New `LocationDisclosureScreen` (full-screen, reuses existing
      `foreground_location_title` / `foreground_location_explanation` /
      `privacy_policy` strings): icon, title, data-usage text, privacy link,
      affirmative **Continue**, and **Cancel** (returns to Welcome).
- [x] NavGraph: route Onboarding `onComplete` → `LocationDisclosure`; the screen
      auto-forwards to Discovery if already accepted (no re-show for returning users).
- [x] Bump versionCode 19 → 20, versionName 1.1.6 → 1.1.7.
- [x] `./gradlew :app:compileDebugKotlin` → BUILD SUCCESSFUL.

## Review
**What changed:** Added a first-launch prominent disclosure that every user/reviewer
hits on the guaranteed startup path (Welcome → Onboarding → **LocationDisclosure** →
Discovery), before any location access. It reuses the round-1 disclosure copy (data
type = device location, use = trigger audio at GPS waypoints, never stored/shared),
links to the privacy policy, and requires affirmative action (**Continue**) with a
**Cancel** that returns to Welcome. Acceptance is persisted, so returning users are
forwarded straight to Discovery without re-seeing it. The round-1 Start-Tour disclosure
stays as a second safety net.

**Files:** `utils/Constants.kt`, `services/UserPreferencesManager.kt`,
`ui/welcome/WelcomeViewModel.kt`, new `ui/welcome/LocationDisclosureScreen.kt`,
`ui/navigation/NavGraph.kt`, `app/build.gradle.kts` (version bump).

**Diagnosis note (Chrome):** Verified the privacy policy at
`walkspace-api.onrender.com/privacy` is live and fully discloses location + background
use — not the cause. Reviewer screenshot shows v1.0.1/build 2, which matches no
submitted build (15/18/19) — confirm in Play Console which versionCode the rejection is
attached to; if it's an old build, the fix may already be present and an appeal applies.

**Release steps (manual):** build a signed AAB (versionCode 20), upload to Play
Console, and on the Publishing overview "send changes for review" / reply to the
policy issue.

---

# Release tooling: API publishing (Gradle Play Publisher)

Signed AAB built: `app/build/outputs/bundle/release/app-release.aab` (versionCode 20,
1.1.7). No publishing automation existed, so set up GPP for repeatable uploads.

- [x] Added `com.github.triplet.play` 3.12.1 (root + `:app`), `play { }` block
      (track=`internal`, AAB default, releaseStatus=COMPLETED, gitignored
      `play-service-account.json`).
- [x] Gitignored `play-service-account.json`.
- [x] Release notes in `app/src/main/play/release-notes/{en-US,it-IT,fr-FR}/default.txt`.
- [x] `android-app/PUBLISHING.md` documents service-account creation + release commands.
- [x] Verified `:app:tasks` registers `publishReleaseBundle` (config resolves).
- [ ] **User action:** create Play service account JSON (see PUBLISHING.md), drop it at
      `android-app/play-service-account.json`, then `./gradlew :app:publishReleaseBundle`
      (start on `internal`, then switch `track` to the rejected track and re-run).

## Submission (Jun 19 2026, via Play Console UI in Chrome)
- App is on the **Production** track. Live release = **vc12 (1.1.4-beta)**; rejected
  release = **vc19 (1.1.6)** → so Google DID review the round-1 disclosure build and
  rejected it (the rejection-email screenshot showing v1.0.1/build 2 was stale/misleading).
- Created a new **Production** release with **vc20 (1.1.7)** (round-2 first-launch
  disclosure); vc19 left under "Not included". AAB uploaded by the user (Chrome
  extension file_upload is sandboxed to session-shared files, so it couldn't push the
  build path — user selected it manually).
- User submitted the changes for review. NOTE: the submission bundled 2 pre-existing
  pending changes too — **Data safety questionnaire** completion and **Closed testing →
  pause track**.
- Could not visually confirm via Chrome: the Play Console SPA never reaches
  `document_idle`, so claude-in-chrome screenshot/read tools time out on that page.

---

# Round 3: vc20 (1.1.7) also REJECTED — same issue, STALE evidence

## What Play Console shows (verified Jun 21 via Chrome)
- Policy issue: "Prominent Disclosure and Consent Requirement: Inadequate Prominent
  Disclosure" — Rejected Jun 20 2026. Verdict text identical to before.
- Evidence: `IN_APP_EXPERIENCE-1778.png` = the **Settings screen**, and its About
  section reads **Version 1.0.1 / Build 2** — a build that matches NONE of our
  submissions (live 12, prior 17/19, rejected 20). Settings renders version from
  `BuildConfig`, so a vc20 build cannot show 1.0.1/2 → Google re-rejected on a
  reused/stale screenshot that predates every disclosure change.

## Response (user chose: appeal + code fix)
- [x] Code fix: Settings Location section is now a real in-app disclosure — full
      data-usage paragraph (`location_settings_disclosure`, en/it/fr) + Privacy
      Policy link, and a neutral "Manage location access" row that opens OS settings.
      Removed the misleading always-green check (deleted `LocationToggleRow`).
- [x] Bump versionCode 20 → 21, versionName 1.1.7 → 1.1.8.
- [x] `compileDebugKotlin` + `bundleRelease` → BUILD SUCCESSFUL (signed AAB at
      app/build/outputs/bundle/release/app-release.aab, vc21).
- [x] Drafted appeal: `tasks/appeal-draft.md` (argues stale 1.0.1 evidence + lists
      the first-launch disclosure and new Settings disclosure).
- [x] **Appeal SUBMITTED** Jun 21 via Play Console (reason: "I believe this is
      incorrect", 899/1000 chars). Policy page shows "Appeal submitted". Google
      replies by email to gc.giorda@gmail.com within ~7 days.
- [ ] **Holding vc21** (built, signed, ready) until the appeal result, to avoid a
      parallel review getting auto-rejected on the same reused screenshot. If the
      appeal is denied → upload `app/build/outputs/bundle/release/app-release.aab`
      (vc21) and send for review.
- [ ] vc21 code changes are committed-pending (not yet committed/pushed).

**Security note:** `android-app/secrets.properties` (contains MAPS_API_KEY) is committed
to git despite being gitignored — should be untracked + key rotated (flagged separately).
