# iOS Build Configuration Guide

Complete guide to configuring the Sonic Walkscape iOS app for physical device testing and deployment.

## Prerequisites

- ✅ **Xcode** 14.0 or later
- ✅ **Apple Developer Account** (Free or Paid)
- ✅ **iOS Device** running iOS 14.0 or later
- ✅ **USB Cable** for device connection

---

## Step 1: Xcode Project Setup

### 1.1 Open Project

```bash
cd mobile-app/ios/SonicWalkscape
open SonicWalkscape.xcodeproj
```

### 1.2 Select Target

In Xcode:
1. Click on the **project** in the navigator (blue icon)
2. Select the **SonicWalkscape target** under "Targets"

### 1.3 General Settings

**Identity Section**:
- [ ] **Display Name**: "Sonic Walkscape"
- [ ] **Bundle Identifier**: `com.yourcompany.sonicwalkscape` (change to your domain)
- [ ] **Version**: 1.0.0
- [ ] **Build**: 1

**Deployment Info**:
- [ ] **iOS Deployment Target**: 14.0 or later
- [ ] **Devices**: iPhone (or iPhone + iPad)
- [ ] **Device Orientation**: Portrait

---

## Step 2: Signing & Capabilities

### 2.1 Automatic Signing (Recommended for Testing)

1. Select **"Signing & Capabilities"** tab
2. Check ✅ **"Automatically manage signing"**
3. Select your **Team** (your Apple ID or organization)
4. Xcode will automatically create provisioning profiles

### 2.2 Manual Signing (Advanced)

If you need manual control:
1. Uncheck "Automatically manage signing"
2. Select **Provisioning Profile** for Debug/Release
3. Ensure profile matches Bundle ID

### 2.3 Required Capabilities

Verify these capabilities are enabled:

#### ✅ Background Modes

- [ ] **Audio, AirPlay, and Picture in Picture**
  - Allows audio playback when screen locked
  - Required for lock screen controls

- [ ] **Location updates**
  - Allows GPS tracking in background
  - Required for sequential audio triggering

**To Add**:
1. Click **"+ Capability"** button
2. Search for "Background Modes"
3. Check both boxes above

#### ✅ Location Services

No special capability needed, but verify Info.plist has permission descriptions (see Step 3).

---

## Step 3: Info.plist Configuration

### 3.1 Verify Required Keys

Open `Info.plist` and verify these keys exist:

#### ✅ Location Permission Descriptions

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Sonic Walkscape needs your location to trigger audio at specific points along your walking tour.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Sonic Walkscape needs continuous location access to trigger audio even when the screen is locked or the app is in the background.</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>Sonic Walkscape needs continuous location access to trigger audio during your walking tour.</string>
```

**Why needed**: iOS will crash the app if you request location without these descriptions.

#### ✅ Background Modes

```xml
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
    <string>location</string>
</array>
```

**Why needed**: Enables background audio and GPS tracking.

### 3.2 Optional Keys

#### App Transport Security (for HTTP backend)

If your backend uses HTTP (not HTTPS), add:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

**⚠️ WARNING**: Only use for development! Production should use HTTPS.

#### Camera/Microphone (if adding features later)

```xml
<key>NSCameraUsageDescription</key>
<string>Take photos during your tour</string>

<key>NSMicrophoneUsageDescription</key>
<string>Record audio notes</string>
```

---

## Step 4: Build Settings

### 4.1 Verify Swift Version

1. Select **"Build Settings"** tab
2. Search for "Swift Language Version"
3. Ensure it's set to **Swift 5.0** or later

### 4.2 Other C Flags (For Debugging)

For development builds, you can add:

**Debug Configuration**:
- Search for "Other C Flags"
- Add: `-DDEBUG=1`

### 4.3 Dead Code Stripping

**Release Configuration**:
- Search for "Dead Code Stripping"
- Set to **YES** (reduces app size)

---

## Step 5: Connecting Device

### 5.1 Physical Device Setup

**On iPhone**:
1. Go to **Settings → General → VPN & Device Management**
2. Trust your developer certificate (if prompted)

**On Mac**:
1. Connect iPhone via USB
2. If prompted "Trust This Computer?", tap **Trust**
3. Enter iPhone passcode if requested

### 5.2 Select Device in Xcode

1. In Xcode toolbar, click the device selector (next to scheme)
2. Under "iOS Device", select your connected iPhone
3. Should show device name, not "Any iOS Device"

### 5.3 Register Device (First Time)

1. Xcode may prompt: "Register Device"
2. Click **Register** (requires Apple ID signed in)
3. Wait for provisioning profile update

---

## Step 6: Build & Run

### 6.1 Clean Build Folder

Before first build:
1. **Product → Clean Build Folder** (⌘⇧K)
2. Wait for confirmation

### 6.2 Build Project

1. **Product → Build** (⌘B)
2. Watch for errors in Issue Navigator (⌘5)
3. Fix any errors before proceeding

### 6.3 Run on Device

1. **Product → Run** (⌘R)
2. Xcode will:
   - Build the app
   - Install on device
   - Launch automatically

### 6.4 Trust Developer (First Time)

**On iPhone** (first time only):
1. iOS shows: "Untrusted Developer"
2. Go to **Settings → General → VPN & Device Management**
3. Under "Developer App", tap your profile
4. Tap **Trust "[Your Name]"**
5. Confirm

**Return to app and launch again**.

---

## Step 7: Verification

### 7.1 App Launches Successfully

- [ ] App icon appears on home screen
- [ ] Tapping icon launches app
- [ ] No immediate crashes

### 7.2 Permissions Prompt Correctly

- [ ] Location permission dialog appears
- [ ] Shows your custom description from Info.plist
- [ ] Can grant "While Using" or "Always"

### 7.3 Background Modes Work

- [ ] Lock screen shows audio controls (when audio playing)
- [ ] GPS updates continue when screen locked

### 7.4 Xcode Console Connected

- [ ] Console shows app logs (⌘⇧Y to open)
- [ ] Debug logs appear with timestamps
- [ ] Can see GPS and audio events

---

## Troubleshooting Common Issues

### Issue: "Could not launch [app]"

**Cause**: Provisioning profile issue

**Solution**:
1. Go to Signing & Capabilities
2. Change team to "None", then back to your team
3. Clean build folder (⌘⇧K)
4. Try again

### Issue: "Untrusted Developer" Loop

**Cause**: Device trust not completed

**Solution**:
1. Settings → General → VPN & Device Management
2. Delete old profiles
3. Reinstall app from Xcode
4. Trust again

### Issue: App Crashes on Location Request

**Cause**: Missing Info.plist descriptions

**Solution**:
1. Verify all 3 location keys in Info.plist (see Step 3.1)
2. Clean build and reinstall

### Issue: Background Audio Doesn't Work

**Cause**: Background mode not enabled

**Solution**:
1. Signing & Capabilities → Background Modes
2. Check "Audio, AirPlay, and Picture in Picture"
3. Verify Info.plist has audio in UIBackgroundModes

### Issue: GPS Doesn't Update in Background

**Cause**: Missing location background mode

**Solution**:
1. Signing & Capabilities → Background Modes
2. Check "Location updates"
3. Verify Info.plist has location in UIBackgroundModes
4. Ensure `allowsBackgroundLocationUpdates = true` in LocationManager

### Issue: Build Succeeds but App Not Installing

**Cause**: Disk space or device issue

**Solution**:
1. Check device storage (Settings → General → iPhone Storage)
2. Delete old builds of the app
3. Restart iPhone
4. Restart Xcode

### Issue: "Code signing error"

**Cause**: Expired certificate or wrong team

**Solution**:
1. Xcode → Preferences → Accounts
2. Select your Apple ID
3. Click "Download Manual Profiles"
4. Try automatic signing again

---

## Production Build Configuration

When ready for TestFlight or App Store:

### Change Build Configuration

1. **Product → Scheme → Edit Scheme**
2. Select "Run" → Info tab
3. Change "Build Configuration" from Debug to **Release**

### Disable Debug Features

In release builds:
- Disable debug overlay
- Remove verbose logging
- Enable optimizations

### Archive for Distribution

1. Select "Any iOS Device" (not specific device)
2. **Product → Archive**
3. Follow App Store distribution workflow

---

## Best Practices

### Development Builds

✅ Use Debug configuration
✅ Keep verbose logging
✅ Enable debug overlay
✅ Use HTTP for local backend (with ATS exception)
✅ Test on multiple physical devices

### Release Builds

✅ Use Release configuration
✅ Minimal logging (errors only)
✅ Disable/hide debug features
✅ Use HTTPS for backend
✅ Test battery usage thoroughly

### Security

⚠️ Never commit:
- Provisioning profiles
- Certificates
- API keys in code
- Local backend URLs

✅ Use environment variables or config files for:
- API endpoints
- API keys
- Feature flags

---

## Quick Reference Checklist

Before each device test session:

- [ ] Device connected and trusted
- [ ] Latest code pulled from git
- [ ] Clean build performed (⌘⇧K)
- [ ] Build succeeded (⌘B)
- [ ] App installed on device
- [ ] Location permissions granted
- [ ] Backend server running
- [ ] Console logs visible in Xcode
- [ ] Debug overlay enabled in app
- [ ] Battery >50% charged

---

## Environment-Specific Configuration

### Backend URL Configuration

Update `Constants.swift`:

```swift
enum API {
    #if DEBUG
    static let baseURL = "http://192.168.1.138:3000"  // Local development
    #else
    static let baseURL = "https://api.sonicwalkscape.com"  // Production
    #endif
}
```

### Feature Flags

```swift
enum FeatureFlags {
    #if DEBUG
    static let showDebugOverlay = true
    static let verboseLogging = true
    #else
    static let showDebugOverlay = false
    static let verboseLogging = false
    #endif
}
```

---

## Additional Resources

- [Apple Documentation: Configuring Background Execution Modes](https://developer.apple.com/documentation/xcode/configuring-background-execution-modes)
- [Apple Documentation: Requesting Authorization for Location Services](https://developer.apple.com/documentation/corelocation/requesting_authorization_for_location_services)
- [Apple Documentation: Code Signing Guide](https://developer.apple.com/support/code-signing/)

---

## Summary

✅ **Configured**:
- Signing & capabilities
- Background modes (audio + location)
- Location permission descriptions
- Info.plist requirements

✅ **Verified**:
- App builds successfully
- Installs on physical device
- Permissions prompt correctly
- Background modes functional

✅ **Ready for**:
- Physical device testing
- GPS accuracy testing
- Background behavior testing
- Battery usage profiling

🚀 **You're all set to test on a physical device!**
