package com.bandite.sonicwalkscape.data.api

import com.bandite.sonicwalkscape.data.models.Tour
import com.bandite.sonicwalkscape.data.models.TourDetailResponse
import com.bandite.sonicwalkscape.data.models.TourManifest
import com.bandite.sonicwalkscape.data.models.TourPoint
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {

    // ========== Tours ==========

    @GET("tours")
    suspend fun getTours(
        @Query("language") language: String? = null
    ): Response<List<Tour>>

    @GET("tours/{id}")
    suspend fun getTourDetail(
        @Path("id") tourId: String,
        @Query("language") language: String
    ): Response<TourDetailResponse>

    @GET("tours/{id}/points")
    suspend fun getTourPoints(
        @Path("id") tourId: String,
        @Query("language") language: String
    ): Response<List<TourPoint>>

    @GET("tours/{id}/manifest")
    suspend fun getTourManifest(
        @Path("id") tourId: String,
        @Query("language") language: String
    ): Response<TourManifest>

    // ========== Feedback ==========

    @POST("feedback")
    suspend fun submitFeedback(
        @Body request: FeedbackRequest
    ): Response<FeedbackResponse>

    // ========== Analytics ==========

    @POST("analytics/events")
    suspend fun submitAnalyticsEvents(
        @Body request: AnalyticsEventsRequest
    ): Response<Unit>

    // ========== Vouchers ==========

    @POST("vouchers/validate")
    suspend fun validateVoucher(
        @Body request: VoucherValidateRequest
    ): Response<VoucherValidateResponse>
}

// Request/Response DTOs

data class FeedbackRequest(
    val email: String?,
    val name: String?,
    val feedback: String?,
    val subscribeToNewsletter: Boolean
)

data class FeedbackResponse(
    val id: String,
    val message: String
)

data class AnalyticsEventsRequest(
    val events: List<AnalyticsEvent>
)

data class AnalyticsEvent(
    val eventName: String,
    val anonymousId: String,
    val timestamp: String,
    val properties: Map<String, Any?>
)

data class VoucherValidateRequest(
    val code: String,
    val tourId: String
)

data class VoucherValidateResponse(
    val valid: Boolean,
    val message: String?,
    val tourId: String?
)
