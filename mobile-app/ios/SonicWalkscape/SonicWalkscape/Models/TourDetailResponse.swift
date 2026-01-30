import Foundation
import CoreLocation

/// Response model for GET /tours/:id endpoint
/// This matches the backend TourDetailDto structure which returns single-language strings
struct TourDetailResponse: Codable {
    let id: String
    let slug: String
    let title: String  // Single language string (not dictionary)
    let description: String  // Single language string (not dictionary)
    let completionMessage: String?
    let busInfo: String?
    let city: String
    let durationMinutes: Int
    let distanceKm: Double
    let difficulty: String
    let languages: [String]
    let isProtected: Bool
    let imageUrl: String?
    let coverTrailerUrl: String?
    let startingPoint: StartingPoint?
    let routePolyline: String?
    let downloadInfo: DownloadInfo
    let hasAccess: Bool

    struct StartingPoint: Codable {
        let lat: Double?
        let lng: Double?
    }

    struct DownloadInfo: Codable {
        let estimatedSizeMb: Int
        let isDownloaded: Bool
    }

    /// Convert to Tour model format
    /// - Parameter currentLanguage: The language that was requested
    /// - Returns: Tour model with multi-language dictionaries
    func toTour(language: String) -> Tour {
        return Tour(
            id: id,
            slug: slug,
            title: [language: title],
            descriptionPreview: [language: description],
            completionMessage: completionMessage != nil ? [language: completionMessage!] : nil,
            busInfo: busInfo != nil ? [language: busInfo!] : nil,
            city: city,
            durationMinutes: durationMinutes,
            distanceKm: distanceKm,
            difficultyRaw: difficulty,
            languages: languages,
            isProtected: isProtected,
            coverImageUrl: imageUrl,
            coverTrailerUrl: coverTrailerUrl,
            routePolyline: routePolyline,
            points: [],
            isDownloaded: downloadInfo.isDownloaded
        )
    }
}
