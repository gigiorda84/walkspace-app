import Foundation

struct User: Codable, Identifiable {
    let id: UUID
    var email: String
    var name: String
    var profileImageURL: String?
    var preferences: UserPreferences
    var createdAt: Date

    init(id: UUID = UUID(), email: String, name: String, profileImageURL: String? = nil, preferences: UserPreferences = UserPreferences(), createdAt: Date = Date()) {
        self.id = id
        self.email = email
        self.name = name
        self.profileImageURL = profileImageURL
        self.preferences = preferences
        self.createdAt = createdAt
    }
}

struct UserPreferences: Codable {
    var notificationsEnabled: Bool = true
    var autoDownloadTours: Bool = false
    var preferredLanguage: String = "it"
    var analyticsEnabled: Bool = true  // GDPR: anonymous analytics consent

    init(notificationsEnabled: Bool = true, autoDownloadTours: Bool = false, preferredLanguage: String = "it", analyticsEnabled: Bool = true) {
        self.notificationsEnabled = notificationsEnabled
        self.autoDownloadTours = autoDownloadTours
        self.preferredLanguage = preferredLanguage
        self.analyticsEnabled = analyticsEnabled
    }
}
