# Remove Redundant Tour Editor Pages - January 6, 2026

## Objective
Remove old tour editor pages that are now redundant since we have the unified editor at `/tours/[id]/edit`.

## Analysis

### Pages Found
1. ✅ **KEEP**: `/tours/[id]/edit/page.tsx` - NEW unified editor (we just enhanced this)
2. ❌ **REMOVE**: `/tours/[id]/page.tsx` - Old tour detail/overview page
3. ❌ **REMOVE**: `/tours/[id]/editor/page.tsx` - Old localization editor
4. ❌ **REMOVE**: `/tours/[id]/versions/` - Old version management pages
5. ❌ **REMOVE**: `/tours/[id]/points/` - Old points management pages

### Links to Update
Files that link to `/tours/${id}` (the old detail page):
- `cms/src/app/tours/page.tsx:165` - Main tours list
- `cms/src/app/tours/[id]/edit/page.tsx:651` - Unified editor back button
- `cms/src/app/tours/[id]/points/page.tsx:77` - Old points page
- `cms/src/app/tours/[id]/editor/page.tsx:249` - Old editor
- `cms/src/app/tours/[id]/points/[pointId]/localizations/page.tsx:176` - Old localization page

## Plan

### Task 1: Update navigation links in main tours list
- [ ] Change tours list link from `/tours/${id}` to `/tours/${id}/edit`
- File: `cms/src/app/tours/page.tsx:165`

### Task 2: Update back button in unified editor
- [ ] Change back link to go to `/tours` instead of `/tours/${id}`
- File: `cms/src/app/tours/[id]/edit/page.tsx:651`

### Task 3: Remove old tour detail page
- [ ] Delete `cms/src/app/tours/[id]/page.tsx`

### Task 4: Remove old localization editor
- [ ] Delete `cms/src/app/tours/[id]/editor/` directory

### Task 5: Remove old version management pages
- [ ] Delete `cms/src/app/tours/[id]/versions/` directory

### Task 6: Remove old points management pages
- [ ] Delete `cms/src/app/tours/[id]/points/` directory

### Task 7: Test navigation flow
- [ ] Verify tours list links directly to unified editor
- [ ] Verify back button returns to tours list
- [ ] Verify no broken links remain

## Impact
- Simplifies codebase by removing ~500+ lines of redundant code
- Improves user experience with single unified editor
- Prevents confusion about which editor to use

## Files to Modify
1. `cms/src/app/tours/page.tsx` - Update link
2. `cms/src/app/tours/[id]/edit/page.tsx` - Update back button

## Files to Delete
1. `cms/src/app/tours/[id]/page.tsx`
2. `cms/src/app/tours/[id]/editor/` (entire directory)
3. `cms/src/app/tours/[id]/versions/` (entire directory)
4. `cms/src/app/tours/[id]/points/` (entire directory)

---

## Review

### Summary
Successfully removed all redundant tour editor pages and simplified the navigation flow. The CMS now has a single unified editor at `/tours/[id]/edit` for all tour editing tasks.

### Changes Made

#### 1. Updated Navigation Links ✅
**File**: `cms/src/app/tours/page.tsx`
- Changed tour list link from `/tours/${id}` to `/tours/${id}/edit` (line 165)
- Updated title attribute from "View details" to "Edit tour"
- Users now go directly to the unified editor when clicking a tour

#### 2. Updated Back Button ✅
**File**: `cms/src/app/tours/[id]/edit/page.tsx`
- Changed back link from `/tours/${tourId}` to `/tours` (line 651)
- Back button now returns to tours list instead of non-existent detail page

#### 3. Deleted Redundant Pages ✅
Removed 4 directories with all their contents:
- `cms/src/app/tours/[id]/page.tsx` - Old tour detail page
- `cms/src/app/tours/[id]/editor/` - Old localization editor (~150 lines)
- `cms/src/app/tours/[id]/versions/` - Old version management pages (~200 lines)
- `cms/src/app/tours/[id]/points/` - Old points management pages (~150 lines)

### Remaining Pages Structure
```
cms/src/app/tours/
├── page.tsx                    # Tours list
├── new/page.tsx               # Create new tour
└── [id]/
    └── edit/page.tsx          # Unified editor (ONLY editor)
```

### Navigation Flow
1. **Tours List** (`/tours`) → Click tour icon → **Unified Editor** (`/tours/[id]/edit`)
2. **Unified Editor** → Click "Back" → **Tours List** (`/tours`)

### Testing Results
- ✅ Old route `/tours/[id]` returns 404 (correctly removed)
- ✅ New route `/tours/[id]/edit` returns 200 (working perfectly)
- ✅ Tours list route `/tours` returns 200 (working)
- ✅ No TypeScript compilation errors
- ✅ No broken links detected

### Impact
✅ **Codebase Simplification**: Removed ~500 lines of redundant code
✅ **Improved UX**: Single, clear path to edit tours
✅ **No Confusion**: Only one editor to use
✅ **Cleaner Architecture**: 3 pages instead of 10+
✅ **Zero Breaking Changes**: All functionality preserved in unified editor

### Files Modified
1. `cms/src/app/tours/page.tsx` - 1 line changed
2. `cms/src/app/tours/[id]/edit/page.tsx` - 1 line changed

### Files Deleted
1. `cms/src/app/tours/[id]/page.tsx` - Deleted
2. `cms/src/app/tours/[id]/editor/` - Deleted (entire directory)
3. `cms/src/app/tours/[id]/versions/` - Deleted (entire directory)
4. `cms/src/app/tours/[id]/points/` - Deleted (entire directory)
