package com.bandite.sonicwalkscape.services

import android.content.Context
import com.bandite.sonicwalkscape.data.api.ApiClient
import com.bandite.sonicwalkscape.data.api.ApiResult
import com.bandite.sonicwalkscape.data.api.safeApiCall
import com.bandite.sonicwalkscape.data.models.TourManifest
import com.bandite.sonicwalkscape.utils.Constants
import com.bandite.sonicwalkscape.utils.DebugLogger
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TourDownloadManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val apiClient: ApiClient,
    private val preferencesManager: UserPreferencesManager
) {
    private val httpClient = OkHttpClient()

    data class DownloadProgress(
        val currentFile: Int,
        val totalFiles: Int,
        val bytesDownloaded: Long,
        val totalBytes: Long,
        val currentFileName: String
    ) {
        val progressPercent: Float
            get() = if (totalFiles > 0) currentFile.toFloat() / totalFiles else 0f

        val bytesProgressPercent: Float
            get() = if (totalBytes > 0) bytesDownloaded.toFloat() / totalBytes else 0f
    }

    sealed class DownloadResult {
        object Success : DownloadResult()
        data class Error(val message: String) : DownloadResult()
    }

    // ========== Download Tour ==========

    fun downloadTour(tourId: String, language: String): Flow<DownloadProgress> = flow {
        DebugLogger.download("Starting download for tour $tourId, language: $language")

        // Fetch manifest
        val manifestResult = safeApiCall {
            apiClient.apiService.getTourManifest(tourId, language)
        }

        when (manifestResult) {
            is ApiResult.Error -> {
                throw Exception("Failed to fetch manifest: ${manifestResult.exception.message}")
            }
            is ApiResult.Success -> {
                val manifest = manifestResult.data
                downloadManifestFiles(tourId, language, manifest, this@flow)
            }
        }
    }

    private suspend fun downloadManifestFiles(
        tourId: String,
        language: String,
        manifest: TourManifest,
        flowCollector: kotlinx.coroutines.flow.FlowCollector<DownloadProgress>
    ) {
        val audioDir = getAudioDirectory(tourId, language)
        audioDir.mkdirs()

        val totalFiles = manifest.audio.size
        var currentFile = 0
        var totalBytesDownloaded = 0L
        val totalBytes = manifest.audio.sumOf { it.fileSizeBytes.toLong() }

        for (audioFile in manifest.audio.sortedBy { it.order }) {
            currentFile++

            val localFile = File(audioDir, "${audioFile.pointId}.mp3")

            // Skip if file already exists
            if (localFile.exists()) {
                DebugLogger.download("Skipping existing file: ${localFile.name}")
                totalBytesDownloaded += audioFile.fileSizeBytes
                flowCollector.emit(
                    DownloadProgress(
                        currentFile = currentFile,
                        totalFiles = totalFiles,
                        bytesDownloaded = totalBytesDownloaded,
                        totalBytes = totalBytes,
                        currentFileName = localFile.name
                    )
                )
                continue
            }

            // Download file
            val fileUrl = if (audioFile.fileUrl.startsWith("http")) {
                audioFile.fileUrl
            } else {
                "${Constants.Api.BASE_URL}${audioFile.fileUrl}"
            }

            DebugLogger.download("Downloading: ${audioFile.pointId} from $fileUrl")

            withContext(Dispatchers.IO) {
                downloadFile(fileUrl, localFile)
            }

            totalBytesDownloaded += audioFile.fileSizeBytes

            flowCollector.emit(
                DownloadProgress(
                    currentFile = currentFile,
                    totalFiles = totalFiles,
                    bytesDownloaded = totalBytesDownloaded,
                    totalBytes = totalBytes,
                    currentFileName = localFile.name
                )
            )
        }

        // Mark tour as downloaded
        val tourKey = "${tourId}_$language"
        preferencesManager.addDownloadedTour(tourKey)
        DebugLogger.download("Download complete for tour $tourId")
    }

    private fun downloadFile(url: String, destination: File) {
        val request = Request.Builder().url(url).build()
        val response = httpClient.newCall(request).execute()

        if (!response.isSuccessful) {
            throw Exception("Download failed: ${response.code}")
        }

        response.body?.let { body ->
            FileOutputStream(destination).use { outputStream ->
                body.byteStream().use { inputStream ->
                    val buffer = ByteArray(Constants.Download.BUFFER_SIZE)
                    var bytesRead: Int
                    while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                        outputStream.write(buffer, 0, bytesRead)
                    }
                }
            }
        } ?: throw Exception("Empty response body")
    }

    // ========== Delete Tour ==========

    suspend fun deleteTour(tourId: String, language: String) {
        val tourDir = getTourDirectory(tourId)
        if (tourDir.exists()) {
            tourDir.deleteRecursively()
            DebugLogger.download("Deleted tour directory: ${tourDir.absolutePath}")
        }

        val tourKey = "${tourId}_$language"
        preferencesManager.removeDownloadedTour(tourKey)
    }

    // ========== Local File Access ==========

    fun getLocalAudioUrl(tourId: String, language: String, pointId: String): File? {
        val file = File(getAudioDirectory(tourId, language), "$pointId.mp3")
        return if (file.exists()) file else null
    }

    fun isTourDownloaded(tourId: String, language: String): Boolean {
        val audioDir = getAudioDirectory(tourId, language)
        return audioDir.exists() && (audioDir.listFiles()?.isNotEmpty() == true)
    }

    // ========== Directory Management ==========

    private fun getTourDirectory(tourId: String): File {
        return File(context.filesDir, "${Constants.Storage.TOURS_DIRECTORY}/$tourId")
    }

    private fun getAudioDirectory(tourId: String, language: String): File {
        return File(
            getTourDirectory(tourId),
            "${Constants.Storage.AUDIO_DIRECTORY}/$language"
        )
    }

    fun getSubtitlesDirectory(tourId: String, language: String): File {
        return File(
            getTourDirectory(tourId),
            "${Constants.Storage.SUBTITLES_DIRECTORY}/$language"
        )
    }

    // ========== Storage Info ==========

    fun getDownloadedToursSize(): Long {
        val toursDir = File(context.filesDir, Constants.Storage.TOURS_DIRECTORY)
        return if (toursDir.exists()) {
            toursDir.walkTopDown().filter { it.isFile }.sumOf { it.length() }
        } else 0L
    }

    fun formatSize(bytes: Long): String {
        return when {
            bytes < 1024 -> "$bytes B"
            bytes < 1024 * 1024 -> "%.1f KB".format(bytes / 1024.0)
            bytes < 1024 * 1024 * 1024 -> "%.1f MB".format(bytes / (1024.0 * 1024.0))
            else -> "%.2f GB".format(bytes / (1024.0 * 1024.0 * 1024.0))
        }
    }
}
