package com.bandite.sonicwalkscape.ui.tourdetail

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bandite.sonicwalkscape.data.api.ApiResult
import com.bandite.sonicwalkscape.data.api.ApiService
import com.bandite.sonicwalkscape.data.api.safeApiCall
import com.bandite.sonicwalkscape.data.models.Tour
import com.bandite.sonicwalkscape.data.models.TourPoint
import com.bandite.sonicwalkscape.services.TourDownloadManager
import com.bandite.sonicwalkscape.services.UserPreferencesManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TourDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val apiService: ApiService,
    private val preferencesManager: UserPreferencesManager,
    private val downloadManager: TourDownloadManager
) : ViewModel() {

    private val tourId: String = savedStateHandle.get<String>("tourId") ?: ""

    private val _uiState = MutableStateFlow<TourDetailUiState>(TourDetailUiState.Loading)
    val uiState: StateFlow<TourDetailUiState> = _uiState.asStateFlow()

    private val _selectedLanguage = MutableStateFlow("")
    val selectedLanguage: StateFlow<String> = _selectedLanguage.asStateFlow()

    private val _showSubtitles = MutableStateFlow(true)
    val showSubtitles: StateFlow<Boolean> = _showSubtitles.asStateFlow()

    private val _isDownloading = MutableStateFlow(false)
    val isDownloading: StateFlow<Boolean> = _isDownloading.asStateFlow()

    private val _downloadProgress = MutableStateFlow(0f)
    val downloadProgress: StateFlow<Float> = _downloadProgress.asStateFlow()

    init {
        loadTour()
    }

    fun loadTour() {
        viewModelScope.launch {
            _uiState.value = TourDetailUiState.Loading

            val language = preferencesManager.getPreferredLanguageSync()
            _selectedLanguage.value = language

            val result = safeApiCall { apiService.getTourDetail(tourId, language) }

            when (result) {
                is ApiResult.Success -> {
                    val tour = result.data.toTour(language)
                    val isDownloaded = downloadManager.isTourDownloaded(tourId, language)

                    // Load points
                    val pointsResult = safeApiCall { apiService.getTourPoints(tourId, language) }
                    val points = when (pointsResult) {
                        is ApiResult.Success -> pointsResult.data
                        is ApiResult.Error -> emptyList()
                    }

                    _uiState.value = TourDetailUiState.Success(
                        tour = tour.copy(points = points, isDownloaded = isDownloaded),
                        points = points
                    )
                }
                is ApiResult.Error -> {
                    _uiState.value = TourDetailUiState.Error(result.exception.message)
                }
            }
        }
    }

    fun setSelectedLanguage(language: String) {
        _selectedLanguage.value = language
        // Reload tour with new language
        loadTour()
    }

    fun toggleSubtitles() {
        _showSubtitles.value = !_showSubtitles.value
    }

    fun downloadTour() {
        val state = _uiState.value as? TourDetailUiState.Success ?: return
        val language = _selectedLanguage.value

        viewModelScope.launch {
            _isDownloading.value = true
            _downloadProgress.value = 0f

            try {
                downloadManager.downloadTour(tourId, language).collect { progress ->
                    _downloadProgress.value = progress.progressPercent
                }

                // Update UI state with downloaded status
                _uiState.value = state.copy(
                    tour = state.tour.copy(isDownloaded = true)
                )
            } catch (e: Exception) {
                // Handle error
            } finally {
                _isDownloading.value = false
            }
        }
    }

    fun deleteTour() {
        val state = _uiState.value as? TourDetailUiState.Success ?: return
        val language = _selectedLanguage.value

        viewModelScope.launch {
            downloadManager.deleteTour(tourId, language)
            _uiState.value = state.copy(
                tour = state.tour.copy(isDownloaded = false)
            )
        }
    }

    fun isDownloaded(): Boolean {
        val state = _uiState.value as? TourDetailUiState.Success ?: return false
        return state.tour.isDownloaded
    }
}

sealed class TourDetailUiState {
    object Loading : TourDetailUiState()
    data class Success(
        val tour: Tour,
        val points: List<TourPoint>
    ) : TourDetailUiState()
    data class Error(val message: String) : TourDetailUiState()
}
