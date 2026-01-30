package com.bandite.sonicwalkscape.data.models

data class TourManifest(
    val tourId: String,
    val language: String,
    val version: Int,
    val audio: List<AudioFile>,
    val images: List<ImageFile>,
    val subtitles: List<SubtitleFile>,
    val offlineMap: OfflineMap?
) {
    data class AudioFile(
        val pointId: String,
        val order: Int,
        val fileUrl: String,
        val fileSizeBytes: Int
    )

    data class ImageFile(
        val pointId: String?,
        val fileUrl: String,
        val fileSizeBytes: Int
    )

    data class SubtitleFile(
        val pointId: String,
        val language: String,
        val fileUrl: String,
        val fileSizeBytes: Int
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

    // Calculate total download size
    val totalSizeBytes: Long
        get() {
            val audioSize = audio.sumOf { it.fileSizeBytes.toLong() }
            val imageSize = images.sumOf { it.fileSizeBytes.toLong() }
            val subtitleSize = subtitles.sumOf { it.fileSizeBytes.toLong() }
            return audioSize + imageSize + subtitleSize
        }

    val totalSizeMb: Double
        get() = totalSizeBytes / (1024.0 * 1024.0)
}
