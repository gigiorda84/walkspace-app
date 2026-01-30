import Foundation
import CoreLocation

struct TourPoint: Codable, Identifiable, Equatable {
    let id: String
    let order: Int
    let title: String
    let description: String
    let location: Location
    let triggerRadiusMeters: Double

    // Backward compatibility
    var coordinate: Coordinate {
        Coordinate(latitude: location.lat, longitude: location.lng)
    }

    var triggerRadius: Double {
        triggerRadiusMeters
    }

    struct Location: Codable, Equatable {
        let lat: Double
        let lng: Double

        var clCoordinate: CLLocationCoordinate2D {
            CLLocationCoordinate2D(latitude: lat, longitude: lng)
        }
    }
}

struct Coordinate: Codable, Equatable {
    var latitude: Double
    var longitude: Double

    var clCoordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    init(latitude: Double, longitude: Double) {
        self.latitude = latitude
        self.longitude = longitude
    }

    init(from coordinate: CLLocationCoordinate2D) {
        self.latitude = coordinate.latitude
        self.longitude = coordinate.longitude
    }
}
