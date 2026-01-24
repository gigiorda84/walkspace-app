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

