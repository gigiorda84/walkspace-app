# iOS App Testing Plan

## Overview
Test the native iOS app (Swift + SwiftUI) located in `/mobile-app/ios/SonicWalkscape`

## Pre-Testing Checklist

### 1. Environment Setup
- [ ] Backend API is running on localhost:3000
- [ ] Xcode is installed and up to date
- [ ] iOS Simulator is available

### 2. Project Configuration
- [ ] Review Info.plist for required permissions (Location, Audio)
- [ ] Check API endpoint configuration (localhost handling)
- [ ] Verify build settings and deployment target

### 3. Build and Run
- [ ] Clean build folder
- [ ] Build the app for iOS Simulator
- [ ] Launch app in Simulator
- [ ] Check for build errors or warnings

## Feature Testing

### Screen 1: Welcome/Onboarding
**File:** `Views/Welcome/WelcomeView.swift`

Test Cases:
- [ ] Screen displays correctly with brand colors
- [ ] All form fields are present (Name, Email, Language, Mailing List)
- [ ] Form validation works
- [ ] Language picker shows: Italian, English, French
- [ ] "Start Exploring" button navigates to Discovery
- [ ] User data is stored locally

### Screen 2: Discovery (Tour Catalog)
**Files:** `Views/Discovery/DiscoveryView.swift`, `Views/Discovery/TourCardView.swift`

Test Cases:
- [ ] Screen loads and displays tour cards
- [ ] Tours are fetched from backend API (localhost:3000/v1/tours)
- [ ] Tour cards show: image, title, city, duration, distance, stops
- [ ] Protected tours show lock icon
- [ ] Language flags display correctly
- [ ] Tap on tour card navigates to Tour Detail
- [ ] Filter chips work (All, Protected, Free) if implemented

### Screen 3: Tour Detail
**File:** `Views/TourDetail/TourDetailView.swift`

Test Cases:
- [ ] Hero image displays correctly
- [ ] Back button navigates to Discovery
- [ ] Tour information is complete (title, city, description, stats)
- [ ] "Start Tour" button is present
- [ ] Protected tours require voucher code (if implemented)
- [ ] Button navigates to appropriate next screen

### Services Testing

#### LocationManager
**File:** `Services/LocationManager.swift`

Test Cases:
- [ ] LocationManager initializes correctly
- [ ] Location permissions are requested
- [ ] Can access user's current location (in Simulator, use Debug > Location)
- [ ] Location updates work
- [ ] Background location capability configured (if needed)

#### AudioPlayerManager
**File:** `Services/AudioPlayerManager.swift`

Test Cases:
- [ ] AudioPlayerManager initializes correctly
- [ ] Can load audio files
- [ ] Play/pause controls work
- [ ] Progress tracking works
- [ ] Seek functionality works
- [ ] Background audio capability configured

### Models Testing

Test Cases:
- [ ] Tour model matches API response structure
- [ ] TourPoint model has GPS coordinates and radius
- [ ] User model stores preferences
- [ ] AudioSettings model manages language/subtitle preferences

## API Integration Testing

### Endpoints to Test
1. `GET /v1/tours` - List all tours
   - [ ] Request succeeds
   - [ ] Data parses correctly
   - [ ] Tours display in Discovery view

2. `GET /v1/tours/:id` - Tour details
   - [ ] Request succeeds
   - [ ] Tour detail view shows correct data

3. `POST /auth/register` - User registration (if implemented)
   - [ ] Form submission works
   - [ ] User is created in backend
   - [ ] App stores auth token

## Known Issues to Check

- [ ] Localhost API accessibility from Simulator (may need http://localhost:3000)
- [ ] Info.plist includes NSLocationWhenInUseUsageDescription
- [ ] Info.plist includes NSLocationAlwaysUsageDescription (for background)
- [ ] Info.plist includes NSMicrophoneUsageDescription (if needed)
- [ ] App Transport Security allows localhost connections

## Performance Testing

- [ ] App launches quickly (< 3 seconds)
- [ ] Smooth scrolling in Discovery view
- [ ] Images load efficiently
- [ ] No memory leaks
- [ ] No excessive battery drain from location services

## Next Steps After Testing

Based on test results:
1. Document any bugs found
2. List missing features
3. Check API integration issues
4. Verify design compliance with DESIGN_REFERENCE.md
5. Plan next development phase

---

**Tester:** Claude
**Date:** December 26, 2025
**Backend Status:** Running on port 3000
**Xcode Version:** TBD
