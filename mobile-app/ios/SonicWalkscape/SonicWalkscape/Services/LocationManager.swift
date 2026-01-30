import Foundation
import CoreLocation
import Combine

class LocationManager: NSObject, ObservableObject {
    private let locationManager = CLLocationManager()

    // MARK: - Published Properties
    @Published var location: CLLocation?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var nearbyPoint: TourPoint?

    // Sequential triggering state
    @Published var currentPointIndex: Int = 0
    @Published var triggeredPoints: Set<String> = []
    @Published var isPointActive: Bool = false
    @Published var distanceToNextPoint: Double = 0
    @Published var nextPointQueued: Bool = false

    // Tour data
    private var tourPoints: [TourPoint] = []

    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 10

        // Enable background location updates for GPS-triggered audio
        // Note: Requires Background Modes capability in Xcode project settings
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
    }

    // MARK: - Public Methods

    func requestPermission() {
        locationManager.requestWhenInUseAuthorization()
    }

    func startTracking() {
        locationManager.startUpdatingLocation()
    }

    func stopTracking() {
        locationManager.stopUpdatingLocation()
    }

    func setTourPoints(_ points: [TourPoint]) {
        self.tourPoints = points.sorted(by: { $0.order < $1.order })
        self.currentPointIndex = 0
        self.triggeredPoints = []
        self.isPointActive = false
        self.nextPointQueued = false
    }

    func resetTourProgress() {
        currentPointIndex = 0
        triggeredPoints = []
        isPointActive = false
        nearbyPoint = nil
        nextPointQueued = false
    }

    // MARK: - Private Methods

    private func checkSequentialPointProximity() {
        guard let currentLocation = location else { return }
        guard !tourPoints.isEmpty else { return }
        guard currentPointIndex < tourPoints.count else {
            // Tour completed
            nearbyPoint = nil
            isPointActive = false
            return
        }

        let nextPoint = tourPoints[currentPointIndex]

        // Calculate distance to next point only
        let pointLocation = CLLocation(
            latitude: nextPoint.location.lat,
            longitude: nextPoint.location.lng
        )
        let distance = currentLocation.distance(from: pointLocation)
        distanceToNextPoint = distance

        // Check if user is within trigger radius
        if distance <= nextPoint.triggerRadiusMeters {
            // Point triggered!
            if !isPointActive {
                isPointActive = true
                nearbyPoint = nextPoint
                triggeredPoints.insert(nextPoint.id)

                DebugLogger.gps("Point \(nextPoint.order) TRIGGERED at \(String(format: "%.0f", distance))m: \(nextPoint.title)")
            }
        } else {
            // User moved out of radius
            if isPointActive {
                isPointActive = false
                nearbyPoint = nil
                DebugLogger.gps("Point \(nextPoint.order) deactivated - moved out of \(String(format: "%.0f", nextPoint.triggerRadiusMeters))m radius")
            }
        }

        // Also check if user entered the NEXT point's radius (queue it for when current audio finishes)
        let nextNextIndex = currentPointIndex + 1
        if nextNextIndex < tourPoints.count {
            let upcomingPoint = tourPoints[nextNextIndex]
            let upcomingLocation = CLLocation(
                latitude: upcomingPoint.location.lat,
                longitude: upcomingPoint.location.lng
            )
            let upcomingDistance = currentLocation.distance(from: upcomingLocation)

            if upcomingDistance <= upcomingPoint.triggerRadiusMeters && !nextPointQueued {
                nextPointQueued = true
                DebugLogger.gps("Point \(upcomingPoint.order) QUEUED at \(String(format: "%.0f", upcomingDistance))m (will play after current audio)")
            }
        }
    }

    /// Call this when audio for current point finishes playing
    func advanceToNextPoint() {
        guard currentPointIndex < tourPoints.count - 1 else {
            DebugLogger.success("Tour completed!")
            return
        }

        // Check if next point was queued (user passed through while audio was playing)
        let wasQueued = nextPointQueued

        currentPointIndex += 1
        isPointActive = false
        nextPointQueued = false

        let nextPoint = tourPoints[currentPointIndex]
        DebugLogger.gps("Advanced to point \(currentPointIndex + 1): \(nextPoint.title)")

        // If the point was queued, trigger it immediately
        if wasQueued {
            isPointActive = true
            nearbyPoint = nextPoint
            triggeredPoints.insert(nextPoint.id)
            DebugLogger.gps("Point \(nextPoint.order) AUTO-TRIGGERED from queue: \(nextPoint.title)")
        } else {
            nearbyPoint = nil
        }
    }
}

extension LocationManager: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }

        // Log detailed location updates
        let accuracy = location.horizontalAccuracy
        let speed = location.speed >= 0 ? location.speed : 0

        // Record performance metrics
        PerformanceMonitor.shared.recordGPSAccuracy(accuracy)

        if accuracy <= 20 {
            DebugLogger.gps("Location updated - accuracy: \(String(format: "%.1f", accuracy))m, speed: \(String(format: "%.1f", speed))m/s")
        } else {
            DebugLogger.warning("Poor GPS accuracy: \(String(format: "%.1f", accuracy))m")
        }

        self.location = location
        checkSequentialPointProximity()
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus

        if authorizationStatus == .authorizedWhenInUse || authorizationStatus == .authorizedAlways {
            DebugLogger.success("Location permission granted: \(authorizationStatus.rawValue)")
        } else if authorizationStatus == .denied {
            DebugLogger.error("Location permission denied")
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        DebugLogger.error("Location error: \(error.localizedDescription)")
    }
}
