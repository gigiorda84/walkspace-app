# Tour Cover Trailer Feature - COMPLETED

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
