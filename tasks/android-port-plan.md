# Android Port Plan - Sonic Walkscape

## Overview

Port the existing iOS app (37 Swift files) to Android using Kotlin and Jetpack Compose. The iOS app is well-structured with MVVM architecture and uses only Apple frameworks - no external dependencies.

---

## iOS to Android Technology Mapping

| iOS (Swift) | Android (Kotlin) |
|-------------|------------------|
| SwiftUI | Jetpack Compose |
| CoreLocation | FusedLocationProviderClient (Google Play Services) |
| AVFoundation (AVAudioPlayer/AVPlayer) | ExoPlayer (Media3) |
| MapKit | Google Maps SDK or Mapbox |
| Combine | Kotlin Flow / StateFlow |
| UserDefaults | SharedPreferences / DataStore |
| URLSession | Retrofit + OkHttp |
| AVAudioSession | AudioManager + AudioFocus |
| MediaPlayer (lock screen) | MediaSession + MediaController |
| NWPathMonitor | ConnectivityManager |

---

## iOS App Structure Summary (What We're Porting)

```
SonicWalkscape/ (iOS - 37 files)
├── Models/                 6 files  - Tour, TourPoint, TourManifest, etc.
├── Services/               7 files  - API, Location, Audio, Download, Analytics
├── Views/                 16 files  - Welcome, Discovery, Player, Settings
├── Utilities/              7 files  - Constants, Logger, Localization, Subtitles
└── SonicWalkscapeApp.swift 1 file   - Entry point
```

### Core Features to Port:
1. **GPS Sequential Triggering** - Points trigger in order, queue next while audio plays
2. **Audio Playback** - Local (downloaded) + streaming, background playback, lock screen controls
3. **Tour Downloads** - Manifest-based download, track per-language, skip existing files
4. **Offline Playback** - Full tour playback without network
5. **3 Languages** - Italian, French, English (UI + audio content)
6. **GDPR Analytics** - Anonymous tracking with consent
7. **Onboarding** - Welcome carousel with safety tips

---

## Android Project Structure (Target)

```
android-app/
├── app/
│   ├── src/main/
│   │   ├── java/com/bandite/sonicwalkscape/
│   │   │   ├── SonicWalkscapeApp.kt              # Application class
│   │   │   ├── MainActivity.kt                    # Single activity
│   │   │   │
│   │   │   ├── data/
│   │   │   │   ├── models/                        # Data classes (6)
│   │   │   │   │   ├── Tour.kt
│   │   │   │   │   ├── TourPoint.kt
│   │   │   │   │   ├── TourManifest.kt
│   │   │   │   │   ├── TourDetailResponse.kt
│   │   │   │   │   ├── User.kt
│   │   │   │   │   └── AudioSettings.kt
│   │   │   │   │
│   │   │   │   └── api/
│   │   │   │       ├── ApiService.kt              # Retrofit interface
│   │   │   │       └── ApiClient.kt               # Network config
│   │   │   │
│   │   │   ├── services/                          # Business logic (8)
│   │   │   │   ├── LocationManager.kt
│   │   │   │   ├── AudioPlayerManager.kt
│   │   │   │   ├── TourDownloadManager.kt
│   │   │   │   ├── AnalyticsService.kt
│   │   │   │   ├── UserPreferencesManager.kt
│   │   │   │   ├── PerformanceMonitor.kt
│   │   │   │   └── TourPlaybackService.kt         # Foreground service (NEW)
│   │   │   │
│   │   │   ├── ui/
│   │   │   │   ├── navigation/
│   │   │   │   │   └── NavGraph.kt
│   │   │   │   │
│   │   │   │   ├── theme/
│   │   │   │   │   ├── Color.kt
│   │   │   │   │   ├── Theme.kt
│   │   │   │   │   └── Type.kt
│   │   │   │   │
│   │   │   │   ├── welcome/
│   │   │   │   │   ├── WelcomeScreen.kt
│   │   │   │   │   └── OnboardingCarouselScreen.kt
│   │   │   │   │
│   │   │   │   ├── discovery/
│   │   │   │   │   ├── DiscoveryScreen.kt
│   │   │   │   │   ├── DiscoveryMapScreen.kt
│   │   │   │   │   ├── TourCard.kt
│   │   │   │   │   └── VideoPlayer.kt
│   │   │   │   │
│   │   │   │   ├── tourdetail/
│   │   │   │   │   ├── TourDetailScreen.kt
│   │   │   │   │   └── TourSetupSheet.kt
│   │   │   │   │
│   │   │   │   ├── player/
│   │   │   │   │   ├── PlayerScreen.kt
│   │   │   │   │   ├── MapView.kt
│   │   │   │   │   ├── AudioControls.kt
│   │   │   │   │   ├── SubtitlesView.kt
│   │   │   │   │   └── TourCompletionScreen.kt
│   │   │   │   │
│   │   │   │   ├── settings/
│   │   │   │   │   └── SettingsScreen.kt
│   │   │   │   │
│   │   │   │   └── components/
│   │   │   │       └── CommonComponents.kt
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── Constants.kt
│   │   │       ├── DebugLogger.kt
│   │   │       └── SubtitleParser.kt
│   │   │
│   │   └── res/
│   │       ├── values/
│   │       │   ├── strings.xml                    # English
│   │       │   ├── colors.xml
│   │       │   └── themes.xml
│   │       ├── values-it/
│   │       │   └── strings.xml                    # Italian
│   │       ├── values-fr/
│   │       │   └── strings.xml                    # French
│   │       └── drawable/
│   │
│   ├── build.gradle.kts
│   └── proguard-rules.pro
│
├── build.gradle.kts (project)
├── settings.gradle.kts
└── gradle.properties
```

---

## Implementation Phases

### Phase 1: Project Setup & Foundation
- [x] 1.1 Create new Android project (Kotlin + Compose)
- [x] 1.2 Configure Gradle dependencies
- [x] 1.3 Set up package structure
- [x] 1.4 Configure AndroidManifest.xml permissions
- [x] 1.5 Set up theme (colors, typography from iOS)
- [x] 1.6 Create Application class
- [x] 1.7 Set up Hilt dependency injection

### Phase 2: Data Layer
- [x] 2.1 Port Tour.kt data class
- [x] 2.2 Port TourPoint.kt data class
- [x] 2.3 Port TourManifest.kt data class
- [x] 2.4 Port TourDetailResponse.kt data class
- [x] 2.5 Port User.kt data class
- [x] 2.6 Port AudioSettings.kt data class
- [x] 2.7 Create Retrofit ApiService interface
- [x] 2.8 Create ApiClient with retry logic
- [ ] 2.9 Test API connectivity

### Phase 3: Core Utilities
- [x] 3.1 Port Constants.kt
- [x] 3.2 Port DebugLogger.kt
- [x] 3.3 Port SubtitleParser.kt
- [x] 3.4 Create string resources (EN/IT/FR)
- [x] 3.5 Port UserPreferencesManager (DataStore)

### Phase 4: Location Services (Critical)
- [x] 4.1 Create LocationManager with FusedLocationProviderClient
- [x] 4.2 Request location permissions (fine + background)
- [x] 4.3 Implement sequential point triggering logic
- [x] 4.4 Implement point queueing (while audio plays)
- [x] 4.5 Implement distance calculation
- [x] 4.6 Configure foreground service for background location
- [ ] 4.7 Test background location updates

### Phase 5: Audio Playback (Critical)
- [x] 5.1 Add Media3 ExoPlayer dependency
- [x] 5.2 Create AudioPlayerManager
- [x] 5.3 Support local file playback
- [x] 5.4 Support remote streaming
- [x] 5.5 Handle audio focus (duck others)
- [ ] 5.6 Implement MediaSession for lock screen
- [x] 5.7 Create notification with controls
- [ ] 5.8 Test background audio
- [x] 5.9 Implement completion callbacks
- [x] 5.10 Integrate with location triggering

### Phase 6: Foreground Service
- [x] 6.1 Create TourPlaybackService
- [x] 6.2 Handle location + audio together
- [x] 6.3 Create persistent notification
- [x] 6.4 Handle service lifecycle
- [x] 6.5 Connect UI to service

### Phase 7: Download Manager
- [x] 7.1 Create TourDownloadManager
- [x] 7.2 Create directory structure
- [x] 7.3 Implement manifest fetching
- [x] 7.4 Implement file downloads with progress
- [x] 7.5 Track downloaded tours (DataStore)
- [x] 7.6 Skip existing files
- [x] 7.7 Implement delete functionality

### Phase 8: UI - Welcome & Onboarding
- [x] 8.1 Create WelcomeScreen
- [x] 8.2 Create OnboardingCarouselScreen (HorizontalPager)
- [x] 8.3 Style to match iOS

### Phase 9: UI - Discovery
- [x] 9.1 Create DiscoveryScreen (tour list)
- [x] 9.2 Create TourCard composable
- [x] 9.3 Implement search
- [x] 9.4 Implement filters (city, category)
- [ ] 9.5 Create DiscoveryMapScreen
- [ ] 9.6 Create VideoPlayer composable

### Phase 10: UI - Tour Detail
- [x] 10.1 Create TourDetailScreen
- [ ] 10.2 Create TourSetupSheet (bottom sheet)
- [x] 10.3 Language selection
- [x] 10.4 Download status display
- [x] 10.5 Start tour flow

### Phase 11: UI - Player (Core)
- [x] 11.1 Create PlayerScreen scaffold
- [ ] 11.2 Integrate MapView with route
- [ ] 11.3 Show current location
- [ ] 11.4 Highlight triggered points
- [x] 11.5 Create AudioControls
- [ ] 11.6 Create SubtitlesView
- [x] 11.7 Handle sequential triggering
- [x] 11.8 Create TourCompletionScreen
- [ ] 11.9 Integrate feedback form

### Phase 12: UI - Settings
- [x] 12.1 Create SettingsScreen
- [x] 12.2 Language selection
- [x] 12.3 Permission toggles
- [x] 12.4 Auto-download toggle
- [x] 12.5 Analytics consent
- [x] 12.6 About section

### Phase 13: Analytics
- [x] 13.1 Create AnalyticsService
- [x] 13.2 Generate anonymous ID
- [x] 13.3 Track events
- [x] 13.4 Batch submission
- [x] 13.5 Offline queue
- [x] 13.6 Respect consent

### Phase 14: Testing & Polish
- [ ] 14.1 Test sequential triggering (real environment)
- [ ] 14.2 Test background audio + location
- [ ] 14.3 Test offline playback
- [ ] 14.4 Test various Android versions (8+)
- [ ] 14.5 Test screen sizes
- [ ] 14.6 Battery optimization testing

### Phase 15: Release
- [ ] 15.1 Configure ProGuard
- [ ] 15.2 App signing
- [ ] 15.3 Play Store assets
- [ ] 15.4 Beta testing

---

## Key Technical Challenges

### 1. Background Location + Audio (Most Complex)

**iOS**: Background modes (location + audio) work together easily
**Android**: Requires foreground service with notification

```kotlin
// TourPlaybackService.kt
class TourPlaybackService : Service() {
    private lateinit var locationManager: LocationManager
    private lateinit var audioManager: AudioPlayerManager

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, createNotification())
        startLocationUpdates()
        return START_STICKY
    }
}
```

### 2. Sequential Audio Triggering

Same logic as iOS, different APIs:

```kotlin
// LocationManager.kt
fun checkSequentialPointProximity(location: Location) {
    val currentPoint = tourPoints[currentPointIndex]
    val distance = location.distanceTo(currentPoint.toLocation())

    if (distance <= currentPoint.triggerRadiusMeters) {
        if (!triggeredPoints.contains(currentPoint.id)) {
            triggeredPoints.add(currentPoint.id)
            _nearbyPoint.value = currentPoint
        }
    }

    // Check next point for queueing
    if (currentPointIndex + 1 < tourPoints.size) {
        val nextPoint = tourPoints[currentPointIndex + 1]
        val nextDistance = location.distanceTo(nextPoint.toLocation())
        if (nextDistance <= nextPoint.triggerRadiusMeters) {
            nextPointQueued = true
        }
    }
}
```

### 3. Lock Screen Controls

**iOS**: MPRemoteCommandCenter
**Android**: MediaSession + MediaStyle notification

```kotlin
// AudioPlayerManager.kt
private fun setupMediaSession() {
    mediaSession = MediaSession.Builder(context, player)
        .setCallback(MediaSessionCallback())
        .build()
}
```

---

## Dependencies (build.gradle.kts)

```kotlin
dependencies {
    // Compose BOM
    val composeBom = platform("androidx.compose:compose-bom:2024.01.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation("androidx.navigation:navigation-compose:2.7.6")

    // Lifecycle
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.7.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.lifecycle:lifecycle-service:2.7.0")

    // Hilt
    implementation("com.google.dagger:hilt-android:2.50")
    kapt("com.google.dagger:hilt-compiler:2.50")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Media3 (ExoPlayer)
    implementation("androidx.media3:media3-exoplayer:1.2.1")
    implementation("androidx.media3:media3-session:1.2.1")
    implementation("androidx.media3:media3-ui:1.2.1")

    // Location
    implementation("com.google.android.gms:play-services-location:21.1.0")

    // Maps
    implementation("com.google.maps.android:maps-compose:4.3.0")
    implementation("com.google.android.gms:play-services-maps:18.2.0")

    // DataStore
    implementation("androidx.datastore:datastore-preferences:1.0.0")

    // Coil (images)
    implementation("io.coil-kt:coil-compose:2.5.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
```

---

## Permissions (AndroidManifest.xml)

```xml
<!-- Network -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Location -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Foreground Service -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />

<!-- Notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Audio -->
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

---

## File Count Comparison

| Category | iOS Files | Android Files (Est.) |
|----------|-----------|---------------------|
| Models | 6 | 6 |
| Services | 7 | 8 (+1 Foreground Service) |
| Screens | 16 | 16 |
| Utilities | 7 | 4 (localization in resources) |
| Navigation | 0 | 1 |
| Theme | 0 | 3 |
| DI/App | 1 | 2 |
| **Total** | **37** | **~40** |

---

## Configuration

- **Min SDK**: 26 (Android 8.0) - 95%+ device coverage
- **Target SDK**: 34 (Android 14)
- **Language**: 100% Kotlin
- **UI**: 100% Jetpack Compose (no XML layouts)
- **Architecture**: MVVM + Hilt DI
- **Package**: com.bandite.sonicwalkscape

---

## Review Section

### Implementation Summary (Phase 1)

**Created 57 files** including:

#### Kotlin Files (31 files)
| Category | Files |
|----------|-------|
| Data Models | 6 (Tour, TourPoint, TourManifest, TourDetailResponse, User, AudioSettings) |
| API Layer | 2 (ApiService, ApiClient) |
| Services | 6 (LocationManager, AudioPlayerManager, TourDownloadManager, AnalyticsService, UserPreferencesManager, TourPlaybackService) |
| UI Screens | 11 (Welcome, Onboarding, Discovery, TourDetail, Player, Completion, Settings + ViewModels) |
| Theme | 3 (Color, Type, Theme) |
| Utils | 3 (Constants, DebugLogger, SubtitleParser) |
| App/DI | 3 (Application, MainActivity, AppModule) |
| Navigation | 1 (NavGraph) |

#### Resources (13 XML files)
- `strings.xml` (EN, IT, FR) - 3 files
- `colors.xml`, `themes.xml` - 2 files
- `AndroidManifest.xml` - 1 file
- Drawables (icons) - 4 files
- Launcher icons - 2 files

#### Build Configuration (4 files)
- `build.gradle.kts` (project + app)
- `settings.gradle.kts`
- `gradle.properties`
- `proguard-rules.pro`

### What's Fully Implemented
- Complete MVVM architecture with Hilt DI
- All data models ported from iOS
- API layer with Retrofit + error handling
- Location tracking with sequential point triggering
- Audio playback with ExoPlayer (local + streaming)
- Tour download manager with progress tracking
- Foreground service for background playback
- Analytics service with GDPR consent
- All main UI screens (Welcome, Discovery, Detail, Player, Settings)
- Full localization (EN, IT, FR)

### Remaining Tasks
- [ ] Integrate Google Maps with route polyline
- [ ] Add MediaSession for lock screen controls
- [ ] Create SubtitlesView component
- [ ] Create DiscoveryMapScreen
- [ ] Create VideoPlayer for tour trailers
- [ ] Test on physical devices
- [ ] Configure app signing for release

### Next Steps
1. Add Google Maps API key to `secrets.properties`
2. Build and test on Android device/emulator
3. Integrate Google Maps into PlayerScreen
4. Add MediaSession for lock screen controls
5. Test complete tour flow with GPS

