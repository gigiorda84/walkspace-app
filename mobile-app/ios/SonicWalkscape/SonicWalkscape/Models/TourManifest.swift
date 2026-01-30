//
//  TourManifest.swift
//  SonicWalkscape
//
//  Tour manifest model for audio, subtitles, and offline map data
//

import Foundation

struct TourManifest: Codable {
    let tourId: String
    let language: String
    let version: Int
    let audio: [AudioFile]
    let images: [ImageFile]
    let subtitles: [SubtitleFile]
    let offlineMap: OfflineMap?

    struct AudioFile: Codable {
        let pointId: String
        let order: Int
        let fileUrl: String
        let fileSizeBytes: Int
    }

    struct ImageFile: Codable {
        let pointId: String?
        let fileUrl: String
        let fileSizeBytes: Int
    }

    struct SubtitleFile: Codable {
        let pointId: String
        let language: String
        let fileUrl: String
        let fileSizeBytes: Int
    }

    struct OfflineMap: Codable {
        let tilesUrlTemplate: String
        let bounds: Bounds
        let recommendedZoomLevels: [Int]

        struct Bounds: Codable {
            let north: Double
            let south: Double
            let east: Double
            let west: Double
        }
    }
}
