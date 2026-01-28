package com.bandite.sonicwalkscape.utils

object Constants {
    // API Configuration
    const val API_BASE_URL = "https://walkspace-api.onrender.com/"

    // Storage paths
    const val TOURS_DIRECTORY = "tours"
    const val AUDIO_DIRECTORY = "audio"
    const val IMAGES_DIRECTORY = "images"
    const val SUBTITLES_DIRECTORY = "subtitles"

    // Location
    const val DEFAULT_TRIGGER_RADIUS_METERS = 150
    const val LOCATION_UPDATE_INTERVAL_MS = 5000L
    const val LOCATION_FASTEST_INTERVAL_MS = 2000L
    const val LOCATION_MIN_DISPLACEMENT_METERS = 5f

    // Audio
    const val AUDIO_DUCK_VOLUME = 0.2f
    const val AUDIO_FULL_VOLUME = 1.0f

    // Notifications
    const val NOTIFICATION_CHANNEL_ID = "tour_playback"
    const val NOTIFICATION_CHANNEL_NAME = "Tour Playback"
    const val NOTIFICATION_ID = 1

    // Analytics
    const val ANALYTICS_BATCH_SIZE = 10
    const val ANALYTICS_FLUSH_INTERVAL_MS = 60000L

    // Supported Languages
    val SUPPORTED_LANGUAGES = listOf("en", "it", "fr")
    const val DEFAULT_LANGUAGE = "en"

    // SharedPreferences/DataStore keys
    const val PREFS_NAME = "sonic_walkscape_prefs"
    const val KEY_ONBOARDING_COMPLETED = "onboarding_completed"
    const val KEY_PREFERRED_LANGUAGE = "preferred_language"
    const val KEY_ANALYTICS_ENABLED = "analytics_enabled"
    const val KEY_NOTIFICATIONS_ENABLED = "notifications_enabled"
    const val KEY_AUTO_DOWNLOAD_ENABLED = "auto_download_enabled"
    const val KEY_DOWNLOADED_TOURS = "downloaded_tours"
    const val KEY_AUTH_TOKEN = "auth_token"
    const val KEY_REFRESH_TOKEN = "refresh_token"
    const val KEY_USER_ID = "user_id"
    const val KEY_ANONYMOUS_ID = "anonymous_id"
}
