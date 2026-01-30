//
//  AnalyticsService.swift
//  SonicWalkscape
//
//  Anonymous analytics tracking with GDPR compliance
//

import Foundation
import UIKit

// MARK: - Event Types

enum AnalyticsEventType: String {
    case tourStarted = "tour_started"
    case pointTriggered = "point_triggered"
    case tourCompleted = "tour_completed"
    case tourAbandoned = "tour_abandoned"
    case followUsClicked = "follow_us_clicked"
    case contactClicked = "contact_clicked"
    case donationLinkClicked = "donation_link_clicked"
}

// MARK: - Trigger Type

enum TriggerType: String {
    case gps = "gps"
    case manual = "manual"
}

// MARK: - Analytics Event

struct AnalyticsEvent: Codable {
    let name: String
    let anonymousId: String
    let tourId: String?
    let pointId: String?
    let language: String?
    let device: String
    let osVersion: String
    let timestamp: String
    let properties: [String: AnyCodableValue]?
}

// MARK: - AnyCodableValue for flexible properties

enum AnyCodableValue: Codable {
    case string(String)
    case int(Int)
    case double(Double)
    case bool(Bool)

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let v = try? container.decode(String.self) { self = .string(v) }
        else if let v = try? container.decode(Int.self) { self = .int(v) }
        else if let v = try? container.decode(Double.self) { self = .double(v) }
        else if let v = try? container.decode(Bool.self) { self = .bool(v) }
        else { self = .string("") }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let v): try container.encode(v)
        case .int(let v): try container.encode(v)
        case .double(let v): try container.encode(v)
        case .bool(let v): try container.encode(v)
        }
    }
}

// MARK: - Analytics Service

class AnalyticsService {
    static let shared = AnalyticsService()

    private let anonymousIdKey = "analytics_anonymous_id"
    private let pendingEventsKey = "analytics_pending_events"
    private var pendingEvents: [AnalyticsEvent] = []
    private let batchSize = 10
    private let flushInterval: TimeInterval = 30

    private var flushTimer: Timer?

    private init() {
        loadPendingEvents()
        startFlushTimer()
    }

    // MARK: - Anonymous ID

    var anonymousId: String {
        if let id = UserDefaults.standard.string(forKey: anonymousIdKey) {
            return id
        }
        let newId = UUID().uuidString
        UserDefaults.standard.set(newId, forKey: anonymousIdKey)
        return newId
    }

    // MARK: - Device Info

    private var deviceInfo: String {
        "ios-\(UIDevice.current.model)"
    }

    private var osVersionInfo: String {
        "iOS \(UIDevice.current.systemVersion)"
    }

    // MARK: - Consent Check

    private var hasConsent: Bool {
        UserPreferencesManager.shared.analyticsEnabled
    }

    // MARK: - Track Events

    func trackTourStarted(tourId: String, language: String, triggerType: TriggerType) {
        track(
            event: .tourStarted,
            tourId: tourId,
            properties: [
                "triggerType": .string(triggerType.rawValue),
                "language": .string(language),
                "platform": .string("ios")
            ]
        )
    }

    func trackPointTriggered(tourId: String, pointId: String, triggerType: TriggerType) {
        track(
            event: .pointTriggered,
            tourId: tourId,
            pointId: pointId,
            properties: [
                "triggerType": .string(triggerType.rawValue)
            ]
        )
    }

    func trackTourCompleted(tourId: String, durationMinutes: Int, pointsVisited: Int, triggerType: TriggerType) {
        track(
            event: .tourCompleted,
            tourId: tourId,
            properties: [
                "durationMinutes": .int(durationMinutes),
                "pointsVisited": .int(pointsVisited),
                "triggerType": .string(triggerType.rawValue),
                "platform": .string("ios")
            ]
        )
    }

    func trackTourAbandoned(tourId: String, durationMinutes: Int, lastPointIndex: Int) {
        track(
            event: .tourAbandoned,
            tourId: tourId,
            properties: [
                "durationMinutes": .int(durationMinutes),
                "lastPointIndex": .int(lastPointIndex),
                "platform": .string("ios")
            ]
        )
    }

    func trackFollowUsClicked(tourId: String) {
        track(
            event: .followUsClicked,
            tourId: tourId,
            properties: nil
        )
    }

    func trackContactClicked(tourId: String, channel: String) {
        track(
            event: .contactClicked,
            tourId: tourId,
            properties: [
                "channel": .string(channel)
            ]
        )
    }

    func trackDonationLinkClicked(tourId: String) {
        track(
            event: .donationLinkClicked,
            tourId: tourId,
            properties: nil
        )
    }

    // MARK: - Core Track Method

    private func track(
        event: AnalyticsEventType,
        tourId: String? = nil,
        pointId: String? = nil,
        properties: [String: AnyCodableValue]?
    ) {
        guard hasConsent else {
            DebugLogger.log("Analytics disabled by user preference")
            return
        }

        let formatter = ISO8601DateFormatter()
        let analyticsEvent = AnalyticsEvent(
            name: event.rawValue,
            anonymousId: anonymousId,
            tourId: tourId,
            pointId: pointId,
            language: UserPreferencesManager.shared.preferredLanguage,
            device: deviceInfo,
            osVersion: osVersionInfo,
            timestamp: formatter.string(from: Date()),
            properties: properties
        )

        pendingEvents.append(analyticsEvent)
        savePendingEvents()

        DebugLogger.log("Analytics: Queued \(event.rawValue)")

        // Flush if batch size reached
        if pendingEvents.count >= batchSize {
            flush()
        }
    }

    // MARK: - Flush Events

    func flush() {
        guard !pendingEvents.isEmpty else { return }
        guard hasConsent else {
            pendingEvents.removeAll()
            savePendingEvents()
            return
        }

        let eventsToSend = pendingEvents
        pendingEvents.removeAll()
        savePendingEvents()

        Task {
            await sendEvents(eventsToSend)
        }
    }

    private func sendEvents(_ events: [AnalyticsEvent]) async {
        let urlString = "\(Constants.API.fullURL)/analytics/events"
        guard let url = URL(string: urlString) else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload = ["events": events]

        do {
            let encoder = JSONEncoder()
            request.httpBody = try encoder.encode(payload)

            let (_, response) = try await URLSession.shared.data(for: request)

            if let httpResponse = response as? HTTPURLResponse,
               (200...299).contains(httpResponse.statusCode) {
                DebugLogger.success("Analytics: Sent \(events.count) events")
            } else {
                // Re-queue events on failure
                await MainActor.run {
                    self.pendingEvents.append(contentsOf: events)
                    self.savePendingEvents()
                }
                DebugLogger.warning("Analytics: Failed to send, re-queued \(events.count) events")
            }
        } catch {
            // Re-queue events on error (offline support)
            await MainActor.run {
                self.pendingEvents.append(contentsOf: events)
                self.savePendingEvents()
            }
            DebugLogger.warning("Analytics: Network error, re-queued \(events.count) events")
        }
    }

    // MARK: - Persistence

    private func savePendingEvents() {
        if let data = try? JSONEncoder().encode(pendingEvents) {
            UserDefaults.standard.set(data, forKey: pendingEventsKey)
        }
    }

    private func loadPendingEvents() {
        if let data = UserDefaults.standard.data(forKey: pendingEventsKey),
           let events = try? JSONDecoder().decode([AnalyticsEvent].self, from: data) {
            pendingEvents = events
        }
    }

    // MARK: - Timer

    private func startFlushTimer() {
        flushTimer = Timer.scheduledTimer(withTimeInterval: flushInterval, repeats: true) { [weak self] _ in
            self?.flush()
        }
    }
}
