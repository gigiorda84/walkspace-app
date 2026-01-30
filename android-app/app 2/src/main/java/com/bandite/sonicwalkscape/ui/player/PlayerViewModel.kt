package com.bandite.sonicwalkscape.ui.player

import android.content.Context
import android.content.Intent
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bandite.sonicwalkscape.data.api.ApiResult
import com.bandite.sonicwalkscape.data.api.ApiService
import com.bandite.sonicwalkscape.data.api.safeApiCall
import com.bandite.sonicwalkscape.data.models.Tour
import com.bandite.sonicwalkscape.data.models.TourManifest
import com.bandite.sonicwalkscape.data.models.TourPoint
import com.bandite.sonicwalkscape.services.AnalyticsService
import com.bandite.sonicwalkscape.services.AudioPlayerManager
import com.bandite.sonicwalkscape.services.LocationManager
import com.bandite.sonicwalkscape.services.TourDownloadManager
import com.bandite.sonicwalkscape.services.TourPlaybackService
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

@HiltViewModel
class PlayerViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    @ApplicationContext private val context: Context,
    private val apiService: ApiService,
    private val locationManager: LocationManager,
    private val audioPlayerManager: AudioPlayerManager,
    private val downloadManager: TourDownloadManager,
    private val analyticsService: AnalyticsService
) : ViewModel() {

    val tourId: String = savedStateHandle.get<String>("tourId") ?: ""
    val language: String = savedStateHandle.get<String>("language") ?: "en"

    private val _uiState = MutableStateFlow<PlayerUiState>(PlayerUiState.Loading)
    val uiState: StateFlow<PlayerUiState> = _uiState.asStateFlow()

    private var tour: Tour? = null
    private var points: List<TourPoint> = emptyList()
    private var manifest: TourManifest? = null
    private var tourStartTime: Long = 0

    // Expose location and audio state
    val currentLocation = locationManager.currentLocation
    val nearbyPoint = locationManager.nearbyPoint
    val currentPointIndex = locationManager.currentPointIndex
    val distanceToNextPoint = locationManager.distanceToNextPoint
    val isPointActive = locationManager.isPointActive

    val isPlaying = audioPlayerManager.isPlaying
    val currentTime = audioPlayerManager.currentTime
    val duration = audioPlayerManager.duration
    val isBuffering = audioPlayerManager.isBuffering

    init {
        setupCallbacks()
        loadTourData()
    }

    private fun setupCallbacks() {
        // When a point is triggered by GPS
        locationManager.onPointTriggered = { point ->
            playPointAudio(point)
            analyticsService.trackPointTriggered(tourId, point.id, "gps")
            updateNotification(point)
        }

        // When audio finishes playing
        audioPlayerManager.onPlaybackComplete = {
            onAudioComplete()
        }
    }

    private fun loadTourData() {
        viewModelScope.launch {
            _uiState.value = PlayerUiState.Loading

            // Load tour details
            val tourResult = safeApiCall { apiService.getTourDetail(tourId, language) }
            if (tourResult is ApiResult.Error) {
                _uiState.value = PlayerUiState.Error(tourResult.exception.message)
                return@launch
            }

            tour = (tourResult as ApiResult.Success).data.toTour(language)

            // Load points
            val pointsResult = safeApiCall { apiService.getTourPoints(tourId, language) }
            if (pointsResult is ApiResult.Error) {
                _uiState.value = PlayerUiState.Error(pointsResult.exception.message)
                return@launch
            }

            points = (pointsResult as ApiResult.Success).data
            locationManager.setTourPoints(points)

            // Load manifest
            val manifestResult = safeApiCall { apiService.getTourManifest(tourId, language) }
            if (manifestResult is ApiResult.Success) {
                manifest = manifestResult.data
            }

            // Start tour
            tourStartTime = System.currentTimeMillis()
            analyticsService.trackTourStarted(tourId, language, "manual")

            // Start foreground service
            startPlaybackService()

            _uiState.value = PlayerUiState.Playing(
                tour = tour!!,
                points = points,
                currentPointIndex = 0
            )
        }
    }

    private fun startPlaybackService() {
        val intent = Intent(context, TourPlaybackService::class.java).apply {
            action = TourPlaybackService.ACTION_START
            putExtra(TourPlaybackService.EXTRA_TOUR_ID, tourId)
        }
        context.startForegroundService(intent)
    }

    private fun stopPlaybackService() {
        val intent = Intent(context, TourPlaybackService::class.java).apply {
            action = TourPlaybackService.ACTION_STOP
        }
        context.startService(intent)
    }

    private fun updateNotification(point: TourPoint) {
        val intent = Intent(context, TourPlaybackService::class.java).apply {
            action = TourPlaybackService.ACTION_UPDATE_NOTIFICATION
            putExtra(TourPlaybackService.EXTRA_POINT_TITLE, point.title)
            putExtra(TourPlaybackService.EXTRA_POINT_NUMBER, point.order)
        }
        context.startService(intent)
    }

    private fun playPointAudio(point: TourPoint) {
        val audioFile = manifest?.audio?.find { it.pointId == point.id }

        // Try local file first
        val localFile = downloadManager.getLocalAudioUrl(tourId, language, point.id)
        if (localFile != null) {
            audioPlayerManager.playLocalFile(localFile)
        } else if (audioFile != null) {
            // Stream from remote
            val url = if (audioFile.fileUrl.startsWith("http")) {
                audioFile.fileUrl
            } else {
                "${com.bandite.sonicwalkscape.utils.Constants.Api.BASE_URL}${audioFile.fileUrl}"
            }
            audioPlayerManager.playRemoteUrl(url)
        }
    }

    fun playCurrentPoint() {
        val currentPoint = locationManager.getCurrentPoint() ?: return
        playPointAudio(currentPoint)
        analyticsService.trackPointTriggered(tourId, currentPoint.id, "manual")
    }

    private fun onAudioComplete() {
        if (locationManager.isLastPoint()) {
            // Tour complete
            onTourComplete()
        } else {
            // Advance to next point
            locationManager.advanceToNextPoint()

            // Update UI state
            val state = _uiState.value as? PlayerUiState.Playing ?: return
            _uiState.value = state.copy(
                currentPointIndex = locationManager.currentPointIndex.value
            )
        }
    }

    private fun onTourComplete() {
        val durationMinutes = ((System.currentTimeMillis() - tourStartTime) / 60000).toInt()
        analyticsService.trackTourCompleted(tourId, durationMinutes, "gps")

        _uiState.value = PlayerUiState.Completed
        cleanup()
    }

    fun togglePlayPause() {
        audioPlayerManager.togglePlayPause()
    }

    fun seekTo(positionMs: Long) {
        audioPlayerManager.seekTo(positionMs)
    }

    fun exitTour() {
        val durationMinutes = ((System.currentTimeMillis() - tourStartTime) / 60000).toInt()
        analyticsService.trackTourAbandoned(
            tourId,
            durationMinutes,
            locationManager.currentPointIndex.value
        )
        cleanup()
    }

    private fun cleanup() {
        stopPlaybackService()
        audioPlayerManager.stop()
        locationManager.stopTracking()
        locationManager.resetTourProgress()
    }

    override fun onCleared() {
        super.onCleared()
        cleanup()
    }

    fun getCurrentPoint(): TourPoint? = locationManager.getCurrentPoint()
    fun getTotalPoints(): Int = locationManager.getTotalPoints()
}

sealed class PlayerUiState {
    object Loading : PlayerUiState()
    data class Playing(
        val tour: Tour,
        val points: List<TourPoint>,
        val currentPointIndex: Int
    ) : PlayerUiState()
    object Completed : PlayerUiState()
    data class Error(val message: String) : PlayerUiState()
}
