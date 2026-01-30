package com.bandite.sonicwalkscape.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bandite.sonicwalkscape.services.UserPreferencesManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val userPreferencesManager: UserPreferencesManager
) : ViewModel() {

    val preferredLanguage: Flow<String> = userPreferencesManager.preferredLanguage
    val notificationsEnabled: Flow<Boolean> = userPreferencesManager.notificationsEnabled
    val autoDownloadEnabled: Flow<Boolean> = userPreferencesManager.autoDownloadEnabled
    val analyticsEnabled: Flow<Boolean> = userPreferencesManager.analyticsEnabled

    fun setPreferredLanguage(language: String) {
        viewModelScope.launch {
            userPreferencesManager.setPreferredLanguage(language)
        }
    }

    fun setNotificationsEnabled(enabled: Boolean) {
        viewModelScope.launch {
            userPreferencesManager.setNotificationsEnabled(enabled)
        }
    }

    fun setAutoDownloadEnabled(enabled: Boolean) {
        viewModelScope.launch {
            userPreferencesManager.setAutoDownloadEnabled(enabled)
        }
    }

    fun setAnalyticsEnabled(enabled: Boolean) {
        viewModelScope.launch {
            userPreferencesManager.setAnalyticsEnabled(enabled)
        }
    }
}
