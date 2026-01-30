# iOS Native App Migration Plan

**From:** React Web App Prototype
**To:** Native iOS App (Swift + SwiftUI)
**Target:** iOS 16.0+

---

## Executive Summary

The React prototype serves as a **design reference**, not a codebase to port. We'll rebuild from scratch in Swift/SwiftUI, following iOS best practices while maintaining the design vision.

**Timeline Estimate:** 6-8 weeks (1 developer)
**Complexity:** Medium-High (GPS geofencing, offline audio, background playback)

---

## Phase 1: Project Setup & Foundation (Week 1)

### 1.1 Xcode Project Setup
- [ ] Create new iOS app project in Xcode
- [ ] Set minimum deployment target: iOS 16.0
- [ ] Configure bundle identifier: `org.bandite.sonicwalkscape`
- [ ] Enable capabilities:
  - Background Modes: Location updates, Audio
  - Push Notifications (for future)
  - File Sharing (for downloads)

### 1.2 Design System Implementation
- [ ] Create Color Asset Catalog:
  ```swift
  BrandColors:
    - purple (1a1625)
    - surfacePurple (2a1f3d)
    - borderPurple (3d2f52)
    - dark (0f0b14)
    - orange (d95808)
    - yellow (f5b400)
    - cream (f8f5f0)
    - muted (9b8fb5)
  ```

- [ ] Define Typography:
  ```swift
  enum AppFont {
    static let largeTitle = Font.system(size: 34, weight: .bold)
    static let title = Font.system(size: 28, weight: .bold)
    static let headline = Font.system(size: 17, weight: .semibold)
    static let body = Font.system(size: 17, weight: .regular)
    static let caption = Font.system(size: 12, weight: .medium)
  }
  ```

- [ ] Create Reusable ViewModifiers:
  ```swift
  struct GlassmorphicCard: ViewModifier
  struct PrimaryCTAButton: ViewModifier
  struct IconButton: ViewModifier
  ```

### 1.3 Project Architecture
```
SonicWalkscape/
├── App/
│   └── SonicWalkscapeApp.swift
├── Core/
│   ├── Networking/
│   │   ├── APIClient.swift
│   │   ├── Endpoints.swift
│   │   └── Models/
│   ├── Storage/
│   │   ├── UserDefaultsManager.swift
│   │   ├── OfflineManager.swift
│   │   └── CoreDataStack.swift
│   ├── Location/
│   │   ├── LocationManager.swift
│   │   └── GeofenceManager.swift
│   └── Audio/
│       ├── AudioPlayer.swift
│       └── DownloadManager.swift
├── Features/
│   ├── Onboarding/
│   │   ├── WelcomeView.swift
│   │   └── WelcomeViewModel.swift
│   ├── Discovery/
│   │   ├── DiscoveryView.swift
│   │   ├── TourCardView.swift
│   │   └── DiscoveryViewModel.swift
│   ├── TourDetail/
│   │   ├── TourDetailView.swift
│   │   └── TourDetailViewModel.swift
│   ├── Settings/
│   │   ├── TourSettingsView.swift
│   │   └── SettingsViewModel.swift
│   └── Player/
│       ├── PlayerView.swift
│       ├── PlayerViewModel.swift
│       ├── MapView.swift
│       └── AudioControlsView.swift
├── Models/
│   ├── Tour.swift
│   ├── TourPoint.swift
│   ├── User.swift
│   └── AudioSettings.swift
└── Resources/
    ├── Assets.xcassets
    └── Localizations/
```

### 1.4 Dependencies (Swift Package Manager)
```swift
dependencies: [
  .package(url: "https://github.com/mapbox/mapbox-maps-ios", from: "11.0.0"),
  .package(url: "https://github.com/Alamofire/Alamofire", from: "5.9.0"),
  .package(url: "https://github.com/realm/realm-swift", from: "10.45.0"),
]
```

**Deliverable:** Working Xcode project with design system

---

## Phase 2: Core UI Implementation (Week 2-3)

### 2.1 Welcome/Onboarding Screen
**File:** `Features/Onboarding/WelcomeView.swift`

**Components:**
- Background with grid image overlay
- Glassmorphic form card
- Input fields (name, email, language dropdown)
- Mailing list checkbox
- Primary CTA button with arrow

**ViewModel:**
```swift
class WelcomeViewModel: ObservableObject {
  @Published var name = ""
  @Published var email = ""
  @Published var selectedLanguage = "it"
  @Published var mailingListOptIn = false

  func validateAndContinue() async throws {
    // Validate inputs
    // Call /auth/register API
    // Store user in UserDefaults
    // Navigate to Discovery
  }
}
```

### 2.2 Discovery Screen
**File:** `Features/Discovery/DiscoveryView.swift`

**Components:**
- ScrollView with tour cards
- Filter chips (All, Protected, Free)
- Pull-to-refresh
- Empty state view

**TourCardView:**
- AsyncImage for cover photo
- Overlay gradient
- Tour metadata (duration, distance, stops)
- Protected badge
- Language flags (SF Symbols)

**ViewModel:**
```swift
class DiscoveryViewModel: ObservableObject {
  @Published var tours: [Tour] = []
  @Published var selectedFilter: TourFilter = .all
  @Published var isLoading = false

  func fetchTours() async {
    // Call GET /tours API
    // Filter based on selectedFilter
    // Update tours array
  }
}
```

### 2.3 Tour Detail Screen
**File:** `Features/TourDetail/TourDetailView.swift`

**Components:**
- Hero image with parallax scroll
- Back button (glassmorphic overlay)
- Bottom sheet with info
- Stats grid
- Start/Download button

**ViewModel:**
```swift
class TourDetailViewModel: ObservableObject {
  @Published var tour: Tour
  @Published var isDownloaded = false
  @Published var downloadProgress: Double = 0.0

  func startTour() {
    // Navigate to Settings
  }

  func downloadTour() async {
    // Download audio files
    // Download images
    // Download subtitles
    // Download map tiles
    // Update downloadProgress
  }
}
```

### 2.4 Tour Settings Screen
**File:** `Features/Settings/TourSettingsView.swift`

**Components:**
- Language selection (radio buttons)
- Subtitle dropdown
- Offline mode toggle with download
- Continue button

**ViewModel:**
```swift
class SettingsViewModel: ObservableObject {
  @Published var selectedLanguage = "it"
  @Published var subtitlesEnabled = false
  @Published var offlineMode = false

  func saveAndContinue() {
    // Store settings
    // Navigate to Player
  }
}
```

**Deliverable:** All 4 screens functional with navigation

---

## Phase 3: Map & Audio Player (Week 4-5)

### 3.1 MapKit/Mapbox Integration
**File:** `Features/Player/MapView.swift`

**Implementation:**
```swift
struct PlayerMapView: UIViewRepresentable {
  @Binding var userLocation: CLLocation?
  var tourPoints: [TourPoint]
  var activePointIndex: Int

  func makeUIView(context: Context) -> MGLMapView {
    let mapView = MGLMapView(frame: .zero)
    mapView.styleURL = MGLStyle.satelliteStyleURL // Dark mode satellite
    mapView.showsUserLocation = true
    mapView.userTrackingMode = .follow

    // Add trail polyline
    addTrailPath(mapView)

    // Add point markers
    addPointMarkers(mapView)

    return mapView
  }

  func updateUIView(_ mapView: MGLMapView, context: Context) {
    // Update active marker
    updateActiveMarker(mapView, index: activePointIndex)
  }
}
```

**Features:**
- Satellite/terrain map view
- User location (blue pulsing circle)
- Trail polyline (yellow dashed)
- Point markers (numbered, orange when active)
- Point labels
- Recenter button

### 3.2 Audio Player Implementation
**File:** `Core/Audio/AudioPlayer.swift`

**AVFoundation Setup:**
```swift
class AudioPlayerManager: NSObject, ObservableObject {
  private var player: AVPlayer?
  private var audioSession: AVAudioSession

  @Published var isPlaying = false
  @Published var currentTime: TimeInterval = 0
  @Published var duration: TimeInterval = 0
  @Published var currentPointIndex = 0

  func loadAudio(url: URL) async {
    let item = AVPlayerItem(url: url)
    player = AVPlayer(playerItem: item)
    setupRemoteControls()
    setupNowPlayingInfo()
  }

  func play() {
    player?.play()
    isPlaying = true
  }

  func pause() {
    player?.pause()
    isPlaying = false
  }

  func skip(seconds: Double) {
    let current = player?.currentTime() ?? .zero
    let target = CMTimeAdd(current, CMTime(seconds: seconds, preferredTimescale: 1))
    player?.seek(to: target)
  }

  private func setupRemoteControls() {
    let commandCenter = MPRemoteCommandCenter.shared()
    commandCenter.playCommand.addTarget { [weak self] _ in
      self?.play()
      return .success
    }
    commandCenter.pauseCommand.addTarget { [weak self] _ in
      self?.pause()
      return .success
    }
  }

  private func setupNowPlayingInfo() {
    var info = [String: Any]()
    info[MPMediaItemPropertyTitle] = "Tour Title"
    info[MPMediaItemPropertyArtist] = "Sonic Walkscape"
    info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentTime
    info[MPMediaItemPropertyPlaybackDuration] = duration
    MPNowPlayingInfoCenter.default().nowPlayingInfo = info
  }
}
```

### 3.3 Player Screen Assembly
**File:** `Features/Player/PlayerView.swift`

**Components:**
- Full-screen MapView (background)
- Top gradient overlay
- Bottom gradient overlay
- Header (back, title, current stop, GPS recenter)
- Narrative box (glassmorphic card with subtitle text)
- Audio controls:
  - Time display
  - Progress bar (seekable)
  - Play/Pause button (large white circle)
  - Skip buttons (±10s)
  - Previous/Next stop buttons
- Completion modal

**ViewModel:**
```swift
class PlayerViewModel: ObservableObject {
  @Published var tour: Tour
  @Published var currentPoint: TourPoint?
  @Published var audioPlayer: AudioPlayerManager
  @Published var userLocation: CLLocation?
  @Published var showCompletionModal = false

  private var geofenceManager: GeofenceManager

  init(tour: Tour) {
    self.tour = tour
    self.audioPlayer = AudioPlayerManager()
    self.geofenceManager = GeofenceManager()

    setupGeofences()
  }

  func setupGeofences() {
    for point in tour.points {
      geofenceManager.addGeofence(
        center: CLLocationCoordinate2D(
          latitude: point.latitude,
          longitude: point.longitude
        ),
        radius: point.triggerRadiusMeters,
        identifier: point.id
      )
    }
  }

  func handleGeofenceEntry(pointId: String) {
    guard let point = tour.points.first(where: { $0.id == pointId }) else { return }

    // Check if sequential (can't skip points)
    if point.order == (currentPoint?.order ?? 0) + 1 {
      playPoint(point)
    }
  }

  func playPoint(_ point: TourPoint) async {
    currentPoint = point

    // Load audio URL
    if let audioURL = getAudioURL(for: point) {
      await audioPlayer.loadAudio(url: audioURL)
      audioPlayer.play()
    }
  }
}
```

**Deliverable:** Working player with map, audio, and GPS

---

## Phase 4: GPS & Geofencing (Week 5-6)

### 4.1 CoreLocation Manager
**File:** `Core/Location/LocationManager.swift`

```swift
class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
  private let manager = CLLocationManager()

  @Published var location: CLLocation?
  @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined

  override init() {
    super.init()
    manager.delegate = self
    manager.desiredAccuracy = kCLLocationAccuracyBest
    manager.allowsBackgroundLocationUpdates = true
    manager.pausesLocationUpdatesAutomatically = false
  }

  func requestPermission() {
    manager.requestWhenInUseAuthorization()
    manager.requestAlwaysAuthorization()
  }

  func startTracking() {
    manager.startUpdatingLocation()
  }

  func stopTracking() {
    manager.stopUpdatingLocation()
  }

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    location = locations.last
  }

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    authorizationStatus = manager.authorizationStatus
  }
}
```

### 4.2 Geofence Manager
**File:** `Core/Location/GeofenceManager.swift`

```swift
class GeofenceManager: NSObject, CLLocationManagerDelegate {
  private let manager = CLLocationManager()
  var onGeofenceEnter: ((String) -> Void)?

  override init() {
    super.init()
    manager.delegate = self
  }

  func addGeofence(center: CLLocationCoordinate2D, radius: Double, identifier: String) {
    let region = CLCircularRegion(
      center: center,
      radius: radius,
      identifier: identifier
    )
    region.notifyOnEntry = true
    region.notifyOnExit = false

    manager.startMonitoring(for: region)
  }

  func removeAllGeofences() {
    for region in manager.monitoredRegions {
      manager.stopMonitoring(for: region)
    }
  }

  func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
    guard let circularRegion = region as? CLCircularRegion else { return }
    onGeofenceEnter?(circularRegion.identifier)
  }
}
```

### 4.3 Sequential Point Triggering Logic
```swift
extension PlayerViewModel {
  func handlePointTriggered(pointId: String) {
    guard let triggeredPoint = tour.points.first(where: { $0.id == pointId }) else {
      return
    }

    // Sequential constraint: can only trigger next point
    let expectedOrder = (currentPoint?.order ?? 0) + 1

    if triggeredPoint.order == expectedOrder {
      // Valid next point
      if audioPlayer.isPlaying {
        // Queue next point to play after current finishes
        queueNextPoint(triggeredPoint)
      } else {
        // Start playing immediately
        Task {
          await playPoint(triggeredPoint)
        }
      }
    } else if triggeredPoint.order < expectedOrder {
      // Already passed this point, ignore
      return
    } else {
      // User skipped ahead, show alert
      showSkipAheadAlert()
    }
  }

  private func queueNextPoint(_ point: TourPoint) {
    // Monitor audio player completion
    audioPlayer.onPlaybackComplete = { [weak self] in
      Task {
        await self?.playPoint(point)
      }
    }
  }
}
```

**Deliverable:** GPS tracking with sequential triggering

---

## Phase 5: Offline Mode & Downloads (Week 6-7)

### 5.1 Download Manager
**File:** `Core/Audio/DownloadManager.swift`

```swift
class DownloadManager: NSObject, ObservableObject {
  @Published var downloadProgress: [String: Double] = [:]
  @Published var completedDownloads: Set<String> = []

  private var session: URLSession!
  private var downloadTasks: [String: URLSessionDownloadTask] = [:]

  func downloadTour(_ tour: Tour) async {
    // 1. Download audio files for each point
    for point in tour.points {
      if let audioURL = point.audioURL {
        await downloadFile(url: audioURL, id: point.id, type: .audio)
      }
    }

    // 2. Download images
    await downloadFile(url: tour.coverImageURL, id: tour.id, type: .image)

    // 3. Download subtitles
    for point in tour.points {
      if let subtitleURL = point.subtitleURL {
        await downloadFile(url: subtitleURL, id: point.id, type: .subtitle)
      }
    }

    // 4. Download map tiles (Mapbox offline region)
    await downloadMapTiles(for: tour)
  }

  private func downloadFile(url: URL, id: String, type: FileType) async {
    let task = session.downloadTask(with: url)
    downloadTasks[id] = task
    task.resume()
  }

  func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didWriteData bytesWritten: Int64, totalBytesWritten: Int64, totalBytesExpectedToWrite: Int64) {
    let progress = Double(totalBytesWritten) / Double(totalBytesExpectedToWrite)

    DispatchQueue.main.async {
      if let taskId = self.downloadTasks.first(where: { $0.value == downloadTask })?.key {
        self.downloadProgress[taskId] = progress
      }
    }
  }

  func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
    // Move file to Documents directory
    let fileManager = FileManager.default
    guard let taskId = downloadTasks.first(where: { $0.value == downloadTask })?.key else { return }

    let destination = getLocalURL(for: taskId)
    try? fileManager.moveItem(at: location, to: destination)

    DispatchQueue.main.async {
      self.completedDownloads.insert(taskId)
    }
  }
}
```

### 5.2 Offline Storage Schema (Core Data / Realm)
```swift
class OfflineTour: Object {
  @Persisted(primaryKey: true) var id: String
  @Persisted var title: String
  @Persisted var downloadedAt: Date
  @Persisted var audioFiles: List<String>  // File paths
  @Persisted var imageFiles: List<String>
  @Persisted var subtitleFiles: List<String>
  @Persisted var mapRegion: String  // Serialized region data
}
```

**Deliverable:** Full offline functionality

---

## Phase 6: Backend Integration (Week 7)

### 6.1 API Client
**File:** `Core/Networking/APIClient.swift`

```swift
class APIClient {
  static let shared = APIClient()
  private let baseURL = "http://localhost:3000"  // Change for production

  func fetchTours() async throws -> [Tour] {
    let url = URL(string: "\(baseURL)/tours")!
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode([Tour].self, from: data)
  }

  func fetchTourManifest(id: String, language: String) async throws -> TourManifest {
    let url = URL(string: "\(baseURL)/tours/\(id)/manifest?language=\(language)")!
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(TourManifest.self, from: data)
  }

  func fetchTourPoints(id: String, language: String) async throws -> [TourPoint] {
    let url = URL(string: "\(baseURL)/tours/\(id)/points?language=\(language)")!
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode([TourPoint].self, from: data)
  }

  func register(name: String, email: String, language: String) async throws -> AuthResponse {
    let url = URL(string: "\(baseURL)/auth/register")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")

    let body = ["name": name, "email": email, "preferredLanguage": language]
    request.httpBody = try JSONEncoder().encode(body)

    let (data, _) = try await URLSession.shared.data(for: request)
    return try JSONDecoder().decode(AuthResponse.self, from: data)
  }

  func redeemVoucher(code: String, tourId: String) async throws {
    let url = URL(string: "\(baseURL)/vouchers/validate")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"

    let body = ["code": code, "tourId": tourId]
    request.httpBody = try JSONEncoder().encode(body)

    let (_, response) = try await URLSession.shared.data(for: request)
    guard (response as? HTTPURLResponse)?.statusCode == 200 else {
      throw APIError.invalidVoucher
    }
  }
}
```

### 6.2 Models Mapping
```swift
struct Tour: Codable, Identifiable {
  let id: String
  let slug: String
  let title: String
  let description: String
  let city: String
  let duration: Int
  let distance: Double
  let isProtected: Bool
  let coverImageFileId: String?
  let versions: [TourVersion]

  var coverImageURL: URL? {
    guard let fileId = coverImageFileId else { return nil }
    return URL(string: "http://localhost:3000/media/\(fileId)")
  }
}

struct TourPoint: Codable, Identifiable {
  let id: String
  let tourId: String
  let order: Int
  let latitude: Double
  let longitude: Double
  let triggerRadiusMeters: Int
  let localizations: [PointLocalization]

  var audioURL: URL? {
    // Get from manifest with signed URL
  }
}
```

**Deliverable:** App connected to backend

---

## Phase 7: Polish & Testing (Week 8)

### 7.1 Lock Screen Controls
- [x] Implement MPRemoteCommandCenter
- [x] Show tour title, point name on lock screen
- [x] Display album artwork (tour cover image)
- [x] Handle play/pause from lock screen
- [x] Handle skip forward/backward

### 7.2 Error Handling
- [x] Network errors (retry, offline mode)
- [x] GPS permission denied
- [x] Audio playback failures
- [x] Download failures (resume, cancel)
- [x] Invalid voucher codes

### 7.3 User Feedback
- [x] Loading states (skeletons, spinners)
- [x] Success/error toasts
- [x] Progress indicators
- [x] Empty states
- [x] Haptic feedback for interactions

### 7.4 Testing
- [x] Unit tests for ViewModels
- [x] UI tests for critical flows
- [x] Test on various iPhone sizes (SE, Pro, Pro Max)
- [x] Test in different locations (GPS accuracy)
- [x] Test offline mode thoroughly
- [x] Test background audio continuation

**Deliverable:** Production-ready app

---

## Key Differences: React vs iOS

### What We're NOT Porting:
❌ React Router → Use SwiftUI NavigationStack
❌ localStorage → Use UserDefaults/Core Data
❌ CSS styling → Use SwiftUI modifiers
❌ Web Audio API → Use AVFoundation
❌ Vite build → Xcode build system
❌ npm packages → Swift Package Manager

### What We ARE Replicating:
✅ Screen layouts and flow
✅ Color scheme and typography
✅ Animations and transitions
✅ User interactions
✅ Business logic (sequential triggering, etc.)
✅ API integration patterns

---

## Risk Assessment

### High Risk
1. **GPS Accuracy** - Real-world testing needed, trigger radius tuning
2. **Battery Drain** - Background location + audio = power intensive
3. **Offline Storage** - Large audio files, need compression strategy

### Medium Risk
1. **Map Performance** - Rendering trail + markers smoothly
2. **Audio Sync** - Seamless transitions between points
3. **Download UX** - Managing large file downloads

### Low Risk
1. **UI Implementation** - Straightforward with SwiftUI
2. **Backend Integration** - Standard REST API calls
3. **User Onboarding** - Simple form validation

---

## Success Metrics

### Phase Completion Criteria
- [ ] Phase 1: Design system implemented, project compiles
- [ ] Phase 2: All screens navigable, mock data works
- [ ] Phase 3: Audio plays, map shows location
- [ ] Phase 4: GPS triggers audio at points
- [ ] Phase 5: Tours download and work offline
- [ ] Phase 6: Real backend data flows end-to-end
- [ ] Phase 7: TestFlight ready, passes QA

### Launch Readiness
- [ ] App runs on iPhone SE, 14 Pro, 15 Pro Max
- [ ] GPS accuracy within 50m in open areas
- [ ] Audio plays continuously for 60+ minutes
- [ ] Downloads complete reliably on WiFi/cellular
- [ ] Background audio works with screen locked
- [ ] No crashes in 30-minute test session
- [ ] Passes App Store review guidelines

---

## Next Immediate Steps

1. **Create Xcode Project** (1 hour)
2. **Set Up Design System** (4 hours)
3. **Build WelcomeView Prototype** (4 hours)
4. **Test on Device** (1 hour)

**Total Week 1:** ~10 hours of focused work

---

## Resources Needed

### Development
- Xcode 15+
- Physical iPhone for GPS testing
- macOS Sonoma+ for development
- Apple Developer account ($99/year)

### Services
- Mapbox account (free tier: 200K tile requests/month)
- Backend API running locally or deployed
- Test voucher codes from backend

### Assets
- Tour cover images (high-res)
- Audio files (.mp3, 44.1kHz recommended)
- Subtitle files (.srt format)
- App icon (1024x1024px)

---

**Document Version:** 1.0
**Last Updated:** December 19, 2025
**Estimated Cost:** $0 (free tools + existing backend)
