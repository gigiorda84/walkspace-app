package com.bandite.sonicwalkscape.ui.player

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bandite.sonicwalkscape.data.api.ApiService
import com.bandite.sonicwalkscape.data.models.Tour
import com.bandite.sonicwalkscape.utils.DebugLogger
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TourCompletionViewModel @Inject constructor(
    private val apiService: ApiService
) : ViewModel() {

    private val _tour = MutableStateFlow<Tour?>(null)
    val tour: StateFlow<Tour?> = _tour.asStateFlow()

    fun loadTour(tourId: String, language: String) {
        viewModelScope.launch {
            try {
                val response = apiService.getTourDetail(tourId, language)
                if (response.isSuccessful) {
                    val detail = response.body()
                    if (detail != null) {
                        val tour = Tour(
                            id = detail.id,
                            slug = detail.slug,
                            title = mapOf(language to detail.title),
                            descriptionPreview = mapOf(language to detail.description),
                            completionMessage = detail.completionMessage?.let { mapOf(language to it) },
                            busInfo = detail.busInfo?.let { mapOf(language to it) },
                            city = detail.city,
                            durationMinutes = detail.durationMinutes,
                            distanceKm = detail.distanceKm,
                            languages = detail.languages,
                            isProtected = detail.isProtected,
                            coverImageUrl = detail.coverImageUrl,
                            coverTrailerUrl = detail.coverTrailerUrl,
                            routePolyline = detail.routePolyline
                        )
                        _tour.value = tour
                        DebugLogger.d("Loaded tour for completion: ${tour.getDisplayTitle(language)}")
                    }
                }
            } catch (e: Exception) {
                DebugLogger.e("Failed to load tour for completion", e)
            }
        }
    }
}
