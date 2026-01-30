# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BANDITE Sonic Walkscape is a branded mobile app for nonprofit-led sonic walking tours. The app delivers immersive, geolocated audio experiences along linear paths in various cities.

**Key characteristics:**
- iOS-first (Swift + SwiftUI), Android later
- Web CMS for tour management (React/Next.js)
- Backend API (Node.js + NestJS + TypeScript + PostgreSQL)
- Offline-first architecture with mandatory downloads
- GPS-triggered sequential audio playback
- GDPR-compliant analytics
- Voucher-based access control

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Mobile App (iOS)                  │
│  - GPS geofencing (100-300m radius)                 │
│  - Offline audio/subtitle/map playback              │
│  - Download manager for tour packages               │
│  - Background audio with lock-screen controls       │
└─────────────────┬───────────────────────────────────┘
                  │ HTTPS REST API
┌─────────────────▼───────────────────────────────────┐
│               Backend (NestJS)                       │
│  - Auth (JWT + Firebase/Auth0)                      │
│  - Tour/manifest APIs                               │
│  - Voucher validation                               │
│  - Analytics ingestion                              │
└─────────────────┬───────────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
┌───────▼────────┐  ┌────────▼──────────┐
│  PostgreSQL    │  │  Object Storage   │
│  - Users       │  │  - Audio (50MB)   │
│  - Tours       │  │  - Images         │
│  - Points      │  │  - Subtitles      │
│  - Vouchers    │  │  - Map tiles      │
│  - Analytics   │  │                   │
└────────────────┘  └───────────────────┘

┌─────────────────────────────────────────────────────┐
│                 Web CMS (Next.js)                   │
│  - Map-based route editor                           │
│  - Tour versioning (draft/published)                │
│  - Multilingual content management                  │
│  - Media upload & management                        │
│  - Voucher batch generation                         │
│  - Analytics dashboard                              │
└─────────────────────────────────────────────────────┘
```

## Core Domain Concepts

### Tour Structure
- **Tour**: Base entity (slug, city, duration, distance, protection status)
- **Tour Version**: Language-specific variant (title, description, status, route polyline)
- **Tour Points**: Sequential waypoints with GPS coordinates and trigger radius
- **Point Localizations**: Language-specific content (audio, images, subtitles, text)

### Sequential Audio Triggering
1. Points must be triggered in order (1 → 2 → 3...)
2. If user enters next region while audio is playing:
   - Current audio finishes completely
   - Next audio auto-plays immediately after
3. GPS monitoring continues even when screen is locked

### Download Flow (Option B)
- Download is **optional** until tour starts
- When user taps "Start Tour" without download:
  - App blocks and prompts mandatory download
  - Downloads full language package: audio + images + subtitles + map tiles
  - Typical package size: ~200MB
- Once downloaded, tour is fully playable offline

### Access Control
- Tours can be public (free) or protected (voucher-required)
- Vouchers have: code, max uses, expiration, tour association
- Redemption creates `user_tour_access` record
- Access is persistent per user account

## Key API Endpoints

### Mobile APIs (`/v1`)
- `POST /auth/register` - Email/password registration
- `POST /auth/login` - Standard login
- `POST /auth/social` - Apple/Google sign-in
- `GET /tours` - List tours (with filters)
- `GET /tours/{id}` - Tour details
- `GET /tours/{id}/manifest?language=it` - Download manifest with signed URLs
- `GET /tours/{id}/points?language=it` - GPS points with trigger radii
- `POST /vouchers/validate` - Redeem voucher code
- `POST /analytics/events` - Batch analytics ingestion

### CMS APIs (`/admin`)
- `GET /admin/tours` - List all tours
- `POST /admin/tours` - Create tour
- `POST /admin/tours/{id}/versions` - Create language version
- `POST /admin/tours/{id}/points` - Add GPS points
- `POST /admin/media/upload` - Upload audio/images/subtitles
- `POST /admin/voucher-batches` - Generate voucher codes

## Database Schema (Core Tables)

### Users & Auth
- `users` - User profiles (email, name, preferred_language, mailing_list_opt_in)
- `user_auth_providers` - Social auth mappings
- `user_tour_access` - Unlocked tours per user

### Tours & Content
- `tours` - Base tour entity
- `tour_versions` - Language variants (with route polyline)
- `tour_points` - Sequential GPS waypoints
- `tour_point_localizations` - Language-specific content per point
- `media_files` - Uploaded audio/images/subtitles with storage paths

### Access & Analytics
- `vouchers` - Access codes
- `voucher_batches` - Grouped code generation
- `voucher_redemptions` - Usage tracking
- `analytics_events` - Event stream (JSONB properties)

### CMS
- `cms_users` - CMS staff (admin/editor roles)

## Development Guidelines

### Mobile (iOS)
- Use Swift + SwiftUI
- Implement CoreLocation for geofencing with background mode
- Use AVAudioPlayer for offline playback
- Integrate Mapbox/MapLibre SDK for dark mode maps with offline tiles
- Handle significant location changes efficiently (battery optimization)
- Audio files are .mp3/.wav (up to 50MB each)
- Subtitles are .srt files parsed locally

### Backend (NestJS + TypeScript)
- Use PostgreSQL with TypeORM or Prisma
- Generate signed URLs for media downloads (S3/Cloud Storage)
- Implement JWT-based auth with refresh tokens
- GDPR compliance: EU region storage, explicit consent, data deletion endpoints
- Analytics events use JSONB for flexible properties
- Voucher validation must be atomic (race condition protection)

### CMS (Next.js + React)
- Map editor using Mapbox/MapLibre GL JS
- Drag-and-drop route polyline editing
- Media upload with progress indicators (large audio files)
- Support cloning tours for language variants
- Role-based access: admins see all, editors see content only
- Analytics dashboard with CSV export

### Media Handling
- Audio: .mp3/.wav, max 50MB per file
- Images: JPG/PNG for points and cover images
- Subtitles: .srt format per language per point
- Map tiles: Pre-generated offline tiles for tour bounds (zoom 14-16)
- Use CDN for media delivery with signed URLs

### Testing Considerations
- GPS accuracy varies (especially in dense urban areas)
- Use large trigger radii (100-300m) for reliability
- Test background audio continuation when screen locks
- Test sequential triggering when user walks fast
- Verify offline playback without network
- Test voucher race conditions (simultaneous redemptions)

## Language Support

The app supports three languages initially:
- Italian (`it`)
- French (`fr`)
- English (`en`)

Each tour can have multiple language versions with separate:
- UI translations (title, description)
- Audio narration files
- Subtitle files (.srt)

User can set:
- App UI language (affects interface)
- Preferred audio/subtitle language per tour

## Analytics Events

Track these events with user consent:
- `app_open`, `signup`, `login`
- `tour_viewed`, `tour_download_started`, `tour_download_completed`, `tour_download_deleted`
- `tour_started`, `point_triggered`, `tour_completed`
- `voucher_redeemed`, `donation_link_clicked`

Include properties: `user_id`, `anonymous_id`, `tour_id`, `point_id`, `language`, `device`, `os_version`, `offline` flag.

## Security & Privacy

- All endpoints use HTTPS
- Passwords hashed with bcrypt/argon2
- JWT tokens with short expiration + refresh flow
- Media URLs are signed (time-limited)
- GDPR: data stored in EU region, explicit analytics consent, data deletion API
- CMS has role-based access control

## Project Status

This repository is in the **planning phase**. See PRD.md for complete product requirements.

When development begins:
1. Set up backend repository (NestJS + PostgreSQL)
2. Set up CMS repository (Next.js)
3. Set up iOS app repository (Swift + SwiftUI)
4. Configure shared infrastructure (storage, auth provider, map tiles)
