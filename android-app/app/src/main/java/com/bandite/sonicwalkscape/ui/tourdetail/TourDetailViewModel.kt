package com.bandite.sonicwalkscape.ui.tourdetail

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bandite.sonicwalkscape.data.api.ApiService
import com.bandite.sonicwalkscape.data.models.Tour
import com.bandite.sonicwalkscape.data.models.TourPoint
import com.bandite.sonicwalkscape.services.AnalyticsService
import com.bandite.sonicwalkscape.services.TourDownloadManager
import com.bandite.sonicwalkscape.services.UserPreferencesManager
import com.bandite.sonicwalkscape.utils.DebugLogger
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TourDetailViewModel @Inject constructor(
    private val apiService: ApiService,
    private val userPreferencesManager: UserPreferencesManager,
    private val tourDownloadManager: TourDownloadManager,
    private val analyticsService: AnalyticsService
) : ViewModel() {

    private val _tour = MutableStateFlow<Tour?>(null)
    val tour: StateFlow<Tour?> = _tour.asStateFlow()

    private val _points = MutableStateFlow<List<TourPoint>>(emptyList())
    val points: StateFlow<List<TourPoint>> = _points.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _isDownloaded = MutableStateFlow(false)
    val isDownloaded: StateFlow<Boolean> = _isDownloaded.asStateFlow()

    val downloadProgress: StateFlow<Float> = tourDownloadManager.downloadProgress
    val isDownloading: StateFlow<Boolean> = tourDownloadManager.isDownloading

    val preferredLanguage: Flow<String> = userPreferencesManager.preferredLanguage

    fun loadTour(tourId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            try {
                val language = userPreferencesManager.preferredLanguage.first()

                // Load tour detail
                val tourResponse = apiService.getTourDetail(tourId, language)
                if (tourResponse.isSuccessful) {
                    val detail = tourResponse.body()
                    if (detail != null) {
                        // Load points
                        val pointsResponse = apiService.getTourPoints(tourId, language)
                        val tourPoints = if (pointsResponse.isSuccessful) {
                            pointsResponse.body() ?: emptyList()
                        } else {
                            emptyList()
                        }

                        _points.value = tourPoints

                        // Create Tour object from detail
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
                            points = tourPoints,
                            isDownloaded = tourDownloadManager.isTourDownloaded(tourId)
                        )

                        _tour.value = tour
                        _isDownloaded.value = tour.isDownloaded

                        analyticsService.trackTourViewed(tourId)
                        DebugLogger.d("Loaded tour: ${tour.getDisplayTitle(language)}")
                    }
                } else {
                    _error.value = "Failed to load tour: ${tourResponse.code()}"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Unknown error"
                DebugLogger.e("Failed to load tour", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun downloadTour(tourId: String) {
        viewModelScope.launch {
            val language = userPreferencesManager.preferredLanguage.first()
            analyticsService.trackTourDownloadStarted(tourId)

            val success = tourDownloadManager.downloadTour(tourId, language)
            if (success) {
                _isDownloaded.value = true
                _tour.value = _tour.value?.copy(isDownloaded = true)
                userPreferencesManager.addDownloadedTour(tourId)
                analyticsService.trackTourDownloadCompleted(tourId)
            }
        }
    }

    fun deleteTour(tourId: String) {
        viewModelScope.launch {
            if (tourDownloadManager.deleteTour(tourId)) {
                _isDownloaded.value = false
                _tour.value = _tour.value?.copy(isDownloaded = false)
                userPreferencesManager.removeDownloadedTour(tourId)
            }
        }
    }
}
