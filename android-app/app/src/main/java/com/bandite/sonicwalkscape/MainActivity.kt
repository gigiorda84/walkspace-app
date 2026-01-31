package com.bandite.sonicwalkscape

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.core.os.LocaleListCompat
import androidx.lifecycle.lifecycleScope
import com.bandite.sonicwalkscape.services.UserPreferencesManager
import com.bandite.sonicwalkscape.ui.navigation.NavGraph
import com.bandite.sonicwalkscape.ui.theme.SonicWalkscapeTheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var userPreferencesManager: UserPreferencesManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Apply stored language preference on startup
        lifecycleScope.launch {
            val storedLanguage = userPreferencesManager.getPreferredLanguageOnce()
            val currentLocales = AppCompatDelegate.getApplicationLocales()
            val currentLanguage = currentLocales.toLanguageTags().takeIf { it.isNotEmpty() }

            // Only apply if different from current to avoid unnecessary recreation
            if (currentLanguage != storedLanguage) {
                AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(storedLanguage))
            }
        }

        enableEdgeToEdge()
        setContent {
            SonicWalkscapeTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    NavGraph()
                }
            }
        }
    }
}
