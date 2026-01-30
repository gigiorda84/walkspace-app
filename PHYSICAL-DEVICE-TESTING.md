# Physical Device Testing Checklist

Complete guide for testing GPS-triggered audio playback on a physical iOS device.

## Pre-Testing Setup

### Device Preparation

- [ ] **iOS Device Charged** (>80% battery recommended)
- [ ] **Storage Space** (At least 500MB free for test audio)
- [ ] **iOS Version** (iOS 14+ required for background location)
- [ ] **Clear Weather** (Better GPS accuracy outdoors)

### Xcode & App Setup

- [ ] **Xcode Version** (Latest stable version)
- [ ] **Provisioning Profile** (Valid for your device)
- [ ] **Code Signing** (Configured correctly)
- [ ] **Background Modes** (Enabled in project capabilities)
- [ ] **Clean Build** (⌘⇧K, then ⌘B to rebuild)
- [ ] **Device Selected** (Not simulator)

### Backend Setup

- [ ] **Backend Running** (API accessible)
- [ ] **Test Tour Loaded** (Milan test tour in database)
- [ ] **Audio Files** (Uploaded and accessible)
- [ ] **Network Accessible** (Device can reach backend)

### Permissions

- [ ] **Location Services** (Settings → Privacy → Location Services → ON)
- [ ] **App Location Permission** (Settings → Sonic Walkscape → Location → "Always")
- [ ] **Precise Location** (Settings → Sonic Walkscape → "Precise Location" → ON)
- [ ] **Motion & Fitness** (If using for enhanced accuracy)

---

## Pre-Flight Checks (Before Walking)

### In-App Verification

1. **Launch App**
   - [ ] App launches without crashes
   - [ ] Welcome screen appears correctly

2. **Navigate to Test Tour**
   - [ ] Milan Test Tour visible in discovery
   - [ ] Tour details load correctly
   - [ ] Cover image displays (if configured)

3. **Start Tour Player**
   - [ ] Tap "Start Tour"
   - [ ] Player view loads successfully
   - [ ] Map displays with tour route
   - [ ] Tour points visible on map

4. **Enable Debug Overlay**
   - [ ] Tap 🐜 (debug) button
   - [ ] Debug overlay appears
   - [ ] Shows "Waiting for GPS..." initially

5. **Wait for GPS Fix**
   - [ ] Debug overlay updates with location
   - [ ] Latitude and longitude display
   - [ ] GPS accuracy shows (should be <50m)
   - [ ] Speed shows 0 m/s (stationary)
   - [ ] Distance to Point 1 appears

### Console Log Checks

Open Xcode console (⌘⇧Y) while app is running on device:

- [ ] `[HH:MM:SS.mmm] ✅ Success Location permission granted`
- [ ] `[HH:MM:SS.mmm] 📍 GPS GPS tracking started`
- [ ] `[HH:MM:SS.mmm] 📍 GPS Location updated - accuracy: X.Xm, speed: 0.0m/s`
- [ ] `[HH:MM:SS.mmm] 🌐 Network Manifest loaded: X audio files, X subtitle files`

**If you don't see these logs**: Check permissions and GPS fix.

---

## Testing Phase 1: Basic GPS Triggering

### Test 1.1: First Point Trigger

**Objective**: Verify Point 1 triggers when entering radius

- [ ] **Walk toward Point 1** (Piazza del Duomo or your test location)
- [ ] **Watch debug overlay** distance decrease
- [ ] **When distance < trigger radius (150m)**:
  - [ ] Debug overlay shows "Status: ACTIVE" (green)
  - [ ] Point indicator changes to point 1
  - [ ] Console: `📍 GPS Point 1 TRIGGERED at XXm: [Point Title]`
  - [ ] Audio download starts: `⬇️ Download Downloading audio from: [URL]`
  - [ ] Audio auto-plays: `🎵 Audio Audio ready: XX.Xs, autoPlay: true`
  - [ ] Lock screen shows track info

**If audio doesn't play**: Check console for download errors.

### Test 1.2: Audio Playback Quality

While Point 1 audio plays:

- [ ] **Audio Quality** (Clear, no distortion)
- [ ] **Volume Level** (Appropriate loudness)
- [ ] **Subtitles** (Appear synchronized if enabled)
- [ ] **Playback Controls** (Play/pause works)
- [ ] **Skip Forward** (+10s works)
- [ ] **Skip Backward** (-10s works)
- [ ] **Seek Slider** (Dragging works)

### Test 1.3: Point Deactivation

**Objective**: Verify point deactivates when leaving radius

- [ ] **Walk away** from Point 1 (before audio finishes)
- [ ] **When distance > trigger radius**:
  - [ ] Debug overlay shows "Status: Waiting" (red)
  - [ ] Audio keeps playing (doesn't stop)
  - [ ] Console: `📍 GPS Point 1 deactivated - moved out of XXm radius`

- [ ] **Walk back** into Point 1 radius:
  - [ ] Status returns to "ACTIVE"
  - [ ] Audio continues (doesn't restart)

---

## Testing Phase 2: Sequential Triggering

### Test 2.1: Proper Sequence Enforcement

**Objective**: Cannot skip points out of order

- [ ] **Complete Point 1 audio** (or manually skip to next point)
- [ ] **Console log**: `🎵 Audio Audio playback completed successfully`
- [ ] **Console log**: `📍 GPS Advanced to point 2: [Point 2 Title]`
- [ ] **Walk toward Point 2**
- [ ] **When entering Point 2 radius**:
  - [ ] Point 2 triggers
  - [ ] Point 2 audio plays
  - [ ] Debug overlay shows point 2

### Test 2.2: Cannot Skip Ahead

**Objective**: If you walk near Point 3 before completing Point 2, it should NOT trigger

- [ ] **While on Point 2**, walk toward Point 3 (skip Point 2 audio if needed)
- [ ] **Get within Point 3 radius** before Point 2 audio completes
- [ ] **Verify**:
  - [ ] Point 3 does NOT trigger
  - [ ] Debug overlay still shows Point 2 as current
  - [ ] No audio for Point 3 starts

- [ ] **Complete Point 2 audio**
- [ ] **Console**: Point advances to 3
- [ ] **Now Point 3 triggers** (since you're already in radius)

### Test 2.3: Fast Walking Scenario

**Objective**: Enter next point radius while current audio still playing

- [ ] **Start Point 3 audio**
- [ ] **Immediately walk toward Point 4** (don't wait for audio to finish)
- [ ] **Enter Point 4 radius** while Point 3 audio plays
- [ ] **Verify**:
  - [ ] Point 3 audio continues playing (doesn't cut off)
  - [ ] Point 4 does NOT trigger yet
  - [ ] When Point 3 audio finishes:
    - [ ] Console: `🎵 Audio Audio playback completed successfully`
    - [ ] Point advances to 4
    - [ ] Since you're in radius, Point 4 triggers immediately
    - [ ] Point 4 audio auto-plays

---

## Testing Phase 3: Background Mode

### Test 3.1: Screen Lock During Audio

**Objective**: Audio continues when screen locks

- [ ] **Start Point 4 audio playing**
- [ ] **Lock screen** (press power button)
- [ ] **Wait 10-15 seconds**
- [ ] **Verify**:
  - [ ] Audio continues playing through lock screen
  - [ ] Can hear audio clearly
  - [ ] No interruptions

- [ ] **Check lock screen**:
  - [ ] Artwork/info displayed (if configured)
  - [ ] Track title shows: "[Point Title]"
  - [ ] Artist shows: "Sonic Walkscape" or tour name
  - [ ] Play/pause control works
  - [ ] Timeline shows progress

### Test 3.2: GPS Tracking During Lock Screen

**Objective**: Location continues updating when locked

- [ ] **Screen still locked** from previous test
- [ ] **Continue walking** toward Point 5
- [ ] **When Point 4 audio finishes**:
  - [ ] Console: `📍 GPS Advanced to point 5`
  - [ ] GPS should still be updating (verify in console logs)

- [ ] **Keep walking** to Point 5 with screen locked
- [ ] **When entering Point 5 radius**:
  - [ ] Point 5 audio should auto-play
  - [ ] Can hear audio start
  - [ ] Lock screen updates to show Point 5

- [ ] **Unlock screen**
- [ ] **Verify**:
  - [ ] Debug overlay shows correct location
  - [ ] Point 5 is active
  - [ ] Map shows correct position

### Test 3.3: App Backgrounding

**Objective**: GPS/audio continues when switching apps

- [ ] **Point 5 audio playing**
- [ ] **Press home button** (or swipe up) to exit app
- [ ] **Open another app** (Safari, Messages, etc.)
- [ ] **Wait 30-60 seconds**
- [ ] **Verify**:
  - [ ] Audio continues in background
  - [ ] No interruptions

- [ ] **Return to Sonic Walkscape**
- [ ] **Verify**:
  - [ ] Audio still playing
  - [ ] Debug overlay shows updated location
  - [ ] All state preserved correctly

---

## Testing Phase 4: Tour Completion

### Test 4.1: Finish Last Point

**Objective**: Tour completion screen appears

- [ ] **On Point 5** (final point)
- [ ] **Let audio play to end** OR **skip to end**
- [ ] **When audio completes**:
  - [ ] Console: `✅ Success Tour completed! Showing completion screen`
  - [ ] Completion screen appears
  - [ ] Shows tour summary:
    - [ ] Points visited: 5
    - [ ] Duration: XX minutes
    - [ ] Distance: 0.5 km

- [ ] **Completion screen actions**:
  - [ ] "Return to Discovery" button works
  - [ ] "Close" button works
  - [ ] Returns to correct view

---

## Testing Phase 5: Edge Cases

### Test 5.1: Poor GPS Accuracy

**Objective**: App handles low accuracy gracefully

- [ ] **Stand in area with poor GPS** (between tall buildings, under trees)
- [ ] **Check debug overlay**:
  - [ ] Accuracy value (should be >50m)
  - [ ] Console: `⚠️ Warning Poor GPS accuracy: XXm`

- [ ] **Verify**:
  - [ ] App doesn't crash
  - [ ] Position still updates (even if inaccurate)
  - [ ] Points can still trigger (with some delay)

### Test 5.2: No Network Connection

**Objective**: Test offline audio download failure

- [ ] **Enable Airplane Mode** (or disconnect WiFi)
- [ ] **Restart tour from beginning**
- [ ] **Walk to Point 1**
- [ ] **Verify**:
  - [ ] Point triggers correctly (GPS works offline)
  - [ ] Audio download fails: `❌ Error Failed to download audio`
  - [ ] Error message shown to user (if implemented)
  - [ ] App doesn't crash

- [ ] **Disable Airplane Mode**
- [ ] **Resume tour**
- [ ] **Verify recovery**

### Test 5.3: App Interruptions

**Objective**: Handle phone calls and notifications

- [ ] **Audio playing**
- [ ] **Receive phone call** (or simulate)
- [ ] **Verify**:
  - [ ] Audio pauses automatically
  - [ ] Can answer call
  - [ ] GPS continues tracking

- [ ] **End call**
- [ ] **Verify**:
  - [ ] Audio resumes (or gives option to resume)
  - [ ] State preserved correctly

### Test 5.4: Low Battery

**Objective**: Monitor battery usage

- [ ] **Note starting battery %**: ______%
- [ ] **Complete full tour** (all 5 points)
- [ ] **Note ending battery %**: ______%
- [ ] **Calculate usage**: ______% over ______ minutes

**Expected**: ~5-10% battery for 20-minute tour with GPS + audio

---

## Testing Phase 6: Manual Controls

### Test 6.1: Manual Point Navigation

**Objective**: Next/Previous point buttons work

- [ ] **On any point**
- [ ] **Tap "Next Point" button**:
  - [ ] Advances to next point
  - [ ] Console: `🎵 Audio Manual skip to point X: [Title]`
  - [ ] Audio for new point loads
  - [ ] Map updates

- [ ] **Tap "Previous Point" button**:
  - [ ] Goes back one point
  - [ ] Console: `🎵 Audio Manual back to point X: [Title]`
  - [ ] Audio for previous point loads

- [ ] **On last point, tap "Next"**:
  - [ ] Shows completion screen
  - [ ] Console: `🎵 Audio Next point pressed on last point - showing completion screen`

### Test 6.2: Close Tour Mid-Way

**Objective**: Can exit tour safely

- [ ] **During any point**
- [ ] **Tap X (close) button**
- [ ] **Verify**:
  - [ ] Player closes
  - [ ] Returns to tour detail or discovery
  - [ ] Audio stops
  - [ ] GPS tracking stops
  - [ ] Console: no errors

- [ ] **Restart tour**
- [ ] **Verify**:
  - [ ] Starts from Point 1 again
  - [ ] No leftover state from previous session

---

## Performance Metrics

### Battery Usage

| Duration | Battery Used | Rate |
|----------|-------------|------|
| 5 min    | _____%      | _____%/hr |
| 10 min   | _____%      | _____%/hr |
| 20 min   | _____%      | _____%/hr |

**Target**: <30% per hour

### GPS Accuracy

| Location Type | Typical Accuracy | Notes |
|--------------|------------------|-------|
| Open plaza   | ______m          |       |
| Street       | ______m          |       |
| Under trees  | ______m          |       |
| Buildings    | ______m          |       |

**Target**: <20m in open areas

### Memory Usage

- [ ] **Initial app launch**: ______ MB
- [ ] **During tour playback**: ______ MB
- [ ] **After 30 minutes**: ______ MB

**Target**: <150MB steady state

---

## Issues Found

Document any bugs or unexpected behavior:

| Issue # | Description | Severity | Reproducible? | Notes |
|---------|-------------|----------|---------------|-------|
| 1       |             | H/M/L    | Y/N           |       |
| 2       |             | H/M/L    | Y/N           |       |
| 3       |             | H/M/L    | Y/N           |       |

**Severity**: H=High (crashes, data loss), M=Medium (broken features), L=Low (cosmetic, minor)

---

## Sign-Off

**Tester Name**: _______________________

**Date**: _______________________

**Device**: _______________________ (e.g., iPhone 13 Pro, iOS 16.5)

**Location Tested**: _______________________ (e.g., Milan city center)

**Overall Result**: ☐ PASS  ☐ PASS WITH ISSUES  ☐ FAIL

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Next Steps After Testing

✅ **All tests passed?**
- Document any performance metrics
- Note any battery concerns
- Plan for public beta testing

⚠️ **Issues found?**
- File bugs in issue tracker
- Prioritize fixes
- Re-test after fixes

🚀 **Ready for production?**
- Test with multiple users
- Try different cities/tours
- Monitor crash reports
- Gather user feedback
