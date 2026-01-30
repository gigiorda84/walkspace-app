package com.bandite.sonicwalkscape.services

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.bandite.sonicwalkscape.utils.Constants
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(
    name = Constants.Preferences.PREFERENCES_NAME
)

@Singleton
class UserPreferencesManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val dataStore = context.dataStore

    // Preference Keys
    private object Keys {
        val PREFERRED_LANGUAGE = stringPreferencesKey(Constants.Preferences.KEY_PREFERRED_LANGUAGE)
        val NOTIFICATIONS_ENABLED = booleanPreferencesKey(Constants.Preferences.KEY_NOTIFICATIONS_ENABLED)
        val AUTO_DOWNLOAD = booleanPreferencesKey(Constants.Preferences.KEY_AUTO_DOWNLOAD)
        val ANALYTICS_ENABLED = booleanPreferencesKey(Constants.Preferences.KEY_ANALYTICS_ENABLED)
        val ONBOARDING_COMPLETED = booleanPreferencesKey(Constants.Preferences.KEY_ONBOARDING_COMPLETED)
        val DOWNLOADED_TOURS = stringSetPreferencesKey(Constants.Preferences.KEY_DOWNLOADED_TOURS)
    }

    // ========== Language ==========

    val preferredLanguage: Flow<String> = dataStore.data.map { preferences ->
        preferences[Keys.PREFERRED_LANGUAGE] ?: detectSystemLanguage()
    }

    suspend fun setPreferredLanguage(language: String) {
        dataStore.edit { preferences ->
            preferences[Keys.PREFERRED_LANGUAGE] = language
        }
    }

    private fun detectSystemLanguage(): String {
        val systemLanguage = Locale.getDefault().language
        return if (systemLanguage in Constants.Languages.SUPPORTED) {
            systemLanguage
        } else {
            Constants.Languages.DEFAULT
        }
    }

    // ========== Notifications ==========

    val notificationsEnabled: Flow<Boolean> = dataStore.data.map { preferences ->
        preferences[Keys.NOTIFICATIONS_ENABLED] ?: true
    }

    suspend fun setNotificationsEnabled(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[Keys.NOTIFICATIONS_ENABLED] = enabled
        }
    }

    // ========== Auto Download ==========

    val autoDownloadEnabled: Flow<Boolean> = dataStore.data.map { preferences ->
        preferences[Keys.AUTO_DOWNLOAD] ?: false
    }

    suspend fun setAutoDownloadEnabled(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[Keys.AUTO_DOWNLOAD] = enabled
        }
    }

    // ========== Analytics ==========

    val analyticsEnabled: Flow<Boolean> = dataStore.data.map { preferences ->
        preferences[Keys.ANALYTICS_ENABLED] ?: true
    }

    suspend fun setAnalyticsEnabled(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[Keys.ANALYTICS_ENABLED] = enabled
        }
    }

    // ========== Onboarding ==========

    val onboardingCompleted: Flow<Boolean> = dataStore.data.map { preferences ->
        preferences[Keys.ONBOARDING_COMPLETED] ?: false
    }

    suspend fun setOnboardingCompleted(completed: Boolean) {
        dataStore.edit { preferences ->
            preferences[Keys.ONBOARDING_COMPLETED] = completed
        }
    }

    // ========== Downloaded Tours ==========

    val downloadedTours: Flow<Set<String>> = dataStore.data.map { preferences ->
        preferences[Keys.DOWNLOADED_TOURS] ?: emptySet()
    }

    suspend fun addDownloadedTour(tourKey: String) {
        dataStore.edit { preferences ->
            val current = preferences[Keys.DOWNLOADED_TOURS] ?: emptySet()
            preferences[Keys.DOWNLOADED_TOURS] = current + tourKey
        }
    }

    suspend fun removeDownloadedTour(tourKey: String) {
        dataStore.edit { preferences ->
            val current = preferences[Keys.DOWNLOADED_TOURS] ?: emptySet()
            preferences[Keys.DOWNLOADED_TOURS] = current - tourKey
        }
    }

    suspend fun isTourDownloaded(tourId: String, language: String): Boolean {
        val key = "${tourId}_$language"
        return downloadedTours.first().contains(key)
    }

    // ========== Convenience Methods ==========

    suspend fun getPreferredLanguageSync(): String {
        return preferredLanguage.first()
    }

    suspend fun isAnalyticsEnabledSync(): Boolean {
        return analyticsEnabled.first()
    }
}
