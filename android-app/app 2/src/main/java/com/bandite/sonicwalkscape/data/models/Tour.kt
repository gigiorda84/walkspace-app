package com.bandite.sonicwalkscape.data.models

import com.google.android.gms.maps.model.LatLng
import com.google.gson.annotations.SerializedName

data class Tour(
    val id: String,
    val slug: String,
    val title: Map<String, String>,
    val descriptionPreview: Map<String, String>,
    val completionMessage: Map<String, String>? = null,
    val busInfo: Map<String, String>? = null,
    val city: String,
    val durationMinutes: Int,
    val distanceKm: Double,
    @SerializedName("difficulty")
    val difficultyRaw: String = "facile",
    val languages: List<String>,
    val isProtected: Boolean,
    @SerializedName("imageUrl")
    val coverImageUrl: String? = null,
    val coverTrailerUrl: String? = null,
    val routePolyline: String? = null,
    var points: List<TourPoint> = emptyList(),
    var isDownloaded: Boolean = false
) {
    // Display properties with language fallback
    fun getDisplayTitle(language: String = "en"): String {
        return title[language] ?: title.values.firstOrNull() ?: "Untitled Tour"
    }

    fun getDisplayDescription(language: String = "en"): String {
        return descriptionPreview[language] ?: descriptionPreview.values.firstOrNull() ?: ""
    }

    fun getDisplayCompletionMessage(language: String = "en"): String? {
        return completionMessage?.get(language) ?: completionMessage?.values?.firstOrNull()
    }

    fun getDisplayBusInfo(language: String = "en"): String? {
        return busInfo?.get(language) ?: busInfo?.values?.firstOrNull()
    }

    // Duration in seconds
    val durationSeconds: Long
        get() = durationMinutes * 60L

    // Distance in meters
    val distanceMeters: Double
        get() = distanceKm * 1000

    val difficulty: Difficulty
        get() = when (difficultyRaw) {
            "medio" -> Difficulty.MODERATE
            "difficile" -> Difficulty.CHALLENGING
            else -> Difficulty.EASY
        }

    // Full image URL with base URL prepended
    fun getFullCoverImageUrl(baseUrl: String): String? {
        val url = coverImageUrl ?: return null
        return if (url.startsWith("http://") || url.startsWith("https://")) {
            url
        } else {
            "$baseUrl$url"
        }
    }

    // Full trailer URL with base URL prepended
    fun getFullCoverTrailerUrl(baseUrl: String): String? {
        val url = coverTrailerUrl ?: return null
        return if (url.startsWith("http://") || url.startsWith("https://")) {
            url
        } else {
            "$baseUrl$url"
        }
    }

    // Parse route polyline string into coordinates
    // Format: "lat1,lng1;lat2,lng2;lat3,lng3"
    val routeCoordinates: List<LatLng>
        get() {
            val polyline = routePolyline ?: return emptyList()
            if (polyline.isEmpty()) return emptyList()

            return polyline.split(";").mapNotNull { pair ->
                val components = pair.split(",")
                if (components.size == 2) {
                    val lat = components[0].toDoubleOrNull()
                    val lng = components[1].toDoubleOrNull()
                    if (lat != null && lng != null) {
                        LatLng(lat, lng)
                    } else null
                } else null
            }
        }

    enum class Difficulty {
        EASY,
        MODERATE,
        CHALLENGING
    }

    enum class Category {
        HISTORY,
        NATURE,
        ART,
        ARCHITECTURE,
        FOOD,
        CULTURE
    }
}
