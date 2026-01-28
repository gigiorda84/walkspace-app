package com.bandite.sonicwalkscape.data.models

data class TourDetailResponse(
    val id: String,
    val slug: String,
    val title: String,
    val description: String,
    val city: String,
    val durationMinutes: Int,
    val distanceKm: Double,
    val languages: List<String>,
    val isProtected: Boolean,
    val coverImageUrl: String?,
    val startingPoint: StartingPoint?,
    val routePolyline: String?,
    val downloadInfo: DownloadInfo?,
    val points: List<TourPoint> = emptyList()
) {
    data class StartingPoint(
        val lat: Double,
        val lng: Double
    )

    data class DownloadInfo(
        val estimatedSizeMb: Int,
        val isDownloaded: Boolean
    )
}
