//
//  PerformanceMonitor.swift
//  SonicWalkscape
//
//  Tracks performance metrics during GPS testing
//

import Foundation
import CoreLocation
import Combine

class PerformanceMonitor: ObservableObject {
    static let shared = PerformanceMonitor()

    // MARK: - GPS Metrics
    @Published var gpsAccuracyHistory: [Double] = []
    @Published var averageGPSAccuracy: Double = 0
    @Published var poorAccuracyCount: Int = 0

    // MARK: - Audio Metrics
    @Published var audioLoadTimes: [TimeInterval] = []
    @Published var averageAudioLoadTime: TimeInterval = 0

    // MARK: - Memory Metrics
    @Published var currentMemoryUsageMB: Double = 0
    @Published var peakMemoryUsageMB: Double = 0

    // MARK: - Session Metrics
    @Published var sessionStartTime: Date?
    @Published var totalLocationUpdates: Int = 0
    @Published var locationUpdatesPerMinute: Double = 0

    private init() {}

    // MARK: - GPS Tracking

    func recordGPSAccuracy(_ accuracy: Double) {
        gpsAccuracyHistory.append(accuracy)

        // Keep only last 100 readings
        if gpsAccuracyHistory.count > 100 {
            gpsAccuracyHistory.removeFirst()
        }

        // Calculate average
        averageGPSAccuracy = gpsAccuracyHistory.reduce(0, +) / Double(gpsAccuracyHistory.count)

        // Count poor accuracy readings (>50m)
        if accuracy > 50 {
            poorAccuracyCount += 1
        }

        totalLocationUpdates += 1
        updateLocationFrequency()
    }

    func recordLocationUpdate() {
        totalLocationUpdates += 1
        updateLocationFrequency()
    }

    private func updateLocationFrequency() {
        guard let startTime = sessionStartTime else { return }
        let elapsed = Date().timeIntervalSince(startTime)
        let minutes = elapsed / 60.0

        if minutes > 0 {
            locationUpdatesPerMinute = Double(totalLocationUpdates) / minutes
        }
    }

    // MARK: - Audio Performance

    func startAudioLoadTimer() -> Date {
        return Date()
    }

    func recordAudioLoadTime(startTime: Date) {
        let loadTime = Date().timeIntervalSince(startTime)
        audioLoadTimes.append(loadTime)

        // Keep only last 50 readings
        if audioLoadTimes.count > 50 {
            audioLoadTimes.removeFirst()
        }

        // Calculate average
        averageAudioLoadTime = audioLoadTimes.reduce(0, +) / Double(audioLoadTimes.count)

        DebugLogger.log("Audio load time: \(String(format: "%.2f", loadTime))s, avg: \(String(format: "%.2f", averageAudioLoadTime))s")
    }

    // MARK: - Memory Tracking

    func updateMemoryUsage() {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size) / 4

        let kerr: kern_return_t = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(mach_task_self_,
                         task_flavor_t(MACH_TASK_BASIC_INFO),
                         $0,
                         &count)
            }
        }

        if kerr == KERN_SUCCESS {
            let memoryMB = Double(info.resident_size) / 1024.0 / 1024.0
            currentMemoryUsageMB = memoryMB

            if memoryMB > peakMemoryUsageMB {
                peakMemoryUsageMB = memoryMB
            }
        }
    }

    // MARK: - Session Management

    func startSession() {
        sessionStartTime = Date()
        gpsAccuracyHistory = []
        audioLoadTimes = []
        totalLocationUpdates = 0
        poorAccuracyCount = 0
        averageGPSAccuracy = 0
        averageAudioLoadTime = 0
        locationUpdatesPerMinute = 0

        DebugLogger.success("Performance monitoring started")
    }

    func endSession() {
        printSessionSummary()
        DebugLogger.success("Performance monitoring ended")
    }

    // MARK: - Reporting

    func printSessionSummary() {
        guard let startTime = sessionStartTime else { return }

        let duration = Date().timeIntervalSince(startTime)
        let durationMinutes = duration / 60.0

        print("\n" + String(repeating: "=", count: 60))
        print("PERFORMANCE SUMMARY")
        print(String(repeating: "=", count: 60))

        // Session Info
        print("\n📊 Session:")
        print("  Duration: \(String(format: "%.1f", durationMinutes)) minutes")
        print("  Started: \(formatDate(startTime))")
        print("  Ended: \(formatDate(Date()))")

        // GPS Metrics
        print("\n📍 GPS Performance:")
        print("  Total Updates: \(totalLocationUpdates)")
        print("  Updates/Minute: \(String(format: "%.1f", locationUpdatesPerMinute))")
        print("  Average Accuracy: \(String(format: "%.1f", averageGPSAccuracy))m")
        print("  Poor Accuracy Count: \(poorAccuracyCount) (>\(50)m)")

        if let bestAccuracy = gpsAccuracyHistory.min() {
            print("  Best Accuracy: \(String(format: "%.1f", bestAccuracy))m")
        }

        if let worstAccuracy = gpsAccuracyHistory.max() {
            print("  Worst Accuracy: \(String(format: "%.1f", worstAccuracy))m")
        }

        // Audio Metrics
        print("\n🎵 Audio Performance:")
        print("  Audio Loads: \(audioLoadTimes.count)")
        print("  Average Load Time: \(String(format: "%.2f", averageAudioLoadTime))s")

        if let fastestLoad = audioLoadTimes.min() {
            print("  Fastest Load: \(String(format: "%.2f", fastestLoad))s")
        }

        if let slowestLoad = audioLoadTimes.max() {
            print("  Slowest Load: \(String(format: "%.2f", slowestLoad))s")
        }

        // Memory Metrics
        print("\n💾 Memory Usage:")
        print("  Current: \(String(format: "%.1f", currentMemoryUsageMB)) MB")
        print("  Peak: \(String(format: "%.1f", peakMemoryUsageMB)) MB")

        // Recommendations
        print("\n💡 Recommendations:")

        if averageGPSAccuracy > 30 {
            print("  ⚠️ High average GPS accuracy - test in areas with better sky visibility")
        }

        if poorAccuracyCount > totalLocationUpdates / 4 {
            print("  ⚠️ >25% of GPS readings had poor accuracy")
        }

        if averageAudioLoadTime > 5.0 {
            print("  ⚠️ Slow audio loading - check network speed or file sizes")
        }

        // Memory threshold adjusted for app with MapKit, audio playback, and background location
        // Baseline: ~100MB (app + frameworks) + ~50MB (MapKit) + ~10MB (audio) = ~160MB
        if peakMemoryUsageMB > 300 {
            print("  ⚠️ High memory usage - possible memory leak")
        }

        if locationUpdatesPerMinute < 5 {
            print("  ⚠️ Low GPS update frequency - check location settings")
        }

        if locationUpdatesPerMinute > 30 {
            print("  💚 Excellent GPS update frequency")
        }

        if averageGPSAccuracy < 20 {
            print("  💚 Excellent GPS accuracy")
        }

        if averageAudioLoadTime < 2.0 {
            print("  💚 Fast audio loading")
        }

        print("\n" + String(repeating: "=", count: 60) + "\n")
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        return formatter.string(from: date)
    }

    // MARK: - Export Metrics

    func exportMetricsCSV() -> String {
        var csv = "Metric,Value\n"

        // Session
        if let startTime = sessionStartTime {
            let duration = Date().timeIntervalSince(startTime)
            csv += "Session Duration (minutes),\(String(format: "%.1f", duration / 60.0))\n"
        }

        // GPS
        csv += "Total GPS Updates,\(totalLocationUpdates)\n"
        csv += "GPS Updates/Minute,\(String(format: "%.1f", locationUpdatesPerMinute))\n"
        csv += "Average GPS Accuracy (m),\(String(format: "%.1f", averageGPSAccuracy))\n"
        csv += "Poor Accuracy Count,\(poorAccuracyCount)\n"

        // Audio
        csv += "Audio Loads,\(audioLoadTimes.count)\n"
        csv += "Average Audio Load Time (s),\(String(format: "%.2f", averageAudioLoadTime))\n"

        // Memory
        csv += "Current Memory (MB),\(String(format: "%.1f", currentMemoryUsageMB))\n"
        csv += "Peak Memory (MB),\(String(format: "%.1f", peakMemoryUsageMB))\n"

        return csv
    }
}
