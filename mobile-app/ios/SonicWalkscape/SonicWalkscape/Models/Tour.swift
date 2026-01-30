import Foundation
import CoreLocation

struct Tour: Codable, Identifiable, Equatable {
    let id: String
    let slug: String
    let title: [String: String]
    let descriptionPreview: [String: String]
    let completionMessage: [String: String]?
    let busInfo: [String: String]?
    let city: String
    let durationMinutes: Int
    let distanceKm: Double
    let difficultyRaw: String
    let languages: [String]
    let isProtected: Bool
    let coverImageUrl: String?
    let coverTrailerUrl: String?
    let routePolyline: String?
    var points: [TourPoint] = []
    var isDownloaded: Bool = false

    // Computed properties for backward compatibility
    var displayTitle: String {
        title["en"] ?? title.values.first ?? "Untitled Tour"
    }

    var displayDescription: String {
        descriptionPreview["en"] ?? descriptionPreview.values.first ?? ""
    }

    var displayCompletionMessage: String? {
        completionMessage?["en"] ?? completionMessage?.values.first
    }

    var displayBusInfo: String? {
        busInfo?["en"] ?? busInfo?.values.first
    }

    var duration: TimeInterval {
        TimeInterval(durationMinutes * 60)
    }

    var distance: Double {
        distanceKm * 1000
    }

    // Keep category for UI filtering
    var category: Category {
        .history // Default, can be enhanced later
    }

    var difficulty: Difficulty {
        switch difficultyRaw {
        case "medio": return .moderate
        case "difficile": return .challenging
        default: return .easy
        }
    }

    var displayDifficulty: String {
        LocalizedStrings.shared.localizedDifficulty(difficultyRaw)
    }

    // Full image URL with base URL prepended
    var fullCoverImageUrl: String? {
        guard let coverImageUrl = coverImageUrl else { return nil }
        // If already absolute URL, return as is
        if coverImageUrl.hasPrefix("http://") || coverImageUrl.hasPrefix("https://") {
            return coverImageUrl
        }
        // Otherwise prepend base URL
        return "\(Constants.API.baseURL)\(coverImageUrl)"
    }

    // Full trailer URL with base URL prepended
    var fullCoverTrailerUrl: String? {
        guard let coverTrailerUrl = coverTrailerUrl else { return nil }
        // If already absolute URL, return as is
        if coverTrailerUrl.hasPrefix("http://") || coverTrailerUrl.hasPrefix("https://") {
            return coverTrailerUrl
        }
        // Otherwise prepend base URL
        return "\(Constants.API.baseURL)\(coverTrailerUrl)"
    }

    // Parse route polyline string into coordinates
    // Format: "lat1,lng1;lat2,lng2;lat3,lng3"
    var routeCoordinates: [CLLocationCoordinate2D] {
        guard let routePolyline = routePolyline, !routePolyline.isEmpty else {
            return []
        }

        return routePolyline.split(separator: ";").compactMap { pair in
            let components = pair.split(separator: ",")
            guard components.count == 2,
                  let lat = Double(components[0]),
                  let lng = Double(components[1]) else {
                return nil
            }
            return CLLocationCoordinate2D(latitude: lat, longitude: lng)
        }
    }

    enum Difficulty: String, Codable {
        case easy
        case moderate
        case challenging
    }

    enum Category: String, Codable {
        case history
        case nature
        case art
        case architecture
        case food
        case culture
    }

    enum CodingKeys: String, CodingKey {
        case id, slug, title, descriptionPreview, completionMessage, busInfo, city, durationMinutes, distanceKm, languages, isProtected
        case difficultyRaw = "difficulty"
        case coverImageUrl = "imageUrl"
        case coverTrailerUrl
        case routePolyline
    }

    // Manual initializer for creating Tour objects in code
    init(
        id: String,
        slug: String,
        title: [String: String],
        descriptionPreview: [String: String],
        completionMessage: [String: String]? = nil,
        busInfo: [String: String]? = nil,
        city: String,
        durationMinutes: Int,
        distanceKm: Double,
        difficultyRaw: String = "facile",
        languages: [String],
        isProtected: Bool,
        coverImageUrl: String? = nil,
        coverTrailerUrl: String? = nil,
        routePolyline: String? = nil,
        points: [TourPoint] = [],
        isDownloaded: Bool = false
    ) {
        self.id = id
        self.slug = slug
        self.title = title
        self.descriptionPreview = descriptionPreview
        self.completionMessage = completionMessage
        self.busInfo = busInfo
        self.city = city
        self.durationMinutes = durationMinutes
        self.distanceKm = distanceKm
        self.difficultyRaw = difficultyRaw
        self.languages = languages
        self.isProtected = isProtected
        self.coverImageUrl = coverImageUrl
        self.coverTrailerUrl = coverTrailerUrl
        self.routePolyline = routePolyline
        self.points = points
        self.isDownloaded = isDownloaded
    }

    // Custom decoder
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        id = try container.decode(String.self, forKey: .id)
        slug = try container.decode(String.self, forKey: .slug)
        title = try container.decode([String: String].self, forKey: .title)
        descriptionPreview = try container.decode([String: String].self, forKey: .descriptionPreview)
        completionMessage = try container.decodeIfPresent([String: String].self, forKey: .completionMessage)
        busInfo = try container.decodeIfPresent([String: String].self, forKey: .busInfo)
        city = try container.decode(String.self, forKey: .city)
        durationMinutes = try container.decode(Int.self, forKey: .durationMinutes)
        distanceKm = try container.decode(Double.self, forKey: .distanceKm)
        difficultyRaw = try container.decodeIfPresent(String.self, forKey: .difficultyRaw) ?? "facile"
        languages = try container.decode([String].self, forKey: .languages)
        isProtected = try container.decode(Bool.self, forKey: .isProtected)
        coverImageUrl = try container.decodeIfPresent(String.self, forKey: .coverImageUrl)
        coverTrailerUrl = try container.decodeIfPresent(String.self, forKey: .coverTrailerUrl)
        routePolyline = try container.decodeIfPresent(String.self, forKey: .routePolyline)

        points = []
        isDownloaded = false
    }

    // Custom encoder to match the decoder
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        try container.encode(id, forKey: .id)
        try container.encode(slug, forKey: .slug)
        try container.encode(title, forKey: .title)
        try container.encode(descriptionPreview, forKey: .descriptionPreview)
        try container.encodeIfPresent(completionMessage, forKey: .completionMessage)
        try container.encodeIfPresent(busInfo, forKey: .busInfo)
        try container.encode(city, forKey: .city)
        try container.encode(durationMinutes, forKey: .durationMinutes)
        try container.encode(distanceKm, forKey: .distanceKm)
        try container.encode(difficultyRaw, forKey: .difficultyRaw)
        try container.encode(languages, forKey: .languages)
        try container.encode(isProtected, forKey: .isProtected)
        try container.encodeIfPresent(coverImageUrl, forKey: .coverImageUrl)
        try container.encodeIfPresent(coverTrailerUrl, forKey: .coverTrailerUrl)
        try container.encodeIfPresent(routePolyline, forKey: .routePolyline)
    }

    // Manual Equatable implementation (required because we have custom Codable)
    static func == (lhs: Tour, rhs: Tour) -> Bool {
        return lhs.id == rhs.id &&
               lhs.slug == rhs.slug &&
               lhs.city == rhs.city &&
               lhs.durationMinutes == rhs.durationMinutes &&
               lhs.distanceKm == rhs.distanceKm &&
               lhs.difficultyRaw == rhs.difficultyRaw &&
               lhs.isProtected == rhs.isProtected
    }
}
