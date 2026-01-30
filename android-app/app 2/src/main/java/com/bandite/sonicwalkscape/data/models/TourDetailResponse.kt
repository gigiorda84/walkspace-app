package com.bandite.sonicwalkscape.data.models

/**
 * Response model for GET /tours/:id endpoint
 * This matches the backend TourDetailDto structure which returns single-language strings
 */
data class TourDetailResponse(
    val id: String,
    val slug: String,
    val title: String,  // Single language string (not dictionary)
    val description: String,  // Single language string (not dictionary)
    val completionMessage: String?,
    val busInfo: String?,
    val city: String,
    val durationMinutes: Int,
    val distanceKm: Double,
    val difficulty: String,
    val languages: List<String>,
    val isProtected: Boolean,
    val imageUrl: String?,
    val coverTrailerUrl: String?,
    val startingPoint: StartingPoint?,
    val routePolyline: String?,
    val downloadInfo: DownloadInfo,
    val hasAccess: Boolean
) {
    data class StartingPoint(
        val lat: Double?,
        val lng: Double?
    )

    data class DownloadInfo(
        val estimatedSizeMb: Int,
        val isDownloaded: Boolean
    )

    /**
     * Convert to Tour model format
     * @param language The language that was requested
     * @return Tour model with multi-language dictionaries
     */
    fun toTour(language: String): Tour {
        return Tour(
            id = id,
            slug = slug,
            title = mapOf(language to title),
            descriptionPreview = mapOf(language to description),
            completionMessage = completionMessage?.let { mapOf(language to it) },
            busInfo = busInfo?.let { mapOf(language to it) },
            city = city,
            durationMinutes = durationMinutes,
            distanceKm = distanceKm,
            difficultyRaw = difficulty,
            languages = languages,
            isProtected = isProtected,
            coverImageUrl = imageUrl,
            coverTrailerUrl = coverTrailerUrl,
            routePolyline = routePolyline,
            points = emptyList(),
            isDownloaded = downloadInfo.isDownloaded
        )
    }
}
