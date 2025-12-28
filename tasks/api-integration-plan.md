# API Integration Implementation Plan

## Goal
Get tours displaying in the Discovery screen by implementing backend API integration.

## Tasks

### 1. Fix API Configuration
**File:** `Utilities/Constants.swift`
- Change baseURL from `https://api.sonicwalkscape.com` to `http://localhost:3000`
- Update fullURL to just return baseURL (remove /v1 suffix)
- Add App Transport Security exception in Info.plist for localhost

### 2. Update Tour Model
**File:** `Models/Tour.swift`
- Match backend response structure
- Handle multilingual fields (title, descriptionPreview as dictionaries)
- Add missing fields: `slug`, `languages`, `isProtected`, `coverImageUrl`
- Update field names to match backend: `durationMinutes`, `distanceKm`
- Keep backward compatibility with existing code

### 3. Create API Service
**New File:** `Services/APIService.swift`
- Create reusable API service class
- Implement `fetchTours()` method
- Handle JSON decoding with proper error handling
- Support async/await pattern

### 4. Implement Tour Loading
**File:** `Views/Discovery/DiscoveryView.swift`
- Implement `loadTours()` function
- Call APIService.fetchTours()
- Add loading state
- Add error handling
- Display tours in UI

### 5. Update TourCardView
**File:** `Views/Discovery/TourCardView.swift`
- Handle multilingual title display
- Show protection status (lock icon)
- Display language flags
- Handle missing images gracefully

### 6. Test & Verify
- Build and run app
- Verify tours load from backend
- Test category filtering
- Test navigation to tour detail
- Take screenshots

## Implementation Notes

- Keep changes minimal and focused
- Maintain existing code structure
- Add error states for better UX
- Use modern Swift patterns (async/await, Codable)
