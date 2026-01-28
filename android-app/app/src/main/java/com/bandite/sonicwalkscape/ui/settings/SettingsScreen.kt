package com.bandite.sonicwalkscape.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.bandite.sonicwalkscape.BuildConfig
import com.bandite.sonicwalkscape.R
import com.bandite.sonicwalkscape.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    onBack: () -> Unit
) {
    val preferredLanguage by viewModel.preferredLanguage.collectAsState(initial = "en")
    val notificationsEnabled by viewModel.notificationsEnabled.collectAsState(initial = true)
    val autoDownloadEnabled by viewModel.autoDownloadEnabled.collectAsState(initial = false)
    val analyticsEnabled by viewModel.analyticsEnabled.collectAsState(initial = true)

    var showLanguageDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = stringResource(R.string.settings),
                        color = TextPrimary
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = stringResource(R.string.back),
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
            // Language section
            SettingsSection(title = stringResource(R.string.language)) {
                SettingsItem(
                    title = stringResource(R.string.preferred_language),
                    subtitle = getLanguageName(preferredLanguage),
                    onClick = { showLanguageDialog = true }
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Preferences section
            SettingsSection(title = stringResource(R.string.preferences)) {
                SettingsToggle(
                    title = stringResource(R.string.notifications),
                    subtitle = stringResource(R.string.notifications_description),
                    checked = notificationsEnabled,
                    onCheckedChange = { viewModel.setNotificationsEnabled(it) }
                )
                Spacer(modifier = Modifier.height(8.dp))
                SettingsToggle(
                    title = stringResource(R.string.auto_download),
                    subtitle = stringResource(R.string.auto_download_description),
                    checked = autoDownloadEnabled,
                    onCheckedChange = { viewModel.setAutoDownloadEnabled(it) }
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Privacy section
            SettingsSection(title = stringResource(R.string.privacy)) {
                SettingsToggle(
                    title = stringResource(R.string.analytics),
                    subtitle = stringResource(R.string.analytics_description),
                    checked = analyticsEnabled,
                    onCheckedChange = { viewModel.setAnalyticsEnabled(it) }
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // About section
            SettingsSection(title = stringResource(R.string.about)) {
                SettingsItem(
                    title = stringResource(R.string.version),
                    subtitle = BuildConfig.VERSION_NAME
                )
            }
        }
    }

    if (showLanguageDialog) {
        LanguageDialog(
            currentLanguage = preferredLanguage,
            onLanguageSelected = {
                viewModel.setPreferredLanguage(it)
                showLanguageDialog = false
            },
            onDismiss = { showLanguageDialog = false }
        )
    }
}

@Composable
fun SettingsSection(
    title: String,
    content: @Composable ColumnScope.() -> Unit
) {
    Column {
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall,
            color = AccentPrimary,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            color = BackgroundCard
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                content = content
            )
        }
    }
}

@Composable
fun SettingsItem(
    title: String,
    subtitle: String,
    onClick: (() -> Unit)? = null
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge,
                color = TextPrimary
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )
        }
    }
}

@Composable
fun SettingsToggle(
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge,
                color = TextPrimary
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = TextPrimary,
                checkedTrackColor = AccentPrimary
            )
        )
    }
}

@Composable
fun LanguageDialog(
    currentLanguage: String,
    onLanguageSelected: (String) -> Unit,
    onDismiss: () -> Unit
) {
    val languages = listOf(
        "en" to "English",
        "it" to "Italiano",
        "fr" to "Français"
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.select_language), color = TextPrimary) },
        text = {
            Column {
                languages.forEach { (code, name) ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onLanguageSelected(code) }
                            .padding(vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = name, color = TextPrimary)
                        if (currentLanguage == code) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = null,
                                tint = AccentPrimary
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {},
        containerColor = BackgroundCard
    )
}

private fun getLanguageName(code: String): String {
    return when (code) {
        "en" -> "English"
        "it" -> "Italiano"
        "fr" -> "Français"
        else -> code
    }
}
