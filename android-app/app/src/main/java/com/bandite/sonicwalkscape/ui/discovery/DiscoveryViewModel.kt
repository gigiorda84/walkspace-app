package com.bandite.sonicwalkscape.ui.discovery

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bandite.sonicwalkscape.data.api.ApiService
import com.bandite.sonicwalkscape.data.models.Tour
import com.bandite.sonicwalkscape.services.AnalyticsService
import com.bandite.sonicwalkscape.services.TourDownloadManager
import com.bandite.sonicwalkscape.services.UserPreferencesManager
import com.bandite.sonicwalkscape.utils.DebugLogger
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DiscoveryViewModel @Inject constructor(
    private val apiService: ApiService,
    private val userPreferencesManager: UserPreferencesManager,
    private val tourDownloadManager: TourDownloadManager,
    private val analyticsService: AnalyticsService
) : ViewModel() {

    private val _tours = MutableStateFlow<List<Tour>>(emptyList())
    val tours: StateFlow<List<Tour>> = _tours.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    val preferredLanguage: Flow<String> = userPreferencesManager.preferredLanguage

    init {
        loadTours()
        trackAppOpen()
    }

    private fun trackAppOpen() {
        viewModelScope.launch {
            analyticsService.trackAppOpen()
        }
    }

    fun loadTours() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            try {
                val language = userPreferencesManager.preferredLanguage.first()
                val response = apiService.getTours(language = language)

                if (response.isSuccessful) {
                    val tourList = response.body() ?: emptyList()
                    // Update download status
                    val updatedTours = tourList.map { tour ->
                        tour.copy(isDownloaded = tourDownloadManager.isTourDownloaded(tour.id))
                    }
                    _tours.value = updatedTours
                    DebugLogger.network("Loaded ${updatedTours.size} tours")
                } else {
                    _error.value = "Failed to load tours: ${response.code()}"
                    DebugLogger.e("API error: ${response.code()}")
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Unknown error"
                DebugLogger.e("Failed to load tours", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun refreshTours() {
        loadTours()
    }
}
