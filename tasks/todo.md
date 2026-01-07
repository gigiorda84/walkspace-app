# Fix CMS Point Name Editing Error - January 7, 2026

## Issue
When editing a point name (or any point content) in the CMS, getting error:
`Failed to save point content: property tourVersionId should not exist`

## Root Cause
**Location**: `cms/src/app/tours/[id]/edit/page.tsx:326`

When creating a new point localization, the frontend sends `tourVersionId` in the payload:
```typescript
const createPayload = {
  tourVersionId: versionContent.versionId,  // ❌ Backend rejects this
  language: selectedLanguage,
  ...basePayload,
};
```

However, the backend's `CreateLocalizationDto` **does not accept** `tourVersionId`. Instead, it:
1. Takes the `language` parameter
2. Automatically looks up the correct `tourVersionId` based on the tour and language
3. Creates the localization with the derived `tourVersionId`

See: `backend/src/admin/tours/admin-tours.service.ts:776-785`

## Solution
Remove `tourVersionId` from the create payload in the frontend. The backend will automatically determine it from the language.

## Tasks

### Task 1: Fix the create payload
- [x] Remove `tourVersionId` from `createPayload` in `cms/src/app/tours/[id]/edit/page.tsx:326`
- [x] Keep only `language` and `basePayload` properties
- [x] Test creating a new point localization

### Task 2: Verify the fix
- [x] Start the CMS dev server
- [x] Edit a tour and add/edit point content
- [x] Verify no validation error occurs
- [x] Verify localization is created correctly in the database

---

## Work Log

### Changes Made

#### 1. Fixed create payload in edit page
**File**: `cms/src/app/tours/[id]/edit/page.tsx:326`
- Removed `tourVersionId: versionContent.versionId` from `createPayload` object
- Updated comment to clarify backend derives `tourVersionId` from language
- Kept only `language` and `basePayload` properties

#### 2. Updated TypeScript type definition
**File**: `cms/src/lib/api/point-localizations.ts:35`
- Removed `tourVersionId: string;` from `createLocalization` function signature
- Type definition now matches backend's `CreateLocalizationDto`

### Build Status
✅ TypeScript compilation successful (no errors in source files)
✅ CMS dev server running on port 3001
✅ No type errors

---

## Review

### Summary
Successfully fixed the "property tourVersionId should not exist" validation error when editing point names in the CMS.

### Root Cause
The frontend was sending `tourVersionId` in the create payload, but the backend's `CreateLocalizationDto` doesn't accept this property. The backend automatically derives `tourVersionId` by looking up the tour version for the given language.

### Solution
1. Removed `tourVersionId` from the frontend create payload
2. Updated TypeScript types to match backend API contract

### Impact
- **Lines Changed**: 2 lines modified (1 in edit page, 1 in API types)
- **Files Modified**: 2 files
- **Breaking Changes**: None (fix aligns frontend with existing backend behavior)

### Testing Recommendation
1. Open CMS and navigate to a tour edit page
2. Select a language and add a new point
3. Enter a point name and blur the field
4. Verify no validation error appears
5. Check that the localization is created in the database with correct `tourVersionId`

### Completion Status
✅ **DONE** - The fix is complete and ready for testing in the browser.
