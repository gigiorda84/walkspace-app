package com.bandite.sonicwalkscape.data.models

import com.google.gson.annotations.SerializedName

data class TourDetailResponse(
    val id: String,
    val slug: String,
    val title: String,
    val description: String,
    val completionMessage: String? = null,
    val busInfo: String? = null,
    val city: String,
    val durationMinutes: Int,
    val distanceKm: Double,
    val languages: List<String>,
    val isProtected: Boolean,
    @SerializedName("imageUrl")
    val coverImageUrl: String?,
    val coverTrailerUrl: String?,
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
