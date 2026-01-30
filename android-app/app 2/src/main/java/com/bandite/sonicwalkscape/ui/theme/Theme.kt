package com.bandite.sonicwalkscape.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = BrandAccent,
    onPrimary = TextPrimary,
    primaryContainer = BrandPrimary,
    onPrimaryContainer = TextPrimary,

    secondary = BrandSecondary,
    onSecondary = TextPrimary,
    secondaryContainer = BackgroundElevated,
    onSecondaryContainer = TextPrimary,

    tertiary = BrandAccentLight,
    onTertiary = TextPrimary,

    background = BackgroundDark,
    onBackground = TextPrimary,

    surface = BackgroundCard,
    onSurface = TextPrimary,
    surfaceVariant = BackgroundElevated,
    onSurfaceVariant = TextSecondary,

    error = StatusError,
    onError = TextPrimary,

    outline = TextMuted,
    outlineVariant = BackgroundElevated
)

@Composable
fun SonicWalkscapeTheme(
    darkTheme: Boolean = true, // Always dark theme for this app
    content: @Composable () -> Unit
) {
    val colorScheme = DarkColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = BackgroundDark.toArgb()
            window.navigationBarColor = BackgroundDark.toArgb()
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = false
                isAppearanceLightNavigationBars = false
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
