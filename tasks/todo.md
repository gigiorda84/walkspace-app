# Opening Screen Redesign - COMPLETED

## Changes Made

### 1. Added BANDITE logo to asset catalog
- Created `BanditeLogo.imageset` in Assets.xcassets
- Copied `logo_BANDITE-T.png` from Downloads folder

### 2. Updated WelcomeView.swift
- **Logo**: Replaced `headphones.circle.fill` icon with BANDITE logo image (200x200)
- **Subtitle**: Changed "Discover the world through sound" to "BANDITE _ Artivism"
- **About button**: Added new button that opens a sheet with multilingual text (EN/IT/FR)
- **Start Exploring**: Kept as-is (orange primary CTA button)
- **Connect button**: Added new button that reuses `FollowUsModal` from TourCompletionView
- **Enable Location**: Removed completely

### New Components
- `AboutModal`: Full-screen sheet with scrollable multilingual About text
- `AboutSection`: Reusable component for each language section with styled card

### Button Order (top to bottom):
1. About (opens About modal)
2. Start Exploring (goes to DiscoveryView)
3. Connect (opens FollowUsModal with social links)

### Files Modified:
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Assets.xcassets/BanditeLogo.imageset/` (created)
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Welcome/WelcomeView.swift`

---

# Tour Completed Screen Redesign - COMPLETED

## Goal
Redesign the "Tour Completed" screen with the following changes:
1. Move orange checkmark next to "Tour Completed!" text (inline/horizontal)
2. Move stats (Points Visited, Distance, Duration) to a single compact line above the purple box
3. Replace stats in the purple box with three action buttons: "Info Bus", "Seguici", "Supporta"

## Tasks

- [x] Modify header to show checkmark inline with "Tour Completed!" text
- [x] Create compact single-line stats row (points, distance, duration)
- [x] Replace StatRow content in purple box with three stacked action buttons
- [ ] Test the layout in preview

## File Modified
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Player/TourCompletionView.swift`

## Review

### Changes Made

1. **Inline checkmark + title** (lines 25-35): Changed from vertical stack to HStack with checkmark icon (40pt) and "Tour Completed!" text side by side

2. **Compact stats line** (lines 72-81): Added a single horizontal line showing `"4 pts • 2.0 km • 0 min"` format with muted color

3. **Action buttons card** (lines 83-96): Replaced the three StatRow items with three stacked ActionButton components

4. **ActionButton component** (lines 136-156): New reusable button component with:
   - Semi-transparent orange background
   - Orange border
   - Cream text color
   - Full-width layout

5. **Removed StatRow component**: No longer needed, replaced with ActionButton

### Notes
- The three buttons currently have empty actions (`action: {}`) - these need to be wired up to actual functionality later
- Layout matches the requested design with checkmark inline, stats in a compact line, and three stacked buttons in the purple box

---

# Previous Task: Tour Cover Trailer Feature - COMPLETED

## Goal
Add support for tour cover trailers (videos) that play on the iOS app's discover page. When users tap a tour to view details, they see the static cover image instead of the video.

## Implementation Summary

All tasks have been completed successfully. The feature is now fully implemented across backend, CMS, and iOS.

### Backend Changes

**Database Schema (`backend/prisma/schema.prisma`)**
- Added `coverTrailerFileId` column to `tour_versions` table
- Added `coverTrailer` relation to `MediaFile` with relation name "TourVersionCoverTrailer"
- Added `tourVersionCoverTrailers` back-reference in `MediaFile` model
- Created migration: `20260115093500_add_cover_trailer_to_tour_versions`

**DTOs Updated**
- `backend/src/admin/tours/dto/version-response.dto.ts` - Added `coverTrailerFileId: string | null`
- `backend/src/admin/tours/dto/create-version.dto.ts` - Added optional `coverTrailerFileId?: string`
- `backend/src/admin/tours/dto/update-version.dto.ts` - Added optional `coverTrailerFileId?: string | null`
- `backend/src/tours/dto/tour-detail.dto.ts` - Added `coverTrailerUrl: string | null`
- `backend/src/tours/dto/tour-list.dto.ts` - Added `coverTrailerUrl: string | null`

**Services Updated**
- `backend/src/tours/tours.service.ts:75-87` - Updated Prisma query to include `coverTrailer` relation
- `backend/src/tours/tours.service.ts:121-124` - Generate signed URL for trailer video
- `backend/src/tours/tours.service.ts:138` - Include `coverTrailerUrl` in response
- `backend/src/admin/tours/admin-tours.service.ts:325` - Include `coverTrailerFileId` in version creation

### CMS Changes

**Tour Editor (`cms/src/app/tours/[id]/edit/page.tsx`)**
- Line 66: Added `coverTrailerFileId: ''` to `versionContent` state
- Line 91: Added `tourTrailerModalOpen` state
- Line 213: Load `coverTrailerFileId` from version
- Line 519: Save `coverTrailerFileId` on blur
- Line 530: Include in version creation
- Line 590-617: Added `handleTourTrailerSelect` handler
- Line 619-645: Added `clearTourTrailer` handler
- Line 1053-1077: Added "Tour Cover Trailer" UI field
- Line 1584-1591: Added `MediaBrowserModal` for video selection

**TypeScript Types (`cms/src/types/api/index.ts`)**
- Line 59: Added `coverTrailerFileId?: string | null` to `TourVersion` interface
- Line 91: Added `'video'` to `MediaFile.type` union

### iOS Changes

**Models**
- `Tour.swift:16` - Added `coverTrailerUrl: String?` property
- `Tour.swift:98` - Added `coverTrailerUrl` to `CodingKeys`
- `Tour.swift:115` - Added to initializer parameter
- `Tour.swift:131` - Set in initializer
- `Tour.swift:152` - Decode in `init(from:)`
- `Tour.swift:174` - Encode in `encode(to:)`
- `TourDetailResponse.swift:18` - Added `coverTrailerUrl: String?` property
- `TourDetailResponse.swift:50` - Pass to `Tour` conversion

**Views**
- Created `VideoPlayerView.swift` - New looping video player component with:
  - Auto-play with muted audio
  - Infinite looping via notification observer
  - Proper cleanup on disappear
  - Loading state with progress indicator
  - `AVPlayerLayer` wrapped in `UIViewRepresentable`
- `TourCardView.swift:9-11` - Conditionally show video if `coverTrailerUrl` exists
- `TourCardView.swift:12-29` - Fallback to image if no trailer

## Data Flow

1. **CMS**: User uploads video via media manager, selects it in "Tour Cover Trailer" field
2. **Backend**: Stores `coverTrailerFileId` in `tour_versions.cover_trailer_file_id`
3. **API**: Returns `coverTrailerUrl` with signed URL in tour detail response
4. **iOS**: Decodes `coverTrailerUrl` → shows `VideoPlayerView` on discover page

## Behavior

- **Discover Page (TourCardView)**: Shows auto-playing muted video loop if trailer is set, otherwise shows static image
- **Detail Page (TourDetailView)**: Always shows static cover image (unchanged)
- **Fallback**: If video fails to load or isn't set, static image is displayed
- **Language-Specific**: Each tour version can have its own trailer

## Files Modified

### Backend
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260115093500_add_cover_trailer_to_tour_versions/migration.sql` (created)
- `backend/src/admin/tours/dto/version-response.dto.ts`
- `backend/src/admin/tours/dto/create-version.dto.ts`
- `backend/src/admin/tours/dto/update-version.dto.ts`
- `backend/src/tours/dto/tour-detail.dto.ts`
- `backend/src/tours/dto/tour-list.dto.ts`
- `backend/src/tours/tours.service.ts`
- `backend/src/admin/tours/admin-tours.service.ts`

### CMS
- `cms/src/app/tours/[id]/edit/page.tsx`
- `cms/src/types/api/index.ts`

### iOS
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Models/Tour.swift`
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Models/TourDetailResponse.swift`
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Discovery/VideoPlayerView.swift` (created)
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Discovery/TourCardView.swift`

## Testing Checklist

### Backend
- [ ] Run `npx prisma generate` to regenerate Prisma client
- [ ] Build backend with `npm run build`
- [ ] Deploy backend to production
- [ ] Test API endpoint returns `coverTrailerUrl` field

### CMS
- [ ] Build CMS with `npm run build`
- [ ] Upload a video file via media manager
- [ ] Open a tour in editor
- [ ] Select video in "Tour Cover Trailer" field
- [ ] Verify auto-save works
- [ ] Verify trailer persists on page reload
- [ ] Test clearing trailer

### iOS
- [ ] Build iOS app in Xcode
- [ ] Run on simulator/device
- [ ] Navigate to discover page
- [ ] Verify video plays automatically for tours with trailers
- [ ] Verify video is muted
- [ ] Verify video loops infinitely
- [ ] Verify image shows for tours without trailers
- [ ] Tap tour → verify detail page shows static image (not video)
- [ ] Test with poor network (video should fallback to image on error)

## Notes

- Videos should be kept short (15-30 seconds recommended) for best UX
- The media service already supports video uploads with 500MB limit
- Auto-play is muted to comply with mobile platform guidelines
- Video playback is optimized for memory by cleaning up when cards scroll off-screen
- All changes are backward compatible - existing tours without trailers continue to work

---

## Bug Fix: Video not displaying in Discover page (2026-01-15)

### Problem
Video was loaded to CMS but not displayed in the iOS Discover page.

### Root Cause
The `listTours` endpoint in `tours.service.ts` was NOT returning `coverTrailerUrl`:
- The Prisma query did not include `coverTrailer` in the versions select
- The return object did not include `coverTrailerUrl`

The `getTourDetails` endpoint correctly returned `coverTrailerUrl`, but the **list endpoint** (used by iOS Discover page) did not.

### Fix
Updated `backend/src/tours/tours.service.ts` `listTours` method:
1. Added `coverTrailer: true` to the versions select in Prisma query (line 27)
2. Added signed URL generation for cover trailer (lines 56-60)
3. Added `coverTrailerUrl` to the return object (line 74)

Updated `backend/src/tours/dto/tour-list.dto.ts`:
1. Added `coverTrailerUrl: string | null;` field (line 13)

### Verification
- Backend builds successfully with `npm run build`
