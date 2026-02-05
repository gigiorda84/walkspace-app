# Test Tour Data for GPS Testing

This directory contains test tour data for physical device testing of GPS-triggered audio playback.

## Available Test Tours

### 1. Milan Duomo Test Walk (`milan-test-tour.json`)

**Location**: Milan city center (Duomo to Sempione Park)

**Points**: 5 waypoints
- Point 1: Piazza del Duomo (45.464203, 9.189982)
- Point 2: Galleria Vittorio Emanuele II (45.465803, 9.190182)
- Point 3: Teatro alla Scala (45.467203, 9.189382)
- Point 4: Castello Sforzesco (45.470603, 9.179582)
- Point 5: Parco Sempione (45.472003, 9.173782)

**Distance**: ~500m total
**Duration**: 10-15 minutes walking
**Trigger Radii**: 120-150m

**Best for testing**:
- Sequential GPS triggering
- Urban GPS accuracy
- Background location tracking
- Full tour completion flow

### 2. Custom Test Tour Template (`custom-test-tour-template.json`)

Use this template to create your own test tour near your location:

1. Copy the template
2. Use Google Maps to find GPS coordinates near you
3. Pick 3-5 locations that are 100-200m apart
4. Replace the coordinates in the JSON
5. Update the location names and descriptions

## How to Use Test Tours

### Option 1: Backend Integration (Recommended)

1. Start your backend server
2. Import the test tour data into your database
3. The mobile app will fetch it via the API
4. Test the full manifest download + GPS triggering flow

### Option 2: Mock Data in App (Quick Testing)

For quick GPS testing without backend setup:

1. Add the JSON file to your Xcode project
2. Create a local data loader in the app
3. Parse the JSON and create Tour/TourPoint objects
4. Navigate directly to PlayerView with the test data

Example Swift code:

```swift
// Load test tour from bundle
if let path = Bundle.main.path(forResource: "milan-test-tour", ofType: "json"),
   let data = try? Data(contentsOf: URL(fileURLWithPath: path)),
   let testTour = try? JSONDecoder().decode(TestTourData.self, from: data) {
    // Use testTour.tour and testTour.points for testing
}
```

## GPS Testing Tips

### Before You Start

✅ Enable Location Services on your device
✅ Ensure "Precise Location" is enabled
✅ Test in areas with clear sky view
✅ Charge your device fully (GPS drains battery)
✅ Have the debug overlay enabled (🐜 button)

### During Testing

📍 **Watch GPS accuracy** in debug overlay (should be <20m)
📍 **Monitor distance to next point** to see when it triggers
📍 **Test background mode** by locking screen during walk
📍 **Check lock screen controls** while audio plays
📍 **Verify sequential triggering** (can't skip points)

### Challenging Scenarios to Test

1. **Poor GPS (Urban Canyon)**
   - Walk between tall buildings
   - Expect accuracy >50m
   - Verify app handles gracefully

2. **Fast Walking**
   - Enter next point radius while audio playing
   - Audio should finish, then next should auto-play

3. **Screen Lock**
   - Lock phone while walking
   - GPS should continue tracking
   - Audio should keep playing

4. **Background App**
   - Switch to another app
   - GPS tracking should continue
   - Return to app and verify state

## Customizing for Your Location

### Quick Coordinate Finding

1. Open Google Maps
2. Right-click on a location
3. Click the coordinates to copy them
4. Format as: `"lat": 45.464203, "lng": 9.189982`

### Recommended Point Spacing

- **Close**: 50-100m (quick testing, may overlap)
- **Normal**: 100-200m (realistic walking distance)
- **Far**: 200-300m (ensures no overlap, longer test)

### Trigger Radius Guidelines

| Accuracy | Radius | Best For |
|----------|--------|----------|
| High precision | 50-80m | Open areas, clear GPS |
| Standard | 100-150m | Mixed urban areas |
| Safe/Reliable | 150-200m | Urban canyons, forests |

**Rule of thumb**: Set radius to 2-3x expected GPS accuracy

## Audio Files for Testing

If testing with actual audio, your backend should serve audio files for each point. For quick testing, you can use:

- Public domain audio files
- Text-to-speech generated narrations
- Placeholder audio (sine waves, test tones)

The app expects audio URLs in this format from the backend:
```
http://192.168.1.138:3000/uploads/audio/{filename}.mp3
```

## Troubleshooting

### GPS Not Triggering

- ✅ Check if you're within trigger radius (debug overlay shows distance)
- ✅ Verify GPS accuracy is good (<50m)
- ✅ Ensure you're on the correct point in sequence
- ✅ Check console logs for GPS updates

### Audio Not Playing

- ✅ Verify manifest loaded successfully
- ✅ Check audio URL is accessible
- ✅ Look for download errors in console
- ✅ Confirm audio session is active

### Background Mode Issues

- ✅ Verify Info.plist has background modes enabled
- ✅ Check that location permission is "Always" (not "While Using")
- ✅ Ensure `allowsBackgroundLocationUpdates = true`
- ✅ Test on physical device (simulator behavior differs)

## Test Checklist

Use this checklist when testing on a physical device:

- [ ] Location permissions granted
- [ ] Background location enabled
- [ ] Audio plays when entering first point
- [ ] Lock screen shows track info
- [ ] GPS continues updating when screen locked
- [ ] Audio continues playing when screen locked
- [ ] Sequential triggering works (can't skip ahead)
- [ ] Next audio auto-plays after current finishes
- [ ] Manual skip forward/backward works
- [ ] Tour completion screen shows after last point
- [ ] Debug overlay shows accurate GPS data
- [ ] Console logs are clear and helpful
- [ ] Battery usage is reasonable
- [ ] No crashes or freezes during tour

## Notes

- GPS accuracy varies by location (open sky vs. buildings)
- First GPS fix can take 30-60 seconds
- Movement helps GPS accuracy (static testing may be less accurate)
- Test in real conditions you expect users to experience
