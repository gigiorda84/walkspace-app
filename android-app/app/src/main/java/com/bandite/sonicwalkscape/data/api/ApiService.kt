package com.bandite.sonicwalkscape.data.api

import com.bandite.sonicwalkscape.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Tours
    @GET("tours")
    suspend fun getTours(
        @Query("language") language: String? = null,
        @Query("city") city: String? = null
    ): Response<List<Tour>>

    @GET("tours/{tourId}")
    suspend fun getTourDetail(
        @Path("tourId") tourId: String,
        @Query("language") language: String = "en"
    ): Response<TourDetailResponse>

    @GET("tours/{tourId}/points")
    suspend fun getTourPoints(
        @Path("tourId") tourId: String,
        @Query("language") language: String = "en"
    ): Response<List<TourPoint>>

    @GET("tours/{tourId}/manifest")
    suspend fun getTourManifest(
        @Path("tourId") tourId: String,
        @Query("language") language: String = "en"
    ): Response<TourManifest>

    // Auth
    @POST("auth/register")
    suspend fun register(
        @Body request: RegisterRequest
    ): Response<AuthResponse>

    @POST("auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<AuthResponse>

    @POST("auth/refresh")
    suspend fun refreshToken(
        @Body request: RefreshTokenRequest
    ): Response<TokenResponse>

    // User
    @GET("me")
    suspend fun getCurrentUser(): Response<User>

    @PATCH("me")
    suspend fun updateUser(
        @Body request: UpdateUserRequest
    ): Response<User>

    // Vouchers
    @POST("vouchers/validate")
    suspend fun validateVoucher(
        @Body request: VoucherRequest
    ): Response<VoucherResponse>

    // Analytics
    @POST("analytics/events")
    suspend fun sendAnalyticsEvents(
        @Body request: AnalyticsRequest
    ): Response<AnalyticsResponse>

    // Feedback
    @POST("feedback")
    suspend fun submitFeedback(
        @Body request: FeedbackRequest
    ): Response<FeedbackResponse>
}

// Request/Response DTOs
data class RegisterRequest(
    val email: String,
    val password: String,
    val name: String? = null,
    val preferredLanguage: String = "en",
    val mailingListOptIn: Boolean = false
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class RefreshTokenRequest(
    val refreshToken: String
)

data class TokenResponse(
    val accessToken: String
)

data class UpdateUserRequest(
    val name: String? = null,
    val preferredLanguage: String? = null,
    val mailingListOptIn: Boolean? = null
)

data class VoucherRequest(
    val code: String,
    val tourId: String
)

data class VoucherResponse(
    val valid: Boolean,
    val maxUses: Int? = null,
    val usesSoFar: Int? = null,
    val expiresAt: String? = null
)

data class AnalyticsRequest(
    val events: List<AnalyticsEvent>
)

data class AnalyticsEvent(
    val name: String,
    val userId: String? = null,
    val anonymousId: String,
    val tourId: String? = null,
    val pointId: String? = null,
    val language: String? = null,
    val device: String? = null,
    val osVersion: String? = null,
    val timestamp: String,
    val properties: Map<String, Any>? = null
)

data class AnalyticsResponse(
    val status: String
)

data class FeedbackRequest(
    val email: String? = null,
    val name: String? = null,
    val feedback: String? = null,
    val subscribeToNewsletter: Boolean = false
)

data class FeedbackResponse(
    val success: Boolean,
    val message: String
)
