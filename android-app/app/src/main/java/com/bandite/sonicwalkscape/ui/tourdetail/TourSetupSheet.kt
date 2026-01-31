package com.bandite.sonicwalkscape.ui.tourdetail

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bandite.sonicwalkscape.R
import com.bandite.sonicwalkscape.ui.theme.*
import kotlinx.coroutines.delay

data class TourSetupConfig(
    val language: String,
    val subtitlesEnabled: Boolean,
    val downloadEnabled: Boolean
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TourSetupSheet(
    availableLanguages: List<String>,
    defaultLanguage: String,
    isDownloading: Boolean,
    downloadProgress: Float,
    downloadError: String?,
    onDownloadStart: (String) -> Unit,
    onComplete: (TourSetupConfig) -> Unit,
    onDismiss: () -> Unit
) {
    var currentStep by remember { mutableIntStateOf(0) }
    var selectedLanguage by remember { mutableStateOf(defaultLanguage) }
    var subtitlesEnabled by remember { mutableStateOf(true) }
    var downloadEnabled by remember { mutableStateOf(true) }

    ModalBottomSheet(
        onDismissRequest = { if (!isDownloading) onDismiss() },
        containerColor = BrandPurple,
        dragHandle = null,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header with back/close buttons
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Back button (hidden on step 0 and during download)
                if (currentStep > 0 && !isDownloading) {
                    IconButton(onClick = { currentStep-- }) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = stringResource(R.string.back),
                            tint = BrandCream
                        )
                    }
                } else {
                    Spacer(modifier = Modifier.size(48.dp))
                }

                Spacer(modifier = Modifier.weight(1f))

                // Close button (hidden during download)
                if (!isDownloading) {
                    IconButton(onClick = onDismiss) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = stringResource(R.string.close),
                            tint = BrandCream
                        )
                    }
                } else {
                    Spacer(modifier = Modifier.size(48.dp))
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Content with animation
            AnimatedContent(
                targetState = if (isDownloading) 3 else currentStep,
                transitionSpec = {
                    (slideInHorizontally { it } + fadeIn()) togetherWith
                            (slideOutHorizontally { -it } + fadeOut())
                },
                label = "step_animation"
            ) { step ->
                when (step) {
                    0 -> LanguageSelectionStep(
                        availableLanguages = availableLanguages,
                        selectedLanguage = selectedLanguage,
                        onLanguageSelected = { lang ->
                            selectedLanguage = lang
                            currentStep = 1
                        }
                    )
                    1 -> SubtitleSelectionStep(
                        subtitlesEnabled = subtitlesEnabled,
                        onSubtitlesSelected = { enabled ->
                            subtitlesEnabled = enabled
                            currentStep = 2
                        }
                    )
                    2 -> DownloadSelectionStep(
                        downloadEnabled = downloadEnabled,
                        onDownloadSelected = {
                            downloadEnabled = true
                            onDownloadStart(selectedLanguage)
                        },
                        onStreamSelected = {
                            downloadEnabled = false
                            onComplete(TourSetupConfig(selectedLanguage, subtitlesEnabled, false))
                        }
                    )
                    3 -> DownloadingStep(
                        progress = downloadProgress,
                        error = downloadError,
                        onRetry = { onDownloadStart(selectedLanguage) },
                        onSkip = {
                            onComplete(TourSetupConfig(selectedLanguage, subtitlesEnabled, false))
                        },
                        onComplete = {
                            onComplete(TourSetupConfig(selectedLanguage, subtitlesEnabled, true))
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Step indicators (hidden during download)
            if (!isDownloading) {
                StepIndicators(currentStep = currentStep, totalSteps = 3)
            }
        }
    }
}

@Composable
private fun LanguageSelectionStep(
    availableLanguages: List<String>,
    selectedLanguage: String,
    onLanguageSelected: (String) -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.fillMaxWidth()
    ) {
        // Icon
        Icon(
            imageVector = Icons.Default.Equalizer,
            contentDescription = null,
            tint = BrandYellow,
            modifier = Modifier.size(48.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Title
        Text(
            text = stringResource(R.string.choose_audio_language),
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = BrandCream,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Subtitle
        Text(
            text = stringResource(R.string.choose_language_subtitle),
            fontSize = 14.sp,
            color = BrandMuted,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Language buttons
        availableLanguages.forEach { lang ->
            val isSelected = lang == selectedLanguage
            OptionButton(
                title = getLanguageName(lang),
                isSelected = isSelected,
                onClick = { onLanguageSelected(lang) }
            )
            Spacer(modifier = Modifier.height(12.dp))
        }
    }
}

@Composable
private fun SubtitleSelectionStep(
    subtitlesEnabled: Boolean,
    onSubtitlesSelected: (Boolean) -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.fillMaxWidth()
    ) {
        // Icon
        Icon(
            imageVector = Icons.Default.Subtitles,
            contentDescription = null,
            tint = BrandYellow,
            modifier = Modifier.size(48.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Title
        Text(
            text = stringResource(R.string.subtitles),
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = BrandCream,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Subtitle
        Text(
            text = stringResource(R.string.subtitles_question),
            fontSize = 14.sp,
            color = BrandMuted,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(24.dp))

        // ON option
        OptionButton(
            title = stringResource(R.string.subtitles_on),
            subtitle = stringResource(R.string.subtitles_on_description),
            isSelected = subtitlesEnabled,
            onClick = { onSubtitlesSelected(true) }
        )

        Spacer(modifier = Modifier.height(12.dp))

        // OFF option
        OptionButton(
            title = stringResource(R.string.subtitles_off),
            subtitle = stringResource(R.string.subtitles_off_description),
            isSelected = !subtitlesEnabled,
            onClick = { onSubtitlesSelected(false) }
        )
    }
}

@Composable
private fun DownloadSelectionStep(
    downloadEnabled: Boolean,
    onDownloadSelected: () -> Unit,
    onStreamSelected: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.fillMaxWidth()
    ) {
        // Icon
        Icon(
            imageVector = Icons.Default.Download,
            contentDescription = null,
            tint = BrandYellow,
            modifier = Modifier.size(48.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Title
        Text(
            text = stringResource(R.string.download_tour),
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = BrandCream,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Subtitle
        Text(
            text = stringResource(R.string.download_recommended_subtitle),
            fontSize = 14.sp,
            color = BrandMuted,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Download option
        OptionButton(
            title = stringResource(R.string.download_recommended),
            subtitle = stringResource(R.string.save_for_offline),
            isSelected = downloadEnabled,
            onClick = onDownloadSelected
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Stream option
        OptionButton(
            title = stringResource(R.string.stream_only),
            subtitle = stringResource(R.string.requires_internet),
            isSelected = !downloadEnabled,
            onClick = onStreamSelected
        )
    }
}

@Composable
private fun DownloadingStep(
    progress: Float,
    error: String?,
    onRetry: () -> Unit,
    onSkip: () -> Unit,
    onComplete: () -> Unit
) {
    // Auto-complete when download finishes
    LaunchedEffect(progress) {
        if (progress >= 1f && error == null) {
            delay(300) // Brief delay to show 100%
            onComplete()
        }
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.fillMaxWidth()
    ) {
        if (error != null) {
            // Error state
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = null,
                tint = Error,
                modifier = Modifier.size(48.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = stringResource(R.string.download_failed),
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = BrandCream,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = error,
                fontSize = 14.sp,
                color = Error,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Retry button
            Button(
                onClick = onRetry,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = BrandYellow)
            ) {
                Text(
                    text = stringResource(R.string.retry),
                    color = BrandPurple,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Skip button
            OutlinedButton(
                onClick = onSkip,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = BrandCream)
            ) {
                Text(
                    text = stringResource(R.string.skip),
                    fontWeight = FontWeight.SemiBold
                )
            }
        } else {
            // Downloading state
            Icon(
                imageVector = Icons.Default.Download,
                contentDescription = null,
                tint = BrandYellow,
                modifier = Modifier.size(48.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = stringResource(R.string.downloading_tour),
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = BrandCream,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = stringResource(R.string.please_wait),
                fontSize = 14.sp,
                color = BrandMuted,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Progress bar
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
                color = BrandYellow,
                trackColor = SurfacePurple
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Percentage
            Text(
                text = "${(progress * 100).toInt()}%",
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium,
                color = BrandCream
            )
        }
    }
}

@Composable
private fun OptionButton(
    title: String,
    subtitle: String? = null,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val backgroundColor = if (isSelected) BrandYellow.copy(alpha = 0.15f) else SurfacePurple
    val borderColor = if (isSelected) BrandYellow else BorderPurple

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .border(1.5.dp, borderColor, RoundedCornerShape(12.dp))
            .background(backgroundColor)
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 14.dp)
    ) {
        Column {
            Text(
                text = title,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (isSelected) BrandYellow else BrandCream
            )
            if (subtitle != null) {
                Text(
                    text = subtitle,
                    fontSize = 13.sp,
                    color = BrandMuted
                )
            }
        }
    }
}

@Composable
private fun StepIndicators(currentStep: Int, totalSteps: Int) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        repeat(totalSteps) { index ->
            val isActive = index <= currentStep
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(if (isActive) BrandYellow else BrandMuted.copy(alpha = 0.4f))
            )
        }
    }
}

private fun getLanguageName(code: String): String {
    return when (code.lowercase()) {
        "it" -> "Italiano"
        "en" -> "English"
        "fr" -> "Français"
        "de" -> "Deutsch"
        "es" -> "Español"
        else -> code.uppercase()
    }
}
