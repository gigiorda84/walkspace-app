//
//  DiscoveryMapView.swift
//  SonicWalkscape
//
//  Discovery map showing all tour starting points with labels
//

import SwiftUI
import MapKit

// MARK: - Discovery Map View

struct DiscoveryMapView: View {
    let tours: [Tour]
    let onTourSelected: (Tour) -> Void
    @Binding var region: MKCoordinateRegion

    @StateObject private var preferencesManager = UserPreferencesManager.shared

    private var preferredLanguage: String {
        preferencesManager.preferredLanguage
    }

    var body: some View {
        DiscoveryMapViewRepresentable(
            tours: tours,
            region: $region,
            preferredLanguage: preferredLanguage,
            onTourSelected: onTourSelected
        )
    }
}

// MARK: - Tour Annotation

class TourStartPointAnnotation: NSObject, MKAnnotation {
    let tour: Tour
    let coordinate: CLLocationCoordinate2D
    let title: String?
    let tourName: String

    init(tour: Tour, coordinate: CLLocationCoordinate2D, title: String?, tourName: String) {
        self.tour = tour
        self.coordinate = coordinate
        self.title = title
        self.tourName = tourName
        super.init()
    }
}

// MARK: - MapKit UIViewRepresentable

struct DiscoveryMapViewRepresentable: UIViewRepresentable {
    let tours: [Tour]
    @Binding var region: MKCoordinateRegion
    let preferredLanguage: String
    let onTourSelected: (Tour) -> Void

    // Helper to get localized tour title
    private func getTourTitle(for tour: Tour) -> String {
        return tour.title[preferredLanguage] ?? tour.displayTitle
    }

    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView()
        mapView.delegate = context.coordinator
        mapView.showsUserLocation = true

        // Enable dark mode
        if #available(iOS 13.0, *) {
            mapView.overrideUserInterfaceStyle = .dark
        }

        return mapView
    }

    func updateUIView(_ mapView: MKMapView, context: Context) {
        // Only update region if it changed significantly and we didn't just set it
        // Use larger threshold (0.01 degrees ≈ 1km) to prevent animation loops
        let regionChanged: Bool
        if let lastSet = context.coordinator.lastSetRegion {
            let latDiff = abs(lastSet.center.latitude - region.center.latitude)
            let lonDiff = abs(lastSet.center.longitude - region.center.longitude)
            let latSpanDiff = abs(lastSet.span.latitudeDelta - region.span.latitudeDelta)
            let lonSpanDiff = abs(lastSet.span.longitudeDelta - region.span.longitudeDelta)
            regionChanged = latDiff > 0.01 || lonDiff > 0.01 || latSpanDiff > 0.01 || lonSpanDiff > 0.01
        } else {
            // First time, always set
            regionChanged = true
        }

        if regionChanged {
            print("🗺️ Region changed, updating map")
            mapView.setRegion(region, animated: true)
            context.coordinator.lastSetRegion = region
        }

        // Only update annotations if tours changed
        let currentAnnotationCount = mapView.annotations.filter { $0 is TourStartPointAnnotation }.count
        if currentAnnotationCount != tours.count || context.coordinator.lastTourCount != tours.count {
            print("🗺️ Tours changed, updating annotations (was: \(context.coordinator.lastTourCount), now: \(tours.count))")
            context.coordinator.lastTourCount = tours.count

            // Remove existing tour annotations (keep user location)
            let tourAnnotations = mapView.annotations.filter { $0 is TourStartPointAnnotation }
            mapView.removeAnnotations(tourAnnotations)

            // Add new tour annotations
            for tour in tours {
                let tourTitle = getTourTitle(for: tour)

                // Get the starting point (first point with order 1)
                if let firstPoint = tour.points.first(where: { $0.order == 1 }) {
                    let coordinate = firstPoint.location.clCoordinate
                    let annotation = TourStartPointAnnotation(
                        tour: tour,
                        coordinate: coordinate,
                        title: nil,
                        tourName: tourTitle
                    )
                    mapView.addAnnotation(annotation)
                } else if let routeCoords = tour.routeCoordinates.first {
                    let annotation = TourStartPointAnnotation(
                        tour: tour,
                        coordinate: routeCoords,
                        title: nil,
                        tourName: tourTitle
                    )
                    mapView.addAnnotation(annotation)
                }
            }
        }

        // Update coordinator's onTourSelected closure
        context.coordinator.onTourSelected = onTourSelected
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, MKMapViewDelegate {
        var onTourSelected: (Tour) -> Void
        var lastTourCount: Int = 0
        var lastSetRegion: MKCoordinateRegion?

        init(_ parent: DiscoveryMapViewRepresentable) {
            self.onTourSelected = parent.onTourSelected
        }

        // Custom annotation view with yellow label
        func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
            guard let tourAnnotation = annotation as? TourStartPointAnnotation else {
                return nil
            }

            let identifier = "TourAnnotation"
            var annotationView = mapView.dequeueReusableAnnotationView(withIdentifier: identifier)

            if annotationView == nil {
                annotationView = MKAnnotationView(annotation: annotation, reuseIdentifier: identifier)
                annotationView?.canShowCallout = false // No callout - direct tap navigation
            } else {
                annotationView?.annotation = annotation
                // Remove all existing subviews when reusing
                annotationView?.subviews.forEach { $0.removeFromSuperview() }
            }

            // Remove default pin image
            annotationView?.image = nil

            // Create custom label view
            let tourName = tourAnnotation.tourName
            let hostingController = UIHostingController(
                rootView: TourLabelView(tourName: tourName)
            )
            hostingController.view.backgroundColor = .clear

            // Size the view
            let size = hostingController.view.intrinsicContentSize
            hostingController.view.frame = CGRect(origin: .zero, size: size)

            // Add to annotation view
            annotationView?.addSubview(hostingController.view)
            annotationView?.bounds.size = size

            // Center offset to position label above the point
            annotationView?.centerOffset = CGPoint(x: 0, y: -size.height / 2)

            return annotationView
        }

        // Handle annotation tap - navigate directly to tour detail
        func mapView(_ mapView: MKMapView, didSelect view: MKAnnotationView) {
            guard let tourAnnotation = view.annotation as? TourStartPointAnnotation else {
                return
            }

            // Deselect immediately (no callout to show)
            mapView.deselectAnnotation(view.annotation, animated: false)

            // Navigate to tour detail
            onTourSelected(tourAnnotation.tour)
        }
    }
}

// MARK: - Tour Label View

struct TourLabelView: View {
    let tourName: String

    var body: some View {
        VStack(spacing: 2) {
            // Point marker
            Circle()
                .fill(Color.brandYellow)
                .frame(width: 12, height: 12)

            // Tour name label
            Text(tourName)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.black)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.brandYellow)
                .cornerRadius(8)
                .shadow(color: .black.opacity(0.3), radius: 2, x: 0, y: 1)
        }
    }
}

