# Task: Change Minimum Trigger Radius to 5m

## Problem
The current minimum trigger radius for tour points is set to 50m across the CMS, backend, and iOS app. This needs to be changed to 5m to allow for more precise geofencing.

## Requirements
1. Update backend validation to allow minimum radius of 5m
2. Update CMS form validation to allow minimum radius of 5m
3. Update iOS app default radius constant to 5m

## Files to Modify
1. `backend/src/admin/tours/dto/create-point.dto.ts` - Backend validation for creating points
2. `backend/src/admin/tours/dto/update-point.dto.ts` - Backend validation for updating points
3. `cms/src/app/tours/[id]/points/[pointId]/edit/page.tsx` - CMS edit point form validation
4. `cms/src/components/map/PointsManager.tsx` - CMS point manager input validation
5. `mobile-app/ios/SonicWalkscape/SonicWalkscape/Utilities/Constants.swift` - iOS default radius constant

## Implementation Plan

### [✓] 1. Update Backend Validation (create-point.dto.ts)
- Changed `@Min(50)` to `@Min(5)` on line 19

### [✓] 2. Update Backend Validation (update-point.dto.ts)
- Changed `@Min(50)` to `@Min(5)` on line 22

### [✓] 3. Update CMS Edit Form Validation
- In `cms/src/app/tours/[id]/points/[pointId]/edit/page.tsx` line 261:
  - Changed `min: { value: 50, message: 'Minimum radius is 50 meters' }` to `min: { value: 5, message: 'Minimum radius is 5 meters' }`

### [✓] 4. Update CMS Points Manager Input
- In `cms/src/components/map/PointsManager.tsx` line 145:
  - Changed `min="50"` to `min="5"`

### [✓] 5. Update iOS Default Radius Constant
- In `mobile-app/ios/SonicWalkscape/SonicWalkscape/Utilities/Constants.swift` line 21:
  - Changed `static let defaultTriggerRadius: Double = 50.0` to `static let defaultTriggerRadius: Double = 5.0`

## Notes
- The iOS app doesn't have its own validation - it uses values from the backend API
- The backend default radius is 150m (in the Prisma schema), which remains unchanged
- Only the minimum allowed value is being changed from 50m to 5m
- Maximum radius remains 500m

## Review

### Changes Summary

All minimum radius validations have been successfully updated from 50m to 5m across the entire system:

**Backend Changes (2 files):**
1. `backend/src/admin/tours/dto/create-point.dto.ts` - Changed `@Min(50)` to `@Min(5)` on line 19
2. `backend/src/admin/tours/dto/update-point.dto.ts` - Changed `@Min(50)` to `@Min(5)` on line 22

**CMS Changes (2 files):**
3. `cms/src/app/tours/[id]/points/[pointId]/edit/page.tsx` - Updated form validation from 50m to 5m with updated error message on line 261
4. `cms/src/components/map/PointsManager.tsx` - Changed input min attribute from "50" to "5" on line 145

**iOS App Changes (1 file):**
5. `mobile-app/ios/SonicWalkscape/SonicWalkscape/Utilities/Constants.swift` - Changed defaultTriggerRadius from 50.0 to 5.0 on line 21

### Impact
- Users can now set trigger radii as low as 5 meters for precise geofencing
- All validation is consistent across backend, CMS, and iOS app
- No breaking changes - existing points with larger radii remain unaffected
- Maximum radius remains at 500m
- Default radius in database schema remains at 150m

### Testing Recommendations
- Test creating a new point with 5m radius in CMS
- Test editing an existing point to 5m radius in CMS
- Verify backend validation accepts 5m but rejects values below 5m
- Test iOS app behavior with 5m trigger radius points
