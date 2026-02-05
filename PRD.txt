
# PRD – BANDITE Sonic Walkscape App

## 1. Product Overview

### 1.1 Vision

Create a **branded mobile app** (iOS first, Android later) that offers **sonic walking tours**: immersive, geolocated audio experiences along a **linear path** in various cities.

- Multiple tours across multiple cities.
- One-off branded app for a **nonprofit**.
- Donation-based monetization and **voucher-based access**.
- Strong focus on **offline reliability** and **simple UX**.

Audio content and storyline are produced by the artistic team; the app + CMS are the **delivery and management platform**.

### 1.2 Goals

- Deliver initial **2 tours** (Italian + French, English optional).
- Provide **frictionless on-site experience**:
  - GPS-triggered audio in sequence.
  - Offline-friendly with clear download experience.
- Provide a **web CMS** for self-service tour management.
- Ensure **GDPR-compliant analytics**.
- Launch **iOS first**, then Android.

---

## 2. Scope

### 2.1 In Scope (MVP – iOS)

- iOS app (iPhone) with:
  - User onboarding & login (email/password + Apple/Google).
  - Tour catalog & tour details.
  - **Optional pre-download** of tours for offline use.
  - When user taps **Start Tour**, if the tour is not downloaded:
    - The app **prompts and requires a download** before starting playback (Option B).
  - GPS-based region triggers (100–300m radius) in defined sequence.
  - Auto-playing audio:
    - If user enters next region while previous audio is playing:
      - Previous audio finishes.
      - Next point’s audio auto-plays.
  - Dark mode map with route and points.
  - Offline experience:
    - GPS-triggered audio and subtitles.
    - Map display from offline map tiles.
  - Voucher / access code redemption.
  - External donation link.
  - Settings and language control.
  - Analytics event logging.

- Web-based CMS:
  - Tour creation & versioning (draft/published).
  - Map-based linear route creation.
  - Geofenced points with:
    - Audio upload (.mp3/.wav up to 50MB).
    - Images.
    - Title & description.
    - Multilingual text.
    - .srt subtitles per language.
  - Cloning tours for new languages.
  - Voucher code generation & management.
  - Basic analytics dashboard.

- Backend & infrastructure:
  - REST APIs for mobile & CMS.
  - Auth & user management.
  - Storage for media & subtitles.
  - Analytics ingestion & storage.

### 2.2 Out of Scope (for MVP)

- Android app (Phase 2).
- Gamification (scoring, badges, social sharing).
- Direct in-app purchases (IAP) for donations (donations handled via external service).
- Advanced accessibility (beyond subtitles & standard controls).
- Full web-based “tour player” for end users (future web companion).

---

## 3. Users & Personas

### 3.1 End Users (Walkers)

- Locals and tourists.
- Not necessarily tech-savvy.
- Need:
  - Simple onboarding.
  - Clear indication of where to start.
  - Reliable **GPS + audio**.
  - Ability to pre-download a tour, but also the option to decide at start.

### 3.2 Artistic Team (CMS Creators)

- Artists, dramaturgs, producers.
- Need:
  - Map-based route editor.
  - Easy upload of audio, images, subtitles.
  - Multilingual content management.
  - Draft/publish and versioning.

### 3.3 Admins (Nonprofit Staff)

- Need:
  - High-level analytics (downloads, completions, language usage).
  - Voucher code management.
  - Control over published tours.

---

## 4. User Flows (App)

### 4.1 Onboarding & Auth

1. First launch:
   - App detects system language and suggests it (Italian/French/English).
   - User can override app language (affects UI, default audio/subtitle language).
   - Privacy & tracking consent (GDPR).
2. Auth:
   - Sign up with email/password, or
   - Sign in with Apple, or
   - Sign in with Google.
3. Optional:
   - User enters name and opts in to mailing list.

### 4.2 Tour Discovery

1. User sees list of available tours:
   - Title, city, approximate duration, distance, languages available.
2. User taps a tour:
   - Sees description, hero image, map preview with route.
   - Chooses audio/subtitle language (default from app language).
   - Sees:
     - **Download for offline use** button.
     - **Start Tour** button (if user has access).

### 4.3 Access Control & Voucher

1. Tour can be:
   - Public & free, or
   - Protected (requires voucher).
2. If protected:
   - User taps **Unlock with voucher**.
   - Enters voucher code.
   - App sends code to backend for validation.
   - On success:
     - Access is granted and tied to user account.
     - User can see **Start Tour** and **Download** buttons.

### 4.4 Download Flow (Option B Behavior)

- Download is **optional** until the tour is started:
  1. User may download directly from tour screen (recommended).
  2. If user taps **Start Tour** and tour is **not** fully downloaded:
     - App shows:
       > "To ensure stable playback, you need to download this tour (audio, images, map). Download now?"
     - User confirms → full language package is downloaded:
       - Audio files (up to 50MB each; total up to ~200MB per tour).
       - Images.
       - .srt subtitles.
       - Offline map tiles for the region.
  3. Once download completes:
     - Tour is marked **Available offline**.
     - Tour starts.

### 4.5 Walking the Tour

1. User opens a downloaded (or just-downloaded) tour and sees:
   - Dark-mode map with route and points.
   - Indicator of current position and starting point.
2. At starting point:
   - App prompts to begin.
   - Intro audio auto-plays.
3. As user walks:
   - GPS geofencing detects entry into regions (100–300m per point).
   - Points are triggered in **sequence**:
     - If user enters the next region early:
       - Current audio continues until completion.
       - Next point audio is **queued** and auto-plays after the current one.
4. Playback:
   - Playback occurs even in background (screen off).
   - User can pause/play, replay last point.
5. Tour completion:
   - Show completion screen with:
     - Summary.
     - Donation link (external).
     - Option to opt-in mailing list (if not already).
     - Feedback prompt (optional).

---

## 5. Functional Requirements

### 5.1 Mobile App

**Auth & Account**

- Email/password registration & login.
- Apple Sign-In (iOS).
- Google Sign-In.
- Password reset.
- Store user profile:
  - name (optional),
  - email,
  - preferred language,
  - mailing list opt-in.

**Tour Catalog**

- List tours with:
  - Title, short description.
  - City/location.
  - Duration and distance.
  - Languages available.
- Filter or sort by city/language (future).

**Tour Details**

- Show:
  - Cover image, description.
  - List of available languages (audio + subtitles).
  - Map preview with starting point and route.
- Actions:
  - Change audio/subtitle language.
  - Download for offline use (language package).
  - Start Tour (with download enforcement if not yet downloaded).
  - Unlock with voucher (if required).

**Download & Offline**

- **Optional pre-download**, mandatory download on first Start Tour.
- Download includes:
  - Audio files for selected language.
  - Images.
  - Subtitles (.srt) for that language.
  - Offline map tiles for route area.
- Show:
  - Download progress.
  - Total size (up to ~200MB).
- Allow:
  - Cancel, pause, resume download.
  - Delete downloaded content per tour.

**Map & GPS**

- Dark mode base map (using Mapbox/MapLibre).
- Show:
  - User position.
  - Route polyline.
  - Points of interest (numbered).
- Geofencing:
  - Regions around each point (100–300m).
  - Sequential triggering logic.

**Audio & Subtitles**

- Local playback of downloaded files.
- Auto-play on entering triggered region:
  - If no audio playing → start immediately.
  - If audio playing → queue next track.
- Show subtitles synchronized from .srt files (per language).
- Support background playback with lock-screen controls (where possible).

**Settings**

- Change app language.
- Set preferred audio/subtitle language.
- Manage account (name, email).
- Manage analytics & mailing list consent.
- View app version, legal, privacy.

**Analytics**

Track (with user consent):

- Events:
  - app_open
  - signup / login
  - tour_viewed
  - tour_download_started / completed / deleted
  - tour_started
  - point_triggered
  - tour_completed
  - voucher_redeemed
  - donation_link_clicked
- User properties:
  - user_id
  - email (if available)
  - preferred_language
  - device_type, OS version
  - mailing_list_opt_in

### 5.2 CMS (Web)

**Auth & Roles**

- Email/password login for CMS.
- Roles:
  - Admin (full access).
  - Editor (limited; content only).

**Tour Management**

- Create, view, update, delete tours.
- Draft / Published status.
- Duplicate tour (for language cloning).

**Route & Points**

- Map-based editor:
  - Draw route polyline.
  - Add/edit/remove points along route.
- For each point:
  - Set position (lat/lng, draggable on map).
  - Set trigger radius (default 100–300m).
  - Set sequence order.

**Content Management**

- Per tour & per language:
  - Title, description.
  - Audio upload/link (.mp3/.wav, max 50MB).
  - Point-specific audio file assignment.
  - Image upload (JPG/PNG).
  - Text description (multilingual).
  - .srt subtitles upload per point per language.
- Cloning:
  - Clone existing tour with structure and metadata, then replace audio/text/subtitles.

**Voucher Management**

- Create voucher batches with:
  - Code pattern or auto-generated codes.
  - Usage limit (single-use/multi-use).
  - Expiration date.
  - Associated tour(s).
- Manage:
  - Status (active/inactive).
  - View list of redemptions.

**Analytics Dashboard**

- Per tour:
  - # of downloads.
  - # of starts, # of completions.
  - Language breakdown.
  - Voucher usage.
- Export data as CSV.

### 5.3 Backend

Core capabilities:

- Auth API (user & CMS).
- Tour/tour version listing & details.
- Download manifest for mobile app.
- Voucher validation.
- Analytics event ingestion & aggregation.
- Media URL generation (signed URLs for downloads).

---

## 6. Non-Functional Requirements

- Performance:
  - App home screen loads under 3 seconds on modern devices.
- Reliability:
  - Backend & CMS uptime ≥ 99%.
- Security:
  - HTTPS for all endpoints.
  - JWT or similar for auth.
  - Encrypted password storage.
  - Role-based access in CMS.
- Privacy (GDPR):
  - Data stored in EU or GDPR-compliant providers.
  - Explicit consent for analytics and mailing list.
  - Ability to delete user data.
- Scalability:
  - Support dozens of tours and thousands of users without redesign.

---

## 7. Technology Choices (Summary)

- Mobile:
  - **Recommended:** Native Swift + SwiftUI (iOS), Kotlin + Jetpack Compose (Android later).
- Backend:
  - **Recommended:** Node.js + NestJS (TypeScript) + PostgreSQL.
- CMS:
  - **Recommended:** React (Next.js) frontend.
- Maps:
  - **Recommended:** Mapbox SDKs / MapLibre with dark theme and offline tiles.
- Auth:
  - **Recommended:** Firebase Auth or Auth0.
- Analytics:
  - Mixpanel/Amplitude + Sentry/Crashlytics.
- Storage:
  - S3/Cloud Storage/Azure Blob with EU region and CDN.

---

## 8. Release Plan (High Level)

- Phase 0: Design & architecture.
- Phase 1: Backend & CMS MVP.
- Phase 2: iOS app MVP.
- Phase 3: Public iOS launch.
- Phase 4: Android app.
- Phase 5: Web companion for listeners (future).

---

## 9. Risks & Mitigations

- GPS accuracy in dense areas → large trigger radius, field testing.
- Battery usage → optimized location updates.
- Offline complexity → clear download step and size limits.
- GDPR compliance → DPA with providers, explicit consent, data deletion process.

---

## 10. Developer-Ready API Specification (Draft)

Base URL examples:

- Mobile API: `https://api.bandite.walkscape.org/v1`
- CMS API: `https://admin-api.bandite.walkscape.org/v1`

### 10.1 Auth (Shared)

#### POST `/auth/register`

Registers a new end user (mobile).

**Request (JSON)**

```json
{
  "email": "user@example.org",
  "password": "string-min-8",
  "name": "Optional Name",
  "preferredLanguage": "it",
  "mailingListOptIn": true
}
```

**Response (200)**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.org",
    "name": "Optional Name",
    "preferredLanguage": "it",
    "mailingListOptIn": true
  },
  "tokens": {
    "accessToken": "jwt",
    "refreshToken": "jwt"
  }
}
```

#### POST `/auth/login`

**Request**

```json
{
  "email": "user@example.org",
  "password": "string"
}
```

**Response**

Same shape as `/auth/register`.

#### POST `/auth/refresh`

**Request**

```json
{
  "refreshToken": "jwt"
}
```

**Response**

```json
{
  "accessToken": "jwt"
}
```

#### POST `/auth/social`

For Apple/Google sign-in: client sends provider token.

**Request**

```json
{
  "provider": "apple",
  "token": "id_token_from_sdk"
}
```

**Response**

Same as `/auth/login`.

---

### 10.2 User Profile

#### GET `/me` (auth required)

Returns current user.

#### PATCH `/me`

Update profile:

```json
{
  "name": "New Name",
  "preferredLanguage": "fr",
  "mailingListOptIn": false
}
```

---

### 10.3 Tours (Mobile-facing)

#### GET `/tours`

Query parameters:

- `language` (optional): filter by available language.
- `city` (optional).

**Response**

```json
[
  {
    "id": "uuid",
    "slug": "bandite-city-center",
    "title": {
      "it": "Titolo italiano",
      "fr": "Titre français",
      "en": "English title"
    },
    "descriptionPreview": {
      "it": "Breve descrizione...",
      "fr": "Brève description...",
      "en": "Short description..."
    },
    "city": "City Name",
    "durationMinutes": 120,
    "distanceKm": 4.5,
    "languages": ["it", "fr"],
    "isProtected": true,
    "coverImageUrl": "https://cdn/.../cover.jpg"
  }
]
```

#### GET `/tours/{tourId}`

Returns full detail metadata for selected language (via query `?language=it`).

**Response**

```json
{
  "id": "uuid",
  "slug": "bandite-city-center",
  "title": "Titolo italiano",
  "description": "Descrizione lunga...",
  "city": "City Name",
  "durationMinutes": 120,
  "distanceKm": 4.5,
  "languages": ["it", "fr"],
  "isProtected": true,
  "coverImageUrl": "https://cdn/.../cover.jpg",
  "startingPoint": {
    "lat": 45.123,
    "lng": 7.123
  },
  "routePreview": {
    "polyline": "encoded_polyline_string"
  },
  "downloadInfo": {
    "estimatedSizeMb": 180,
    "isDownloaded": false
  }
}
```

#### GET `/tours/{tourId}/manifest`

Returns download manifest for a given language.

Query: `?language=it`

**Response**

```json
{
  "tourId": "uuid",
  "language": "it",
  "version": 3,
  "audio": [
    {
      "pointId": "uuid-point-1",
      "order": 1,
      "fileUrl": "https://signed-cdn/.../p1-it.mp3",
      "fileSizeBytes": 12345678
    }
  ],
  "images": [
    {
      "pointId": "uuid-point-1",
      "fileUrl": "https://signed-cdn/.../p1.jpg",
      "fileSizeBytes": 234567
    }
  ],
  "subtitles": [
    {
      "pointId": "uuid-point-1",
      "language": "it",
      "fileUrl": "https://signed-cdn/.../p1-it.srt",
      "fileSizeBytes": 12345
    }
  ],
  "offlineMap": {
    "tilesUrlTemplate": "https://tiles.provider.org/{z}/{x}/{y}.pbf?token=...",
    "bounds": {
      "north": 45.2,
      "south": 45.1,
      "east": 7.2,
      "west": 7.1
    },
    "recommendedZoomLevels": [14, 15, 16]
  }
}
```

Mobile will use this manifest to orchestrate download.

---

### 10.4 Points (Mobile-facing)

#### GET `/tours/{tourId}/points`

Query: `?language=it`

**Response**

```json
[
  {
    "id": "uuid-point-1",
    "order": 1,
    "title": "Titolo punto",
    "description": "Descrizione testuale",
    "location": {
      "lat": 45.123,
      "lng": 7.123
    },
    "triggerRadiusMeters": 150
  }
]
```

(App uses this to configure geofences.)

---

### 10.5 Voucher API

#### POST `/vouchers/validate`

**Request**

```json
{
  "code": "BANDITE-2025-XYZ",
  "tourId": "uuid"
}
```

**Response (200)**

```json
{
  "valid": true,
  "maxUses": 1,
  "usesSoFar": 0,
  "expiresAt": "2026-01-01T00:00:00Z"
}
```

If valid, backend also associates access to user in the DB.

---

### 10.6 Analytics API

#### POST `/analytics/events` (batch)

**Request**

```json
{
  "events": [
    {
      "name": "tour_started",
      "userId": "uuid-or-null",
      "anonymousId": "device-id-or-app-id",
      "tourId": "uuid",
      "pointId": null,
      "language": "it",
      "device": "iPhone14,3",
      "osVersion": "iOS 18.0",
      "createdAt": "2025-12-05T10:15:00Z",
      "properties": {
        "offline": true
      }
    }
  ]
}
```

**Response**

```json
{
  "status": "ok"
}
```

---

### 10.7 CMS APIs (Examples)

#### GET `/admin/tours`

List tours for CMS dashboard.

#### POST `/admin/tours`

Create a new tour.

```json
{
  "slug": "bandite-city-center",
  "defaultCity": "City Name",
  "defaultDurationMinutes": 120,
  "defaultDistanceKm": 4.5
}
```

#### PATCH `/admin/tours/{tourId}`

Update metadata.

#### POST `/admin/tours/{tourId}/versions`

Create language version.

```json
{
  "language": "it",
  "title": "Titolo italiano",
  "description": "Descrizione...",
  "status": "draft"
}
```

#### POST `/admin/tours/{tourId}/points`

Create points with route ordering.

```json
{
  "order": 1,
  "location": {
    "lat": 45.123,
    "lng": 7.123
  },
  "triggerRadiusMeters": 150
}
```

#### POST `/admin/media/upload`

Media upload (audio/images/subtitles), returns fileId and URL.

#### POST `/admin/voucher-batches`

Create voucher batch.

---

## 11. Data Model (Schema Draft)

### 11.1 Tables (Core)

#### `users`

- `id` (UUID, PK)
- `email` (unique, nullable if social-only)
- `password_hash` (nullable for social-only)
- `name`
- `preferred_language` (e.g., "it", "fr", "en")
- `mailing_list_opt_in` (boolean)
- `created_at`
- `updated_at`

#### `user_auth_providers`

- `id` (UUID, PK)
- `user_id` (FK → users.id)
- `provider` ("apple", "google", "password")
- `provider_user_id` (string)
- Unique `(provider, provider_user_id)`

#### `tours`

- `id` (UUID, PK)
- `slug` (string, unique)
- `default_city`
- `default_duration_minutes`
- `default_distance_km`
- `is_protected` (boolean)
- `cover_image_file_id` (FK → media_files.id)
- `created_at`
- `updated_at`

#### `tour_versions`

Represents tour per language and version.

- `id` (UUID, PK)
- `tour_id` (FK → tours.id)
- `language` (string, e.g., "it")
- `title`
- `description`
- `status` ("draft", "published", "archived")
- `version_number` (int, auto-increment per tour+language)
- `starting_point_lat`
- `starting_point_lng`
- `route_polyline` (text)
- `created_at`
- `updated_at`

#### `tour_points`

Language-agnostic structural points (sequence & location).

- `id` (UUID, PK)
- `tour_id` (FK → tours.id)
- `order` (int, 1..N)
- `lat`
- `lng`
- `default_trigger_radius_meters`
- `created_at`
- `updated_at`

#### `tour_point_localizations`

Language-specific content per point.

- `id` (UUID, PK)
- `tour_point_id` (FK → tour_points.id)
- `tour_version_id` (FK → tour_versions.id)
- `language` (string)
- `title`
- `description`
- `audio_file_id` (FK → media_files.id)
- `image_file_id` (FK → media_files.id, nullable)
- `subtitle_file_id` (FK → media_files.id, nullable)
- Unique: `(tour_point_id, tour_version_id, language)`

#### `media_files`

- `id` (UUID, PK)
- `type` ("audio", "image", "subtitle")
- `mime_type`
- `file_size_bytes`
- `storage_path` (string)
- `created_at`

#### `user_tour_access`

Which users have access to which tours (unlocked/free).

- `id` (UUID, PK)
- `user_id` (FK → users.id)
- `tour_id` (FK → tours.id)
- `source` ("free", "voucher")
- `created_at`
- Unique `(user_id, tour_id)`

#### `vouchers`

- `id` (UUID, PK)
- `code` (string, unique)
- `batch_id` (FK → voucher_batches.id, nullable)
- `tour_id` (FK → tours.id, nullable for global codes)
- `max_uses` (int)
- `uses_so_far` (int)
- `expires_at` (timestamp, nullable)
- `created_at`
- `updated_at`

#### `voucher_batches`

- `id` (UUID, PK)
- `name`
- `description`
- `tour_id` (FK → tours.id, nullable)
- `created_by_cms_user_id` (FK → cms_users.id)
- `created_at`

#### `voucher_redemptions`

- `id` (UUID, PK)
- `voucher_id` (FK → vouchers.id)
- `user_id` (FK → users.id)
- `tour_id` (FK → tours.id)
- `redeemed_at`

#### `analytics_events`

- `id` (UUID, PK)
- `name` (string)
- `user_id` (FK → users.id, nullable)
- `anonymous_id` (string, nullable)
- `tour_id` (FK → tours.id, nullable)
- `point_id` (FK → tour_points.id, nullable)
- `language` (string, nullable)
- `device` (string, nullable)
- `os_version` (string, nullable)
- `properties` (JSONB)
- `created_at` (timestamp)

#### `cms_users`

- `id` (UUID, PK)
- `email` (unique)
- `password_hash`
- `role` ("admin", "editor")
- `created_at`
- `updated_at`

---

## 12. Diagrams (Text / Mermaid)

### 12.1 System Architecture

```mermaid
flowchart LR
    subgraph Client
        A[Mobile App (iOS/Android)]
        B[Web CMS (Browser)]
    end

    subgraph Backend
        API[REST API (NestJS)]
        AUTH[Auth Provider (Firebase/Auth0)]
        DB[(PostgreSQL)]
        STORAGE[(Object Storage - Audio/Images/Subtitles)]
        ANALYTICS[Analytics & Logs]
    end

    subgraph External
        MAPS[Map Tiles Provider (Mapbox/MapLibre)]
        DONATE[Donation Service]
    end

    A -->|HTTPS| API
    B -->|HTTPS| API

    API --> DB
    API --> STORAGE
    API --> AUTH
    API --> ANALYTICS

    A --> MAPS
    A --> DONATE
```

### 12.2 ERD (Simplified)

```mermaid
erDiagram
    USERS ||--o{ USER_AUTH_PROVIDERS : has
    USERS ||--o{ USER_TOUR_ACCESS : has
    USERS ||--o{ VOUCHER_REDEMPTIONS : makes
    USERS ||--o{ ANALYTICS_EVENTS : "may generate"

    TOURS ||--o{ TOUR_VERSIONS : has
    TOURS ||--o{ TOUR_POINTS : has
    TOURS ||--o{ USER_TOUR_ACCESS : "may be accessed by"
    TOURS ||--o{ VOUCHER_BATCHES : "may belong to"
    TOURS ||--o{ VOUCHERS : "may be limited to"
    TOURS ||--o{ ANALYTICS_EVENTS : "may have events"

    TOUR_POINTS ||--o{ TOUR_POINT_LOCALIZATIONS : has
    TOUR_POINTS ||--o{ ANALYTICS_EVENTS : "triggered at"

    TOUR_VERSIONS ||--o{ TOUR_POINT_LOCALIZATIONS : has

    TOUR_POINT_LOCALIZATIONS }o--|| MEDIA_FILES : "audio_file"
    TOUR_POINT_LOCALIZATIONS }o--|| MEDIA_FILES : "image_file"
    TOUR_POINT_LOCALIZATIONS }o--|| MEDIA_FILES : "subtitle_file"

    VOUCHER_BATCHES ||--o{ VOUCHERS : has
    VOUCHERS ||--o{ VOUCHER_REDEMPTIONS : has

    CMS_USERS ||--o{ VOUCHER_BATCHES : creates
```

### 12.3 Sequence – Starting a Tour (with Download Enforcement)

```mermaid
sequenceDiagram
    participant U as User
    participant App as Mobile App
    participant API as Backend API
    participant Storage as Media Storage

    U->>App: Open Tour Detail
    App->>API: GET /tours/{id}
    API-->>App: Tour metadata + download status

    U->>App: Tap "Start Tour"
    App->>App: Check if tour language package is downloaded
    alt Not downloaded
        App->>U: Prompt "Download required"
        U->>App: Confirm download
        App->>API: GET /tours/{id}/manifest?language=it
        API-->>App: Manifest (audio/images/subtitles/map)
        App->>Storage: Download files (from manifest URLs)
        Storage-->>App: Files downloaded
    end

    App->>App: Initialize GPS & audio queue
    App->>U: Show map and start intro audio
```

### 12.4 Sequence – Voucher Redemption

```mermaid
sequenceDiagram
    participant U as User
    participant App as Mobile App
    participant API as Backend
    participant DB as Database

    U->>App: Enter voucher code for a tour
    App->>API: POST /vouchers/validate {code, tourId}
    API->>DB: Validate voucher (code, expiry, maxUses)
    DB-->>API: Valid result
    API->>DB: Insert user_tour_access and voucher_redemption
    DB-->>API: OK
    API-->>App: {valid: true}
    App->>U: Show "Tour unlocked"
```

### 12.5 Sequence – GPS-triggered Playback

```mermaid
sequenceDiagram
    participant GPS as Device GPS
    participant App as Mobile App
    participant Audio as Audio Player

    loop Periodic / significant location updates
        GPS-->>App: New location
        App->>App: Determine if entered next point region
        alt Entered new region
            alt No audio playing
                App->>Audio: Play point N audio
            else Audio already playing
                App->>App: Queue point N as "next"
            end
        end
        alt Current audio finished and "next" queued
            App->>Audio: Play queued audio
        end
    end
```

---

This PRD now reflects **Option B** (download optional until start, then required) and includes:

- Updated requirements  
- Developer-ready **API spec**  
- **Data schema** draft  
- **Architecture, ERD, and sequence diagrams** in mermaid/text form  

