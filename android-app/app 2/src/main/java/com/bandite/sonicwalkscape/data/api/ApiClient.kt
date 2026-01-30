package com.bandite.sonicwalkscape.data.api

import com.bandite.sonicwalkscape.utils.Constants
import com.bandite.sonicwalkscape.utils.DebugLogger
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ApiClient @Inject constructor() {

    private val loggingInterceptor = HttpLoggingInterceptor { message ->
        DebugLogger.network(message)
    }.apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(Constants.Api.CONNECT_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .readTimeout(Constants.Api.READ_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .writeTimeout(Constants.Api.WRITE_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .addInterceptor(loggingInterceptor)
        .addInterceptor { chain ->
            val original = chain.request()
            val request = original.newBuilder()
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .method(original.method, original.body)
                .build()
            chain.proceed(request)
        }
        .retryOnConnectionFailure(true)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(Constants.Api.BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val apiService: ApiService = retrofit.create(ApiService::class.java)
}

// Sealed class for API results
sealed class ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class Error(val exception: ApiException) : ApiResult<Nothing>()
}

// Custom exception for API errors
sealed class ApiException(override val message: String) : Exception(message) {
    object NetworkError : ApiException("Network error. Please check your connection.")
    object Timeout : ApiException("Request timed out. Please try again.")
    object Offline : ApiException("No internet connection.")
    data class ServerError(val code: Int) : ApiException("Server error ($code). Please try again later.")
    object NotFound : ApiException("Resource not found.")
    object Forbidden : ApiException("Access denied.")
    object Unauthorized : ApiException("Authentication required.")
    data class Unknown(override val message: String) : ApiException(message)
}

// Extension function to safely execute API calls
suspend fun <T> safeApiCall(apiCall: suspend () -> retrofit2.Response<T>): ApiResult<T> {
    return try {
        val response = apiCall()
        if (response.isSuccessful) {
            response.body()?.let {
                ApiResult.Success(it)
            } ?: ApiResult.Error(ApiException.Unknown("Empty response body"))
        } else {
            val exception = when (response.code()) {
                401 -> ApiException.Unauthorized
                403 -> ApiException.Forbidden
                404 -> ApiException.NotFound
                in 500..599 -> ApiException.ServerError(response.code())
                else -> ApiException.Unknown("HTTP ${response.code()}: ${response.message()}")
            }
            ApiResult.Error(exception)
        }
    } catch (e: java.net.UnknownHostException) {
        ApiResult.Error(ApiException.Offline)
    } catch (e: java.net.SocketTimeoutException) {
        ApiResult.Error(ApiException.Timeout)
    } catch (e: java.io.IOException) {
        ApiResult.Error(ApiException.NetworkError)
    } catch (e: Exception) {
        ApiResult.Error(ApiException.Unknown(e.message ?: "Unknown error"))
    }
}
