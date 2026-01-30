package com.bandite.sonicwalkscape.data.models

import com.google.gson.annotations.SerializedName

data class Tour(
    val id: String,
    val slug: String,
    val title: Map<String, String>,
    val descriptionPreview: Map<String, String>,
    val city: String,
    val durationMinutes: Int,
    val distanceKm: Double,
    @SerializedName("difficulty")
    val difficultyRaw: String = "moderate",
    val languages: List<String>,
    val isProtected: Boolean,
    @SerializedName("imageUrl")
    val coverImageUrl: String? = null,
    val coverTrailerUrl: String? = null,
    val routePolyline: String? = null,
    var points: List<TourPoint>? = null,
    var isDownloaded: Boolean = false
) {
    enum class Difficulty {
        EASY, MODERATE, CHALLENGING;

        companion object {
            fun fromString(value: String): Difficulty {
                return when (value.lowercase()) {
                    "easy" -> EASY
                    "challenging" -> CHALLENGING
                    else -> MODERATE
                }
            }
        }
    }

    val difficulty: Difficulty
        get() = Difficulty.fromString(difficultyRaw)

    val durationSeconds: Long
        get() = durationMinutes * 60L

    val distanceMeters: Double
        get() = distanceKm * 1000

    fun getDisplayTitle(language: String = "en"): String {
        return title[language] ?: title["en"] ?: title.values.firstOrNull() ?: ""
    }

    fun getDisplayDescription(language: String = "en"): String {
        return descriptionPreview[language] ?: descriptionPreview["en"] ?: descriptionPreview.values.firstOrNull() ?: ""
    }

    fun getFullCoverImageUrl(baseUrl: String): String? {
        return coverImageUrl?.let {
            if (it.startsWith("http")) it else "$baseUrl$it"
        }
    }
}
