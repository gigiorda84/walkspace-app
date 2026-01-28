package com.bandite.sonicwalkscape.data.models

data class TourManifest(
    val tourId: String,
    val language: String,
    val version: Int,
    val audio: List<AudioFile>,
    val images: List<ImageFile>,
    val subtitles: List<SubtitleFile>,
    val offlineMap: OfflineMap? = null
) {
    data class AudioFile(
        val pointId: String,
        val order: Int,
        val fileUrl: String,
        val fileSizeBytes: Long
    )

    data class ImageFile(
        val pointId: String,
        val fileUrl: String,
        val fileSizeBytes: Long
    )

    data class SubtitleFile(
        val pointId: String,
        val language: String,
        val fileUrl: String,
        val fileSizeBytes: Long
    )

    data class OfflineMap(
        val tilesUrlTemplate: String,
        val bounds: Bounds,
        val recommendedZoomLevels: List<Int>
    ) {
        data class Bounds(
            val north: Double,
            val south: Double,
            val east: Double,
            val west: Double
        )
    }

    val totalSizeBytes: Long
        get() = audio.sumOf { it.fileSizeBytes } +
                images.sumOf { it.fileSizeBytes } +
                subtitles.sumOf { it.fileSizeBytes }
}
