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
import com.bandite.sonicwalkscape.data.models.TourPoint
import com.bandite.sonicwalkscape.services.*
import com.bandite.sonicwalkscape.utils.DebugLogger
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
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

    private val _currentPoint = MutableStateFlow<TourPoint?>(null)
    val currentPoint: StateFlow<TourPoint?> = _currentPoint.asStateFlow()

    private val _isTourComplete = MutableStateFlow(false)
    val isTourComplete: StateFlow<Boolean> = _isTourComplete.asStateFlow()

    val currentLocation = locationManager.currentLocation
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
                viewModelScope.launch {
                    _tour.value?.let { tour ->
                        analyticsService.trackTourCompleted(tour.id)
                    }
                }
            }
        }
    }

    fun loadAndStartTour(tourId: String) {
        viewModelScope.launch {
            try {
                val language = userPreferencesManager.preferredLanguage.first()

                // Load tour and points
                val tourResponse = apiService.getTourDetail(tourId, language)
                val pointsResponse = apiService.getTourPoints(tourId, language)

                if (tourResponse.isSuccessful && pointsResponse.isSuccessful) {
                    val detail = tourResponse.body()
                    val points = pointsResponse.body() ?: emptyList()

                    if (detail != null) {
                        val tour = Tour(
                            id = detail.id,
                            slug = detail.slug,
                            title = mapOf(language to detail.title),
                            descriptionPreview = mapOf(language to detail.description),
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
                        startTour(tour, language)
                        analyticsService.trackTourStarted(tourId)
                    }
                }
            } catch (e: Exception) {
                DebugLogger.e("Failed to load tour", e)
            }
        }
    }

    private fun startTour(tour: Tour, language: String) {
        // Start foreground service
        val intent = Intent(context, TourPlaybackService::class.java).apply {
            action = TourPlaybackService.ACTION_START
        }
        context.startForegroundService(intent)
        context.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)

        // Initialize location tracking
        locationManager.setTourPoints(tour.points ?: emptyList())
        locationManager.startTracking()
        audioPlayerManager.initialize()

        DebugLogger.d("Tour started: ${tour.id}")
    }

    private fun playPointAudio(point: TourPoint) {
        viewModelScope.launch {
            val tour = _tour.value ?: return@launch
            val audioFile = tourDownloadManager.getAudioFile(tour.id, point.id)

            if (audioFile != null) {
                audioPlayerManager.playFile(audioFile, point.id)
            } else {
                point.audioUrl?.let { url ->
                    audioPlayerManager.playUrl(url, point.id)
                }
            }
        }
    }

    fun togglePlayPause() {
        if (audioPlayerManager.isPlaying.value) {
            audioPlayerManager.pause()
        } else {
            audioPlayerManager.play()
        }
    }

    fun seekForward() {
        audioPlayerManager.seekForward()
    }

    fun seekBackward() {
        audioPlayerManager.seekBackward()
    }

    fun stopTour() {
        locationManager.stopTracking()
        audioPlayerManager.stop()

        if (serviceBound) {
            context.unbindService(serviceConnection)
            serviceBound = false
        }

        val intent = Intent(context, TourPlaybackService::class.java).apply {
            action = TourPlaybackService.ACTION_STOP
        }
        context.startService(intent)
    }

    override fun onCleared() {
        super.onCleared()
        stopTour()
    }
}
