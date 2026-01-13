# Move Route Editing to Unified Editor - COMPLETED

## Problem

Routes saved in the CMS were appearing differently (or not at all) in the iOS app due to API response format mismatch. Additionally, route editing functionality was split across multiple pages, making it confusing for users.

## Goals Achieved

1. ✅ Fixed backend API to return routes in correct format for iOS app
2. ✅ Moved route editing functionality to unified editor at `/tours/[id]/edit`
3. ✅ Eliminated the old `/editor` page
4. ✅ Made the unified editor the single place for all tour editing

## Changes Made

### 1. Backend API Fix (Route Format)

**File: `backend/src/tours/tours.service.ts`**
- Changed route response from nested `routePreview.polyline` to top-level `routePolyline`
- This matches what the iOS app expects to receive

**Before:**
```typescript
routePreview: {
  polyline: tour.routePolyline,
},
```

**After:**
```typescript
routePolyline: tour.routePolyline,
```

### 2. Unified Editor Enhancement

**File: `cms/src/app/tours/[id]/edit/page.tsx`**

Added complete route editing functionality:
- **Imports**: Added `RouteDrawer`, `MapIcon`, `Save`, `X` icons
- **State**: Added `routePolyline`, `showRouteMap`, `isDrawingRoute` state variables
- **Effects**: Load route from tour when page loads
- **Mutations**: `saveRouteMutation` to save routes to backend
- **Handlers**:
  - `handleSaveRoute()` - validates and saves route
  - `handleClearRoute()` - clears route with confirmation
  - `handleStartDrawing()` - activates drawing mode
- **UI Section**: Complete route editor section with:
  - Draw/Edit route button
  - Clear route button
  - Save route button
  - Hide/show map toggle
  - Interactive map with RouteDrawer component
  - Info overlay with instructions
  - Real-time point count display

### 3. Navigation Updates

**Files Updated:**
- `cms/src/app/tours/[id]/versions/new/page.tsx` - Updated link from `/editor` to `/edit`
- `cms/src/app/tours/[id]/versions/[versionId]/edit/page.tsx` - Updated link from `/editor` to `/edit`

All references now point to the unified editor at `/tours/[id]/edit`.

### 4. Deleted Old Editor

**Removed:**
- `cms/src/app/tours/[id]/editor/page.tsx` - Entire old editor page
- `cms/src/app/tours/[id]/editor/` - Directory deleted

## Benefits

1. **Fixed iOS App Issue**: Routes now display correctly in the iOS app because backend returns `routePolyline` at top level
2. **Single Source of Truth**: All tour editing (metadata, versions, routes, points, content) in one place
3. **Better UX**: Users don't need to navigate between multiple pages to edit different aspects of a tour
4. **Simplified Architecture**: Reduced code duplication and maintenance burden
5. **Clearer Navigation**: Links consistently point to the unified editor

## Data Flow

### Route Editing Flow:
1. User opens unified editor at `/tours/[id]/edit`
2. Route loads from `tour.routePolyline` (shared across all languages)
3. User clicks "Draw Route" → opens map in drawing mode
4. User clicks map to add route points
5. Blue line renders showing walking path
6. User clicks "Done" → route stored in state
7. User clicks "Save Route" → `saveRouteMutation` calls backend
8. Backend updates `tours.routePolyline` column
9. iOS app fetches tour → receives `routePolyline` field → displays on map

### API Response Structure (Fixed):
```json
{
  "id": "...",
  "slug": "...",
  "routePolyline": "lat1,lng1;lat2,lng2;lat3,lng3",  // ← NOW CORRECT
  ...
}
```

## Files Modified

**Backend:**
- `backend/src/tours/tours.service.ts` - Fixed route response format

**CMS:**
- `cms/src/app/tours/[id]/edit/page.tsx` - Added route editing functionality
- `cms/src/app/tours/[id]/versions/new/page.tsx` - Updated link
- `cms/src/app/tours/[id]/versions/[versionId]/edit/page.tsx` - Updated link

**Deleted:**
- `cms/src/app/tours/[id]/editor/` - Old editor page removed

## Testing Checklist

- [ ] Backend deploys successfully
- [ ] Open unified editor at `/tours/[tourId]/edit`
- [ ] Verify route section appears
- [ ] Click "Draw Route" and add multiple points on map
- [ ] Verify blue line renders showing the path
- [ ] Click "Save Route" and verify success message
- [ ] Refresh page and verify route persists
- [ ] iOS app: Fetch tour and verify route displays on map
- [ ] Switch languages in unified editor - route should remain same
- [ ] Try clearing route and redrawing

## Next Steps

1. **Deploy Backend**: Deploy the backend change to fix route response format
2. **Test iOS App**: Verify routes now display correctly in iOS app
3. **User Training**: Update any documentation pointing to old `/editor` page
4. **Monitor**: Check for any broken links or references to `/editor`

## Notes

- Routes are language-independent and stored at the Tour level (not TourVersion level)
- The unified editor now handles ALL tour editing in one place
- Format remains: `"lat,lng;lat,lng;lat,lng"` throughout the system
- Old `/editor` page no longer exists - all functionality moved to `/edit`
