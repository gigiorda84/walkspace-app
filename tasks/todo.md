# Task: Add Delete Point & Location/Dimensions Fields

## Plan
- [ ] Add delete button to each point card header in the right-side point editor
- [ ] Create delete handler function that:
  - Shows confirmation dialog
  - Calls API to delete the point
  - Removes point from local state (mapPoints)
  - Reorders remaining points (sequenceOrder)
  - Clears selection if deleted point was selected
  - Refetches points to sync with database
- [ ] Test the delete functionality

## Implementation Details

The delete button will be added to the point header section (around line 495-510) next to the point title.

**Logic:**
1. When clicked, show confirmation dialog
2. If confirmed, call `pointsApi.deletePoint(tourId, pointId)`
3. Remove point from `mapPoints` state
4. Reorder remaining points (update sequenceOrder)
5. Clear `selectedPointId` if it matches deleted point
6. Refetch points to sync

**UI:**
- Trash icon button in the point card header
- Red color (text-red-600) to indicate destructive action
- Confirmation dialog before deletion

## Changes Made

### File: `/cms/src/app/tours/[id]/edit/page.tsx`

1. **Added Trash2 icon import** (line 7)
   - Added `Trash2` to the lucide-react imports

2. **Created handleDeletePoint function** (lines 322-350)
   - Shows confirmation dialog with warning about removing all language content
   - Calls `pointsApi.deletePoint(tourId, pointId)` to delete from database
   - Removes point from `mapPoints` state
   - Reorders remaining points (updates sequenceOrder)
   - Clears `selectedPointId` if deleted point was selected
   - Refetches points to sync with database
   - Error handling with console.error and user alert

3. **Added delete button to point card header** (lines 537-546)
   - Red trash icon button positioned on the right side of each point header
   - Hover effects: darker red text and light red background
   - Tooltip: "Delete point"
   - Calls `handleDeletePoint(point.id)` on click

4. **Added Location & Dimensions section** (lines 549-649)
   - New section displaying editable location and dimensions for each point
   - Light gray background box with border for visual grouping
   - Three-column grid layout with:
     - Latitude input (6 decimal precision)
     - Longitude input (6 decimal precision)
     - Trigger Radius input (50-500m range)
   - onChange handlers update `mapPoints` state in real-time
   - onBlur handlers auto-save to database via `updatePointMutation`
   - Smaller text size (text-xs) for compact display

5. **Removed duplicate GPS coordinates** (line 535)
   - Removed read-only coordinate display from point header
   - Coordinates now only shown as editable fields in Location & Dimensions section

## Review

### Summary
Successfully added two major features to the unified tour editor:
1. **Delete functionality** - Red trash button in each point header with confirmation dialog
2. **Location & Dimensions editor** - Editable fields for latitude, longitude, and trigger radius with auto-save

### Key Features
- ✅ Visual delete button with red color indicating destructive action
- ✅ Confirmation dialog before deletion (warns about removing all language content)
- ✅ Proper state management (removes from map and editor)
- ✅ Automatic reordering of remaining points
- ✅ Database sync via API call
- ✅ Error handling with user feedback
- ✅ Clears selection when deleted point was selected
- ✅ **Editable latitude/longitude fields** with 6 decimal precision
- ✅ **Editable trigger radius field** with 50-500m range validation
- ✅ **Real-time updates** - onChange updates local state, onBlur saves to database
- ✅ **Visual grouping** - Gray background box for location/dimensions section
- ✅ **Compact layout** - 3-column grid with smaller text size
- ✅ **Removed duplicate** - Cleaned up read-only coordinates from header

### Technical Details
- Simple implementation with minimal code changes
- Reuses existing `pointsApi.deletePoint()` and `updatePointMutation` methods
- Follows existing patterns in the codebase (auto-save on blur)
- No new dependencies required
- Clean separation of concerns (UI → handler → API)
- Real-time sync between editable fields and map display

### Impact
- Modified 2 files:
  - `/cms/src/app/tours/[id]/edit/page.tsx` - Added editable fields and delete button
  - `/cms/src/components/map/MapEditor.tsx` - Updated radius visualization
- Added ~130 lines of code total
- Installed @turf/circle package for accurate radius circles
- No breaking changes to existing functionality
- Consistent with existing UI patterns
- Improves UX by making location/dimensions directly editable instead of drag-only
- Radius circles now display accurately in meters on the map

### Additional Changes - Radius Visualization

**File: `/cms/src/components/map/MapEditor.tsx`**

1. **Installed @turf/circle package** (via npm)
   - Provides accurate circle polygon generation based on meters

2. **Updated radius circle rendering** (lines 114-175)
   - Replaced pixel-based circle with proper GeoJSON polygon
   - Uses `circle()` from @turf/circle to create accurate radius polygons
   - Converts trigger radius from meters to kilometers for Turf
   - Renders as fill layer (light indigo, 10% opacity) + outline layer (indigo, 2px width)
   - Used React Fragment (<>...</>) to return multiple map elements
   - Added proper key props to prevent React warnings

3. **Benefits**:
   - Radius circles now accurately represent the trigger radius in meters
   - Circles scale correctly with map zoom
   - When user changes radius in the editor, map updates immediately
   - Visual feedback matches actual GPS trigger area

### Bug Fix - Point Modifications Not Saving

**File: `/cms/src/app/tours/[id]/edit/page.tsx`**

**Problem**: When users edited latitude, longitude, or trigger radius fields, the changes weren't being saved to the database.

**Root Cause**: The `onBlur` handlers were using stale values from the `point` object instead of getting the latest values from the `mapPoints` state.

**Flow of the bug**:
1. User changes latitude from 41.9 to 41.8
2. onChange updates `mapPoints` state with new value
3. User tabs out (onBlur fires)
4. onBlur handler sends `point.latitude` (still 41.9 - the old value!)
5. Database gets updated with the old value instead of the new value

**Fix** (lines 567-653):
Changed all three onBlur handlers to:
1. Find the current point from `mapPoints` state using `mapPoints.find(p => p.id === point.id)`
2. Use the current point's values instead of the stale `point` object
3. This ensures the latest values from state are sent to the API

**Code change**:
```javascript
// Before (WRONG - uses stale values)
onBlur={() => {
  updatePointMutation.mutate({
    pointId: point.id,
    data: {
      lat: point.latitude,  // Stale value!
      lng: point.longitude,
      order: point.sequenceOrder,
      defaultTriggerRadiusMeters: point.triggerRadiusMeters,
    },
  });
}}

// After (CORRECT - uses current state values)
onBlur={() => {
  const currentPoint = mapPoints.find(p => p.id === point.id);
  if (currentPoint) {
    updatePointMutation.mutate({
      pointId: currentPoint.id,
      data: {
        lat: currentPoint.latitude,  // Fresh value from state!
        lng: currentPoint.longitude,
        order: currentPoint.sequenceOrder,
        defaultTriggerRadiusMeters: currentPoint.triggerRadiusMeters,
      },
    });
  }
}}
```

**Result**: Point modifications now save correctly to the database.

### Auto-Fit Map Bounds

**File: `/cms/src/components/map/MapEditor.tsx`**

**Feature**: Map automatically centers and zooms to show all points.

**Implementation** (lines 39, 62-92, 118):
- Added `mapLoaded` state to track when map is ready
- Added `onLoad` handler to Map component to set mapLoaded flag
- Added useEffect that runs when points change AND map is loaded
- Includes 100ms delay to ensure map is fully ready
- Calculates bounding box from all point coordinates
- Uses `mapRef.fitBounds()` to adjust viewport
- Includes 80px padding around bounds for better UX
- Smooth 1-second animation when adjusting view

**Benefits**:
- When you open the editor, all points are immediately visible
- When you add/remove/move points, map automatically adjusts
- No need to manually zoom or pan to find points
- Always shows the optimal view of your tour route

**Code**:
```javascript
useEffect(() => {
  if (!mapRef.current || points.length === 0) return;

  // Calculate bounding box
  const lngs = points.map(p => p.longitude);
  const lats = points.map(p => p.latitude);

  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  // Fit bounds with padding and animation
  mapRef.current.fitBounds(
    [[minLng, minLat], [maxLng, maxLat]],
    { padding: 80, duration: 1000 }
  );
}, [points]);
```

### Auto-Save Point Content (Title & Description)

**File: `/cms/src/app/tours/[id]/edit/page.tsx`**

**Feature**: Point titles and descriptions now auto-save when you tab out or click away.

**Changes**:
1. **Added onBlur to title field** (lines 675-680):
   - Auto-saves when user tabs out or clicks away
   - Only saves if title is not empty

2. **Added onBlur to description field** (lines 698-703):
   - Auto-saves when user tabs out or clicks away
   - Only saves if title exists (required field)

3. **Removed Save button** (line 782-787):
   - Replaced with subtle "Saving..." indicator
   - Shows when save mutation is in progress
   - Cleaner, less cluttered interface

4. **Removed Save icon import** (line 7):
   - Cleaned up unused import

**Benefits**:
- ✅ **No manual saving** - Changes persist automatically
- ✅ **Immediate feedback** - "Saving..." appears when saving
- ✅ **Cleaner UI** - No need for Save button
- ✅ **Better UX** - Works like modern web apps (Google Docs, Notion, etc.)
- ✅ **No data loss** - Changes saved as you type and move between fields

**How it works**:
1. User edits title or description
2. onChange updates local state (instant UI update)
3. User tabs out or clicks another field (onBlur)
4. Auto-save mutation fires
5. "Saving..." indicator appears briefly
6. Data is saved to database
7. Changes persist on page reload

### Auto-Save Media File Selections

**File: `/cms/src/app/tours/[id]/edit/page.tsx`**

**Feature**: Audio, subtitle, and image selections now auto-save immediately after selection or removal.

**Changes**:
1. **Updated handleFileSelect** (lines 300-314):
   - Added auto-save after selecting a file
   - 100ms delay to ensure state updates first
   - Works for audio, subtitles, and images

2. **Updated clearFile** (lines 317-330):
   - Added auto-save after clearing a file
   - 100ms delay to ensure state updates first
   - Works for all media types

**Benefits**:
- ✅ **Instant persistence** - File selections save immediately
- ✅ **No manual saving** - Select and go
- ✅ **Works for all media** - Audio, subtitles, images
- ✅ **Works on clear** - Removing files also auto-saves
- ✅ **Consistent UX** - All fields now auto-save

**How it works**:
1. User clicks "Browse Audio/Subtitles/Images"
2. Media browser modal opens
3. User selects a file
4. Modal closes
5. State updates with new file ID
6. Auto-save fires after 100ms
7. "Saving..." indicator appears
8. File selection persists on page reload

OR for clearing:
1. User clicks X button to clear file
2. State updates to empty string
3. Auto-save fires after 100ms
4. File is removed from database
5. Change persists on page reload

### UI Improvement - Language Selector in Tour Settings

**File: `/cms/src/app/tours/[id]/edit/page.tsx`**

**Change**: Moved language selector from separate section into Tour Settings section.

**What Changed** (lines 457-479):
- Removed standalone "Language" section
- Moved language selector into Tour Settings section
- Added as a separate row below tour fields
- Added border-top separator for visual distinction
- Changed label to "Content Language" for clarity
- Reduced button text size to `text-sm` for consistency
- Reduced gap between buttons from `gap-3` to `gap-2`

**Benefits**:
- ✅ **Cleaner layout** - One less section on the page
- ✅ **Logical grouping** - Language is a tour setting
- ✅ **Better UX** - Related settings grouped together
- ✅ **Less scrolling** - More compact interface
- ✅ **Still functional** - Language switching works exactly the same

**Visual Structure**:
```
┌─────────────────────────────────────────┐
│ Tour Settings                           │
├─────────────────────────────────────────┤
│ [Slug] [City] [Duration] [Distance] [✓] │
├─────────────────────────────────────────┤
│ Content Language                        │
│ [Italian] [French] [English]            │
└─────────────────────────────────────────┘
```
