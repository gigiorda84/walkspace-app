//
//  SubtitlesView.swift
//  SonicWalkscape
//
//  Displays subtitles synced with audio playback
//

import SwiftUI

struct SubtitlesView: View {
    let currentSubtitle: String?
    let isVisible: Bool

    var body: some View {
        VStack {
            Spacer()

            if let subtitle = currentSubtitle, isVisible, !subtitle.isEmpty {
                Text(subtitle)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.black.opacity(0.75))
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(.ultraThinMaterial)
                            )
                    )
                    .padding(.horizontal, 20)
                    .padding(.bottom, 20)
                    .shadow(color: .black.opacity(0.3), radius: 8, x: 0, y: 4)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
            }
        }
        .animation(.easeInOut(duration: 0.3), value: currentSubtitle)
    }
}

#Preview {
    ZStack {
        Color.gray
        SubtitlesView(
            currentSubtitle: "Welcome to the historic square, built in the 15th century.",
            isVisible: true
        )
    }
}
