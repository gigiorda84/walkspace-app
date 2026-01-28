package com.bandite.sonicwalkscape.services

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import com.bandite.sonicwalkscape.utils.Constants
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = Constants.PREFS_NAME)

class UserPreferencesManager(private val context: Context) {

    private object PreferencesKeys {
        val ONBOARDING_COMPLETED = booleanPreferencesKey(Constants.KEY_ONBOARDING_COMPLETED)
        val PREFERRED_LANGUAGE = stringPreferencesKey(Constants.KEY_PREFERRED_LANGUAGE)
        val ANALYTICS_ENABLED = booleanPreferencesKey(Constants.KEY_ANALYTICS_ENABLED)
        val NOTIFICATIONS_ENABLED = booleanPreferencesKey(Constants.KEY_NOTIFICATIONS_ENABLED)
        val AUTO_DOWNLOAD_ENABLED = booleanPreferencesKey(Constants.KEY_AUTO_DOWNLOAD_ENABLED)
        val DOWNLOADED_TOURS = stringSetPreferencesKey(Constants.KEY_DOWNLOADED_TOURS)
        val AUTH_TOKEN = stringPreferencesKey(Constants.KEY_AUTH_TOKEN)
        val REFRESH_TOKEN = stringPreferencesKey(Constants.KEY_REFRESH_TOKEN)
        val USER_ID = stringPreferencesKey(Constants.KEY_USER_ID)
        val ANONYMOUS_ID = stringPreferencesKey(Constants.KEY_ANONYMOUS_ID)
    }

    val onboardingCompleted: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[PreferencesKeys.ONBOARDING_COMPLETED] ?: false
    }

    val preferredLanguage: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[PreferencesKeys.PREFERRED_LANGUAGE] ?: Constants.DEFAULT_LANGUAGE
    }

    val analyticsEnabled: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[PreferencesKeys.ANALYTICS_ENABLED] ?: true
    }

    val notificationsEnabled: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[PreferencesKeys.NOTIFICATIONS_ENABLED] ?: true
    }

    val autoDownloadEnabled: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[PreferencesKeys.AUTO_DOWNLOAD_ENABLED] ?: false
    }

    val downloadedTours: Flow<Set<String>> = context.dataStore.data.map { prefs ->
        prefs[PreferencesKeys.DOWNLOADED_TOURS] ?: emptySet()
    }

    val authToken: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[PreferencesKeys.AUTH_TOKEN]
    }

    val anonymousId: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[PreferencesKeys.ANONYMOUS_ID] ?: UUID.randomUUID().toString()
    }

    suspend fun setOnboardingCompleted(completed: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.ONBOARDING_COMPLETED] = completed
        }
    }

    suspend fun setPreferredLanguage(language: String) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.PREFERRED_LANGUAGE] = language
        }
    }

    suspend fun setAnalyticsEnabled(enabled: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.ANALYTICS_ENABLED] = enabled
        }
    }

    suspend fun setNotificationsEnabled(enabled: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.NOTIFICATIONS_ENABLED] = enabled
        }
    }

    suspend fun setAutoDownloadEnabled(enabled: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.AUTO_DOWNLOAD_ENABLED] = enabled
        }
    }

    suspend fun addDownloadedTour(tourId: String) {
        context.dataStore.edit { prefs ->
            val current = prefs[PreferencesKeys.DOWNLOADED_TOURS] ?: emptySet()
            prefs[PreferencesKeys.DOWNLOADED_TOURS] = current + tourId
        }
    }

    suspend fun removeDownloadedTour(tourId: String) {
        context.dataStore.edit { prefs ->
            val current = prefs[PreferencesKeys.DOWNLOADED_TOURS] ?: emptySet()
            prefs[PreferencesKeys.DOWNLOADED_TOURS] = current - tourId
        }
    }

    suspend fun setAuthToken(token: String?) {
        context.dataStore.edit { prefs ->
            if (token != null) {
                prefs[PreferencesKeys.AUTH_TOKEN] = token
            } else {
                prefs.remove(PreferencesKeys.AUTH_TOKEN)
            }
        }
    }

    suspend fun setRefreshToken(token: String?) {
        context.dataStore.edit { prefs ->
            if (token != null) {
                prefs[PreferencesKeys.REFRESH_TOKEN] = token
            } else {
                prefs.remove(PreferencesKeys.REFRESH_TOKEN)
            }
        }
    }

    suspend fun ensureAnonymousId(): String {
        var id: String? = null
        context.dataStore.edit { prefs ->
            id = prefs[PreferencesKeys.ANONYMOUS_ID]
            if (id == null) {
                id = UUID.randomUUID().toString()
                prefs[PreferencesKeys.ANONYMOUS_ID] = id!!
            }
        }
        return id!!
    }
}
