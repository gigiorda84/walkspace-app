# GPS-Triggered Audio Playback Implementation Plan

## Overview
Implement GPS geofencing to automatically trigger audio playback when users enter a tour point's radius. Must support sequential triggering and background location updates.

## Requirements (from DESIGN_REFERENCE.md)

1. **Sequential Triggering**: Points must be triggered in order (1 → 2 → 3...)
2. **Auto-play on Entry**: When entering point radius, audio plays automatically
3. **Radius Detection**: 100-300m trigger radius per point
4. **Background Updates**: Continue tracking when screen is locked
5. **Current Audio Handling**: If user enters next point while audio playing:
   - Current audio finishes completely
   - Next audio auto-plays immediately after

## Implementation Steps

### 1. Add Location Permissions to Info.plist ⏳

**File**: `SonicWalkscape/Info.plist`

Add required privacy keys:
- `NSLocationWhenInUseUsageDescription`: "We need your location to trigger audio stories as you walk the tour route."
- `NSLocationAlwaysAndWhenInUseUsageDescription`: "We need your location in the background to trigger audio stories even when the screen is locked."
- `UIBackgroundModes`: Add "location" for background tracking

**Why**: iOS requires explicit permission descriptions and background mode declarations.

### 2. Enhance LocationManager with Geofencing ⏳

**File**: `Services/LocationManager.swift`

**Current State**:
- Has `setTourPoints()` method
- Tracks user location
- Checks proximity to all points

**Enhancements Needed**:
```swift
// Add state tracking
@Published var currentPointIndex: Int = 0
@Published var triggeredPoints: Set<String> = []
@Published var isPointActive: Bool = false

// Add geofencing logic
private func setupGeofences(for points: [TourPoint]) {
    // Create CLCircularRegion for each point
    // Monitor only the NEXT point in sequence
}

// Enhanced proximity checking
private func checkPointProximity() {
    // Only check the next point in sequence
    // If within radius, trigger point
    // Update currentPointIndex
}
```

**Key Logic**:
- Monitor only the NEXT point in sequence (not all points)
- When user enters radius → mark point as triggered
- Increment `currentPointIndex` for next point
- Publish state changes via `@Published` properties

### 3. Implement Sequential Triggering Logic ⏳

**File**: `Services/LocationManager.swift`

**Algorithm**:
```
1. Start with currentPointIndex = 0
2. Monitor location updates
3. Calculate distance to tourPoints[currentPointIndex]
4. If distance <= triggerRadiusMeters:
   a. Mark point as triggered
   b. Notify observers (publish event)
   c. Increment currentPointIndex
   d. Start monitoring next point
5. Ignore all other points
```

**State Machine**:
```
IDLE → MONITORING_POINT_1 → POINT_1_TRIGGERED →
  MONITORING_POINT_2 → POINT_2_TRIGGERED → ... → TOUR_COMPLETE
```

### 4. Connect LocationManager to PlayerView ⏳

**File**: `Views/Player/PlayerView.swift`

**Current State**:
- Has LocationManager as `@StateObject`
- Calls `startTracking()` on appear

**Enhancements**:
```swift
.onReceive(locationManager.$nearbyPoint) { point in
    guard let point = point else { return }
    handlePointTriggered(point)
}

private func handlePointTriggered(_ point: TourPoint) {
    // If audio is playing, queue this point
    // If audio finished, play immediately
    // Update UI to show active point
}
```

### 5. Add Background Location Support ⏳

**File**: `SonicWalkscapeApp.swift`

Enable background location updates:
```swift
locationManager.allowsBackgroundLocationUpdates = true
locationManager.pausesLocationUpdatesAutomatically = false
```

**Note**: Requires `UIBackgroundModes` in Info.plist

### 6. Add Point Activation UI Feedback ⏳

**File**: `Views/Player/MapView.swift`

Visual feedback for point states:
- **Inactive**: Gray circle (not yet reached)
- **Active**: Orange pulsing circle (currently in radius)
- **Completed**: Green checkmark (triggered and audio played)

## Testing Strategy

### Simulator Testing
1. Use Xcode's location simulation
2. Create GPX file with waypoints along tour route
3. Simulate walking through points sequentially
4. Verify points trigger in order
5. Verify only next point is monitored

### Real Device Testing (Later)
1. Walk actual tour route
2. Test with screen locked
3. Verify background updates work
4. Test battery impact
5. Test in areas with poor GPS accuracy

## Edge Cases to Handle

1. **User skips ahead**: Only next point triggers (enforce sequence)
2. **User backtracks**: Don't re-trigger completed points
3. **GPS accuracy issues**: Use larger trigger radius (100-300m)
4. **Location permission denied**: Show error, disable GPS features
5. **Background location denied**: Warn user, require foreground
6. **Audio still playing**: Queue next point, auto-play after current finishes

## Success Criteria

✅ User enters point 1 radius → Point 1 triggered
✅ Point 2 doesn't trigger until point 1 is complete
✅ Points trigger sequentially (1 → 2 → 3...)
✅ Location updates continue with screen locked
✅ GPS works in simulator with location simulation
✅ App requests appropriate location permissions

## Files to Modify

1. `Info.plist` - Add permission strings and background mode
2. `Services/LocationManager.swift` - Add geofencing + sequential logic
3. `Views/Player/PlayerView.swift` - Connect to location updates
4. `Views/Player/MapView.swift` - Visual feedback for point states

## Estimated Complexity: Medium

- LocationManager enhancement: ~50 lines
- Sequential logic: ~30 lines
- PlayerView integration: ~20 lines
- Info.plist config: ~5 minutes
- Testing: ~1 hour

**Total**: ~2-3 hours of focused work
