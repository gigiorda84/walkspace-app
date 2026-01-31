package com.bandite.sonicwalkscape.ui.theme

import androidx.compose.ui.graphics.Color

// Brand Colors (matching iOS teal palette)
val BrandPurple = Color(0xFF1A5C61)      // Dark teal background (iOS: brandPurple)
val SurfacePurple = Color(0xFF2A6F75)    // Card/surface backgrounds (iOS: brandSurfacePurple)
val BorderPurple = Color(0xFF3D8389)     // Borders (iOS: brandBorderPurple)
val BrandDark = Color(0xFF0F0B14)        // Darkest elements
val BrandOrange = Color(0xFFD95808)      // Primary CTA, active states
val BrandYellow = Color(0xFFF5B400)      // Secondary accent, highlights
val BrandCream = Color(0xFFF8F5F0)       // Primary text
val BrandMuted = Color(0xFF9B8FB5)       // Secondary text, labels

// Semantic Colors
val BackgroundDark = BrandDark
val BackgroundCard = SurfacePurple
val BackgroundElevated = BorderPurple

val TextPrimary = BrandCream
val TextSecondary = Color(0xFFCCC5D9)
val TextMuted = BrandMuted

val AccentPrimary = BrandOrange
val AccentSecondary = BrandYellow

// Status Colors
val Success = Color(0xFF4CAF50)
val Error = Color(0xFFEF5350)
val Warning = BrandYellow

// Map Point Colors
val PointGreen = Color(0xFF1B5E20)  // Dark green for upcoming points
val PointGrey = Color(0xFF757575)   // Grey for passed points
