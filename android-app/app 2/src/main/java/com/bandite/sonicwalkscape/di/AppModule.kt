package com.bandite.sonicwalkscape.di

import android.content.Context
import com.bandite.sonicwalkscape.data.api.ApiClient
import com.bandite.sonicwalkscape.data.api.ApiService
import com.bandite.sonicwalkscape.services.AnalyticsService
import com.bandite.sonicwalkscape.services.AudioPlayerManager
import com.bandite.sonicwalkscape.services.LocationManager
import com.bandite.sonicwalkscape.services.TourDownloadManager
import com.bandite.sonicwalkscape.services.UserPreferencesManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideApiClient(): ApiClient {
        return ApiClient()
    }

    @Provides
    @Singleton
    fun provideApiService(apiClient: ApiClient): ApiService {
        return apiClient.apiService
    }

    @Provides
    @Singleton
    fun provideUserPreferencesManager(
        @ApplicationContext context: Context
    ): UserPreferencesManager {
        return UserPreferencesManager(context)
    }

    @Provides
    @Singleton
    fun provideLocationManager(
        @ApplicationContext context: Context
    ): LocationManager {
        return LocationManager(context)
    }

    @Provides
    @Singleton
    fun provideAudioPlayerManager(
        @ApplicationContext context: Context
    ): AudioPlayerManager {
        return AudioPlayerManager(context)
    }

    @Provides
    @Singleton
    fun provideTourDownloadManager(
        @ApplicationContext context: Context,
        apiClient: ApiClient,
        preferencesManager: UserPreferencesManager
    ): TourDownloadManager {
        return TourDownloadManager(context, apiClient, preferencesManager)
    }

    @Provides
    @Singleton
    fun provideAnalyticsService(
        @ApplicationContext context: Context,
        apiClient: ApiClient,
        preferencesManager: UserPreferencesManager
    ): AnalyticsService {
        return AnalyticsService(context, apiClient, preferencesManager)
    }
}
