package com.bandite.sonicwalkscape.ui.discovery

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bandite.sonicwalkscape.data.api.ApiService
import com.bandite.sonicwalkscape.data.models.Tour
import com.bandite.sonicwalkscape.services.AnalyticsService
import com.bandite.sonicwalkscape.services.TourDownloadManager
import com.bandite.sonicwalkscape.services.UserPreferencesManager
import com.bandite.sonicwalkscape.utils.DebugLogger
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import javax.inject.Inject

@HiltViewModel
class DiscoveryViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val apiService: ApiService,
    private val userPreferencesManager: UserPreferencesManager,
    private val tourDownloadManager: TourDownloadManager,
    private val analyticsService: AnalyticsService
) : ViewModel() {

    private val gson = Gson()
    private val cacheFile: File
        get() = File(context.filesDir, "tours_cache.json")

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
                    // Filter out tours without published versions and update download status
                    val updatedTours = tourList
                        .filter { it.languages.isNotEmpty() }
                        .map { tour ->
                            tour.copy(isDownloaded = tourDownloadManager.isTourDownloaded(tour.id))
                        }
                    _tours.value = updatedTours
                    DebugLogger.network("Loaded ${updatedTours.size} tours")
                    saveToursToCache(updatedTours)
                } else {
                    DebugLogger.e("API error: ${response.code()}")
                    if (!loadToursFromCache()) {
                        _error.value = "Failed to load tours: ${response.code()}"
                    }
                }
            } catch (e: Exception) {
                DebugLogger.e("Failed to load tours", e)
                if (!loadToursFromCache()) {
                    _error.value = e.message ?: "Unknown error"
                }
            } finally {
                _isLoading.value = false
            }
        }
    }

    private suspend fun saveToursToCache(tours: List<Tour>) {
        withContext(Dispatchers.IO) {
            try {
                cacheFile.writeText(gson.toJson(tours))
            } catch (e: Exception) {
                DebugLogger.e("Failed to cache tours", e)
            }
        }
    }

    private suspend fun loadToursFromCache(): Boolean {
        return withContext(Dispatchers.IO) {
            try {
                if (!cacheFile.exists()) return@withContext false
                val type = object : TypeToken<List<Tour>>() {}.type
                val cached: List<Tour> = gson.fromJson(cacheFile.readText(), type) ?: return@withContext false
                if (cached.isEmpty()) return@withContext false
                _tours.value = cached.map { tour ->
                    tour.copy(isDownloaded = tourDownloadManager.isTourDownloaded(tour.id))
                }
                DebugLogger.network("Offline: loaded ${cached.size} tours from cache")
                true
            } catch (e: Exception) {
                DebugLogger.e("Failed to load cached tours", e)
                false
            }
        }
    }

    fun refreshTours() {
        loadTours()
    }
}
