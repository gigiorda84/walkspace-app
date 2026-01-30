package com.bandite.sonicwalkscape.ui.welcome

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bandite.sonicwalkscape.services.UserPreferencesManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class WelcomeViewModel @Inject constructor(
    private val userPreferencesManager: UserPreferencesManager
) : ViewModel() {

    val onboardingCompleted: Flow<Boolean> = userPreferencesManager.onboardingCompleted
    val preferredLanguage: Flow<String> = userPreferencesManager.preferredLanguage

    fun setPreferredLanguage(language: String) {
        viewModelScope.launch {
            userPreferencesManager.setPreferredLanguage(language)
        }
    }

    fun completeOnboarding() {
        viewModelScope.launch {
            userPreferencesManager.setOnboardingCompleted(true)
        }
    }
}
