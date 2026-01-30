# Mobile API Integration Guide

Complete guide for integrating the BANDITE Sonic Walkscape mobile API into iOS/Android apps.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Tour Discovery](#tour-discovery)
4. [Voucher Redemption](#voucher-redemption)
5. [Tour Download](#tour-download)
6. [GPS Triggering](#gps-triggering)
7. [Analytics Tracking](#analytics-tracking)
8. [Error Handling](#error-handling)

---

## Getting Started

### Base URL
```
Local: http://localhost:3000
Production: https://api.bandite.org
```

### API Documentation
Interactive documentation: `http://localhost:3000/api/docs`

### Authentication
Most endpoints support optional JWT authentication. Protected tour content requires authentication.

---

## Authentication

### 1. User Registration

**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "preferredLanguage": "en",
  "mailingListOptIn": true
}
```

**Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "preferredLanguage": "en"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Mobile Implementation:**
```swift
// iOS (Swift)
func register(email: String, password: String) async throws -> AuthResponse {
    let url = URL(string: "\(baseURL)/auth/register")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")

    let body = RegisterRequest(
        email: email,
        password: password,
        name: name,
        preferredLanguage: "en"
    )
    request.httpBody = try JSONEncoder().encode(body)

    let (data, _) = try await URLSession.shared.data(for: request)
    let response = try JSONDecoder().decode(AuthResponse.self, from: data)

    // Store tokens securely
    try KeychainService.save(response.tokens.accessToken, for: "access_token")
    try KeychainService.save(response.tokens.refreshToken, for: "refresh_token")

    return response
}
```

### 2. User Login

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** Same as registration

### 3. Token Refresh

**Endpoint:** `POST /auth/refresh`

**When to refresh:**
- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Refresh proactively before expiration

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Mobile Implementation:**
```swift
func refreshToken() async throws {
    guard let refreshToken = try? KeychainService.load("refresh_token") else {
        throw AuthError.noRefreshToken
    }

    // Make refresh request
    let response = try await apiClient.post("/auth/refresh", body: ["refreshToken": refreshToken])

    // Update stored tokens
    try KeychainService.save(response.accessToken, for: "access_token")
    try KeychainService.save(response.refreshToken, for: "refresh_token")
}
```

---

## Tour Discovery

### 1. List All Tours

**Endpoint:** `GET /tours`

**Authentication:** Optional (returns `hasAccess` flag for authenticated users)

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "slug": "milan-historic-center",
    "isProtected": false,
    "hasAccess": true,
    "versions": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "language": "it",
        "title": "Centro Storico di Milano",
        "description": "Un viaggio sonoro...",
        "city": "Milan",
        "durationMinutes": 90,
        "distanceKm": 3.5,
        "coverImageUrl": "https://cdn.example.com/covers/milan.jpg"
      }
    ]
  }
]
```

**Mobile Implementation:**
```swift
func fetchTours() async throws -> [Tour] {
    var request = URLRequest(url: URL(string: "\(baseURL)/tours")!)

    // Add auth header if user is logged in
    if let token = try? KeychainService.load("access_token") {
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }

    let (data, _) = try await URLSession.shared.data(for: request)
    return try JSONDecoder().decode([Tour].self, from: data)
}
```

### 2. Get Tour Details

**Endpoint:** `GET /tours/:id?language=en`

**Query Parameters:**
- `language` (required): `it`, `fr`, or `en`

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "milan-historic-center",
  "isProtected": false,
  "hasAccess": true,
  "version": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "language": "en",
    "title": "Historic Center of Milan",
    "description": "A sonic journey through Milan's history...",
    "startingPoint": {
      "lat": 45.464211,
      "lng": 9.191383
    },
    "city": "Milan",
    "durationMinutes": 90,
    "distanceKm": 3.5,
    "coverImageUrl": "https://cdn.example.com/covers/milan.jpg",
    "videoUrl": null
  },
  "pointCount": 15
}
```

---

## Voucher Redemption

### Redeem Voucher Code

**Endpoint:** `POST /vouchers/validate`

**Authentication:** Required

**Request:**
```json
{
  "code": "PREMIUM2024"
}
```

**Response:**
```json
{
  "voucher": {
    "code": "PREMIUM2024",
    "tourId": "550e8400-e29b-41d4-a716-446655440000",
    "validUntil": "2024-12-31T23:59:59Z"
  },
  "tour": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "slug": "premium-milan-tour",
    "title": "Premium Milan Experience"
  },
  "accessGranted": true
}
```

**Error Responses:**
- `400`: Voucher expired or exhausted
- `404`: Invalid voucher code
- `409`: User already has access

**Mobile Implementation:**
```swift
func redeemVoucher(code: String) async throws -> VoucherResponse {
    let url = URL(string: "\(baseURL)/vouchers/validate")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

    let body = ["code": code]
    request.httpBody = try JSONEncoder().encode(body)

    let (data, response) = try await URLSession.shared.data(for: request)

    guard let httpResponse = response as? HTTPURLResponse else {
        throw NetworkError.invalidResponse
    }

    switch httpResponse.statusCode {
    case 200:
        return try JSONDecoder().decode(VoucherResponse.self, from: data)
    case 400:
        throw VoucherError.expired
    case 404:
        throw VoucherError.invalid
    case 409:
        throw VoucherError.alreadyRedeemed
    default:
        throw NetworkError.unknown
    }
}
```

---

## Tour Download

### 1. Get Manifest

**Endpoint:** `GET /tours/:id/manifest?language=en`

**Authentication:** Required for protected tours

**Response:**
```json
{
  "tourId": "550e8400-e29b-41d4-a716-446655440000",
  "language": "en",
  "version": 1,
  "audio": [
    {
      "pointId": "770e8400-e29b-41d4-a716-446655440010",
      "order": 1,
      "url": "https://cdn.example.com/audio/point-1.mp3?signature=...",
      "expiresAt": "2024-01-01T12:00:00Z",
      "sizeBytes": 5242880
    }
  ],
  "images": [
    {
      "pointId": "770e8400-e29b-41d4-a716-446655440010",
      "url": "https://cdn.example.com/images/point-1.jpg?signature=...",
      "expiresAt": "2024-01-01T12:00:00Z",
      "sizeBytes": 1048576
    }
  ],
  "subtitles": [],
  "offlineMap": {
    "tilesUrlTemplate": "https://tiles.example.org/{z}/{x}/{y}.pbf",
    "bounds": {
      "north": 45.564211,
      "south": 45.364211,
      "east": 9.291383,
      "west": 9.091383
    },
    "recommendedZoomLevels": [14, 15, 16]
  }
}
```

### 2. Download Implementation

**Mobile Implementation:**
```swift
class TourDownloadManager {
    func downloadTour(tourId: String, language: String) async throws {
        // 1. Get manifest
        let manifest = try await fetchManifest(tourId: tourId, language: language)

        // 2. Calculate total size
        let totalSize = calculateTotalSize(manifest)

        // 3. Download all resources with progress tracking
        var downloadedSize: Int64 = 0

        // Download audio files
        for audio in manifest.audio {
            try await downloadFile(
                url: audio.url,
                to: audioPath(tourId: tourId, pointOrder: audio.order)
            )
            downloadedSize += audio.sizeBytes
            updateProgress(Float(downloadedSize) / Float(totalSize))
        }

        // Download images
        for image in manifest.images {
            try await downloadFile(
                url: image.url,
                to: imagePath(tourId: tourId, pointId: image.pointId)
            )
            downloadedSize += image.sizeBytes
            updateProgress(Float(downloadedSize) / Float(totalSize))
        }

        // Download map tiles (optional)
        try await downloadMapTiles(manifest.offlineMap)

        // 4. Mark tour as downloaded
        try TourStorage.markAsDownloaded(tourId, language: language, manifest: manifest)
    }

    private func downloadFile(url: String, to path: URL) async throws {
        let (fileURL, _) = try await URLSession.shared.download(from: URL(string: url)!)
        try FileManager.default.moveItem(at: fileURL, to: path)
    }
}
```

---

## GPS Triggering

### 1. Get Tour Points

**Endpoint:** `GET /tours/:id/points?language=en`

**Response:**
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440010",
    "order": 1,
    "lat": 45.464211,
    "lng": 9.191383,
    "triggerRadiusMeters": 150,
    "localization": {
      "title": "Duomo di Milano",
      "contentText": "Welcome to the Duomo...",
      "audioUrl": "https://cdn.example.com/audio/point-1.mp3",
      "imageUrl": "https://cdn.example.com/images/duomo.jpg"
    }
  },
  {
    "id": "770e8400-e29b-41d4-a716-446655440011",
    "order": 2,
    "lat": 45.465123,
    "lng": 9.192456,
    "triggerRadiusMeters": 150,
    "localization": {
      "title": "Galleria Vittorio Emanuele II",
      "contentText": "The historic shopping gallery...",
      "audioUrl": "https://cdn.example.com/audio/point-2.mp3",
      "imageUrl": "https://cdn.example.com/images/galleria.jpg"
    }
  }
]
```

### 2. Sequential Triggering Logic

**Mobile Implementation:**
```swift
class TourNavigationManager: NSObject, CLLocationManagerDelegate {
    var points: [TourPoint] = []
    var currentPointIndex: Int = 0
    var isPlayingAudio: Bool = false

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let currentLocation = locations.last else { return }

        // Only check the next point in sequence
        guard currentPointIndex < points.count else {
            // Tour completed
            return
        }

        let nextPoint = points[currentPointIndex]
        let pointLocation = CLLocation(
            latitude: nextPoint.lat,
            longitude: nextPoint.lng
        )

        let distance = currentLocation.distance(from: pointLocation)

        // User entered trigger radius
        if distance <= nextPoint.triggerRadiusMeters {
            handlePointTriggered(nextPoint)
        }
    }

    func handlePointTriggered(_ point: TourPoint) {
        if isPlayingAudio {
            // Queue this point to play after current audio finishes
            audioQueue.append(point)
        } else {
            // Play immediately
            playAudio(for: point)
        }

        // Move to next point
        currentPointIndex += 1
    }

    func playAudio(for point: TourPoint) {
        isPlayingAudio = true

        // Load audio from local storage
        let audioPath = TourStorage.audioPath(tourId: currentTourId, pointOrder: point.order)

        audioPlayer = try! AVAudioPlayer(contentsOf: audioPath)
        audioPlayer.delegate = self
        audioPlayer.play()

        // Track analytics
        trackAnalyticsEvent("point_triggered", properties: [
            "tourId": currentTourId,
            "pointId": point.id,
            "order": point.order
        ])
    }

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        isPlayingAudio = false

        // Play queued audio if any
        if let nextPoint = audioQueue.first {
            audioQueue.removeFirst()
            playAudio(for: nextPoint)
        }
    }
}
```

---

## Analytics Tracking

### Track Events

**Endpoint:** `POST /analytics/events`

**Authentication:** Optional (anonymous tracking supported)

**Request:**
```json
{
  "events": [
    {
      "eventType": "app_open",
      "properties": {
        "device": "iPhone 14 Pro",
        "osVersion": "iOS 17.0"
      }
    },
    {
      "eventType": "tour_viewed",
      "properties": {
        "tourId": "550e8400-e29b-41d4-a716-446655440000",
        "language": "en"
      }
    },
    {
      "eventType": "tour_download_started",
      "properties": {
        "tourId": "550e8400-e29b-41d4-a716-446655440000",
        "language": "en"
      }
    },
    {
      "eventType": "point_triggered",
      "properties": {
        "tourId": "550e8400-e29b-41d4-a716-446655440000",
        "pointId": "770e8400-e29b-41d4-a716-446655440010",
        "order": 1,
        "language": "en",
        "offline": true
      }
    }
  ]
}
```

**Event Types:**
- `app_open`, `signup`, `login`
- `tour_viewed`, `tour_download_started`, `tour_download_completed`
- `tour_started`, `point_triggered`, `tour_completed`
- `voucher_redeemed`

**Mobile Implementation:**
```swift
class AnalyticsService {
    private var eventQueue: [AnalyticsEvent] = []

    func track(_ eventType: String, properties: [String: Any] = [:]) {
        let event = AnalyticsEvent(
            eventType: eventType,
            properties: properties
        )

        eventQueue.append(event)

        // Batch send every 10 events or every 60 seconds
        if eventQueue.count >= 10 {
            Task { await flushEvents() }
        }
    }

    func flushEvents() async {
        guard !eventQueue.isEmpty else { return }

        let events = eventQueue
        eventQueue.removeAll()

        do {
            try await sendEvents(events)
        } catch {
            // Re-queue on failure
            eventQueue.append(contentsOf: events)
        }
    }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Resource created successfully |
| 204 | No Content | Action succeeded (analytics) |
| 400 | Bad Request | Check request format/validation |
| 401 | Unauthorized | Refresh token or re-login |
| 403 | Forbidden | User lacks access (redeem voucher) |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 500 | Server Error | Retry with backoff |

### Common Error Responses

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 403,
  "message": "Access denied. Redeem a voucher to access this tour."
}
```

### Retry Strategy

```swift
func retryWithBackoff<T>(
    maxRetries: Int = 3,
    operation: @escaping () async throws -> T
) async throws -> T {
    var lastError: Error?

    for attempt in 0..<maxRetries {
        do {
            return try await operation()
        } catch {
            lastError = error

            // Don't retry on client errors (4xx)
            if let networkError = error as? NetworkError,
               case .clientError = networkError {
                throw error
            }

            // Exponential backoff
            let delay = pow(2.0, Double(attempt))
            try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
        }
    }

    throw lastError!
}
```

---

## Best Practices

1. **Token Management**
   - Store tokens in Keychain (iOS) / Keystore (Android)
   - Refresh proactively before expiration
   - Handle 401 errors gracefully

2. **Offline Support**
   - Download tours before starting
   - Cache tour lists and details
   - Queue analytics events when offline

3. **Battery Optimization**
   - Use significant location changes when possible
   - Reduce GPS accuracy when not actively touring
   - Batch analytics events

4. **User Experience**
   - Show download progress clearly
   - Handle interrupted downloads gracefully
   - Prefetch next point's content

5. **Error Handling**
   - Show user-friendly error messages
   - Implement retry logic with backoff
   - Log errors for debugging

---

## Support

- **API Documentation**: http://localhost:3000/api/docs
- **Postman Collection**: `backend/docs/postman/Mobile-API.postman_collection.json`
- **GitHub Issues**: https://github.com/bandite/backend/issues
