package com.bandite.sonicwalkscape.ui.player

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bandite.sonicwalkscape.data.api.ApiService
import com.bandite.sonicwalkscape.data.models.Tour
import com.bandite.sonicwalkscape.data.models.TourManifest
import com.bandite.sonicwalkscape.data.models.TourPoint
import com.bandite.sonicwalkscape.services.*
import com.bandite.sonicwalkscape.utils.Constants
import com.bandite.sonicwalkscape.utils.DebugLogger
import com.bandite.sonicwalkscape.utils.SubtitleCue
import com.bandite.sonicwalkscape.utils.SubtitleParser
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.net.URL
import javax.inject.Inject

@HiltViewModel
class PlayerViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val apiService: ApiService,
    private val userPreferencesManager: UserPreferencesManager,
    private val locationManager: LocationManager,
    val audioPlayerManager: AudioPlayerManager,
    private val tourDownloadManager: TourDownloadManager,
    private val analyticsService: AnalyticsService
) : ViewModel() {

    private val _tour = MutableStateFlow<Tour?>(null)
    val tour: StateFlow<Tour?> = _tour.asStateFlow()

    private val _tourPoints = MutableStateFlow<List<TourPoint>>(emptyList())
    val tourPoints: StateFlow<List<TourPoint>> = _tourPoints.asStateFlow()

    private val _currentPoint = MutableStateFlow<TourPoint?>(null)
    val currentPoint: StateFlow<TourPoint?> = _currentPoint.asStateFlow()

    private val _isTourComplete = MutableStateFlow(false)
    val isTourComplete: StateFlow<Boolean> = _isTourComplete.asStateFlow()

    // Subtitle state
    private val _currentSubtitle = MutableStateFlow<String?>(null)
    val currentSubtitle: StateFlow<String?> = _currentSubtitle.asStateFlow()

    private val _subtitlesEnabled = MutableStateFlow(true)
    val subtitlesEnabled: StateFlow<Boolean> = _subtitlesEnabled.asStateFlow()

    private var currentSubtitleCues: List<SubtitleCue> = emptyList()
    private var subtitleUrlsByPointId: Map<String, String> = emptyMap()
    private var audioUrlsByPointId: Map<String, String> = emptyMap()
    private var subtitleSyncJob: Job? = null
    private var currentLanguage: String = "en"

    val currentLocation = locationManager.currentLocation
    val currentPointIndex = locationManager.currentPointIndex
    val distanceToNextPoint = locationManager.distanceToNextPoint
    val isPlaying = audioPlayerManager.isPlaying
    val currentPosition = audioPlayerManager.currentPosition
    val duration = audioPlayerManager.duration

    val preferredLanguage: Flow<String> = userPreferencesManager.preferredLanguage

    private var playbackService: TourPlaybackService? = null
    private var serviceBound = false

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as TourPlaybackService.LocalBinder
            playbackService = binder.getService()
            serviceBound = true
            DebugLogger.d("Service connected")
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            playbackService = null
            serviceBound = false
            DebugLogger.d("Service disconnected")
        }
    }

    init {
        setupCallbacks()
    }

    private fun setupCallbacks() {
        locationManager.onPointTriggered = { point ->
            _currentPoint.value = point
            loadSubtitlesForPoint(point.id)
            playPointAudio(point)
            viewModelScope.launch {
                _tour.value?.let { tour ->
                    analyticsService.trackPointTriggered(tour.id, point.id)
                }
            }
        }

        audioPlayerManager.onPlaybackCompleted = {
            locationManager.advanceToNextPoint()
            if (!locationManager.hasMorePoints) {
                _isTourComplete.value = true
                stopSubtitleSync()
                viewModelScope.launch {
                    _tour.value?.let { tour ->
                        analyticsService.trackTourCompleted(tour.id)
                    }
                }
            }
        }
    }

    fun loadAndStartTour(tourId: String, language: String? = null) {
        viewModelScope.launch {
            try {
                val lang = language ?: userPreferencesManager.preferredLanguage.first()
                currentLanguage = lang

                // Load tour and points
                val tourResponse = apiService.getTourDetail(tourId, lang)
                val pointsResponse = apiService.getTourPoints(tourId, lang)

                if (tourResponse.isSuccessful && pointsResponse.isSuccessful) {
                    val detail = tourResponse.body()
                    val points = pointsResponse.body() ?: emptyList()

                    if (detail != null) {
                        val tour = Tour(
                            id = detail.id,
                            slug = detail.slug,
                            title = mapOf(lang to detail.title),
                            descriptionPreview = mapOf(lang to detail.description),
                            city = detail.city,
                            durationMinutes = detail.durationMinutes,
                            distanceKm = detail.distanceKm,
                            languages = detail.languages,
                            isProtected = detail.isProtected,
                            coverImageUrl = detail.coverImageUrl,
                            routePolyline = detail.routePolyline,
                            points = points,
                            isDownloaded = tourDownloadManager.isTourDownloaded(tourId)
                        )

                        _tour.value = tour
                        _tourPoints.value = points

                        // Fetch manifest for audio/subtitle URLs
                        fetchManifest(tourId, lang)

                        startTour(tour, lang)
                        analyticsService.trackTourStarted(tourId)
                    }
                }
            } catch (e: Exception) {
                DebugLogger.e("Failed to load tour", e)
            }
        }
    }

    private suspend fun fetchManifest(tourId: String, language: String) {
        try {
            val response = apiService.getTourManifest(tourId, language)
            if (response.isSuccessful) {
                val manifest = response.body()
                if (manifest != null) {
                    // Map audio URLs by point ID
                    audioUrlsByPointId = manifest.audio.associate { audio ->
                        val fullUrl = if (audio.fileUrl.startsWith("http")) {
                            audio.fileUrl
                        } else {
                            "${Constants.API_BASE_URL}${audio.fileUrl}"
                        }
                        audio.pointId to fullUrl
                    }

                    // Map subtitle URLs by point ID
                    subtitleUrlsByPointId = manifest.subtitles.associate { subtitle ->
                        val fullUrl = if (subtitle.fileUrl.startsWith("http")) {
                            subtitle.fileUrl
                        } else {
                            "${Constants.API_BASE_URL}${subtitle.fileUrl}"
                        }
                        subtitle.pointId to fullUrl
                    }

                    DebugLogger.d("Manifest loaded: ${manifest.audio.size} audio, ${manifest.subtitles.size} subtitles")
                }
            }
        } catch (e: Exception) {
            DebugLogger.e("Failed to fetch manifest", e)
        }
    }

    private fun startTour(tour: Tour, language: String) {
        // Try to start foreground service, but don't crash if it fails
        // (can fail due to Android 12+ background restrictions or missing permissions)
        try {
            val intent = Intent(context, TourPlaybackService::class.java).apply {
                action = TourPlaybackService.ACTION_START
            }
            context.startForegroundService(intent)
            context.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
            DebugLogger.d("Foreground service started")
        } catch (e: SecurityException) {
            // Missing location permissions - service can't start with location type
            DebugLogger.e("Could not start foreground service (security): ${e.message}")
        } catch (e: Exception) {
            // Other errors (background restrictions, etc.)
            DebugLogger.e("Could not start foreground service: ${e.message}")
        }

        // Initialize location tracking and audio regardless of service status
        locationManager.setTourPoints(tour.points ?: emptyList())
        locationManager.startTracking()
        audioPlayerManager.initialize()

        DebugLogger.d("Tour started: ${tour.id}")
    }

    private fun playPointAudio(point: TourPoint) {
        viewModelScope.launch {
            val tour = _tour.value ?: return@launch

            // Try local file first (downloaded tour)
            val audioFile = tourDownloadManager.getAudioFile(tour.id, point.id)
            if (audioFile != null) {
                audioPlayerManager.playFile(audioFile, point.id)
                startSubtitleSync()
                return@launch
            }

            // Try manifest URL
            val manifestUrl = audioUrlsByPointId[point.id]
            if (manifestUrl != null) {
                audioPlayerManager.playUrl(manifestUrl, point.id)
                startSubtitleSync()
                return@launch
            }

            // Fallback to point's audioUrl
            point.audioUrl?.let { url ->
                audioPlayerManager.playUrl(url, point.id)
                startSubtitleSync()
            }
        }
    }

    fun togglePlayPause() {
        if (audioPlayerManager.isPlaying.value) {
            audioPlayerManager.pause()
            stopSubtitleSync()
        } else {
            // If no audio loaded, load current point
            if (audioPlayerManager.duration.value == 0L) {
                val points = _tourPoints.value
                val index = locationManager.currentPointIndex.value
                if (index < points.size) {
                    val point = points[index]
                    _currentPoint.value = point
                    loadSubtitlesForPoint(point.id)
                    playPointAudio(point)
                }
            } else {
                audioPlayerManager.play()
                startSubtitleSync()
            }
        }
    }

    fun seekForward() {
        audioPlayerManager.seekForward()
        updateCurrentSubtitle()
    }

    fun seekBackward() {
        audioPlayerManager.seekBackward()
        updateCurrentSubtitle()
    }

    fun seekTo(positionMs: Long) {
        audioPlayerManager.seekTo(positionMs)
        updateCurrentSubtitle()
    }

    // Navigation methods
    fun moveToNextPoint() {
        val points = _tourPoints.value
        val currentIndex = locationManager.currentPointIndex.value

        if (currentIndex >= points.size - 1) {
            // Last point - complete tour
            _isTourComplete.value = true
            audioPlayerManager.stop()
            stopSubtitleSync()
            viewModelScope.launch {
                _tour.value?.let { tour ->
                    analyticsService.trackTourCompleted(tour.id)
                }
            }
            return
        }

        audioPlayerManager.stop()
        stopSubtitleSync()

        val newIndex = currentIndex + 1
        locationManager.setPointIndex(newIndex)

        if (newIndex < points.size) {
            val point = points[newIndex]
            _currentPoint.value = point
            loadSubtitlesForPoint(point.id)
            playPointAudio(point)
            DebugLogger.d("Manual skip to point ${newIndex + 1}: ${point.getDisplayTitle()}")
        }
    }

    fun moveToPreviousPoint() {
        val points = _tourPoints.value
        val currentIndex = locationManager.currentPointIndex.value

        if (currentIndex <= 0) return

        audioPlayerManager.stop()
        stopSubtitleSync()

        val newIndex = currentIndex - 1
        locationManager.setPointIndex(newIndex)

        if (newIndex < points.size) {
            val point = points[newIndex]
            _currentPoint.value = point
            loadSubtitlesForPoint(point.id)
            playPointAudio(point)
            DebugLogger.d("Manual back to point ${newIndex + 1}: ${point.getDisplayTitle()}")
        }
    }

    // Subtitle methods
    fun toggleSubtitles() {
        _subtitlesEnabled.value = !_subtitlesEnabled.value
    }

    fun setSubtitlesEnabled(enabled: Boolean) {
        _subtitlesEnabled.value = enabled
    }

    private fun loadSubtitlesForPoint(pointId: String) {
        viewModelScope.launch {
            currentSubtitleCues = emptyList()
            _currentSubtitle.value = null

            val subtitleUrl = subtitleUrlsByPointId[pointId]
            if (subtitleUrl == null) {
                DebugLogger.d("No subtitle URL for point $pointId")
                return@launch
            }

            try {
                // Try local file first
                val localFile = tourDownloadManager.getSubtitleFile(
                    _tour.value?.id ?: return@launch,
                    pointId,
                    currentLanguage
                )

                val content = if (localFile != null) {
                    localFile.readText()
                } else {
                    // Fetch from URL
                    URL(subtitleUrl).readText()
                }

                currentSubtitleCues = SubtitleParser.parseSrt(content)
                DebugLogger.d("Loaded ${currentSubtitleCues.size} subtitles for point $pointId")

                // Start syncing
                startSubtitleSync()
            } catch (e: Exception) {
                DebugLogger.e("Failed to load subtitles", e)
            }
        }
    }

    private fun startSubtitleSync() {
        subtitleSyncJob?.cancel()
        subtitleSyncJob = viewModelScope.launch {
            while (true) {
                updateCurrentSubtitle()
                delay(100) // Update every 100ms
            }
        }
    }

    private fun stopSubtitleSync() {
        subtitleSyncJob?.cancel()
        subtitleSyncJob = null
    }

    private fun updateCurrentSubtitle() {
        val position = audioPlayerManager.currentPosition.value
        val cue = SubtitleParser.getCurrentCue(currentSubtitleCues, position)
        _currentSubtitle.value = cue?.text
    }

    fun stopTour() {
        stopSubtitleSync()
        locationManager.stopTracking()
        audioPlayerManager.stop()

        if (serviceBound) {
            context.unbindService(serviceConnection)
            serviceBound = false
        }

        try {
            val intent = Intent(context, TourPlaybackService::class.java).apply {
                action = TourPlaybackService.ACTION_STOP
            }
            context.startService(intent)
        } catch (e: Exception) {
            DebugLogger.e("Failed to stop service", e)
        }
    }

    override fun onCleared() {
        super.onCleared()
        stopTour()
    }
}
