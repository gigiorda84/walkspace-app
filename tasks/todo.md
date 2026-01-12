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

(To be filled in after implementation)
