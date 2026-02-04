package com.bandite.sonicwalkscape.services

import android.content.Context
import com.bandite.sonicwalkscape.data.api.ApiService
import com.bandite.sonicwalkscape.data.models.TourManifest
import com.bandite.sonicwalkscape.utils.Constants
import com.bandite.sonicwalkscape.utils.DebugLogger
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream

class TourDownloadManager(
    private val context: Context,
    private val apiService: ApiService
) {
    private val httpClient = OkHttpClient()

    private val _downloadProgress = MutableStateFlow(0f)
    val downloadProgress: StateFlow<Float> = _downloadProgress.asStateFlow()

    private val _isDownloading = MutableStateFlow(false)
    val isDownloading: StateFlow<Boolean> = _isDownloading.asStateFlow()

    private val _downloadError = MutableStateFlow<String?>(null)
    val downloadError: StateFlow<String?> = _downloadError.asStateFlow()

    private fun getTourDirectory(tourId: String): File {
        val dir = File(context.filesDir, "${Constants.TOURS_DIRECTORY}/$tourId")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    private fun getAudioDirectory(tourId: String): File {
        val dir = File(getTourDirectory(tourId), Constants.AUDIO_DIRECTORY)
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    private fun getSubtitlesDirectory(tourId: String): File {
        val dir = File(getTourDirectory(tourId), Constants.SUBTITLES_DIRECTORY)
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    private fun isFileValid(file: File, expectedSizeBytes: Long): Boolean {
        return file.exists() && file.length() == expectedSizeBytes
    }

    suspend fun downloadTour(tourId: String, language: String): Boolean {
        return withContext(Dispatchers.IO) {
            try {
                _isDownloading.value = true
                _downloadProgress.value = 0f
                _downloadError.value = null

                // Fetch manifest
                val response = apiService.getTourManifest(tourId, language)
                if (!response.isSuccessful) {
                    _downloadError.value = "Failed to fetch manifest: ${response.code()}"
                    return@withContext false
                }

                val manifest = response.body() ?: run {
                    _downloadError.value = "Empty manifest"
                    return@withContext false
                }

                val totalFiles = manifest.audio.size + manifest.subtitles.size
                var downloadedFiles = 0

                // Download audio files
                for (audioFile in manifest.audio) {
                    val file = File(getAudioDirectory(tourId), "${audioFile.pointId}.mp3")
                    if (!isFileValid(file, audioFile.fileSizeBytes)) {
                        downloadFile(audioFile.fileUrl, file, audioFile.fileSizeBytes)
                    }
                    downloadedFiles++
                    _downloadProgress.value = downloadedFiles.toFloat() / totalFiles
                }

                // Download subtitle files
                for (subtitleFile in manifest.subtitles) {
                    val file = File(getSubtitlesDirectory(tourId), "${subtitleFile.pointId}_${subtitleFile.language}.srt")
                    if (!isFileValid(file, subtitleFile.fileSizeBytes)) {
                        downloadFile(subtitleFile.fileUrl, file, subtitleFile.fileSizeBytes)
                    }
                    downloadedFiles++
                    _downloadProgress.value = downloadedFiles.toFloat() / totalFiles
                }

                _downloadProgress.value = 1f
                DebugLogger.network("Tour $tourId downloaded successfully")
                true
            } catch (e: Exception) {
                DebugLogger.e("Download failed", e)
                _downloadError.value = e.message
                false
            } finally {
                _isDownloading.value = false
            }
        }
    }

    private fun downloadFile(url: String, destination: File, expectedSizeBytes: Long) {
        val maxRetries = 3

        for (attempt in 1..maxRetries) {
            try {
                if (destination.exists()) {
                    destination.delete()
                }

                val request = Request.Builder().url(url).build()
                val response = httpClient.newCall(request).execute()

                if (!response.isSuccessful) {
                    throw Exception("Download failed: ${response.code}")
                }

                response.body?.byteStream()?.use { input ->
                    FileOutputStream(destination).use { output ->
                        input.copyTo(output)
                    }
                }

                val actualSize = destination.length()
                if (actualSize != expectedSizeBytes) {
                    destination.delete()
                    throw Exception("Size mismatch: expected $expectedSizeBytes, got $actualSize")
                }

                DebugLogger.network("Downloaded: ${destination.name} ($actualSize bytes)")
                return

            } catch (e: Exception) {
                DebugLogger.network("Download attempt $attempt failed: ${e.message}")
                if (destination.exists()) destination.delete()
                if (attempt == maxRetries) {
                    throw Exception("Download failed after $maxRetries attempts: ${destination.name}")
                }
            }
        }
    }

    fun getAudioFile(tourId: String, pointId: String): File? {
        val file = File(getAudioDirectory(tourId), "$pointId.mp3")
        return if (file.exists()) file else null
    }

    fun getSubtitleFile(tourId: String, pointId: String, language: String): File? {
        val file = File(getSubtitlesDirectory(tourId), "${pointId}_$language.srt")
        return if (file.exists()) file else null
    }

    fun isTourDownloaded(tourId: String): Boolean {
        val audioDir = getAudioDirectory(tourId)
        return audioDir.exists() && (audioDir.listFiles()?.isNotEmpty() == true)
    }

    fun deleteTour(tourId: String): Boolean {
        return try {
            val tourDir = getTourDirectory(tourId)
            tourDir.deleteRecursively()
            DebugLogger.network("Deleted tour: $tourId")
            true
        } catch (e: Exception) {
            DebugLogger.e("Failed to delete tour", e)
            false
        }
    }

    fun getDownloadedTourSize(tourId: String): Long {
        val tourDir = getTourDirectory(tourId)
        return tourDir.walkTopDown().filter { it.isFile }.sumOf { it.length() }
    }
}
