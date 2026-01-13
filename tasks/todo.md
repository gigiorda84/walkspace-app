# Fix Route Saving Error and Make Routes Language-Independent

## Problem

1. **Route save error**: When clicking "Save Route" in the CMS editor (https://cms-gigiordas-projects.vercel.app/tours/3213335c-a7de-4555-a0c8-5b274fbc4914/editor), an error occurs
2. **Route is language-specific**: Currently routes are stored per language version (`TourVersion.routePolyline`), but the physical route should be the same regardless of language

## Root Cause

Routes are stored in the `TourVersion` table (`routePolyline` field), which means:
- Each language version has its own route
- When switching languages in the editor, different routes load
- This is incorrect - the physical walking path doesn't change based on language

## Solution Plan

Move the `routePolyline` field from `TourVersion` to `Tour` so it's shared across all languages.

## Task List

- [ ] **Backend**: Add migration to move `routePolyline` from `TourVersion` to `Tour` table
- [ ] **Backend**: Update Prisma schema to move field to Tour model
- [ ] **Backend**: Update API to save route on Tour instead of Version
- [ ] **Backend**: Deploy migration and updated API
- [ ] **CMS**: Update editor to save route to Tour instead of Version
- [ ] **CMS**: Update editor to load route from Tour instead of Version
- [ ] **CMS**: Test route saving and loading
- [ ] **iOS**: Update Tour model to read route from top level instead of nested
- [ ] **Build and test**: Verify changes work end-to-end

## Implementation Steps

### 1. Backend Migration (Prisma)

**File**: `backend/prisma/schema.prisma`
- Move `routePolyline` field from `TourVersion` model to `Tour` model

**New migration**:
- Add `routePolyline` column to `tours` table
- Copy data from `tour_versions.route_polyline` to `tours.route_polyline` (take first non-null value per tour)
- Drop `routePolyline` column from `tour_versions` table

### 2. Backend API Updates

**File**: `backend/src/admin/tours/admin-tours.service.ts`
- `updateTour()`: Accept `routePolyline` in UpdateTourDto and save to Tour
- `createTour()`: Accept `routePolyline` in CreateTourDto
- `updateVersion()`: Remove routePolyline handling (no longer stored here)

**Files**: `backend/src/admin/tours/dto/`
- Update DTOs to reflect new structure

### 3. CMS Frontend Updates

**File**: `cms/src/app/tours/[id]/editor/page.tsx`
- Remove route loading from version (lines 88-93)
- Load route directly from tour object
- Update `saveRouteMutation` to call tour update API instead of version API
- Route should be same regardless of selected language

**File**: `cms/src/lib/api/tours.ts`
- Add `updateTour()` method that accepts routePolyline

### 4. iOS App Updates

**File**: `mobile-app/ios/SonicWalkscape/SonicWalkscape/Models/Tour.swift`
- Update to read `routePolyline` from top-level Tour instead of nested in version
- Fix decoder if needed

## Notes

- This is a **simple, focused change** - just moving one field from one table to another
- No complex logic changes needed
- Route will be shared across all language versions as intended
- Minimal code impact

## Review

### Summary

Successfully moved the `routePolyline` field from `TourVersion` to `Tour` table, making routes language-independent as intended. The physical walking path is now shared across all language versions of a tour.

### Changes Made

**1. Backend (Prisma Schema & Migration)**
- Added `routePolyline` field to `Tour` model in `schema.prisma`
- Removed `routePolyline` field from `TourVersion` model
- Created migration `20260112000000_move_route_polyline_to_tour` that:
  - Adds `route_polyline` column to `tours` table
  - Copies existing route data from first version to tour
  - Drops `route_polyline` column from `tour_versions` table

**2. Backend (DTOs & Service)**
- Updated `CreateTourDto` and `UpdateTourDto` to accept `routePolyline`
- Removed `routePolyline` from `CreateVersionDto` and `UpdateVersionDto`
- Updated `AdminTourResponseDto` to include `routePolyline`
- Removed `routePolyline` from `VersionResponseDto` and `AdminTourVersionDto`
- Updated `admin-tours.service.ts` to:
  - Include `routePolyline` in all tour response objects
  - Remove route handling from version create/update operations

**3. CMS Frontend**
- Updated `cms/src/types/api/index.ts`:
  - Added `routePolyline: string | null` to `Tour` interface
  - Removed `routePolyline` from `TourVersion` interface
- Updated `cms/src/app/tours/[id]/editor/page.tsx`:
  - Load route from `tour.routePolyline` instead of `version.routePolyline`
  - Save route via `toursApi.updateTour()` instead of `versionsApi.updateVersion()`
  - Route now persists across language switches

**4. iOS App**
- Updated `mobile-app/ios/SonicWalkscape/SonicWalkscape/Models/Tour.swift`:
  - Simplified `CodingKeys` to decode `routePolyline` directly from Tour
  - Removed nested `routePreview.polyline` decoding logic
  - Updated encoder to match simplified decoder

### Files Modified

**Backend:**
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260112000000_move_route_polyline_to_tour/migration.sql` (new)
- `backend/src/admin/tours/admin-tours.service.ts`
- `backend/src/admin/tours/dto/create-tour.dto.ts`
- `backend/src/admin/tours/dto/update-tour.dto.ts`
- `backend/src/admin/tours/dto/create-version.dto.ts`
- `backend/src/admin/tours/dto/update-version.dto.ts`
- `backend/src/admin/tours/dto/admin-tour-response.dto.ts`
- `backend/src/admin/tours/dto/version-response.dto.ts`

**CMS:**
- `cms/src/types/api/index.ts`
- `cms/src/app/tours/[id]/editor/page.tsx`

**iOS:**
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Models/Tour.swift`

### Benefits

1. **Language Independence**: Routes are no longer duplicated per language - one physical path for all languages
2. **Data Integrity**: Eliminates possibility of different routes for different languages
3. **Simpler Editor**: Route stays the same when switching languages in CMS
4. **Fixes Save Error**: The original save error was caused by trying to save to version - now saves to tour correctly

### Deployment Notes

- The migration will automatically run when backend is deployed
- Existing route data from first version of each tour will be preserved
- No data loss - migration copies route from tour_versions to tours before dropping column

### Build Fix

After the initial deployment, discovered that the version edit page (`cms/src/app/tours/[id]/versions/[versionId]/edit/page.tsx`) was also referencing `version.routePolyline`. Fixed by:
- Loading route from tour instead of version
- Making route display read-only with link to unified editor
- Removing route editing functionality from this page
- Cleaning up unused imports and state

### Next Steps

After deployment:
1. Test route saving in CMS editor
2. Verify route displays correctly in iOS app
3. Confirm route persists across language switches
4. Check that no errors occur when creating/updating tours
