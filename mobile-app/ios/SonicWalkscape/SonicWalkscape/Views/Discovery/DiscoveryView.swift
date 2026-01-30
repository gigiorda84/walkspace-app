import SwiftUI
import MapKit

struct DiscoveryView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var preferencesManager = UserPreferencesManager.shared
    @State private var tours: [Tour] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showSettings = false
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 45.464203, longitude: 9.189982),
        span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
    )
    @State private var selectedTour: Tour?

    private var strings: LocalizedStrings { LocalizedStrings.shared }

    var filteredTours: [Tour] {
        // Only show published tours (tours with at least one language version)
        tours.filter { !$0.languages.isEmpty }
    }

    var body: some View {
        NavigationView {
            ZStack {
                // Full-screen map background
                if !filteredTours.isEmpty {
                    DiscoveryMapView(
                        tours: filteredTours,
                        onTourSelected: { tour in
                            selectedTour = tour
                        },
                        region: $region
                    )
                    .ignoresSafeArea()
                } else {
                    // Background color when no tours
                    Color.brandPurple
                        .ignoresSafeArea()
                }

                // Loading/Error overlay
                if isLoading {
                    VStack {
                        Spacer()
                        ProgressView(strings.loadingTours)
                            .foregroundColor(.brandCream)
                            .padding()
                            .background(Color.black.opacity(0.7))
                            .cornerRadius(12)
                        Spacer()
                    }
                } else if let error = errorMessage {
                    VStack {
                        Spacer()
                        VStack(spacing: 16) {
                            Image(systemName: "exclamationmark.triangle")
                                .font(.largeTitle)
                                .foregroundColor(.brandYellow)
                            Text(strings.errorLoadingTours)
                                .font(.headline)
                                .foregroundColor(.brandCream)
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.brandMuted)
                                .multilineTextAlignment(.center)
                            Button(strings.retry) {
                                loadTours()
                            }
                            .primaryButton()
                        }
                        .padding()
                        .background(Color.black.opacity(0.8))
                        .cornerRadius(12)
                        Spacer()
                    }
                } else if filteredTours.isEmpty {
                    VStack {
                        Spacer()
                        VStack(spacing: 16) {
                            Image(systemName: "map")
                                .font(.largeTitle)
                                .foregroundColor(.brandMuted)
                            Text(strings.noToursFound)
                                .font(.headline)
                                .foregroundColor(.brandCream)
                        }
                        .padding()
                        .background(Color.black.opacity(0.8))
                        .cornerRadius(12)
                        Spacer()
                    }
                }

                // Custom header with centered title
                VStack {
                    HStack {
                        // Home button
                        Button(action: { dismiss() }) {
                            Image(systemName: "house.fill")
                                .font(.system(size: 20))
                                .foregroundColor(.brandYellow)
                                .frame(width: 60, height: 60)
                                .background(Color.black.opacity(0.3))
                                .clipShape(Circle())
                        }

                        Spacer()

                        // Centered title
                        Text(strings.discover)
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(.white)

                        Spacer()

                        // Settings button
                        Button(action: { showSettings = true }) {
                            Image(systemName: "gearshape.fill")
                                .font(.system(size: 20))
                                .foregroundColor(.brandYellow)
                                .frame(width: 60, height: 60)
                                .background(Color.black.opacity(0.3))
                                .clipShape(Circle())
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 8)

                    Spacer()
                }
            }
            .accentColor(.brandYellow)
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
            .sheet(item: $selectedTour) { tour in
                TourDetailView(tour: tour)
            }
        }
        .navigationViewStyle(StackNavigationViewStyle())
        .onAppear {
            if tours.isEmpty {
                loadTours()
            } else {
                // Recalculate region when view appears with tours
                centerMapOnTours()
            }
        }
        .onChange(of: filteredTours) { _ in
            centerMapOnTours()
        }
    }

    private func loadTours() {
        isLoading = true
        errorMessage = nil

        Task {
            do {
                let fetchedTours = try await APIService.shared.fetchTours()
                await MainActor.run {
                    self.tours = fetchedTours
                    self.isLoading = false

                    // Debug logging
                    print("📍 Loaded \(fetchedTours.count) tours")
                    print("📍 Filtered tours: \(filteredTours.count)")
                    for tour in filteredTours {
                        print("📍 Tour: \(tour.displayTitle)")
                        print("   - Languages: \(tour.languages)")
                        print("   - Points count: \(tour.points.count)")
                        print("   - Route polyline: \(tour.routePolyline != nil ? "YES" : "NO")")
                        if let routePolyline = tour.routePolyline {
                            print("   - Route polyline value: \(routePolyline)")
                            print("   - Route coordinates count: \(tour.routeCoordinates.count)")
                            if let firstCoord = tour.routeCoordinates.first {
                                print("   - First coordinate: \(firstCoord.latitude), \(firstCoord.longitude)")
                            }
                        }
                    }
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.isLoading = false
                }
                print("❌ Error loading tours: \(error)")
            }
        }
    }

    private func refreshTours() async {
        do {
            let fetchedTours = try await APIService.shared.fetchTours()
            await MainActor.run {
                self.tours = fetchedTours
                self.errorMessage = nil
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
            }
            print("Error refreshing tours: \(error)")
        }
    }

    private func centerMapOnTours() {
        print("🗺️ centerMapOnTours called")
        print("🗺️ filteredTours.isEmpty: \(filteredTours.isEmpty)")

        guard !filteredTours.isEmpty else {
            print("🗺️ No filtered tours to center on")
            return
        }

        var allCoordinates: [CLLocationCoordinate2D] = []

        // Collect starting points from all tours
        for tour in filteredTours {
            if let firstPoint = tour.points.first(where: { $0.order == 1 }) {
                print("🗺️ Using point #1 for tour: \(tour.displayTitle)")
                allCoordinates.append(firstPoint.location.clCoordinate)
            } else if let routeCoord = tour.routeCoordinates.first {
                print("🗺️ Using first route coordinate for tour: \(tour.displayTitle)")
                allCoordinates.append(routeCoord)
            } else {
                print("⚠️ No coordinates found for tour: \(tour.displayTitle)")
            }
        }

        print("🗺️ Total coordinates collected: \(allCoordinates.count)")

        guard !allCoordinates.isEmpty else {
            print("🗺️ No coordinates to center on")
            return
        }

        // Calculate bounding box
        let minLat = allCoordinates.map { $0.latitude }.min() ?? 0
        let maxLat = allCoordinates.map { $0.latitude }.max() ?? 0
        let minLon = allCoordinates.map { $0.longitude }.min() ?? 0
        let maxLon = allCoordinates.map { $0.longitude }.max() ?? 0

        let center = CLLocationCoordinate2D(
            latitude: (minLat + maxLat) / 2,
            longitude: (minLon + maxLon) / 2
        )

        let span = MKCoordinateSpan(
            latitudeDelta: max((maxLat - minLat) * 1.5, 0.01), // Add 50% padding, minimum 0.01
            longitudeDelta: max((maxLon - minLon) * 1.5, 0.01)
        )

        region = MKCoordinateRegion(center: center, span: span)
        print("🗺️ Map centered at: \(center.latitude), \(center.longitude)")
        print("🗺️ Span: \(span.latitudeDelta), \(span.longitudeDelta)")
    }
}

#Preview {
    DiscoveryView()
}
