//
//  AudioControlsView.swift
//  SonicWalkscape
//
//  Audio playback controls for tour player
//

import SwiftUI

struct AudioControlsView: View {
    let currentPoint: TourPoint
    let totalPoints: Int
    let isPlaying: Bool
    let currentTime: TimeInterval
    let duration: TimeInterval
    let onPlayPause: () -> Void
    let onSkipBackward: () -> Void
    let onSkipForward: () -> Void
    let onSeek: (Double) -> Void
    let onPreviousPoint: () -> Void
    let onNextPoint: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            // Point info
            VStack(spacing: 4) {
                Text(currentPoint.title)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.brandCream)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
            }

            // Progress bar
            VStack(spacing: 8) {
                Slider(value: Binding(
                    get: { currentTime },
                    set: { onSeek($0) }
                ), in: 0...max(duration, 1))
                    .accentColor(.brandYellow)

                HStack {
                    Text(formatTime(currentTime))
                        .font(.caption2)
                        .foregroundColor(.white)

                    Spacer()

                    Text(formatTime(duration))
                        .font(.caption2)
                        .foregroundColor(.white)
                }
            }

            // Playback controls
            HStack(spacing: 40) {
                // Previous point
                Button(action: onPreviousPoint) {
                    Image(systemName: "backward.end.fill")
                        .font(.system(size: 20))
                        .foregroundColor(.brandCream)
                }

                // Skip backward 10s
                Button(action: onSkipBackward) {
                    Image(systemName: "gobackward.10")
                        .font(.system(size: 20))
                        .foregroundColor(.brandCream)
                }

                // Play/Pause
                Button(action: onPlayPause) {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [.brandYellow, .brandYellow],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 64, height: 64)
                            .shadow(color: .brandYellow.opacity(0.4), radius: 12, x: 0, y: 6)

                        Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                            .font(.system(size: 28))
                            .foregroundColor(.white)
                            .offset(x: isPlaying ? 0 : 2) // Slight offset for play icon
                    }
                }
                .scaleEffect(isPlaying ? 1.0 : 1.05)
                .animation(.easeInOut(duration: 0.2), value: isPlaying)

                // Skip forward 10s
                Button(action: onSkipForward) {
                    Image(systemName: "goforward.10")
                        .font(.system(size: 20))
                        .foregroundColor(.brandCream)
                }

                // Next point
                Button(action: onNextPoint) {
                    Image(systemName: "forward.end.fill")
                        .font(.system(size: 20))
                        .foregroundColor(.brandCream)
                }
            }
        }
        .padding(20)
        .glassmorphicCard()
    }

    private func formatTime(_ time: TimeInterval) -> String {
        let minutes = Int(time) / 60
        let seconds = Int(time) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}

#Preview {
    ZStack {
        Color.brandDark
            .ignoresSafeArea()

        VStack {
            Spacer()
            AudioControlsView(
                currentPoint: TourPoint(
                    id: "1",
                    order: 1,
                    title: "Historic Square",
                    description: "Welcome to the historic square",
                    location: TourPoint.Location(lat: 45.464203, lng: 9.189982),
                    triggerRadiusMeters: 150
                ),
                totalPoints: 5,
                isPlaying: false,
                currentTime: 45,
                duration: 180,
                onPlayPause: {},
                onSkipBackward: {},
                onSkipForward: {},
                onSeek: { _ in },
                onPreviousPoint: {},
                onNextPoint: {}
            )
        }
    }
}
