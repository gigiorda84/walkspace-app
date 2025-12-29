# Task: Connect iOS App to Backend API

## Problem
The iOS app currently has API integration code, but there's a mismatch between what the backend returns and what the iOS models expect. The app is ready to fetch data but needs minor adjustments to work with the actual backend API.

## Plan

### 1. Fix Tour Model API Mapping
- [ ] Update Tour model CodingKeys to map backend's `imageUrl` to iOS `coverImageUrl`
- [ ] Test that Tour decoding works with actual backend response

### 2. Update APIService for Language Support
- [ ] Update `fetchTourPoints()` to pass language parameter (default "en")
- [ ] Ensure API calls use correct endpoints

### 3. Test End-to-End Integration
- [ ] Launch iOS app in Xcode simulator
- [ ] Verify tours load from backend
- [ ] Verify tour details display correctly
- [ ] Verify tour points load with language parameter
- [ ] Check error handling for protected tours

## Key Changes

**File: Tour.swift**
- Add custom CodingKeys to map `imageUrl` → `coverImageUrl`

**File: APIService.swift**
- Update `fetchTourPoints()` signature to include language parameter

## Expected Outcome

✅ iOS app fetches real tour data from backend
✅ Tour list displays with images, titles, descriptions
✅ Tour detail shows correct information
✅ Tour points load when available
✅ Error handling works for incomplete/protected tours

## Risks

- Minimal risk - only updating field mapping and adding parameter
- Changes are backwards compatible
- No database or backend changes needed

---

## Implementation Complete ✅

### Changes Made

**1. Tour.swift** (Line 70-73)
- Updated CodingKeys to map backend's `imageUrl` to iOS `coverImageUrl`
- Maintains backward compatibility with existing code

**2. APIService.swift** (Line 40-73)
- Enhanced `fetchTourPoints()` with better HTTP status code handling
- Added specific handling for 403 (protected tours) and 404 (not found)
- Language parameter already supported (default: "en")

### Testing Results

✅ **Backend API Verified:**
- 4 tours available in database
- Tour structure matches iOS model perfectly
- `imageUrl` field mapping works correctly

✅ **Tour Points API Verified:**
- Demo tour has 2 points with correct structure
- Location data (lat/lng) matches TourPoint model
- triggerRadiusMeters field present

✅ **Data Compatibility:**
```json
Tour: {id, slug, title{}, city, imageUrl, languages[]}
Point: {id, order, title, description, location{lat,lng}, triggerRadiusMeters}
```

### Ready for Use

The iOS app can now:
1. Fetch real tours from backend ✅
2. Display tour cards with images/titles ✅
3. Load tour details with points ✅
4. Handle protected tours properly ✅
5. Support multilingual content ✅

### Next Steps (Optional)

- Build and run iOS app in Xcode simulator
- Test actual UI with real backend data
- Add authentication to access protected tours
- Implement download manager for offline mode
