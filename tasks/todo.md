# Task: Reorganize Navigation Elements in Tour Setup Sheet

## Problem
The language and subtitle selection screens need UI reorganization:
- X button is currently in top left
- Back button ("Indietro") is at the bottom with text
- Step indicators (three dots) are at the top center

## Requirements
1. Move X button from top left to top right
2. Add back arrow button to top left (where X currently is)
3. Show only the back arrow icon, not the "Indietro" text
4. Move step indicators (three dots) from top to bottom
5. Back arrow should only appear when not on first step

## Files to Modify
- `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/TourDetail/TourSetupSheet.swift`

## Implementation Plan

### [✓] 1. Reorganize Header Layout (lines 27-49)
- Move back button to left side of header
- Keep X button but move to right side
- Remove step indicators from header
- Show back arrow only when `currentStep > 0`
- Use only chevron.left icon (no text)

### [✓] 2. Remove Bottom Back Button (lines 72-82)
- Remove the existing back button section at the bottom
- This functionality will now be in the header

### [✓] 3. Add Step Indicators to Bottom
- Create new section at bottom with step indicators
- Position after content but before the old back button area
- Should appear on all steps (including during download)

## Changes Summary
- Simplify navigation: back arrow in header (left), X button in header (right)
- More consistent with standard mobile UI patterns
- Step indicators at bottom provide progress feedback without cluttering header

## Review

### Changes Made

**File Modified:** `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/TourDetail/TourSetupSheet.swift`

1. **Header Navigation (lines 26-51)**
   - Added back arrow button on the left side (only visible when `currentStep > 0 && !isDownloading`)
   - Moved X close button to the right side
   - Removed step indicators from header
   - Used transparent placeholder for symmetry when back arrow is hidden
   - Back arrow uses only the icon (`chevron.left`), no text

2. **Bottom Navigation (lines 71-81)**
   - Completely removed the old "Indietro" back button that was at the bottom
   - Replaced with step indicator dots (3 circles)
   - Step indicators now show progress at the bottom of the screen
   - Added 32pt bottom padding for comfortable spacing

### Impact
- Minimal code changes (2 sections modified)
- No breaking changes to functionality
- Back navigation still works exactly the same, just from a different location
- Cleaner, more standard mobile UI layout
- Better visual hierarchy with progress indicators at bottom

### Testing Recommendations
- Test back navigation on steps 2 and 3
- Verify back arrow is hidden on step 1
- Confirm step indicators update correctly as user progresses
- Verify layout on different screen sizes
