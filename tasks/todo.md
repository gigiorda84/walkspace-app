# Fix: Android Analytics 400 + Background Location Permission

## Tasks

- [x] 1. Fix `createdAt` → `timestamp` field name in Android `AnalyticsEvent` (ApiService.kt) and `AnalyticsService.kt`
- [x] 2. Add background location permission request flow to `TourDetailScreen.kt`
- [x] 3. Add localized strings for background location rationale (en, it, fr)
- [x] 4. Write review section

## Review

### Changes Summary

Fixed two Android issues:
1. **Analytics 400 errors**: The Android `AnalyticsEvent` DTO sent `createdAt` but the backend expects `timestamp`. Renamed the field in both `ApiService.kt` and `AnalyticsService.kt`.
2. **Background location not requested**: The manifest declared `ACCESS_BACKGROUND_LOCATION` but the app only requested `ACCESS_FINE_LOCATION` at runtime. Added a two-step permission flow: after fine location is granted, shows a rationale dialog then requests background location. User can skip — the tour still works without it.

### Files Modified

| File | Change |
|------|--------|
| `android-app/.../data/api/ApiService.kt` | Renamed `createdAt` to `timestamp` in `AnalyticsEvent` data class |
| `android-app/.../services/AnalyticsService.kt` | Updated event creation to use `timestamp` instead of `createdAt` |
| `android-app/.../ui/tourdetail/TourDetailScreen.kt` | Added `Build` import, background permission check, two-step launcher flow, and rationale dialog |
| `android-app/.../res/values/strings.xml` | Added `background_location_title` and `background_location_explanation` |
| `android-app/.../res/values-it/strings.xml` | Added Italian translations for background location strings |
| `android-app/.../res/values-fr/strings.xml` | Added French translations for background location strings |

### What did NOT change
- `AndroidManifest.xml` — already declares `ACCESS_BACKGROUND_LOCATION`
- `LocationManager.kt` — no changes needed, it already uses FusedLocationProvider correctly
- `TourPlaybackService.kt` — already starts foreground service with location type
