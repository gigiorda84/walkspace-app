# GPS Simulation Guide for Xcode

This guide explains how to use the provided GPX files to simulate GPS movement in Xcode for testing the Sonic Walkscape app without physically walking the route.

## What is GPX?

GPX (GPS Exchange Format) is an XML format for GPS data. Xcode can use GPX files to simulate location changes during development and testing.

## Available GPX Files

### `milan-test-route.gpx`

Full walking route simulation matching the Milan test tour:
- **Duration**: ~18 minutes simulated walking
- **Speed**: ~1.2 m/s (typical walking pace)
- **Points**: 5 major waypoints with intermediate tracking points
- **Total distance**: ~1.8km

## How to Use GPX Simulation in Xcode

### Method 1: During Debug Session (Simulator or Device)

1. **Build and run** your app in Xcode (⌘R)
2. While the app is running, open the **Debug navigator** (⌘7)
3. At the bottom of Xcode, click the **Location icon** (looks like a location pin)
4. Select **"Add GPX File to Project..."**
5. Choose `milan-test-route.gpx`
6. Click the location icon again
7. Select **"milan-test-route"** from the menu

The simulator/device will now follow the GPS track at normal walking speed.

### Method 2: Adding to Xcode Project (Persistent)

1. **Add GPX to project**:
   - Drag `milan-test-route.gpx` into your Xcode project
   - When prompted, check "Copy items if needed"
   - Add to your app target

2. **Use during debugging**:
   - Edit your Xcode scheme (Product → Scheme → Edit Scheme, or ⌘<)
   - Select **"Run"** on the left
   - Go to **"Options"** tab
   - Under "Core Location", check **"Allow Location Simulation"**
   - Choose your GPX file from the dropdown

3. **Run the app**:
   - Now whenever you run the app, it will automatically use the GPX route
   - Great for repeated testing!

### Method 3: Custom Location (Quick Testing)

For quick single-point testing without GPX:

1. Run your app
2. Click the **Location icon** in debug bar
3. Select one of the preset locations or **"Custom Location..."**
4. Enter coordinates manually (e.g., `45.464203, 9.189982`)
5. Click "OK"

## Testing Workflow with GPX

### Recommended Testing Process

1. **Prepare the app**:
   - Build and run on simulator or device
   - Navigate to a tour (ideally the Milan test tour)
   - Start the tour playback
   - Enable the debug overlay (🐜 button)

2. **Start GPS simulation**:
   - Select the GPX file from location menu
   - Watch the debug overlay update with simulated location
   - Observe as your simulated position approaches each point

3. **What to verify**:
   - ✅ Debug overlay shows location updating
   - ✅ Distance to next point decreases as you "walk"
   - ✅ Point triggers when you enter radius
   - ✅ Audio auto-plays on trigger
   - ✅ Sequential triggering works (no skipping points)
   - ✅ Audio advances after completion

4. **Control simulation speed**:
   - The GPX timestamps control speed
   - Our file simulates realistic walking pace
   - Can't easily speed up/slow down (that's a Xcode limitation)

## Creating Your Own GPX Files

### Option 1: Export from GPS Apps

Many GPS/fitness apps can export GPX:
- Strava
- Runkeeper
- Apple Fitness
- Google Maps (via third-party tools)

### Option 2: Online GPX Editors

Create routes visually:
- [GPX Studio](https://gpx.studio) - Draw routes on a map
- [CalTopo](https://caltopo.com) - Topographic route planning
- [GPS Visualizer](https://www.gpsvisualizer.com/draw/) - Simple route drawing

### Option 3: Manual Creation (Template)

Use this template for a simple 3-point route:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Custom Test Route">
  <trk>
    <name>My Test Route</name>
    <trkseg>
      <!-- Point 1 at time 0 -->
      <trkpt lat="YOUR_LAT" lon="YOUR_LNG">
        <time>2025-01-05T12:00:00Z</time>
      </trkpt>

      <!-- Point 2 at time +2 minutes -->
      <trkpt lat="YOUR_LAT_2" lon="YOUR_LNG_2">
        <time>2025-01-05T12:02:00Z</time>
      </trkpt>

      <!-- Point 3 at time +4 minutes -->
      <trkpt lat="YOUR_LAT_3" lon="YOUR_LNG_3">
        <time>2025-01-05T12:04:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>
```

Replace `YOUR_LAT` and `YOUR_LNG` with your coordinates.

## Limitations of GPX Simulation

### What Works ✅

- Location updates (latitude, longitude)
- Speed calculation (based on time intervals)
- Course/heading (calculated from movement)
- Simulates walking along a path

### What Doesn't Work ❌

- **GPS accuracy variation** - Simulation always has perfect accuracy
- **Signal loss** - Can't simulate going into tunnels/buildings
- **Real-world GPS drift** - No simulation of urban canyon effects
- **Battery impact** - Simulation uses minimal battery vs real GPS
- **Background location** - Harder to test on simulator

### Physical Device Testing Still Needed For:

- Actual GPS accuracy in different environments
- Battery consumption during long tours
- Background location updates when screen locked
- True GPS behavior in urban canyons
- Signal acquisition time and reliability
- Real-world movement detection

## Tips for Effective GPX Testing

### 1. Start Simple

Begin with a short 2-3 point route to verify basic functionality before testing complex routes.

### 2. Match Your Test Data

Ensure your GPX waypoints match your test tour JSON coordinates exactly.

### 3. Add Intermediate Points

For smooth animation, add points every 30-60 seconds along the route, not just the trigger points.

### 4. Realistic Timing

Use realistic walking speed (1.0-1.5 m/s). Too fast or too slow can cause issues.

### 5. Test Pause/Resume

- Pause simulation mid-route
- Switch to other locations
- Resume to verify state management

### 6. Loop Routes

Create return routes to test multiple tour completions without recreating data.

## Troubleshooting

### Location Not Updating

- ✅ Check that "Allow Location Simulation" is enabled in scheme
- ✅ Verify GPX file is properly formatted XML
- ✅ Ensure timestamps are sequential
- ✅ Restart Xcode debug session

### Points Not Triggering

- ✅ Verify GPX coordinates match tour point coordinates
- ✅ Check trigger radius is large enough
- ✅ Enable debug overlay to see distance
- ✅ Watch console logs for GPS updates

### Simulation Too Fast/Slow

- ✅ Check time intervals in GPX file
- ✅ Add more intermediate points for smoothness
- ✅ Verify timestamps are in ISO 8601 format

### Can't Find GPX in Menu

- ✅ Ensure file is added to Xcode project
- ✅ Check file extension is `.gpx`
- ✅ Clean build folder (⌘⇧K) and rebuild

## Advanced: Combining Simulation Methods

For comprehensive testing:

1. **Desk development**: Use GPX for quick iterations
2. **Walking simulation**: Use GPX to test full tour flow
3. **Static testing**: Use custom location for specific points
4. **Real-world testing**: Walk actual routes on physical device

## Summary

GPX simulation is excellent for:
- ✅ Rapid development iteration
- ✅ Testing without leaving your desk
- ✅ Verifying sequential triggering logic
- ✅ Debugging GPS-related code

But remember: **Always do final testing on a physical device in real conditions!**

---

## Quick Reference

| Task | Method |
|------|--------|
| Quick single point test | Custom Location in debug menu |
| Simulate walking route | Load GPX file during debug |
| Automated testing | Add GPX to scheme options |
| Custom route creation | Use gpx.studio or manual XML |
| Real GPS testing | Physical device + actual walking |

Happy testing! 🗺️🚶‍♂️🎵
