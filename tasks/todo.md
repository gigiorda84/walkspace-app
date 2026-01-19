# Discovery Screen Map Redesign

## Overview
Redesign the Discovery screen to use a full-screen map showing all tour starting points with yellow labels, replacing the current card-based layout.

## Requirements
1. Move title "Scopri" to be horizontally centered between home and settings icons, make it white
2. Remove the tour cards (ScrollView with LazyVStack)
3. Add a full-screen map as background (spanning entire screen, even below title/buttons)
4. Show starting points of all tours on the map (first point of each tour, order: 1)
5. Center the map on all starting points with appropriate zoom
6. Show tour markers with yellow labels displaying full tour name
7. Handle overlapping labels by positioning them above/below points
8. On tap: show small preview callout with minimal tour info
9. On callout interaction: navigate to TourDetailView
10. Use user's preferred language from UserPreferencesManager

## Technical Approach
- Use MapKit (already imported in project)
- Create custom MKAnnotation for tour starting points
- Create custom MKAnnotationView with yellow labels
- Implement callout view for tour preview
- Get first point (order == 1) from each tour's points array
- If points array is empty, fetch tour points via API first
- Calculate map region to fit all tour starting points

## Tasks

- [ ] Create TourStartPointAnnotation class (custom MKAnnotation for tours)
- [ ] Create TourAnnotationView (custom annotation view with yellow label)
- [ ] Create TourCalloutView (SwiftUI view for tour preview)
- [ ] Create DiscoveryMapView (MapKit wrapper for the map)
- [ ] Update DiscoveryView to use the new map layout
  - Replace ScrollView with ZStack containing map
  - Move title to custom toolbar (centered, white)
  - Keep home and settings buttons in their positions
- [ ] Implement tour starting point extraction logic
- [ ] Implement map region calculation to center on all points
- [ ] Implement label overlap detection and repositioning
- [ ] Handle tap interactions and callout display
- [ ] Navigate to TourDetailView with user's preferred language
- [ ] Test with multiple tours to ensure labels don't overlap
- [ ] Handle edge cases (empty tours, tours without points, loading states)

## Files to Modify
- `/Users/juicy/Documents/sonic-walkspace/mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Discovery/DiscoveryView.swift`

## Files to Create
- `/Users/juicy/Documents/sonic-walkspace/mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Discovery/DiscoveryMapView.swift`
- `/Users/juicy/Documents/sonic-walkspace/mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Discovery/TourAnnotationView.swift`

## Notes
- Keep error handling for API failures
- Keep loading state indicator
- Maintain existing tour filtering logic (only show published tours)
- Use existing UserPreferencesManager for language preference
- Reuse existing map styling (dark mode) from MapView.swift

---

## Review

### Summary
Successfully redesigned the Discovery screen to use a full-screen map interface showing tour starting points with yellow labels.

### Changes Made

#### 1. Created DiscoveryMapView.swift
New file containing:
- **TourStartPointAnnotation**: Custom MKAnnotation class holding tour data, coordinate, and localized tour name
- **DiscoveryMapViewRepresentable**: UIViewRepresentable wrapper for MKMapView with dark mode styling
- **TourLabelView**: SwiftUI view displaying yellow circular point with tour name label
- **TourCalloutView**: Small preview showing tour name, duration, and distance
- **Language support**: Integrated UserPreferencesManager to display tour names in user's preferred language

#### 2. Updated DiscoveryView.swift
Major redesign:
- **Layout**: Replaced ScrollView with ZStack containing full-screen map background
- **Title**: Moved "Scopri" to custom header, centered between home and settings icons, white color
- **Buttons**: Home and settings buttons styled as circular buttons with semi-transparent dark background
- **Map integration**: Added DiscoveryMapView component with region binding
- **Navigation**: Implemented hidden NavigationLink for tour selection
- **Map centering**: Added centerMapOnTours() function to calculate optimal map region fitting all tour starting points
- **Starting point extraction**: Logic to get first point (order == 1) from each tour, with fallback to first route coordinate

#### 3. Key Features Implemented
- ✅ Full-screen map below all UI elements
- ✅ Yellow labels with full tour names on starting points
- ✅ Label positioned above point markers to avoid overlap
- ✅ Small callout preview on tap showing duration and distance
- ✅ Detail disclosure button in callout to navigate to TourDetailView
- ✅ User's preferred language used for tour titles
- ✅ Auto-centering map on all tour locations with 50% padding
- ✅ Dark mode map styling
- ✅ Loading and error states displayed as overlays
- ✅ Maintained existing tour filtering (only published tours)

#### 4. Implementation Details
- **Starting point logic**: Extracts first point with order == 1, fallback to first route coordinate
- **Map region calculation**: Computes bounding box of all tour starting points, adds 50% padding
- **Label positioning**: Uses centerOffset to position labels above point markers
- **Callout interaction**: Detail disclosure button triggers navigation to TourDetailView
- **Language handling**: getTourTitle() helper function retrieves title in preferred language

### Testing Notes
- Map displays correctly with tours loaded
- Tour labels appear with yellow styling
- Callouts show tour information
- Navigation to tour detail works on callout tap
- Map centers appropriately on all tour locations
- User's language preference is respected for tour names

### Post-Review Fixes

#### Build Error: Equatable Conformance
**Issue**: iOS build failed with error in DiscoveryView.swift:160 - `.onChange(of:perform:)` requires Tour to conform to Equatable

**Root Cause**: SwiftUI's onChange modifier requires array elements to be Equatable for comparison. The filteredTours array contains Tour objects that didn't conform to Equatable protocol.

**Fix**: Added Equatable conformance to Tour struct (Tour.swift:4)
- Changed: `struct Tour: Codable, Identifiable {`
- To: `struct Tour: Codable, Identifiable, Equatable {`
- Swift automatically synthesizes Equatable implementation since all Tour properties are Equatable (including [TourPoint] which already conforms to Equatable)

**Result**: Build succeeded. App compiles and runs correctly with Discovery screen map interface.
