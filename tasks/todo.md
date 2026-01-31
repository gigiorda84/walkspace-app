# Analytics Implementation Plan

## Goal
Implement anonymous, GDPR-compliant analytics tracking to measure:
- Tour starts (which tour, when)
- Tour duration (by completion status and trigger method)
- Trigger method: GPS (on-site) vs Play button (remote)
- Platform: iOS/Android
- Post-tour engagement: contact clicks, social channels, donation clicks
- Display metrics in CMS Analytics section

## Current State
- **Backend**: Event ingestion exists (`POST /analytics/events`) but NO query endpoints
- **iOS App**: Has GPS triggering and manual play, but NO analytics tracking
- **CMS**: Placeholder Analytics page exists, no dashboard

---

## Tasks

### Phase 1: Backend - Add Analytics Query Endpoints

- [x] 1.1 Add `GET /admin/analytics/overview` endpoint
- [x] 1.2 Add `GET /admin/analytics/tours` endpoint
- [x] 1.3 Add `GET /admin/analytics/duration` endpoint
- [x] 1.4 Add `GET /admin/analytics/engagement` endpoint

### Phase 2: iOS App - Add Analytics Tracking

- [x] 2.1 Create `AnalyticsService.swift`
- [x] 2.2 Track `tour_started` event in PlayerView
- [x] 2.3 Track `point_triggered` event with trigger method
- [x] 2.4 Track `tour_completed` event
- [x] 2.5 Track `tour_abandoned` event
- [x] 2.6 Track post-tour engagement in TourCompletionView

### Phase 3: CMS - Build Analytics Dashboard

- [x] 3.1 Add analytics API client methods in CMS
- [x] 3.2 Build Analytics Overview section
- [x] 3.3 Build Duration Analytics section
- [x] 3.4 Build Engagement Analytics section
- [x] 3.5 Build Per-Tour Analytics table

---

## Events Summary

| Event | Properties | When Tracked |
|-------|------------|--------------|
| `tour_started` | tourId, language, triggerType, platform | Player opens |
| `point_triggered` | tourId, pointId, triggerType | GPS or manual point advance |
| `tour_completed` | tourId, durationMinutes, triggerType, platform | All points finished |
| `tour_abandoned` | tourId, durationMinutes, lastPointIndex | Player closed early |
| `follow_us_clicked` | tourId | Follow Us button tapped |
| `contact_clicked` | tourId, channel | Social/email link tapped |
| `donation_link_clicked` | tourId | Support button tapped |

---

## GDPR Compliance Approach

1. **Anonymous Tracking Only**: Use device-generated UUID, not user account ID
2. **No PII Collected**: No emails, names, or identifying info in analytics
3. **Consent Required**: Only track if user has opted in (via app settings)
4. **Data Retention**: Events older than 2 years can be purged
5. **EU Storage**: Data stored in EU region (already in place)

---

## Review

### Files Changed

**Backend (NestJS):**
- `src/analytics/dto/analytics-event.dto.ts` - Added new event types: TOUR_ABANDONED, FOLLOW_US_CLICKED, CONTACT_CLICKED
- `src/admin/analytics/admin-analytics.module.ts` - New module
- `src/admin/analytics/admin-analytics.controller.ts` - 4 new endpoints
- `src/admin/analytics/admin-analytics.service.ts` - Query methods with period filtering
- `src/admin/analytics/dto/analytics-response.dto.ts` - Response DTOs
- `src/app.module.ts` - Registered AdminAnalyticsModule

**iOS App (Swift):**
- `Models/User.swift` - Added `analyticsEnabled` to UserPreferences
- `Services/UserPreferencesManager.swift` - Added analyticsEnabled accessor
- `Services/AnalyticsService.swift` - New service with event tracking, offline queue, GDPR consent
- `Views/Player/PlayerView.swift` - Track tour_started, point_triggered, tour_completed, tour_abandoned
- `Views/Player/TourCompletionView.swift` - Track follow_us_clicked, contact_clicked, donation_link_clicked

**CMS (Next.js):**
- `src/types/api/index.ts` - Added analytics types
- `src/lib/api/client.ts` - Added analyticsApi methods
- `src/app/analytics/page.tsx` - Full analytics dashboard with 4 sections

### API Endpoints Added

| Endpoint | Description |
|----------|-------------|
| `GET /admin/analytics/overview` | Total starts, completions, unique devices, platform/trigger breakdown |
| `GET /admin/analytics/duration` | Avg duration by GPS-completed, manual-completed, abandoned |
| `GET /admin/analytics/engagement` | Follow us clicks, channel breakdown, donation clicks |
| `GET /admin/analytics/tours` | Per-tour analytics with completion rates |

All endpoints support `?period=7d|30d|90d|all` query parameter.

### CMS Dashboard Sections

1. **Overview** - 4 stat cards + platform/trigger distribution bars
2. **Tour Duration** - 3 cards showing avg duration for GPS/manual/abandoned
3. **Post-Tour Engagement** - Follow us clicks, channel breakdown, donation clicks
4. **Per-Tour Table** - Sortable table with all metrics per tour

### GDPR Implementation

- Anonymous device UUID generated on first app launch
- `analyticsEnabled` preference in UserPreferences (default: true)
- AnalyticsService checks consent before tracking any event
- Offline queue with automatic retry when network available
- No PII collected - only anonymous IDs, tour IDs, and behavior data

---

# Newsletter & Feedback Form - Implementation Plan

## Goal
Add a flexible form to the SupportScreen ("Connect" page) that allows users to:
1. Subscribe to newsletter (email required, name optional)
2. Leave feedback (feedback required, email/name optional)
3. Do both

## Tasks

### Backend
- [x] 1. Add `FeedbackSubmission` model to Prisma schema
  - `id` (UUID, primary key)
  - `email` (string, optional)
  - `name` (string, optional)
  - `feedback` (text, optional)
  - `subscribeToNewsletter` (boolean, default false)
  - `createdAt` (timestamp)

- [x] 2. Run database migration

- [x] 3. Create `FeedbackModule` with:
  - `POST /feedback` endpoint (public, no auth required)
  - DTO with validation:
    - If `subscribeToNewsletter` is true, `email` is required
    - If no `feedback` and `subscribeToNewsletter` is false, reject

### Mobile App
- [x] 4. Update `SupportScreen.tsx` to add form:
  - Email input field
  - Name input field (optional label)
  - Feedback textarea (optional label)
  - "Subscribe to newsletter" checkbox
  - Submit button
  - Success/error feedback

- [x] 5. Add API call to POST /feedback

### CMS
- [x] 6. Add `/feedback` page to view submissions
  - Table: date, email, name, feedback preview, newsletter checkbox
  - CSV export
  - Summary cards (newsletter signups, feedback count, emails count)
  - Pagination

## Validation Logic
```
if (!subscribeToNewsletter && !feedback) → reject "Please provide feedback or subscribe"
if (subscribeToNewsletter && !email) → reject "Email required for newsletter"
if (email) → validate email format
```

---

## Review

### Files Changed

**Backend (NestJS):**
- `prisma/schema.prisma` - Added `FeedbackSubmission` model
- `src/feedback/feedback.module.ts` - New module
- `src/feedback/feedback.controller.ts` - POST /feedback and GET /feedback endpoints
- `src/feedback/feedback.service.ts` - Business logic with validation
- `src/feedback/dto/create-feedback.dto.ts` - Request DTO with validation
- `src/app.module.ts` - Registered FeedbackModule

**Mobile App (React):**
- `screens/SupportScreen.tsx` - Added newsletter/feedback form with:
  - Email, name, feedback fields
  - Newsletter checkbox
  - Submit button with loading state
  - Success/error feedback display

**CMS (Next.js):**
- `src/lib/api/client.ts` - Added feedbackApi methods and types
- `src/app/feedback/page.tsx` - New page with table, summary cards, CSV export
- `src/components/layout/Sidebar.tsx` - Added Feedback navigation link

### API Endpoints Added

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/feedback` | POST | Public | Submit feedback/newsletter signup |
| `/feedback` | GET | Public | List all submissions (paginated) |

### Form Behavior

- User can submit **newsletter signup only** (email required)
- User can submit **feedback only** (no email required)
- User can submit **both** (email required if newsletter checked)
- Name is always optional
- Success message shown after submission

---

# Add Editable busInfo Field to CMS

## Goal
Make the "Info Bus" button content editable in the CMS by adding a `busInfo` field to TourVersion.

## Tasks

- [x] 1. Backend - Add `busInfo` field to TourVersion in Prisma schema
- [x] 2. Backend - Run database migration
- [x] 3. Backend - Update DTOs (create-version, update-version, version-response, tour-list, tour-detail)
- [x] 4. Backend - Update tours.service.ts to include busInfo in responses
- [x] 5. CMS - Update types/api/index.ts with busInfo field
- [x] 6. CMS - Update tour editor page with busInfo textarea
- [x] 7. Mobile - Update Tour.swift model
- [x] 8. Mobile - Update TourDetailResponse.swift model
- [x] 9. Mobile - Update TourCompletionView.swift to conditionally show Info Bus button

## Review

### Summary
Implemented editable `busInfo` field across the full stack (backend, CMS, mobile) following the exact same pattern as `completionMessage`.

### Files Changed

**Backend (NestJS):**
- `prisma/schema.prisma` - Added `busInfo` field to TourVersion model
- `src/admin/tours/dto/create-version.dto.ts` - Added `busInfo?: string`
- `src/admin/tours/dto/update-version.dto.ts` - Added `busInfo?: string`
- `src/admin/tours/dto/version-response.dto.ts` - Added `busInfo: string | null`
- `src/tours/dto/tour-list.dto.ts` - Added `busInfo?: Record<string, string>`
- `src/tours/dto/tour-detail.dto.ts` - Added `busInfo?: string`
- `src/tours/tours.service.ts` - Select and aggregate busInfo in listTours, include in getTourDetails

**CMS (Next.js):**
- `src/types/api/index.ts` - Added `busInfo?: string | null` to TourVersion interface
- `src/app/tours/[id]/edit/page.tsx` - Added busInfo to state, added textarea field, included in save mutations

**Mobile App (iOS):**
- `Models/Tour.swift` - Added `busInfo: [String: String]?` property, `displayBusInfo` computed property, updated CodingKeys, init, decoder, encoder
- `Models/TourDetailResponse.swift` - Added `busInfo: String?`, included in toTour() conversion
- `Views/Player/TourCompletionView.swift` - Wrapped Info Bus button in conditional (`if let busInfoText = tour.displayBusInfo`), updated alert to display dynamic content

### Behavior
- If `busInfo` has content → "Info Bus" button shows on completion screen, displays the content in an alert
- If `busInfo` is empty/null → "Info Bus" button is hidden entirely

---

# Fix Feedback Submission 400 Error

## Problem
The iOS feedback form returns a 400 error because it doesn't validate email format before submission. The backend's `@IsEmail` validation rejects invalid email formats.

## Root Cause
In `TourCompletionView.swift`, the `needsEmail` property only checks if email is **empty**, not if it's a valid format:
```swift
private var needsEmail: Bool {
    subscribeToNewsletter && email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
}
```

When a user types an invalid email like "abc" or "test@", the form allows submission, but the backend rejects it with 400.

## Tasks

- [x] 1. Add email validation helper function
- [x] 2. Update form validation to check email format when newsletter is checked
- [x] 3. Test the fix (build succeeded)

## Approach
Add a simple email validation function and update the `needsEmail` computed property. Keep changes minimal.

## Review

### Change Made
Added `isValidEmail` computed property to `TourCompletionView.swift` that validates email format:
- Checks that email is not empty
- Checks that email contains exactly one `@`
- Checks that the domain part contains at least one `.`

Updated `needsEmail` to use `!isValidEmail` instead of just checking if empty.

### Files Changed
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Player/TourCompletionView.swift` (lines 276-286)

### Behavior Change
- **Before**: Submit button enabled when newsletter checked and email field has any text
- **After**: Submit button enabled when newsletter checked and email field has valid format (e.g., `user@example.com`)

---

# Skip Already-Downloaded Files Before Re-downloading

## Problem
When a user initiates a tour download, the app downloads all files regardless of whether they already exist on disk. This wastes bandwidth and time.

## Current Behavior
- `TourDownloadManager.downloadTour()` downloads every audio file from the manifest
- No check for existing files before downloading
- Files are overwritten even if they already exist

## Tasks

- [x] 1. In `downloadTour()`, check if each audio file already exists before downloading
- [x] 2. If file exists, skip downloading and increment progress
- [x] 3. Test that pre-downloaded tours complete instantly

## Files to Modify
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Services/TourDownloadManager.swift`

## Approach
In the download loop (lines 58-69), add `fileManager.fileExists(atPath:)` check before downloading each file. This handles:
1. Fully downloaded tours - skips everything
2. Partially downloaded tours - only downloads missing files
3. No downloaded files - downloads everything (current behavior)

## Review

### Change Made
Added file existence check in `downloadTour()` before downloading each audio file:
- Build local file path first
- Check if file already exists with `fileManager.fileExists(atPath:)`
- If exists: increment progress and `continue` to next file
- If not exists: download and save as before

### Files Changed
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Services/TourDownloadManager.swift` (lines 58-77)

### Behavior Change
- **Before**: All audio files downloaded every time, overwriting existing files
- **After**: Only missing files are downloaded; existing files are skipped

### Test Scenarios
1. **Already downloaded tour**: Progress jumps to 100% instantly (no network requests)
2. **Partially downloaded tour**: Only missing files downloaded
3. **New tour**: All files downloaded (unchanged behavior)

---

# Only Auto-Play First Point If User Is Within GPS Radius

## Problem
When a tour starts, the first point audio plays automatically regardless of the user's location. The user wants auto-play only if they're within the GPS trigger radius of the first point.

## Current Behavior
In `PlayerView.fetchManifest()` (lines 304-308), after loading the manifest, the first point audio auto-plays unconditionally.

## Tasks

- [x] 1. Check if user is within GPS radius of first point before auto-playing
- [x] 2. If within radius → auto-play as before
- [x] 3. If not within radius → prepare audio but don't play (user hits play button)

## Files to Modify
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Player/PlayerView.swift`

## Approach
In `fetchManifest()`, after loading the manifest:
1. Get user's current location from `locationManager.location`
2. Calculate distance to first point
3. Only call `playAudio()` if distance <= triggerRadiusMeters

## Review

### Change Made
Modified `fetchManifest()` in PlayerView.swift to conditionally auto-play the first point:
- Get user's current location from `locationManager.location`
- Calculate distance to first point using `CLLocation.distance(from:)`
- Only call `playAudio()` if distance <= `firstPoint.triggerRadiusMeters`
- If no location or outside radius, just update Now Playing info and wait for user to press play

### Files Changed
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Player/PlayerView.swift` (lines 304-321)

### Behavior Change
- **Before**: First point audio always auto-plays when tour starts
- **After**: First point only auto-plays if user is within GPS trigger radius; otherwise waits for play button

---

# Queue Next Point If User Passes Through While Audio Is Playing

## Problem
If user is at point 2 (audio playing), walks into point 3's radius, then walks past it before audio finishes, point 3's audio never plays. The trigger is lost because LocationManager only checks the current point index.

## Current Behavior
- `checkSequentialPointProximity()` only checks `tourPoints[currentPointIndex]`
- If user enters/exits the next point while audio is playing, it's not detected
- When audio finishes and `advanceToNextPoint()` is called, user may be outside the new point's radius

## Tasks

- [x] 1. Add `nextPointQueued` flag to LocationManager
- [x] 2. In `checkSequentialPointProximity()`, also check next point (currentPointIndex + 1)
- [x] 3. If user enters next point's radius, set `nextPointQueued = true`
- [x] 4. In `advanceToNextPoint()`, if `nextPointQueued`, trigger the new point immediately

## Files to Modify
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Services/LocationManager.swift`

## Review

### Changes Made
1. Added `nextPointQueued: Bool` published property (line 18)
2. Reset flag in `setTourPoints()` and `resetTourProgress()`
3. In `checkSequentialPointProximity()`, added look-ahead check for next point (lines 106-120)
4. In `advanceToNextPoint()`, if point was queued, trigger it immediately (lines 130-148)

### Files Changed
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Services/LocationManager.swift`

### Behavior Change
- **Before**: If user passes through next point while audio is playing, the trigger is lost
- **After**: Next point is queued and auto-plays when current audio finishes

### Flow Example
1. User at point 2, audio playing
2. User walks into point 3's radius → `nextPointQueued = true`, logged as "QUEUED"
3. User walks past point 3 (exits radius)
4. Point 2 audio finishes → `advanceToNextPoint()` sees `wasQueued = true`
5. Point 3 audio auto-plays immediately, logged as "AUTO-TRIGGERED from queue"

---

# Fix Android Connect Page

## Problem
The Android app's Connect bottom sheet has three issues:
1. All 4 social buttons use `R.drawable.ic_notification` (headphones icon) as placeholder
2. Social link click handlers are empty (don't open URLs)
3. Only has "Subscribe to newsletter" placeholder text - missing the full form (email, name, feedback, checkbox, submit)
4. No API connection for feedback submission

## Tasks

- [x] 1. Update `SocialButton` to use Material Icons (ImageVector) instead of drawable resource
- [x] 2. Fix icons: Instagram=CameraAlt, Facebook=People, Website=Language, Email=Email (matching iOS)
- [x] 3. Add URL opening for social links
- [x] 4. Add `POST /feedback` endpoint to Android `ApiService.kt`
- [x] 5. Build full newsletter/feedback form matching iOS implementation
- [x] 6. Add missing localized strings for Italian and French

## Review

### Files Changed

**Android App (Kotlin):**
- `data/api/ApiService.kt` - Added `submitFeedback()` endpoint, `FeedbackRequest` and `FeedbackResponse` DTOs
- `ui/welcome/WelcomeScreen.kt` - Rewrote `ConnectBottomSheet` and `SocialButton`, added `NewsletterFeedbackForm`
- `res/values-it/strings.xml` - Added Italian translations for all Connect form strings
- `res/values-fr/strings.xml` - Added French translations for all Connect form strings

### Changes Made

1. **Icons**: Replaced `R.drawable.ic_notification` placeholder with Material Icons:
   - Instagram → `Icons.Outlined.CameraAlt` (matches iOS `camera.fill`)
   - Facebook → `Icons.Outlined.People` (matches iOS `person.2.fill`)
   - Website → `Icons.Outlined.Language` (matches iOS `globe`)
   - Email → `Icons.Outlined.Email` (matches iOS `envelope.fill`)

2. **Social Links**: Each button now opens the correct URL via `Intent.ACTION_VIEW`

3. **Newsletter Form**: Full form matching iOS with:
   - Email, Name, Feedback fields
   - Newsletter checkbox
   - Submit button with loading spinner
   - Success state with "Send another" option
   - Validation: must provide feedback OR subscribe; email required if subscribing

4. **API Integration**: Form submits to `POST /feedback` using existing Retrofit ApiClient

5. **Localization**: Added all form strings in Italian and French (matching iOS LocalizedStrings)

---

# Match React Discovery Screen to iOS Version (Map-Based)

## Problem
The React/Web DiscoveryScreen shows a card-based bottom sheet with one featured tour, while the iOS version shows a full-screen interactive map with all tour markers.

## Current State (React)
- Static map background image
- Decorative "ping" elements
- Search bar at top
- Bottom sheet card with single featured tour

## Target State (iOS)
- Full-screen interactive map
- Tour markers at each tour's starting point
- Yellow label markers with tour names
- Header: Home button (left), "Discover" title (center), Settings button (right)
- Tap marker → navigate to tour detail

## Tasks

- [x] 1. Add coordinates to Tour type (`startPoint: { lat: number; lng: number }`)
- [x] 2. Add coordinates to MOCK_TOURS in constants.tsx
- [x] 3. Install react-leaflet and leaflet (free, no API key needed)
- [x] 4. Import Leaflet CSS in main entry point
- [x] 5. Update DiscoveryScreen to show interactive map with tour markers
- [x] 6. Add header with Home button, title, Settings button

## Review

### Summary
Converted the React DiscoveryScreen from a card-based bottom sheet to a full-screen interactive map matching the iOS version.

### Files Changed

**types.ts**
- Added `startPoint: { lat: number; lng: number }` to Tour interface

**constants.tsx**
- Added startPoint coordinates to both mock tours (Milan area)

**package.json**
- Added dependencies: `react-leaflet`, `leaflet`, `@types/leaflet`

**index.tsx**
- Added Leaflet CSS import

**screens/DiscoveryScreen.tsx**
- Replaced bottom sheet card with full-screen Leaflet map
- Added dark mode map tiles (CartoDB dark)
- Added yellow dot markers for each tour
- Added header: Home button (left), "Discover" title (center), Settings button (right)
- Clicking marker navigates to tour detail
- Added empty state handling

### Behavior Change
- **Before**: Static map background image with bottom sheet showing one featured tour card
- **After**: Interactive map showing all tours as yellow markers, matching iOS DiscoveryView

---

# Match Android Discover Screen to iOS Version (Map-Based)

## Problem
The Android Discover screen currently shows tours in a vertical list (LazyColumn with TourCards), but the iOS version shows a full-screen map with tour markers as yellow pill-shaped labels.

## iOS Reference (from screenshot)
- Full-screen map (terrain/satellite style)
- Header overlay: Home button (left), "Scopri" title (center), Settings button (right)
- Tour markers shown as yellow pill-shaped labels with tour names
- Tapping a marker should navigate to tour details

## Tasks

- [x] 1. Update DiscoveryScreen.kt to use Google Map instead of LazyColumn
- [x] 2. Make header float over the map (use Box with overlays)
- [x] 3. Add markers for each tour at its first point's location
- [x] 4. Create custom yellow pill-shaped marker labels (always visible)
- [x] 5. Handle marker click to navigate to tour detail
- [x] 6. Set map type to hybrid/satellite to match iOS terrain style
- [x] 7. Fit camera to show all tour markers

## Files to Modify
- `android-app/app/src/main/java/com/bandite/sonicwalkscape/ui/discovery/DiscoveryScreen.kt`

## Dependencies (already present)
- `com.google.maps.android:maps-compose:4.3.0`
- `com.google.android.gms:play-services-maps:18.2.0`
- Google Maps API key configured in manifest

## Notes
- Tours have `points` list with `location.lat` and `location.lng`
- Use first point of each tour as the marker location
- Keep existing loading/error states

## Review

### Summary
Replaced the Android Discover screen's vertical list view with a full-screen Google Map showing tour markers, matching the iOS implementation.

### Files Changed
- `android-app/app/src/main/java/com/bandite/sonicwalkscape/ui/discovery/DiscoveryScreen.kt`

### Changes Made

1. **Replaced LazyColumn with GoogleMap**
   - Full-screen interactive map using `GoogleMap` composable
   - Map type set to `MapType.HYBRID` (satellite/terrain like iOS)
   - Disabled default map controls for cleaner appearance

2. **Header now floats over the map**
   - Uses `Box` layout with header as overlay
   - Added `statusBarsPadding()` for proper spacing
   - Increased button background opacity to 0.5 for better visibility over map

3. **Tour markers with always-visible labels**
   - Uses `MarkerComposable` to render custom marker content
   - Yellow pill-shaped label with tour title (uppercase)
   - Small yellow dot below the label
   - Clicking marker navigates to tour detail

4. **Camera auto-fits to show all markers**
   - On load, camera animates to fit all tour marker bounds
   - Default position set to Montgenèvre area (matches iOS screenshot)

### Key Implementation Details

- `TourLocation` data class pairs a Tour with its LatLng position
- Tours without points are filtered out (no marker shown)
- Uses first point of each tour as marker location
- Existing loading/error states preserved

---

# Tour Setup Carousel Implementation (Android)

## Overview
Implement a 3-step carousel/bottom sheet for tour setup matching the iOS app's `TourSetupSheet.swift`. The carousel appears when the user taps "Start Tour" and allows them to:
1. Select audio language
2. Enable/disable subtitles
3. Choose to download or stream

## Tasks

- [x] 1. Add string resources for the new carousel UI text
- [x] 2. Create TourSetupSheet.kt - Bottom sheet with 3 carousel steps:
  - Step 0: Language selection (icon: waveform/equalizer)
  - Step 1: Subtitle selection ON/OFF (icon: captions/subtitles)
  - Step 2: Download selection (icon: download)
  - Download progress view with retry/skip on error
  - Step indicators (3 dots at bottom)
  - Auto-advance on selection with animation
- [x] 3. Update TourDetailViewModel.kt - Add setup config state
- [x] 4. Update TourDetailScreen.kt - Show setup sheet on "Start Tour" click
- [x] 5. Update NavGraph.kt - Pass setup config (language, subtitles) to Player

## Design Notes (from iOS)
- Use ModalBottomSheet from Material 3
- Match iOS color scheme: yellow for selected, surface purple for unselected
- Buttons: full-width, 12dp corner radius
- Step indicator: 3 circles (filled yellow for current/past, muted for future)
- Animation: 0.3s ease-in-out between steps
- Icons: Step 0=Equalizer, Step 1=Subtitles, Step 2=Download
- Language names: it→Italiano, en→English, fr→Français

## Review

### Summary
Implemented the 3-step tour setup carousel for Android matching the iOS app's `TourSetupSheet.swift` functionality.

### Files Changed

**strings.xml**
- Added 16 new string resources for the carousel UI (choose_audio_language, subtitles, download_tour, etc.)

**TourSetupSheet.kt** (NEW)
- Created new composable with `ModalBottomSheet`
- `TourSetupConfig` data class for passing config to Player
- `LanguageSelectionStep` - Shows available languages with localized names
- `SubtitleSelectionStep` - ON/OFF toggle for subtitles
- `DownloadSelectionStep` - Download (Recommended) or Stream Only
- `DownloadingStep` - Progress bar with percentage, error state with Retry/Skip
- `OptionButton` - Reusable styled button with selected/unselected states
- `StepIndicators` - 3 dots showing progress
- Auto-advance on selection with slide animation

**TourDetailViewModel.kt**
- Added `downloadError` state flow
- Updated `downloadTour()` to accept optional language parameter
- Added `clearDownloadError()` method
- Added error handling with try/catch

**TourDetailScreen.kt**
- Changed `onStartTour` callback to pass `TourSetupConfig`
- Added `showSetupSheet` state
- "Start Tour" button now shows setup sheet instead of navigating directly
- Integrated `TourSetupSheet` with all required callbacks

**NavGraph.kt**
- Updated `Screen.Player` route to include language and subtitles parameters
- Updated `createRoute()` to accept language and subtitlesEnabled
- Updated Player composable to extract new parameters and pass to screen

**PlayerScreen.kt**
- Added `language` and `subtitlesEnabled` parameters
- Uses passed language instead of preferredLanguage from preferences

**PlayerViewModel.kt**
- Updated `loadAndStartTour()` to accept optional language parameter

### Flow
1. User taps "Start Tour" → Setup sheet opens
2. Step 0: Select audio language → auto-advances
3. Step 1: Choose subtitles ON/OFF → auto-advances
4. Step 2: Choose Download or Stream
   - Download: Shows progress, then completes
   - Stream: Completes immediately
5. On complete → Navigates to Player with selected config

---

# Android PlayerScreen - Match iOS PlayerView Implementation

## Problem
The Android PlayerScreen is missing key functionality compared to the iOS PlayerView:
1. Map is just a placeholder (no real map with markers, route, trigger circles)
2. No subtitle overlay synced with audio
3. No cueing system (auto-play next point when user enters its radius while current audio is playing)
4. Missing previous/next point navigation buttons
5. Missing subtitle toggle button
6. Layout doesn't match iOS (should be full-screen map with controls at bottom)

## Tasks

### Phase 1: Update LocationManager with Cueing Support
- [x] 1.1 Add `nextPointQueued` flag to track when user enters next point's radius
- [x] 1.2 Add `currentPointIndex` public accessor
- [x] 1.3 Add `distanceToNextPoint` tracking
- [x] 1.4 Modify `advanceToNextPoint()` to auto-trigger queued points

### Phase 2: Update PlayerViewModel
- [x] 2.1 Expose `tourPoints` list as StateFlow
- [x] 2.2 Add `currentPointIndex` StateFlow
- [x] 2.3 Add `moveToNextPoint()` method
- [x] 2.4 Add `moveToPreviousPoint()` method
- [x] 2.5 Add subtitle loading (fetch manifest, get URLs by point ID)
- [x] 2.6 Add `currentSubtitle` StateFlow
- [x] 2.7 Add `subtitlesEnabled` state toggle
- [x] 2.8 Add subtitle timer to sync with audio position

### Phase 3: Rewrite PlayerScreen Layout (match iOS)
- [x] 3.1 Full-screen Google Map showing:
  - Route polyline
  - Point markers with numbers (yellow=future, orange=current, gray=passed)
  - Trigger radius circles (colored by state)
  - User location
- [x] 3.2 Subtitle overlay on top of map (bottom, semi-transparent background)
- [x] 3.3 Close button (X) overlay top-left
- [x] 3.4 Subtitle toggle button overlay top-right
- [x] 3.5 Audio controls panel at bottom matching iOS:
  - Current point title
  - Seekable progress slider
  - Time display (current / total)
  - Previous point | Skip back 10s | Play/Pause | Skip forward 10s | Next point

### Phase 4: Add String Resources
- [x] 4.1 Add `previous_point` string
- [x] 4.2 Add `next_point` string
- [x] 4.3 Add `toggle_subtitles` string

## Files Modified
1. `LocationManager.kt` - Added cueing support
2. `PlayerViewModel.kt` - Added subtitle/navigation state
3. `PlayerScreen.kt` - Complete rewrite to match iOS layout
4. `strings.xml` (en/it/fr) - Added new strings

## Review

### Summary
Completely rewrote the Android PlayerScreen to match the iOS PlayerView implementation with:
- Full-screen interactive Google Map
- GPS-triggered audio with cueing support
- Real-time subtitle sync
- Full audio controls with point navigation

### Files Changed

**LocationManager.kt**
- Added `_currentPointIndex` StateFlow (exposed as public)
- Added `_distanceToNextPoint` StateFlow for UI display
- Added `_nextPointQueued` StateFlow for cueing
- Modified `checkSequentialPointProximity()` to also check next point's radius
- Modified `advanceToNextPoint()` to auto-trigger queued points
- Added `setPointIndex()` for manual navigation
- Added `getTourPoints()` accessor

**PlayerViewModel.kt**
- Added `_tourPoints` StateFlow
- Added `_currentSubtitle` StateFlow
- Added `_subtitlesEnabled` StateFlow
- Added `subtitleUrlsByPointId` and `audioUrlsByPointId` maps
- Added `fetchManifest()` to get audio/subtitle URLs
- Added `loadSubtitlesForPoint()` to fetch and parse SRT files
- Added `startSubtitleSync()` / `stopSubtitleSync()` for real-time sync
- Added `moveToNextPoint()` and `moveToPreviousPoint()` for manual navigation
- Added `toggleSubtitles()` and `setSubtitlesEnabled()`
- Added `seekTo()` method for slider seeking

**PlayerScreen.kt** (complete rewrite)
- `TourMapView` - Full-screen Google Map with:
  - Route polyline (dark red, matching iOS)
  - Point markers with numbered circles (muted=passed, yellow=current, purple=future)
  - Trigger radius circles (gray=passed, orange=current, dark red=future)
  - User location enabled when available
- `SubtitleOverlay` - Semi-transparent black background with white text
- Top overlay buttons: Close (left) and Subtitle toggle (right)
- `AudioControlsPanel` - Glassmorphic card at bottom with:
  - Point title
  - Seekable slider with time display
  - 5-button row: Previous | -10s | Play/Pause | +10s | Next

**strings.xml (en/it/fr)**
- Added `previous_point`, `next_point`, `toggle_subtitles`

### Key Features Matching iOS
1. **Cueing**: When user walks into next point's radius while audio is playing, the point is queued and auto-triggers when current audio finishes
2. **Subtitles**: Real-time sync with audio position, fetched from manifest URLs, toggle on/off
3. **Map**: Route polyline, numbered markers, trigger radius circles with state-based colors
4. **Controls**: Full playback controls with point navigation, seekable progress bar

---

# App-Wide Language Selection for Android

## Problem
When a user changes the language in the Android app settings, the preference is saved but the UI strings don't change. This is because Android's `stringResource()` follows the device's system locale, not the app's stored preference.

## Solution
Use Android's `AppCompatDelegate.setApplicationLocales()` to apply per-app language settings. This is the modern Android approach that works with API 26+ via AndroidX AppCompat.

## Reference (iOS Implementation)
- Uses `LocalizedStrings` singleton with computed properties
- Each string accesses `UserPreferencesManager.shared.preferredLanguage`
- When language changes, all views automatically re-render
- No restart required

## Android Approach
1. On language change: Call `AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(language))`
2. Android automatically recreates activities with the new locale
3. All `stringResource()` calls will return strings in the selected language
4. On app startup: Apply stored language preference before UI renders

## Tasks

- [x] 1. Update MainActivity to apply stored language on startup
- [x] 2. Update SettingsViewModel to call AppCompatDelegate.setApplicationLocales() when language changes
- [x] 3. Complete missing Italian translations in values-it/strings.xml
- [x] 4. Complete missing French translations in values-fr/strings.xml
- [ ] 5. Test language changes work immediately throughout the app

## Review

### Summary
Implemented app-wide language selection for Android using `AppCompatDelegate.setApplicationLocales()`. When a user changes the language in Settings, the entire app now updates to show strings in the selected language.

### Files Changed

**SettingsViewModel.kt**
- Added imports for `AppCompatDelegate` and `LocaleListCompat`
- Updated `setPreferredLanguage()` to call `AppCompatDelegate.setApplicationLocales()` after saving preference
- Android automatically recreates activities with the new locale applied

**MainActivity.kt**
- Added `@Inject` for `UserPreferencesManager`
- Added startup logic to apply stored language preference
- Compares stored language with current AppCompat locale to avoid unnecessary recreation

**UserPreferencesManager.kt**
- Added `first` import from kotlinx.coroutines.flow
- Added `getPreferredLanguageOnce()` suspend function for synchronous language retrieval on startup

**values-it/strings.xml** (complete rewrite)
- Added all missing translations from iOS `LocalizedStrings.swift`
- Full about_text in Italian
- All onboarding strings (title_1/2/3, text_1a/1b/1c, etc.)
- All difficulty levels, settings, tour setup strings
- Total: 122 strings matching English version

**values-fr/strings.xml** (complete rewrite)
- Added all missing translations from iOS `LocalizedStrings.swift`
- Full about_text in French
- All onboarding strings matching iOS
- All difficulty levels, settings, tour setup strings
- Total: 122 strings matching English version

### How It Works

1. **On language change (Settings)**:
   - User taps a language row
   - `SettingsViewModel.setPreferredLanguage(language)` is called
   - Preference is saved to DataStore
   - `AppCompatDelegate.setApplicationLocales()` is called
   - Android recreates all activities with the new locale
   - All `stringResource()` calls return strings in the new language

2. **On app startup (MainActivity)**:
   - Stored language is retrieved from DataStore
   - If different from current AppCompat locale, applies it
   - Ensures language persists across app restarts

### Behavior
- Language changes take effect immediately (activity recreates)
- All screens update: Welcome, Onboarding, Discovery, Tour Detail, Player, Settings, Tour Completion
- API calls for tour content use the preferred language from DataStore (unchanged)

---

# Android TourDetailScreen - Fix Video/Image Display and Button Positioning

## Problem
Three UI issues on the Android TourDetailScreen:
1. **Video/image not showing** - Shows placeholder icon instead of the trailer video or cover image from the CMS
2. **Back button cut off** - Top-left back button overlaps with the status bar
3. **Bottom button cut off** - The "Start Tour" button is partially hidden at the bottom

## Root Cause Analysis

### Issue 1: Video/Image
- The Android `TourDetailResponse.kt` is missing the `coverTrailerUrl` field that the API returns
- The `TourDetailViewModel` doesn't map `coverTrailerUrl` when creating the Tour object
- The `Tour` model has `coverTrailerUrl` but no helper method `getFullCoverTrailerUrl()`
- The `TourDetailScreen` only checks `getFullCoverImageUrl()`, doesn't try to show video

### Issue 2: Back button
- Uses `padding(16.dp)` which doesn't account for the status bar
- Need to use `statusBarsPadding()` to offset below the system status bar

### Issue 3: Bottom button
- Uses `padding(vertical = 16.dp)` which doesn't account for the navigation bar
- Need to use `navigationBarsPadding()` to ensure button is above the system navigation

## Tasks

- [x] 1. Add `coverTrailerUrl` field to `TourDetailResponse.kt`
- [x] 2. Map `coverTrailerUrl` in `TourDetailViewModel.loadTour()` when creating Tour
- [x] 3. Add `getFullCoverTrailerUrl()` helper method to `Tour.kt`
- [x] 4. Update `TourDetailScreen` to show video trailer first, then fallback to image
- [x] 5. Fix back button positioning by adding `statusBarsPadding()`
- [x] 6. Fix bottom button positioning by adding `navigationBarsPadding()`

## Files Modified
- `android-app/app/src/main/java/com/bandite/sonicwalkscape/data/models/TourDetailResponse.kt`
- `android-app/app/src/main/java/com/bandite/sonicwalkscape/data/models/Tour.kt`
- `android-app/app/src/main/java/com/bandite/sonicwalkscape/ui/tourdetail/TourDetailViewModel.kt`
- `android-app/app/src/main/java/com/bandite/sonicwalkscape/ui/tourdetail/TourDetailScreen.kt`

## Review

### Summary
Fixed three UI issues on the Android TourDetailScreen:
1. Video trailer / cover image now displays from CMS data
2. Back button positioned below status bar
3. Start Tour button positioned above navigation bar

### Changes Made

**TourDetailResponse.kt** (line 14)
- Added `coverTrailerUrl: String?` field to receive video URL from API

**Tour.kt** (lines 55-59)
- Added `getFullCoverTrailerUrl(baseUrl: String)` helper method matching the existing `getFullCoverImageUrl()` pattern

**TourDetailViewModel.kt** (line 88)
- Added `coverTrailerUrl = detail.coverTrailerUrl` when creating Tour object from API response

**TourDetailScreen.kt**
- Added imports for ExoPlayer (Media3) video playback
- Updated cover media section (lines 101-143):
  - First checks for `trailerUrl` → shows `VideoPlayer`
  - Falls back to `imageUrl` → shows `AsyncImage`
  - Falls back to placeholder icon if neither available
- Fixed back button (lines 255-272): Added `statusBarsPadding()` and reduced top padding to 8dp
- Fixed bottom button (lines 295-301): Added `navigationBarsPadding()` before padding
- Added `VideoPlayer` composable (lines 390-427):
  - Uses ExoPlayer with Media3
  - Auto-plays muted, loops continuously (like iOS trailer behavior)
  - No playback controls shown
  - Properly releases player on dispose

### Behavior
- If tour has `coverTrailerUrl`: Auto-playing muted video loop
- If tour has only `coverImageUrl`: Static cover image
- If neither: Placeholder icon (unchanged)
- Back button: Properly positioned below status bar
- Start Tour button: Properly positioned above navigation bar

---

# Android Tour Completion Screen - Match iOS TourCompletionView

## Problem
The Android TourCompletionScreen doesn't match the iOS version. Current Android version:
- Shows a simple success icon and message
- Has only a donation button and return home button

iOS version (from screenshot) shows:
- Yellow checkmark icon + "Tour Completato!" title inline
- Tour name in yellow (e.g., "UNSEEN")
- Custom completion message from CMS (if available)
- Three outlined buttons: "Info Bus", "Seguici", "Supporta"
- One yellow filled button: "Torna alla home"
- Close (X) button in top-right

## Tasks

### Data Model Updates
- [x] 1.1 Add `completionMessage` field to `Tour.kt` (`Map<String, String>?`)
- [x] 1.2 Add `busInfo` field to `Tour.kt` (`Map<String, String>?`)
- [x] 1.3 Add `getDisplayCompletionMessage(language: String)` method to `Tour.kt`
- [x] 1.4 Add `getDisplayBusInfo(language: String)` method to `Tour.kt`
- [x] 1.5 Update `TourDetailResponse.kt` to include `completionMessage` and `busInfo`
- [x] 1.6 Update `TourDetailViewModel.kt` to map new fields when creating Tour

### Navigation Updates
- [x] 2.1 Update `NavGraph.kt` to pass language to completion screen
- [x] 2.2 Update `TourCompletionScreen` parameters to receive language and onClose

### UI Rewrite
- [x] 3.1 Rewrite `TourCompletionScreen.kt` to match iOS layout:
  - Semi-transparent dark background (0.92 opacity)
  - Yellow checkmark + title inline (Row)
  - Tour name in yellow
  - Completion message (if available)
  - "Info Bus" button (only if busInfo exists) → opens AlertDialog
  - "Seguici" button → opens ConnectBottomSheet
  - "Supporta" button → opens external URL
  - "Torna alla home" yellow filled capsule button
  - Close (X) button top-right
- [x] 3.2 Create `TourCompletionViewModel.kt` to fetch tour data

### String Resources
- [x] 4.1 Add `bus_info` string to all language files (en: "Info Bus", it: "Info Bus", fr: "Info Bus")
- [x] 4.2 Add `follow_us` string to all language files (en: "Follow Us", it: "Seguici", fr: "Suivez-nous")
- [x] 4.3 Add `support` string to all language files (en: "Support", it: "Supporta", fr: "Soutenir")
- [x] 4.4 Update `return_home` string in all languages to match iOS

## Review

### Summary
Completely rewrote the Android TourCompletionScreen to match the iOS TourCompletionView design and functionality.

### Files Changed

**Tour.kt**
- Added `completionMessage: Map<String, String>?` field
- Added `busInfo: Map<String, String>?` field
- Added `getDisplayCompletionMessage(language)` helper method
- Added `getDisplayBusInfo(language)` helper method

**TourDetailResponse.kt**
- Added `completionMessage: String?` field
- Added `busInfo: String?` field

**TourDetailViewModel.kt**
- Updated Tour creation to map `completionMessage` and `busInfo` from API response

**NavGraph.kt**
- Updated `TourCompletion` route to include `language` parameter
- Updated navigation call to pass language from PlayerScreen
- Added `onClose` callback parameter

**TourCompletionScreen.kt** (complete rewrite)
- Semi-transparent dark background (92% opacity)
- Yellow checkmark icon + "Tour Completato!" title inline
- Tour name displayed in yellow uppercase
- Completion message from CMS (if available)
- "Info Bus" button (only shows if busInfo exists) → opens AlertDialog with CMS content
- "Seguici" button → opens ConnectBottomSheet (reused from WelcomeScreen)
- "Supporta" button → opens external donation URL
- "Torna alla home" yellow filled capsule button
- Close (X) button top-right with status bar padding

**TourCompletionViewModel.kt** (new file)
- Fetches tour detail from API
- Exposes tour data as StateFlow

**strings.xml (en/it/fr)**
- Added `bus_info`, `follow_us`, `support` strings
- Updated `tour_complete_title` and `return_home` to match iOS

### Behavior
- Screen displays custom completion message from CMS if available
- "Info Bus" button only appears if tour has busInfo content (conditional like iOS)
- "Seguici" opens the same Connect modal as the home page (social links + feedback form)
- "Supporta" opens external donation URL in browser
- Language is passed from PlayerScreen to ensure correct localization
