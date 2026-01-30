//
//  DebugOverlayView.swift
//  SonicWalkscape
//
//  GPS debugging overlay for physical device testing
//

import SwiftUI
import CoreLocation

struct DebugOverlayView: View {
    let location: CLLocation?
    let currentPointIndex: Int
    let totalPoints: Int
    let distanceToNextPoint: Double
    let isPointActive: Bool
    let triggerRadius: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                Text("🔍 GPS Debug")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.white)
                Spacer()
            }

            Divider()
                .background(Color.white.opacity(0.3))

            // Location Info
            if let loc = location {
                debugRow(label: "Lat", value: String(format: "%.6f", loc.coordinate.latitude))
                debugRow(label: "Lng", value: String(format: "%.6f", loc.coordinate.longitude))
                debugRow(label: "Accuracy", value: String(format: "%.1fm", loc.horizontalAccuracy))
                debugRow(label: "Speed", value: String(format: "%.1f m/s", max(0, loc.speed)))
            } else {
                debugRow(label: "Location", value: "Waiting for GPS...")
            }

            Divider()
                .background(Color.white.opacity(0.3))

            // Point Info
            debugRow(label: "Point", value: "\(currentPointIndex + 1) / \(totalPoints)")
            debugRow(label: "Distance", value: String(format: "%.0fm", distanceToNextPoint))
            debugRow(label: "Trigger At", value: String(format: "%.0fm", triggerRadius))

            // Trigger Status
            HStack {
                Text("Status:")
                    .font(.system(size: 11))
                    .foregroundColor(.white.opacity(0.7))
                Spacer()
                HStack(spacing: 4) {
                    Circle()
                        .fill(isPointActive ? Color.green : Color.red)
                        .frame(width: 8, height: 8)
                    Text(isPointActive ? "ACTIVE" : "Waiting")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(isPointActive ? .green : .red)
                }
            }

            // Progress Bar
            if totalPoints > 0 {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Tour Progress")
                        .font(.system(size: 10))
                        .foregroundColor(.white.opacity(0.7))

                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            // Background
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color.white.opacity(0.2))

                            // Progress
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color.green)
                                .frame(width: geometry.size.width * CGFloat(currentPointIndex) / CGFloat(totalPoints))
                        }
                    }
                    .frame(height: 4)
                }
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.black.opacity(0.8))
                .shadow(color: .black.opacity(0.5), radius: 10, x: 0, y: 4)
        )
        .padding()
    }

    private func debugRow(label: String, value: String) -> some View {
        HStack {
            Text(label + ":")
                .font(.system(size: 11))
                .foregroundColor(.white.opacity(0.7))
            Spacer()
            Text(value)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.white)
        }
    }
}

// MARK: - Preview

#Preview {
    ZStack {
        Color.gray
        DebugOverlayView(
            location: CLLocation(latitude: 45.464203, longitude: 9.189982),
            currentPointIndex: 2,
            totalPoints: 5,
            distanceToNextPoint: 87.5,
            isPointActive: false,
            triggerRadius: 150
        )
    }
}
