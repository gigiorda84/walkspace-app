import Foundation
import Combine

class UserPreferencesManager: ObservableObject {
    static let shared = UserPreferencesManager()

    @Published var preferences: UserPreferences {
        didSet {
            savePreferences()
        }
    }

    private let preferencesKey = "userPreferences"

    private init() {
        // Load preferences from UserDefaults
        if let data = UserDefaults.standard.data(forKey: preferencesKey),
           let decoded = try? JSONDecoder().decode(UserPreferences.self, from: data) {
            self.preferences = decoded
        } else {
            // First launch - detect system language
            let systemLanguage = Self.detectSystemLanguage()
            self.preferences = UserPreferences(preferredLanguage: systemLanguage)
            savePreferences()
        }
    }

    /// Detects the phone's system language and returns a supported language code
    private static func detectSystemLanguage() -> String {
        let preferredLanguages = Locale.preferredLanguages
        for language in preferredLanguages {
            let code = String(language.prefix(2)).lowercased()
            if code == "it" || code == "fr" || code == "en" {
                return code
            }
        }
        // Default to Italian if no supported language found
        return "it"
    }

    private func savePreferences() {
        if let encoded = try? JSONEncoder().encode(preferences) {
            UserDefaults.standard.set(encoded, forKey: preferencesKey)
        }
    }

    // Convenience accessors
    var preferredLanguage: String {
        get { preferences.preferredLanguage }
        set {
            preferences.preferredLanguage = newValue
        }
    }

    var notificationsEnabled: Bool {
        get { preferences.notificationsEnabled }
        set {
            preferences.notificationsEnabled = newValue
        }
    }

    var autoDownloadTours: Bool {
        get { preferences.autoDownloadTours }
        set {
            preferences.autoDownloadTours = newValue
        }
    }

    var analyticsEnabled: Bool {
        get { preferences.analyticsEnabled }
        set {
            preferences.analyticsEnabled = newValue
        }
    }
}
