import SwiftUI

struct TourSetupSheet: View {
    let tour: Tour
    let onComplete: (TourSetupConfig) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var currentStep = 0
    @State private var selectedLanguage: String = UserPreferencesManager.shared.preferredLanguage
    @State private var subtitlesEnabled: Bool = true
    @State private var downloadEnabled: Bool = true
    @State private var isDownloading: Bool = false
    @State private var downloadProgress: Double = 0
    @State private var downloadError: String?

    @StateObject private var downloadManager = TourDownloadManager.shared

    private var strings: LocalizedStrings { LocalizedStrings.shared }

    var body: some View {
        ZStack {
            Color.brandPurple
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header with back arrow and close button
                HStack {
                    // Back arrow (only show if not on first step and not downloading)
                    if currentStep > 0 && !isDownloading {
                        Button(action: { currentStep -= 1 }) {
                            Image(systemName: "chevron.left")
                                .font(.title3)
                                .foregroundColor(.brandCream)
                        }
                    } else {
                        // Placeholder for symmetry
                        Image(systemName: "chevron.left")
                            .font(.title3)
                            .foregroundColor(.clear)
                    }

                    Spacer()

                    // Close button
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .font(.title3)
                            .foregroundColor(.brandCream)
                    }
                }
                .padding()

                Spacer()

                // Content based on current step
                if isDownloading {
                    downloadingView
                } else {
                    switch currentStep {
                    case 0:
                        languageSelectionView
                    case 1:
                        subtitlesSelectionView
                    case 2:
                        downloadSelectionView
                    default:
                        EmptyView()
                    }
                }

                Spacer()

                // Step indicators at bottom
                HStack(spacing: 8) {
                    ForEach(0..<3, id: \.self) { index in
                        Circle()
                            .fill(index <= currentStep ? Color.brandYellow : Color.brandMuted.opacity(0.3))
                            .frame(width: 8, height: 8)
                    }
                }
                .padding(.bottom, 32)
            }
        }
    }

    // MARK: - Step 1: Language Selection
    private var languageSelectionView: some View {
        VStack(spacing: 24) {
            Image(systemName: "waveform")
                .font(.system(size: 48))
                .foregroundColor(.brandYellow)

            Text(strings.audioLanguage)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.brandCream)

            Text(strings.chooseAudioLanguage)
                .font(.body)
                .foregroundColor(.brandCream)
                .multilineTextAlignment(.center)

            VStack(spacing: 12) {
                ForEach(tour.languages, id: \.self) { language in
                    languageButton(language: language)
                }
            }
            .padding(.top, 16)
        }
        .padding(.horizontal, 32)
    }

    private func languageButton(language: String) -> some View {
        Button(action: {
            selectedLanguage = language
            // Auto-advance to next step
            withAnimation(.easeInOut(duration: 0.3)) {
                currentStep = 1
            }
        }) {
            Text(languageDisplayName(language))
                .font(.headline)
                .foregroundColor(.brandCream)
                .frame(maxWidth: .infinity)
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(selectedLanguage == language ? Color.brandYellow.opacity(0.2) : Color.brandSurfacePurple)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(selectedLanguage == language ? Color.brandYellow : Color.brandBorderPurple, lineWidth: 1)
                )
        }
    }

    // MARK: - Step 2: Subtitles Selection
    private var subtitlesSelectionView: some View {
        VStack(spacing: 24) {
            Image(systemName: "captions.bubble")
                .font(.system(size: 48))
                .foregroundColor(.brandYellow)

            Text(strings.subtitles)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.brandCream)

            Text(strings.enableSubtitlesQuestion)
                .font(.body)
                .foregroundColor(.brandCream)
                .multilineTextAlignment(.center)

            VStack(spacing: 12) {
                optionButton(
                    title: strings.on,
                    subtitle: strings.showSubtitlesDuringPlayback,
                    isSelected: subtitlesEnabled,
                    action: {
                        subtitlesEnabled = true
                        advanceToNextStep()
                    }
                )

                optionButton(
                    title: strings.off,
                    subtitle: strings.noSubtitles,
                    isSelected: !subtitlesEnabled,
                    action: {
                        subtitlesEnabled = false
                        advanceToNextStep()
                    }
                )
            }
            .padding(.top, 16)
        }
        .padding(.horizontal, 32)
    }

    // MARK: - Step 3: Download Selection
    private var downloadSelectionView: some View {
        VStack(spacing: 24) {
            Image(systemName: "arrow.down.circle")
                .font(.system(size: 48))
                .foregroundColor(.brandYellow)

            Text(strings.downloadTour)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.brandCream)

            Text(strings.downloadRecommendation)
                .font(.body)
                .foregroundColor(.brandCream)
                .multilineTextAlignment(.center)

            VStack(spacing: 12) {
                optionButton(
                    title: strings.downloadRecommended,
                    subtitle: strings.saveForOffline,
                    isSelected: downloadEnabled,
                    action: {
                        downloadEnabled = true
                        startDownload()
                    }
                )

                optionButton(
                    title: strings.streamOnly,
                    subtitle: strings.requiresInternet,
                    isSelected: !downloadEnabled,
                    action: {
                        downloadEnabled = false
                        completeSetup()
                    }
                )
            }
            .padding(.top, 16)
        }
        .padding(.horizontal, 32)
    }

    // MARK: - Downloading View
    private var downloadingView: some View {
        VStack(spacing: 24) {
            if let error = downloadError {
                Image(systemName: "exclamationmark.triangle")
                    .font(.system(size: 48))
                    .foregroundColor(.brandYellow)

                Text(strings.downloadFailed)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.brandCream)

                Text(error)
                    .font(.body)
                    .foregroundColor(.brandCream)
                    .multilineTextAlignment(.center)

                HStack(spacing: 16) {
                    Button(action: { startDownload() }) {
                        Text(strings.retry)
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(Color.brandYellow)
                            .clipShape(Capsule())
                    }

                    Button(action: {
                        downloadEnabled = false
                        completeSetup()
                    }) {
                        Text(strings.skip)
                            .font(.headline)
                            .foregroundColor(.brandMuted)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(Color.brandSurfacePurple)
                            .clipShape(Capsule())
                    }
                }
                .padding(.top, 16)
            } else {
                Image(systemName: "arrow.down.circle")
                    .font(.system(size: 48))
                    .foregroundColor(.brandYellow)

                Text(strings.downloadingTour)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.brandCream)

                Text(strings.pleaseWait)
                    .font(.body)
                    .foregroundColor(.brandCream)
                    .multilineTextAlignment(.center)

                VStack(spacing: 8) {
                    ProgressView(value: downloadProgress)
                        .progressViewStyle(LinearProgressViewStyle(tint: .brandYellow))
                        .scaleEffect(x: 1, y: 2, anchor: .center)

                    Text("\(Int(downloadProgress * 100))%")
                        .font(.caption)
                        .foregroundColor(.brandCream)
                }
                .padding(.top, 24)
                .padding(.horizontal, 32)
            }
        }
        .padding(.horizontal, 32)
    }

    // MARK: - Helper Views
    private func optionButton(title: String, subtitle: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(alignment: .center, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.brandCream)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.brandCream)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.brandYellow.opacity(0.2) : Color.brandSurfacePurple)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.brandYellow : Color.brandBorderPurple, lineWidth: 1)
            )
        }
    }

    // MARK: - Helper Functions
    private func languageDisplayName(_ code: String) -> String {
        switch code.lowercased() {
        case "it": return "Italiano"
        case "en": return "English"
        case "fr": return "Français"
        case "de": return "Deutsch"
        case "es": return "Español"
        default: return code.uppercased()
        }
    }

    private func advanceToNextStep() {
        withAnimation(.easeInOut(duration: 0.3)) {
            currentStep += 1
        }
    }

    private func startDownload() {
        isDownloading = true
        downloadError = nil
        downloadProgress = 0

        Task {
            do {
                for try await progress in downloadManager.downloadTour(tourId: tour.id, language: selectedLanguage) {
                    await MainActor.run {
                        downloadProgress = progress
                    }
                }
                await MainActor.run {
                    completeSetup()
                }
            } catch {
                await MainActor.run {
                    downloadError = error.localizedDescription
                }
            }
        }
    }

    private func completeSetup() {
        let config = TourSetupConfig(
            language: selectedLanguage,
            subtitlesEnabled: subtitlesEnabled,
            isDownloaded: downloadEnabled && downloadError == nil
        )
        onComplete(config)
        dismiss()
    }
}

// MARK: - Configuration Model
struct TourSetupConfig {
    let language: String
    let subtitlesEnabled: Bool
    let isDownloaded: Bool
}

#Preview {
    TourSetupSheet(
        tour: Tour(
            id: "1",
            slug: "test",
            title: ["en": "Test Tour"],
            descriptionPreview: ["en": "Test description"],
            city: "Test City",
            durationMinutes: 60,
            distanceKm: 2.5,
            languages: ["it", "en", "fr"],
            isProtected: false
        ),
        onComplete: { _ in }
    )
}
