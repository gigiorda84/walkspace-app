package com.bandite.sonicwalkscape.ui.player

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bandite.sonicwalkscape.data.api.ApiService
import com.bandite.sonicwalkscape.data.api.FeedbackRequest
import com.bandite.sonicwalkscape.data.models.Tour
import com.bandite.sonicwalkscape.services.AnalyticsService
import com.bandite.sonicwalkscape.utils.DebugLogger
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TourCompletionViewModel @Inject constructor(
    private val apiService: ApiService,
    private val analyticsService: AnalyticsService
) : ViewModel() {

    private val _tour = MutableStateFlow<Tour?>(null)
    val tour: StateFlow<Tour?> = _tour.asStateFlow()

    private val _isSendingRating = MutableStateFlow(false)
    val isSendingRating: StateFlow<Boolean> = _isSendingRating.asStateFlow()

    private val _ratingSent = MutableStateFlow(false)
    val ratingSent: StateFlow<Boolean> = _ratingSent.asStateFlow()

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

    fun trackDonationClicked(provider: String, amount: Int?) {
        viewModelScope.launch {
            val properties = mutableMapOf<String, Any>("provider" to provider)
            if (amount != null) properties["amount"] = amount
            analyticsService.track(
                "donation_link_clicked",
                tourId = _tour.value?.id,
                properties = properties
            )
        }
    }

    fun trackFollowUsClicked() {
        viewModelScope.launch {
            analyticsService.track("follow_us_clicked", tourId = _tour.value?.id)
        }
    }

    fun trackContactClicked(channel: String) {
        viewModelScope.launch {
            analyticsService.track(
                "contact_clicked",
                tourId = _tour.value?.id,
                properties = mapOf("channel" to channel)
            )
        }
    }

    fun submitRating(rating: Int, comment: String, language: String) {
        if (rating <= 0 || _isSendingRating.value) return
        viewModelScope.launch {
            _isSendingRating.value = true
            try {
                val tourTitle = _tour.value?.getDisplayTitle(language) ?: "unknown"
                val trimmed = comment.trim()
                val feedbackText = "Tour $tourTitle — rating $rating/5" +
                    if (trimmed.isEmpty()) "" else " — $trimmed"

                val response = apiService.submitFeedback(FeedbackRequest(feedback = feedbackText))
                if (response.isSuccessful) {
                    _ratingSent.value = true
                } else {
                    DebugLogger.e("Rating submission failed: ${response.code()}")
                }
            } catch (e: Exception) {
                DebugLogger.e("Failed to submit rating", e)
            } finally {
                _isSendingRating.value = false
            }
        }
    }
}
