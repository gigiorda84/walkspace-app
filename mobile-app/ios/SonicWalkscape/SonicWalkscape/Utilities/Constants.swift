import Foundation

enum Constants {
    enum API {
        // Production backend on Render
        static let baseURL = "https://walkspace-api.onrender.com"
        static let version = ""

        static var fullURL: String {
            baseURL
        }
    }

    enum Storage {
        static let userKey = "current_user"
        static let audioSettingsKey = "audio_settings"
        static let downloadedToursKey = "downloaded_tours"
    }

    enum Location {
        static let defaultTriggerRadius: Double = 5.0
        static let minimumAccuracy: Double = 10.0
    }

    enum Audio {
        static let defaultVolume: Float = 0.8
        static let fadeInDuration: TimeInterval = 2.0
        static let fadeOutDuration: TimeInterval = 1.5
    }
}
