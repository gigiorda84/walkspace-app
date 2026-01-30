import SwiftUI

struct TourDetailView: View {
    let tour: Tour
    @StateObject private var locationManager = LocationManager()
    @StateObject private var preferencesManager = UserPreferencesManager.shared
    @State private var showPlayer = false
    @State private var showSetupSheet = false
    @State private var tourSetupConfig: TourSetupConfig?
    @State private var tourPoints: [TourPoint] = []
    @State private var isLoadingPoints = false
    @State private var pointsErrorMessage: String?
    @State private var fullTourDetails: Tour?

    private var strings: LocalizedStrings { LocalizedStrings.shared }

    var body: some View {
        ZStack {
            Color.brandPurple
                .ignoresSafeArea()

            GeometryReader { geometry in
                VStack(spacing: 0) {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 0) {
                            // Show video trailer if available, otherwise fallback to image
                            if let trailerUrl = tour.fullCoverTrailerUrl, let url = URL(string: trailerUrl) {
                                VideoPlayerView(videoURL: url)
                                    .frame(height: 300)
                                    .frame(width: geometry.size.width)
                                    .clipped()
                            } else if let imageUrl = tour.fullCoverImageUrl, let url = URL(string: imageUrl) {
                                AsyncImage(url: url) { image in
                                    image
                                        .resizable()
                                        .aspectRatio(contentMode: .fill)
                                } placeholder: {
                                    Rectangle()
                                        .fill(Color.brandDark)
                                }
                                .frame(height: 300)
                                .frame(width: geometry.size.width)
                                .clipped()
                            } else {
                                Rectangle()
                                    .fill(Color.brandDark)
                                    .frame(height: 300)
                                    .frame(width: geometry.size.width)
                                .overlay(
                                    Image(systemName: "photo")
                                        .font(.largeTitle)
                                        .foregroundColor(.brandMuted)
                                )
                            }

                            VStack(alignment: .leading, spacing: 16) {
                                HStack {
                                    Text(tour.displayTitle)
                                        .font(.system(size: 28, weight: .bold))
                                        .tracking(-1)
                                        .foregroundColor(.brandCream)

                                    Spacer()

                                    if tour.isProtected {
                                        Image(systemName: "lock.fill")
                                            .foregroundColor(.brandYellow)
                                    }
                                }

                                HStack(spacing: 4) {
                                    Image(systemName: "mappin.and.ellipse")
                                        .font(.caption)
                                    Text(tour.city)
                                        .font(.headline)
                                }
                                .foregroundColor(.brandCream)

                                if !tour.languages.isEmpty {
                                    HStack(spacing: 8) {
                                        Image(systemName: "globe")
                                            .font(.caption)
                                            .foregroundColor(.brandCream)
                                        ForEach(tour.languages, id: \.self) { lang in
                                            Text(lang.uppercased())
                                                .font(.caption)
                                                .fontWeight(.medium)
                                                .padding(.horizontal, 8)
                                                .padding(.vertical, 4)
                                                .background(Color.brandYellow.opacity(0.3))
                                                .foregroundColor(.brandYellow)
                                                .cornerRadius(6)
                                        }
                                    }
                                }

                                HStack(spacing: 20) {
                                    InfoBadge(icon: "clock", text: "\(tour.durationMinutes) min")
                                    InfoBadge(icon: "map", text: String(format: "%.1f km", tour.distanceKm))
                                    InfoBadge(icon: "figure.walk", text: tour.displayDifficulty)
                                }

                                Text(fullTourDetails?.displayDescription ?? tour.displayDescription)
                                    .font(.body)
                                    .foregroundColor(.brandCream)
                                    .multilineTextAlignment(.leading)
                            }
                            .padding(.top, 20)
                            .padding(.horizontal, max(20, geometry.safeAreaInsets.leading + 8))
                            .padding(.bottom, 120)
                            .frame(width: geometry.size.width, alignment: .leading)
                        }
                        .frame(width: geometry.size.width)
                    }

                    // Bottom play button anchored to bottom
                    VStack {
                        Button(action: {
                            showSetupSheet = true
                        }) {
                            HStack {
                                Image(systemName: "play.fill")
                                    .font(.title2)
                                Text(strings.startTour)
                                    .font(.headline)
                                    .fontWeight(.semibold)
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(
                                tourPoints.isEmpty ? Color.brandMuted : Color.brandYellow
                            )
                            .clipShape(Capsule())
                        }
                        .disabled(tourPoints.isEmpty)
                        .padding(.horizontal, 20)
                        .padding(.bottom, 16)
                    }
                    .background(
                        LinearGradient(
                            gradient: Gradient(colors: [Color.brandPurple.opacity(0), Color.brandPurple]),
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        .frame(height: 40)
                        .offset(y: -40),
                        alignment: .top
                    )
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showSetupSheet) {
            TourSetupSheet(tour: fullTourDetails ?? tour) { config in
                tourSetupConfig = config
                // Start tour with selected configuration
                locationManager.setTourPoints(tourPoints)
                locationManager.startTracking()
                showPlayer = true
            }
        }
        .fullScreenCover(isPresented: $showPlayer) {
            if !tourPoints.isEmpty, let config = tourSetupConfig {
                PlayerView(
                    tour: fullTourDetails ?? tour,
                    tourPoints: tourPoints,
                    setupConfig: config
                )
            }
        }
        .task {
            await loadFullTourDetails()
            await loadTourPoints()
        }
    }

    private func loadFullTourDetails() async {
        let preferredLang = preferencesManager.preferredLanguage
        var languageToUse = preferredLang

        do {
            let detailResponse = try await APIService.shared.fetchTourDetails(
                tourId: tour.id,
                language: languageToUse
            )

            await updateFullTourDetails(with: detailResponse, language: languageToUse)
        } catch APIError.notFound where preferredLang != "it" {
            // Fallback to Italian if preferred language not available
            languageToUse = "it"
            do {
                let detailResponse = try await APIService.shared.fetchTourDetails(
                    tourId: tour.id,
                    language: languageToUse
                )
                await updateFullTourDetails(with: detailResponse, language: languageToUse)
            } catch {
                print("Failed to load full tour details (fallback): \(error)")
            }
        } catch {
            print("Failed to load full tour details: \(error)")
        }
    }

    private func updateFullTourDetails(with detailResponse: TourDetailResponse, language: String) async {
        await MainActor.run {
            let updatedTour = self.tour

            self.fullTourDetails = Tour(
                id: updatedTour.id,
                slug: updatedTour.slug,
                title: updatedTour.title,
                descriptionPreview: [language: detailResponse.description],
                completionMessage: detailResponse.completionMessage != nil ? [language: detailResponse.completionMessage!] : nil,
                busInfo: detailResponse.busInfo != nil ? [language: detailResponse.busInfo!] : nil,
                city: detailResponse.city,
                durationMinutes: detailResponse.durationMinutes,
                distanceKm: detailResponse.distanceKm,
                difficultyRaw: detailResponse.difficulty,
                languages: detailResponse.languages,
                isProtected: detailResponse.isProtected,
                coverImageUrl: detailResponse.imageUrl,
                routePolyline: detailResponse.routePolyline,
                points: updatedTour.points,
                isDownloaded: detailResponse.downloadInfo.isDownloaded
            )
        }
    }

    private func loadTourPoints() async {
        // Don't try to load points if tour has no languages
        guard !tour.languages.isEmpty else {
            await MainActor.run {
                self.isLoadingPoints = false
                self.pointsErrorMessage = "Tour is incomplete"
            }
            return
        }

        isLoadingPoints = true
        pointsErrorMessage = nil

        let preferredLang = preferencesManager.preferredLanguage

        do {
            let points = try await APIService.shared.fetchTourPoints(
                tourId: tour.id,
                language: preferredLang
            )
            await MainActor.run {
                self.tourPoints = points
                self.isLoadingPoints = false
                self.pointsErrorMessage = nil
            }
        } catch APIError.notFound where preferredLang != "it" {
            // Fallback to Italian if preferred language not available
            do {
                let points = try await APIService.shared.fetchTourPoints(
                    tourId: tour.id,
                    language: "it"
                )
                await MainActor.run {
                    self.tourPoints = points
                    self.isLoadingPoints = false
                    self.pointsErrorMessage = nil
                }
            } catch {
                await MainActor.run {
                    self.isLoadingPoints = false
                    self.pointsErrorMessage = "Unable to load points"
                }
                print("Error loading tour points (fallback): \(error)")
            }
        } catch {
            await MainActor.run {
                self.isLoadingPoints = false

                if let apiError = error as? APIError {
                    switch apiError {
                    case .forbidden:
                        self.pointsErrorMessage = "Access restricted"
                    case .notFound:
                        self.pointsErrorMessage = "Points not available"
                    default:
                        self.pointsErrorMessage = "Unable to load points"
                    }
                } else {
                    self.pointsErrorMessage = "Unable to load points"
                }
            }
            print("Error loading tour points: \(error)")
        }
    }
}

struct InfoBadge: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
            Text(text)
        }
        .font(.caption)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color.brandSurfacePurple.opacity(0.5))
        .foregroundColor(.brandCream)
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.brandBorderPurple, lineWidth: 1)
        )
    }
}

#Preview {
    NavigationView {
        TourDetailView(tour: Tour(
            id: "1",
            slug: "historic-downtown",
            title: ["en": "Historic Downtown Walk"],
            descriptionPreview: ["en": "Explore the rich history of our city center"],
            completionMessage: nil,
            city: "Demo City",
            durationMinutes: 60,
            distanceKm: 2.5,
            languages: ["en"],
            isProtected: false,
            coverImageUrl: "https://picsum.photos/400/300",
            routePolyline: nil
        ))
    }
}
