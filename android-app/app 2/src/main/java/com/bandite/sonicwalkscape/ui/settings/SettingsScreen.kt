package com.bandite.sonicwalkscape.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.bandite.sonicwalkscape.BuildConfig
import com.bandite.sonicwalkscape.R
import com.bandite.sonicwalkscape.ui.theme.BackgroundCard
import com.bandite.sonicwalkscape.ui.theme.BackgroundDark
import com.bandite.sonicwalkscape.ui.theme.BackgroundElevated
import com.bandite.sonicwalkscape.ui.theme.BrandAccent
import com.bandite.sonicwalkscape.ui.theme.TextMuted
import com.bandite.sonicwalkscape.ui.theme.TextPrimary
import com.bandite.sonicwalkscape.ui.theme.TextSecondary
import com.bandite.sonicwalkscape.utils.Constants

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val preferredLanguage by viewModel.preferredLanguage.collectAsState()
    val notificationsEnabled by viewModel.notificationsEnabled.collectAsState()
    val autoDownloadEnabled by viewModel.autoDownloadEnabled.collectAsState()
    val analyticsEnabled by viewModel.analyticsEnabled.collectAsState()

    var showLanguageDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = stringResource(R.string.settings_title),
                        color = TextPrimary
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = stringResource(R.string.close),
                            tint = TextPrimary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = BackgroundDark
                )
            )
        },
        containerColor = BackgroundDark
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Language Setting
            SettingsSection(title = stringResource(R.string.settings_language)) {
                LanguageSelector(
                    selectedLanguage = preferredLanguage,
                    onLanguageSelected = { viewModel.setPreferredLanguage(it) }
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Preferences Section
            SettingsSection(title = "Preferences") {
                SettingsToggle(
                    title = stringResource(R.string.settings_notifications),
                    isChecked = notificationsEnabled,
                    onToggle = { viewModel.setNotificationsEnabled(it) }
                )

                Spacer(modifier = Modifier.height(12.dp))

                SettingsToggle(
                    title = stringResource(R.string.settings_auto_download),
                    isChecked = autoDownloadEnabled,
                    onToggle = { viewModel.setAutoDownloadEnabled(it) }
                )

                Spacer(modifier = Modifier.height(12.dp))

                SettingsToggle(
                    title = stringResource(R.string.settings_analytics),
                    subtitle = stringResource(R.string.settings_analytics_description),
                    isChecked = analyticsEnabled,
                    onToggle = { viewModel.setAnalyticsEnabled(it) }
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // About Section
            SettingsSection(title = stringResource(R.string.settings_about)) {
                Text(
                    text = stringResource(R.string.settings_version, BuildConfig.VERSION_NAME),
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
            }
        }
    }
}

@Composable
private fun SettingsSection(
    title: String,
    content: @Composable () -> Unit
) {
    Column {
        Text(
            text = title.uppercase(),
            style = MaterialTheme.typography.labelMedium,
            color = BrandAccent
        )
        Spacer(modifier = Modifier.height(12.dp))
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(BackgroundCard)
                .padding(16.dp)
        ) {
            content()
        }
    }
}

@Composable
private fun LanguageSelector(
    selectedLanguage: String,
    onLanguageSelected: (String) -> Unit
) {
    val languages = listOf(
        Constants.Languages.ENGLISH to stringResource(R.string.language_english),
        Constants.Languages.ITALIAN to stringResource(R.string.language_italian),
        Constants.Languages.FRENCH to stringResource(R.string.language_french)
    )

    Column(
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        languages.forEach { (code, name) ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(
                        if (code == selectedLanguage) BrandAccent.copy(alpha = 0.2f)
                        else BackgroundElevated
                    )
                    .clickable { onLanguageSelected(code) }
                    .padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = name,
                    style = MaterialTheme.typography.bodyLarge,
                    color = TextPrimary
                )
                if (code == selectedLanguage) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = null,
                        tint = BrandAccent
                    )
                }
            }
        }
    }
}

@Composable
private fun SettingsToggle(
    title: String,
    subtitle: String? = null,
    isChecked: Boolean,
    onToggle: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge,
                color = TextPrimary
            )
            subtitle?.let {
                Text(
                    text = it,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextMuted
                )
            }
        }
        Switch(
            checked = isChecked,
            onCheckedChange = onToggle,
            colors = SwitchDefaults.colors(
                checkedThumbColor = TextPrimary,
                checkedTrackColor = BrandAccent,
                uncheckedThumbColor = TextMuted,
                uncheckedTrackColor = BackgroundElevated
            )
        )
    }
}
