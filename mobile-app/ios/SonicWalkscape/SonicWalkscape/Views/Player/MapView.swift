//
//  MapView.swift
//  SonicWalkscape
//
//  Displays tour route, points, and user location on a map
//

import SwiftUI
import MapKit

struct MapView: View {
    let tour: Tour
    let tourPoints: [TourPoint]
    @Binding var currentPointIndex: Int
    @Binding var userLocation: CLLocationCoordinate2D?
    let onPointTapped: (TourPoint) -> Void

    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 45.464203, longitude: 9.189982),
        span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
    )

    var body: some View {
        MapViewRepresentable(
            tour: tour,
            tourPoints: tourPoints,
            currentPointIndex: currentPointIndex,
            region: $region,
            onPointTapped: onPointTapped
        )
        .onAppear {
            centerMapOnTour()
        }
        .onChange(of: tourPoints) { _ in
            centerMapOnTour()
        }
    }

    private func centerMapOnTour() {
        guard !tourPoints.isEmpty else { return }

        // Calculate bounding box of all points
        let coordinates = tourPoints.map { $0.location.clCoordinate }

        let minLat = coordinates.map { $0.latitude }.min() ?? 0
        let maxLat = coordinates.map { $0.latitude }.max() ?? 0
        let minLon = coordinates.map { $0.longitude }.min() ?? 0
        let maxLon = coordinates.map { $0.longitude }.max() ?? 0

        let center = CLLocationCoordinate2D(
            latitude: (minLat + maxLat) / 2,
            longitude: (minLon + maxLon) / 2
        )

        let span = MKCoordinateSpan(
            latitudeDelta: (maxLat - minLat) * 1.4, // Add 40% padding
            longitudeDelta: (maxLon - minLon) * 1.4
        )

        region = MKCoordinateRegion(center: center, span: span)
    }
}

// MARK: - MapKit UIViewRepresentable with Circles

struct MapViewRepresentable: UIViewRepresentable {
    let tour: Tour
    let tourPoints: [TourPoint]
    let currentPointIndex: Int
    @Binding var region: MKCoordinateRegion
    let onPointTapped: (TourPoint) -> Void

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
        // Update parent reference in coordinator to get latest currentPointIndex
        context.coordinator.parent = self

        // Update region
        mapView.setRegion(region, animated: true)

        // Remove existing overlays and annotations
        mapView.removeOverlays(mapView.overlays)
        mapView.removeAnnotations(mapView.annotations.filter { !($0 is MKUserLocation) })

        // Add route polyline if available
        let routeCoordinates = tour.routeCoordinates
        if !routeCoordinates.isEmpty {
            let polyline = MKPolyline(coordinates: routeCoordinates, count: routeCoordinates.count)
            mapView.addOverlay(polyline)
        }

        // Add circles and annotations for each point
        for point in tourPoints {
            // Add circle overlay for trigger radius
            let circle = MKCircle(
                center: point.location.clCoordinate,
                radius: point.triggerRadiusMeters
            )
            mapView.addOverlay(circle)

            // Add point annotation
            let annotation = PointAnnotation(point: point, currentPointIndex: currentPointIndex)
            mapView.addAnnotation(annotation)
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, MKMapViewDelegate {
        var parent: MapViewRepresentable

        init(_ parent: MapViewRepresentable) {
            self.parent = parent
        }

        // Render circles and polylines with appropriate colors
        func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            // Handle route polyline
            if let polyline = overlay as? MKPolyline {
                let renderer = MKPolylineRenderer(polyline: polyline)
                renderer.strokeColor = UIColor(red: 0x66/255.0, green: 0x00/255.0, blue: 0x14/255.0, alpha: 1.0)
                renderer.lineWidth = 4
                return renderer
            }

            // Handle trigger radius circles
            guard let circle = overlay as? MKCircle else {
                return MKOverlayRenderer(overlay: overlay)
            }

            let renderer = MKCircleRenderer(circle: circle)

            // Find the point for this circle to determine its state
            let circleCoord = circle.coordinate
            if let point = parent.tourPoints.first(where: {
                $0.location.clCoordinate.latitude == circleCoord.latitude &&
                $0.location.clCoordinate.longitude == circleCoord.longitude
            }) {
                let isPassed = point.order < parent.currentPointIndex + 1
                let isCurrent = point.order == parent.currentPointIndex + 1

                if isPassed {
                    // Gray for passed points
                    renderer.fillColor = UIColor.gray.withAlphaComponent(0.15)
                    renderer.strokeColor = UIColor.gray.withAlphaComponent(0.3)
                } else if isCurrent {
                    // Orange for current/active point
                    renderer.fillColor = UIColor.systemOrange.withAlphaComponent(0.2)
                    renderer.strokeColor = UIColor.systemOrange.withAlphaComponent(0.5)
                } else {
                    // Dark red (#660014) for future/unvisited points
                    let darkRed = UIColor(red: 0x66/255.0, green: 0x00/255.0, blue: 0x14/255.0, alpha: 1.0)
                    renderer.fillColor = darkRed.withAlphaComponent(0.15)
                    renderer.strokeColor = darkRed.withAlphaComponent(0.3)
                }
            } else {
                // Default color
                renderer.fillColor = UIColor.systemBlue.withAlphaComponent(0.15)
                renderer.strokeColor = UIColor.systemBlue.withAlphaComponent(0.3)
            }

            renderer.lineWidth = 2
            return renderer
        }

        // Custom annotation view
        func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
            guard let pointAnnotation = annotation as? PointAnnotation else {
                return nil
            }

            let identifier = "PointAnnotation"
            var annotationView = mapView.dequeueReusableAnnotationView(withIdentifier: identifier)

            if annotationView == nil {
                annotationView = MKAnnotationView(annotation: annotation, reuseIdentifier: identifier)
                annotationView?.canShowCallout = false
            } else {
                annotationView?.annotation = annotation
                // Remove all existing subviews when reusing
                annotationView?.subviews.forEach { $0.removeFromSuperview() }
            }

            // Remove default pin image
            annotationView?.image = nil

            // Create custom view using SwiftUI
            let point = pointAnnotation.point
            let isCurrent = point.order == parent.currentPointIndex + 1
            let isPassed = point.order < parent.currentPointIndex + 1

            let hostingController = UIHostingController(
                rootView: PointAnnotationView(
                    point: point,
                    isActive: isCurrent,
                    isCurrent: isCurrent,
                    isPassed: isPassed
                )
            )
            hostingController.view.backgroundColor = .clear

            // Size the hosting view appropriately
            let size = hostingController.view.intrinsicContentSize
            hostingController.view.frame = CGRect(origin: .zero, size: size)

            // Add to annotation view and center it
            annotationView?.addSubview(hostingController.view)
            annotationView?.bounds.size = size

            // The view is now just a 32x32 circle, so its center is already aligned
            // No offset needed - the center of the view IS the center of the circle
            annotationView?.centerOffset = CGPoint.zero

            return annotationView
        }
    }
}

// Custom annotation class to hold point data
class PointAnnotation: NSObject, MKAnnotation {
    let point: TourPoint
    let currentPointIndex: Int
    var coordinate: CLLocationCoordinate2D {
        point.location.clCoordinate
    }

    init(point: TourPoint, currentPointIndex: Int) {
        self.point = point
        self.currentPointIndex = currentPointIndex
    }
}

/// Custom annotation view for tour points
struct PointAnnotationView: View {
    let point: TourPoint
    let isActive: Bool
    let isCurrent: Bool
    let isPassed: Bool

    var body: some View {
        ZStack {
            // Pin background
            Circle()
                .fill(isPassed ? Color.brandMuted : (isCurrent ? Color.brandYellow : Color.brandPurple))
                .frame(width: 32, height: 32)

            // Point number
            Text("\(point.order)")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.white)
        }
    }
}

#Preview {
    let sampleTour = Tour(
        id: "sample-tour",
        slug: "test-tour",
        title: ["en": "Test Tour"],
        descriptionPreview: ["en": "A sample tour"],
        completionMessage: nil,
        city: "Milan",
        durationMinutes: 30,
        distanceKm: 2.0,
        languages: ["en"],
        isProtected: false,
        coverImageUrl: nil,
        routePolyline: "45.464203,9.189982;45.465203,9.190982",
        points: [],
        isDownloaded: false
    )

    return MapView(
        tour: sampleTour,
        tourPoints: [
            TourPoint(
                id: "1",
                order: 1,
                title: "Historic Square",
                description: "Starting point",
                location: TourPoint.Location(lat: 45.464203, lng: 9.189982),
                triggerRadiusMeters: 150
            ),
            TourPoint(
                id: "2",
                order: 2,
                title: "Cathedral",
                description: "Second point",
                location: TourPoint.Location(lat: 45.465203, lng: 9.190982),
                triggerRadiusMeters: 150
            )
        ],
        currentPointIndex: .constant(0),
        userLocation: .constant(nil),
        onPointTapped: { _ in }
    )
}
