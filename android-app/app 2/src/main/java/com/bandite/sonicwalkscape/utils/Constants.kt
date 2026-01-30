package com.bandite.sonicwalkscape.utils

object Constants {

    object Api {
        const val BASE_URL = "https://walkspace-api.onrender.com/"
        const val CONNECT_TIMEOUT_SECONDS = 30L
        const val READ_TIMEOUT_SECONDS = 60L
        const val WRITE_TIMEOUT_SECONDS = 30L
        const val MAX_RETRIES = 3
    }

    object Location {
        const val DEFAULT_TRIGGER_RADIUS_METERS = 5.0 // Very generous trigger radius
        const val MIN_ACCURACY_METERS = 10.0
        const val DISTANCE_FILTER_METERS = 10f // Update every 10m of movement
        const val UPDATE_INTERVAL_MS = 5000L // 5 seconds
        const val FASTEST_UPDATE_INTERVAL_MS = 2000L // 2 seconds
    }

    object Audio {
        const val DEFAULT_VOLUME = 0.8f
        const val FADE_IN_DURATION_MS = 500L
        const val FADE_OUT_DURATION_MS = 500L
        const val PROGRESS_UPDATE_INTERVAL_MS = 100L
    }

    object Download {
        const val BUFFER_SIZE = 8192
        const val MAX_CONCURRENT_DOWNLOADS = 3
    }

    object Analytics {
        const val MAX_BATCH_SIZE = 10
        const val FLUSH_INTERVAL_SECONDS = 30L
        const val ANONYMOUS_ID_KEY = "anonymous_id"
    }

    object Preferences {
        const val PREFERENCES_NAME = "sonic_walkscape_prefs"
        const val KEY_PREFERRED_LANGUAGE = "preferred_language"
        const val KEY_NOTIFICATIONS_ENABLED = "notifications_enabled"
        const val KEY_AUTO_DOWNLOAD = "auto_download"
        const val KEY_ANALYTICS_ENABLED = "analytics_enabled"
        const val KEY_ONBOARDING_COMPLETED = "onboarding_completed"
        const val KEY_DOWNLOADED_TOURS = "downloaded_tours"
    }

    object Languages {
        const val ENGLISH = "en"
        const val ITALIAN = "it"
        const val FRENCH = "fr"

        val SUPPORTED = listOf(ENGLISH, ITALIAN, FRENCH)
        const val DEFAULT = ITALIAN
    }

    object Storage {
        const val TOURS_DIRECTORY = "tours"
        const val AUDIO_DIRECTORY = "audio"
        const val SUBTITLES_DIRECTORY = "subtitles"
        const val IMAGES_DIRECTORY = "images"
    }
}
