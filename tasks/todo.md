# Fix: Analytics Bugs — Android Events Dropped + Tour Completions Lost

## Tasks

- [x] 1. Backend: Remove `filterEventsByConsent` from `analytics.service.ts`
- [x] 2. iOS: Add `flush()` after `trackTourCompleted()` in `PlayerView.swift`
- [x] 3. iOS: Add `flush()` after `trackTourAbandoned()` in `PlayerView.swift`
- [x] 4. Android: Add `flush()` after `trackTourCompleted` in `AnalyticsService.kt`
- [x] 5. Write review section

## Review

### Changes Summary

Fixed two analytics bugs: (1) Android events silently dropped because the backend's GDPR consent filter used `mailingListOptIn` as an analytics consent proxy — only affected Android since it sends auth tokens while iOS doesn't; (2) tour completion/abandonment events lost on both platforms because they were queued but never flushed before the user left the screen.

### Files Modified

| File | Change |
|------|--------|
| `backend/src/analytics/analytics.service.ts` | Removed `filterEventsByConsent` method and its call (~60 lines removed). `trackEvents()` now directly inserts all events. Both clients already gate on analytics consent locally. |
| `mobile-app/ios/.../Views/Player/PlayerView.swift` | Added `AnalyticsService.shared.flush()` after `trackTourCompleted()` (line 579) and after `trackTourAbandoned()` (line 590) |
| `android-app/.../services/AnalyticsService.kt` | Changed `trackTourCompleted` from a one-liner to explicitly call `flush()` after tracking |

### What did NOT change
- `analytics.controller.ts` — still passes `user?.id` for user-association
- `schema.prisma` — `mailingListOptIn` stays for its actual mailing list purpose
- CMS dashboard — no changes needed
- iOS `AnalyticsService.swift` — already has a `flush()` method, we just call it
- Android `flush()` method itself — unchanged, we just call it at the right time
