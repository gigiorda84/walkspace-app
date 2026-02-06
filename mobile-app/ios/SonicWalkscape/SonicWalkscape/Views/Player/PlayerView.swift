//
//  PlayerView.swift
//  SonicWalkscape
//
//  Main tour player view with map, subtitles, and audio controls
//

import SwiftUI
import CoreLocation
import AVFoundation

struct PlayerView: View {
    let tour: Tour
    let tourPoints: [TourPoint]
    let setupConfig: TourSetupConfig

    @Environment(\.dismiss) private var dismiss
    @Environment(\.dismissToRoot) private var dismissToRoot
    @StateObject private var locationManager = LocationManager()
    @StateObject private var audioManager = AudioPlayerManager()
    @StateObject private var downloadManager = TourDownloadManager.shared

    // Player state
    @State private var currentPointIndex: Int = 0
    @State private var userLocation: CLLocationCoordinate2D?

    // Subtitle state
    @State private var subtitles: [Subtitle] = []
    @State private var currentSubtitle: String? = nil
    @State private var showSubtitles: Bool = true

    // Manifest state
    @State private var manifest: TourManifest?
    @State private var audioURLsByPointId: [String: String] = [:]
    @State private var subtitleURLsByPointId: [String: String] = [:]
    @State private var isLoadingManifest = false
    @State private var manifestError: String?

    // Timer for updating playback progress
    @State private var progressTimer: Timer?

    // Memory monitoring timer
    @State private var memoryTimer: Timer?

    // Tour completion state
    @State private var showCompletionScreen: Bool = false
    @State private var tourStartTime: Date?

    // Analytics tracking
    @State private var primaryTriggerType: TriggerType = .manual
    @State private var gpsTriggeredCount: Int = 0
    @State private var manualTriggeredCount: Int = 0

    // Debug mode
    @State private var showDebugOverlay: Bool = false

    var currentPoint: TourPoint {
        tourPoints[safe: currentPointIndex] ?? tourPoints[0]
    }

    var body: some View {
        ZStack {
            // Background
            Color.brandDark
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Map with subtitles overlay
                ZStack {
                    MapView(
                        tour: tour,
                        tourPoints: tourPoints,
                        currentPointIndex: $currentPointIndex,
                        userLocation: $userLocation,
                        onPointTapped: { _ in }
                    )

                    // Subtitle overlay
                    SubtitlesView(
                        currentSubtitle: currentSubtitle,
                        isVisible: showSubtitles
                    )
                }

                // Audio controls
                AudioControlsView(
                    currentPoint: currentPoint,
                    totalPoints: tourPoints.count,
                    isPlaying: audioManager.isPlaying,
                    currentTime: audioManager.currentTime,
                    duration: audioManager.duration,
                    onPlayPause: togglePlayPause,
                    onSkipBackward: skipBackward,
                    onSkipForward: skipForward,
                    onSeek: seek,
                    onPreviousPoint: moveToPreviousPoint,
                    onNextPoint: moveToNextPoint
                )
            }

            // Close button
            VStack {
                HStack {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.brandCream)
                            .frame(width: 36, height: 36)
                            .background(Color.black.opacity(0.5))
                            .clipShape(Circle())
                            .shadow(color: .black.opacity(0.3), radius: 8, x: 0, y: 4)
                    }
                    .padding()

                    Spacer()

                    // Debug toggle
                    Button(action: { showDebugOverlay.toggle() }) {
                        Image(systemName: "ant.fill")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(showDebugOverlay ? .green : .brandCream)
                            .frame(width: 36, height: 36)
                            .background(Color.black.opacity(0.5))
                            .clipShape(Circle())
                            .shadow(color: .black.opacity(0.3), radius: 8, x: 0, y: 4)
                    }
                    .padding(.trailing, 8)

                    // Subtitle toggle
                    Button(action: { showSubtitles.toggle() }) {
                        Image(systemName: showSubtitles ? "captions.bubble.fill" : "captions.bubble")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.brandCream)
                            .frame(width: 36, height: 36)
                            .background(Color.black.opacity(0.5))
                            .clipShape(Circle())
                            .shadow(color: .black.opacity(0.3), radius: 8, x: 0, y: 4)
                    }
                    .padding()
                }
                Spacer()
            }

            // Debug Overlay
            if showDebugOverlay {
                VStack {
                    Spacer()
                    DebugOverlayView(
                        location: locationManager.location,
                        currentPointIndex: currentPointIndex,
                        totalPoints: tourPoints.count,
                        distanceToNextPoint: locationManager.distanceToNextPoint,
                        isPointActive: locationManager.isPointActive,
                        triggerRadius: currentPoint.triggerRadiusMeters
                    )
                }
            }

            // Buffering overlay for streaming mode
            if audioManager.isBuffering && !setupConfig.isDownloaded {
                BufferingOverlayView()
            }
        }
        .onAppear {
            setupPlayer()
        }
        .onDisappear {
            cleanup()
        }
        .onReceive(locationManager.$nearbyPoint) { point in
            handlePointTriggered(point)
        }
        .onReceive(locationManager.$currentPointIndex) { index in
            // Update current point index when it changes
            if index != currentPointIndex && index < tourPoints.count {
                currentPointIndex = index
            }
        }
        .onReceive(audioManager.$didFinishPlaying) { finished in
            if finished {
                // Check if this was the last point
                if currentPointIndex >= tourPoints.count - 1 {
                    // Tour completed!
                    showCompletionScreen = true
                    trackTourCompleted()
                    DebugLogger.success("Tour completed! Showing completion screen. Point \(currentPointIndex + 1) of \(tourPoints.count)")
                } else {
                    // Audio finished - advance to next point
                    locationManager.advanceToNextPoint()
                    DebugLogger.audio("Audio finished for point \(currentPointIndex + 1). Ready for next point.")
                }

                // Reset the flag
                audioManager.didFinishPlaying = false
            }
        }
        .overlay {
            if showCompletionScreen {
                TourCompletionView(
                    tour: tour,
                    pointsVisited: tourPoints.count,
                    durationMinutes: tourDurationMinutes,
                    distanceKm: tour.distanceKm,
                    onReturnToHome: {
                        dismissToRoot()
                    },
                    onClose: {
                        dismiss()
                    }
                )
            }
        }
    }

    private var tourDurationMinutes: Int {
        guard let startTime = tourStartTime else { return 0 }
        let duration = Date().timeIntervalSince(startTime)
        return Int(duration / 60)
    }

    // MARK: - Player Setup

    private func setupPlayer() {
        // Start performance monitoring session
        PerformanceMonitor.shared.startSession()

        // Set tour points in location manager for GPS tracking
        locationManager.setTourPoints(tourPoints)

        // Request location permission first
        locationManager.requestPermission()

        // Fetch manifest BEFORE starting GPS tracking
        Task {
            await fetchManifest()

            // Only start GPS tracking after manifest is loaded
            await MainActor.run {
                locationManager.startTracking()
                tourStartTime = Date()

                // Track tour started (initial trigger type is manual, updated when GPS triggers)
                AnalyticsService.shared.trackTourStarted(
                    tourId: tour.id,
                    language: setupConfig.language,
                    triggerType: .manual
                )

                DebugLogger.gps("GPS tracking started")
            }
        }

        // Load subtitles for first point
        loadSubtitlesForCurrentPoint()

        // Start progress timer
        startProgressTimer()

        // Start memory monitoring
        startMemoryMonitoring()

        DebugLogger.log("Player setup complete. Fetching audio manifest...")
    }

    // MARK: - Manifest Fetching

    private func fetchManifest() async {
        isLoadingManifest = true
        manifestError = nil

        do {
            let manifest = try await APIService.shared.fetchTourManifest(
                tourId: tour.id,
                language: setupConfig.language
            )

            // Map audio URLs by point ID for quick lookup
            var audioMap: [String: String] = [:]
            for audio in manifest.audio {
                // Use absolute URL if provided, otherwise convert relative URL to full URL
                let fullURL = audio.fileUrl.starts(with: "http://") || audio.fileUrl.starts(with: "https://")
                    ? audio.fileUrl
                    : "\(Constants.API.baseURL)\(audio.fileUrl)"
                audioMap[audio.pointId] = fullURL
            }

            // Map subtitle URLs by point ID for quick lookup
            var subtitleMap: [String: String] = [:]
            for subtitle in manifest.subtitles {
                // Use absolute URL if provided, otherwise convert relative URL to full URL
                let fullURL = subtitle.fileUrl.starts(with: "http://") || subtitle.fileUrl.starts(with: "https://")
                    ? subtitle.fileUrl
                    : "\(Constants.API.baseURL)\(subtitle.fileUrl)"
                subtitleMap[subtitle.pointId] = fullURL
            }

            await MainActor.run {
                self.manifest = manifest
                self.audioURLsByPointId = audioMap
                self.subtitleURLsByPointId = subtitleMap
                self.isLoadingManifest = false
                DebugLogger.network("Manifest loaded: \(manifest.audio.count) audio files, \(manifest.subtitles.count) subtitle files")

                // Only auto-play first point if user is within GPS radius
                if let firstPoint = tourPoints.first {
                    audioManager.updateNowPlayingInfo(title: firstPoint.title, artist: tour.title["en"] ?? "Sonic Walkscape")

                    // Check if user is within trigger radius of first point
                    if let userLocation = locationManager.location {
                        let pointLocation = CLLocation(
                            latitude: firstPoint.location.lat,
                            longitude: firstPoint.location.lng
                        )
                        let distance = userLocation.distance(from: pointLocation)

                        if distance <= firstPoint.triggerRadiusMeters {
                            DebugLogger.audio("User within radius (\(String(format: "%.0f", distance))m) - auto-playing first point: \(firstPoint.title)")
                            playAudio(for: firstPoint.id)
                        } else {
                            DebugLogger.audio("User outside radius (\(String(format: "%.0f", distance))m) - waiting for play button: \(firstPoint.title)")
                        }
                    } else {
                        DebugLogger.audio("No user location yet - waiting for play button: \(firstPoint.title)")
                    }
                }

                // Initialize subtitles visibility from config
                showSubtitles = setupConfig.subtitlesEnabled
            }
        } catch {
            await MainActor.run {
                self.manifestError = error.localizedDescription
                self.isLoadingManifest = false
                DebugLogger.error("Failed to load manifest: \(error)")
            }
        }
    }

    // MARK: - GPS-Triggered Audio

    private func handlePointTriggered(_ point: TourPoint?) {
        guard let triggeredPoint = point else { return }

        DebugLogger.gps("GPS Trigger: Point \(triggeredPoint.order) - \(triggeredPoint.title)")

        // Update current point index
        if let index = tourPoints.firstIndex(where: { $0.id == triggeredPoint.id }) {
            currentPointIndex = index
        }

        // Track GPS point trigger
        gpsTriggeredCount += 1
        primaryTriggerType = .gps
        AnalyticsService.shared.trackPointTriggered(
            tourId: tour.id,
            pointId: triggeredPoint.id,
            triggerType: .gps
        )

        // Load subtitles for this point
        loadSubtitlesForCurrentPoint()

        // Update lock screen controls with point info
        audioManager.updateNowPlayingInfo(title: triggeredPoint.title, artist: tour.title["en"] ?? "Sonic Walkscape")

        // Auto-play audio
        playAudio(for: triggeredPoint.id)
    }

    private func cleanup() {
        // Track abandoned tour if not completed
        trackTourAbandoned()

        // End performance monitoring and print summary
        PerformanceMonitor.shared.endSession()

        locationManager.stopTracking()
        audioManager.stop()
        audioManager.clearNowPlayingInfo()
        progressTimer?.invalidate()
        progressTimer = nil
        memoryTimer?.invalidate()
        memoryTimer = nil
    }

    // MARK: - Audio Playback

    /// Play audio for a point, using local file if downloaded, otherwise streaming
    private func playAudio(for pointId: String) {
        guard let audioURL = audioURLsByPointId[pointId] else {
            DebugLogger.warning("No audio URL for point \(pointId)")
            return
        }

        // Check if we have a local file (tour was downloaded)
        let localURL = downloadManager.localAudioURL(
            tourId: tour.id,
            language: setupConfig.language,
            pointId: pointId
        )

        audioManager.play(audioURL: audioURL, localURL: localURL)
    }

    private func togglePlayPause() {
        // Check if audio player is ready
        if audioManager.duration == 0 {
            // Player not initialized - try to load audio for current point
            DebugLogger.warning("Player not ready. Loading audio for current point...")
            let point = tourPoints[currentPointIndex]
            playAudio(for: point.id)
            audioManager.updateNowPlayingInfo(title: point.title, artist: tour.title["en"] ?? "Sonic Walkscape")
        } else {
            // Player ready - toggle play/pause
            audioManager.togglePlayPause()
        }
    }

    private func skipBackward() {
        let newTime = max(0, audioManager.currentTime - 10)
        audioManager.seek(to: newTime)
        updateSubtitle()
    }

    private func skipForward() {
        let newTime = min(audioManager.duration, audioManager.currentTime + 10)

        // Check if we're on the last point and skipping would reach the end
        if currentPointIndex >= tourPoints.count - 1 && newTime >= audioManager.duration - 0.5 {
            // Show completion screen
            showCompletionScreen = true
            audioManager.stop()
            DebugLogger.audio("Skipped to end on last point - showing completion screen")
        } else {
            audioManager.seek(to: newTime)
            updateSubtitle()
        }
    }

    private func seek(_ time: Double) {
        // Check if we're on the last point and seeking to the end
        if currentPointIndex >= tourPoints.count - 1 && time >= audioManager.duration - 0.5 {
            // Show completion screen
            showCompletionScreen = true
            audioManager.stop()
            DebugLogger.audio("Seeked to end on last point - showing completion screen")
        } else {
            audioManager.seek(to: time)
            updateSubtitle()
        }
    }


    private func loadSubtitlesForCurrentPoint() {
        // Check if we have a subtitle URL for this point
        guard let subtitleURL = subtitleURLsByPointId[currentPoint.id] else {
            DebugLogger.warning("No subtitle URL found for point: \(currentPoint.title)")
            subtitles = []
            return
        }

        // Fetch subtitle file from URL
        Task {
            do {
                let url = URL(string: subtitleURL)!
                let (data, _) = try await URLSession.shared.data(from: url)

                guard let srtContent = String(data: data, encoding: .utf8) else {
                    DebugLogger.error("Failed to decode subtitle file as UTF-8")
                    return
                }

                let parsedSubtitles = SubtitleParser.parse(srtContent)

                await MainActor.run {
                    self.subtitles = parsedSubtitles
                    DebugLogger.download("Loaded \(parsedSubtitles.count) subtitles for: \(currentPoint.title)")
                }
            } catch {
                DebugLogger.error("Failed to load subtitles: \(error.localizedDescription)")
                await MainActor.run {
                    self.subtitles = []
                }
            }
        }
    }

    // MARK: - Progress Tracking

    private func startProgressTimer() {
        progressTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
            self.updateSubtitle()
        }
        // Add timer to common run loop mode to ensure it runs during UI interactions
        if let timer = progressTimer {
            RunLoop.current.add(timer, forMode: .common)
        }
    }

    private func updateSubtitle() {
        let time = audioManager.currentTime
        if let subtitle = SubtitleParser.subtitle(at: time, in: subtitles) {
            if currentSubtitle != subtitle.text {
                currentSubtitle = subtitle.text
                // Note: Not logging subtitle updates as they happen frequently
            }
        } else {
            if currentSubtitle != nil {
                currentSubtitle = nil
            }
        }
    }

    // MARK: - Point Navigation

    private func moveToNextPoint() {
        // If we're on the last point, show completion screen
        if currentPointIndex >= tourPoints.count - 1 {
            showCompletionScreen = true
            audioManager.stop()
            trackTourCompleted()
            DebugLogger.audio("Next point pressed on last point - showing completion screen")
            return
        }

        currentPointIndex += 1
        audioManager.stop()

        // Track manual point trigger
        manualTriggeredCount += 1
        let point = tourPoints[currentPointIndex]
        AnalyticsService.shared.trackPointTriggered(
            tourId: tour.id,
            pointId: point.id,
            triggerType: .manual
        )

        loadSubtitlesForCurrentPoint()

        // Load audio for new point
        DebugLogger.audio("Manual skip to point \(currentPointIndex + 1): \(point.title)")
        playAudio(for: point.id)
    }

    private func moveToPreviousPoint() {
        guard currentPointIndex > 0 else { return }

        currentPointIndex -= 1
        audioManager.stop()

        // Track manual navigation (going back)
        manualTriggeredCount += 1
        let point = tourPoints[currentPointIndex]
        AnalyticsService.shared.trackPointTriggered(
            tourId: tour.id,
            pointId: point.id,
            triggerType: .manual
        )

        loadSubtitlesForCurrentPoint()

        // Load audio for new point
        DebugLogger.audio("Manual back to point \(currentPointIndex + 1): \(point.title)")
        playAudio(for: point.id)
    }

    // MARK: - Analytics Helpers

    private func trackTourCompleted() {
        guard let startTime = tourStartTime else { return }
        let duration = Int(Date().timeIntervalSince(startTime) / 60)
        AnalyticsService.shared.trackTourCompleted(
            tourId: tour.id,
            durationMinutes: duration,
            pointsVisited: tourPoints.count,
            triggerType: primaryTriggerType
        )
        AnalyticsService.shared.flush()
    }

    private func trackTourAbandoned() {
        guard let startTime = tourStartTime, !showCompletionScreen else { return }
        let duration = Int(Date().timeIntervalSince(startTime) / 60)
        AnalyticsService.shared.trackTourAbandoned(
            tourId: tour.id,
            durationMinutes: duration,
            lastPointIndex: currentPointIndex
        )
        AnalyticsService.shared.flush()
    }

    // MARK: - Memory Monitoring

    private func startMemoryMonitoring() {
        // Update memory usage every 5 seconds
        memoryTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { _ in
            PerformanceMonitor.shared.updateMemoryUsage()
        }

        if let timer = memoryTimer {
            RunLoop.current.add(timer, forMode: .common)
        }
    }
}

// MARK: - Array Extension

extension Array {
    subscript(safe index: Int) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }
}

// MARK: - Buffering Overlay

/// Overlay shown while audio is buffering during streaming
struct BufferingOverlayView: View {
    var body: some View {
        ZStack {
            // Semi-transparent background
            Color.black.opacity(0.6)
                .ignoresSafeArea()

            VStack(spacing: 16) {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .brandOrange))
                    .scaleEffect(1.5)

                Text("Buffering...")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.white)
            }
        }
    }
}

// MARK: - Preview

#Preview {
    PlayerView(
        tour: Tour(
            id: "1",
            slug: "demo-tour",
            title: ["en": "Demo Tour"],
            descriptionPreview: ["en": "A demo walking tour"],
            completionMessage: nil,
            city: "Milan",
            durationMinutes: 45,
            distanceKm: 2.5,
            languages: ["en"],
            isProtected: false,
            coverImageUrl: nil,
            routePolyline: nil
        ),
        tourPoints: [
            TourPoint(
                id: "1",
                order: 1,
                title: "Historic Square",
                description: "Welcome to the historic square, built in the 15th century.",
                location: TourPoint.Location(lat: 45.464203, lng: 9.189982),
                triggerRadiusMeters: 150
            ),
            TourPoint(
                id: "2",
                order: 2,
                title: "Ancient Cathedral",
                description: "This magnificent cathedral dates back to 1386.",
                location: TourPoint.Location(lat: 45.465203, lng: 9.190982),
                triggerRadiusMeters: 150
            )
        ],
        setupConfig: TourSetupConfig(
            language: "en",
            subtitlesEnabled: true,
            isDownloaded: false
        )
    )
}
