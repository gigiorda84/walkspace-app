package com.bandite.sonicwalkscape.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bandite.sonicwalkscape.services.UserPreferencesManager
import com.bandite.sonicwalkscape.utils.Constants
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val preferencesManager: UserPreferencesManager
) : ViewModel() {

    val preferredLanguage: StateFlow<String> = preferencesManager.preferredLanguage
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), Constants.Languages.DEFAULT)

    val notificationsEnabled: StateFlow<Boolean> = preferencesManager.notificationsEnabled
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), true)

    val autoDownloadEnabled: StateFlow<Boolean> = preferencesManager.autoDownloadEnabled
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)

    val analyticsEnabled: StateFlow<Boolean> = preferencesManager.analyticsEnabled
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), true)

    fun setPreferredLanguage(language: String) {
        viewModelScope.launch {
            preferencesManager.setPreferredLanguage(language)
        }
    }

    fun setNotificationsEnabled(enabled: Boolean) {
        viewModelScope.launch {
            preferencesManager.setNotificationsEnabled(enabled)
        }
    }

    fun setAutoDownloadEnabled(enabled: Boolean) {
        viewModelScope.launch {
            preferencesManager.setAutoDownloadEnabled(enabled)
        }
    }

    fun setAnalyticsEnabled(enabled: Boolean) {
        viewModelScope.launch {
            preferencesManager.setAnalyticsEnabled(enabled)
        }
    }
}
