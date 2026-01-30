package com.bandite.sonicwalkscape.di

import android.content.Context
import com.bandite.sonicwalkscape.data.api.ApiClient
import com.bandite.sonicwalkscape.data.api.ApiService
import com.bandite.sonicwalkscape.services.*
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
    fun provideApiService(): ApiService = ApiClient.apiService

    @Provides
    @Singleton
    fun provideUserPreferencesManager(
        @ApplicationContext context: Context
    ): UserPreferencesManager = UserPreferencesManager(context)

    @Provides
    @Singleton
    fun provideLocationManager(
        @ApplicationContext context: Context
    ): LocationManager = LocationManager(context)

    @Provides
    @Singleton
    fun provideAudioPlayerManager(
        @ApplicationContext context: Context
    ): AudioPlayerManager = AudioPlayerManager(context)

    @Provides
    @Singleton
    fun provideTourDownloadManager(
        @ApplicationContext context: Context,
        apiService: ApiService
    ): TourDownloadManager = TourDownloadManager(context, apiService)

    @Provides
    @Singleton
    fun provideAnalyticsService(
        @ApplicationContext context: Context,
        apiService: ApiService,
        userPreferencesManager: UserPreferencesManager
    ): AnalyticsService = AnalyticsService(context, apiService, userPreferencesManager)
}
