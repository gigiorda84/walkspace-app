package com.bandite.sonicwalkscape.ui.player

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bandite.sonicwalkscape.R
import com.bandite.sonicwalkscape.data.models.TourPoint
import com.bandite.sonicwalkscape.ui.theme.*
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.*
import com.google.maps.android.compose.*

@Composable
fun PlayerScreen(
    tourId: String,
    language: String = "en",
    subtitlesEnabled: Boolean = true,
    viewModel: PlayerViewModel,
    onBack: () -> Unit,
    onTourComplete: () -> Unit
) {
    val tour by viewModel.tour.collectAsState()
    val tourPoints by viewModel.tourPoints.collectAsState()
    val currentPoint by viewModel.currentPoint.collectAsState()
    val currentPointIndex by viewModel.currentPointIndex.collectAsState()
    val isTourComplete by viewModel.isTourComplete.collectAsState()
    val isPlaying by viewModel.isPlaying.collectAsState()
    val currentPosition by viewModel.currentPosition.collectAsState()
    val duration by viewModel.duration.collectAsState()
    val currentSubtitle by viewModel.currentSubtitle.collectAsState()
    val subtitlesOn by viewModel.subtitlesEnabled.collectAsState()
    val userLocation by viewModel.currentLocation.collectAsState()

    LaunchedEffect(tourId, language) {
        viewModel.setSubtitlesEnabled(subtitlesEnabled)
        viewModel.loadAndStartTour(tourId, language)
    }

    LaunchedEffect(isTourComplete) {
        if (isTourComplete) {
            onTourComplete()
        }
    }

    // Update position periodically
    LaunchedEffect(isPlaying) {
        while (isPlaying) {
            viewModel.audioPlayerManager.updatePosition()
            kotlinx.coroutines.delay(100)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
    ) {
        // Map (full screen)
        TourMapView(
            tour = tour,
            tourPoints = tourPoints,
            currentPointIndex = currentPointIndex,
            userLocation = userLocation,
            modifier = Modifier.fillMaxSize()
        )

        // Subtitle overlay
        AnimatedVisibility(
            visible = subtitlesOn && !currentSubtitle.isNullOrEmpty(),
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 200.dp) // Above audio controls
        ) {
            currentSubtitle?.let { subtitle ->
                SubtitleOverlay(text = subtitle)
            }
        }

        // Top overlay buttons
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Close button
            IconButton(
                onClick = {
                    viewModel.stopTour()
                    onBack()
                },
                modifier = Modifier
                    .size(40.dp)
                    .shadow(8.dp, CircleShape)
                    .background(Color.Black.copy(alpha = 0.5f), CircleShape)
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = stringResource(R.string.close),
                    tint = BrandCream
                )
            }

            // Subtitle toggle button
            IconButton(
                onClick = { viewModel.toggleSubtitles() },
                modifier = Modifier
                    .size(40.dp)
                    .shadow(8.dp, CircleShape)
                    .background(Color.Black.copy(alpha = 0.5f), CircleShape)
            ) {
                Icon(
                    imageVector = if (subtitlesOn) Icons.Default.ClosedCaption else Icons.Default.ClosedCaptionDisabled,
                    contentDescription = stringResource(R.string.subtitles),
                    tint = BrandCream
                )
            }
        }

        // Audio controls at bottom
        AudioControlsPanel(
            currentPoint = currentPoint,
            currentPointIndex = currentPointIndex,
            totalPoints = tourPoints.size,
            isPlaying = isPlaying,
            currentPosition = currentPosition,
            duration = duration,
            onPlayPause = { viewModel.togglePlayPause() },
            onSeekTo = { viewModel.seekTo(it) },
            onSkipBackward = { viewModel.seekBackward() },
            onSkipForward = { viewModel.seekForward() },
            onPreviousPoint = { viewModel.moveToPreviousPoint() },
            onNextPoint = { viewModel.moveToNextPoint() },
            language = language,
            modifier = Modifier.align(Alignment.BottomCenter)
        )
    }
}

@Composable
private fun TourMapView(
    tour: com.bandite.sonicwalkscape.data.models.Tour?,
    tourPoints: List<TourPoint>,
    currentPointIndex: Int,
    userLocation: android.location.Location?,
    modifier: Modifier = Modifier
) {
    val cameraPositionState = rememberCameraPositionState()

    // Calculate bounds and center camera on tour points
    LaunchedEffect(tourPoints) {
        if (tourPoints.isNotEmpty()) {
            val boundsBuilder = LatLngBounds.builder()
            tourPoints.forEach { point ->
                boundsBuilder.include(LatLng(point.location.lat, point.location.lng))
            }
            val bounds = boundsBuilder.build()
            cameraPositionState.move(CameraUpdateFactory.newLatLngBounds(bounds, 100))
        }
    }

    GoogleMap(
        modifier = modifier,
        cameraPositionState = cameraPositionState,
        properties = MapProperties(
            mapType = MapType.HYBRID,
            isMyLocationEnabled = userLocation != null
        ),
        uiSettings = MapUiSettings(
            zoomControlsEnabled = false,
            myLocationButtonEnabled = false,
            mapToolbarEnabled = false
        )
    ) {
        // Draw route polyline
        tour?.routePolyline?.let { polylineStr ->
            val routePoints = parseRoutePolyline(polylineStr)
            if (routePoints.isNotEmpty()) {
                Polyline(
                    points = routePoints,
                    color = Color(0xFF660014), // Dark red matching iOS
                    width = 8f
                )
            }
        }

        // Draw trigger radius circles and markers for each point
        tourPoints.forEachIndexed { index, point ->
            val position = LatLng(point.location.lat, point.location.lng)
            val isPassed = index < currentPointIndex
            val isCurrent = index == currentPointIndex

            // Trigger radius circle
            Circle(
                center = position,
                radius = point.triggerRadiusMeters.toDouble(),
                fillColor = when {
                    isPassed -> Color.Gray.copy(alpha = 0.15f)
                    isCurrent -> Color(0xFFFF9800).copy(alpha = 0.2f) // Orange
                    else -> Color(0xFF660014).copy(alpha = 0.15f) // Dark red
                },
                strokeColor = when {
                    isPassed -> Color.Gray.copy(alpha = 0.3f)
                    isCurrent -> Color(0xFFFF9800).copy(alpha = 0.5f)
                    else -> Color(0xFF660014).copy(alpha = 0.3f)
                },
                strokeWidth = 4f
            )

            // Point marker
            MarkerComposable(
                state = MarkerState(position = position),
                title = point.getDisplayTitle(),
                anchor = Offset(0.5f, 0.5f)
            ) {
                PointMarker(
                    order = point.order,
                    isPassed = isPassed,
                    isCurrent = isCurrent
                )
            }
        }
    }
}

@Composable
private fun PointMarker(
    order: Int,
    isPassed: Boolean,
    isCurrent: Boolean
) {
    Box(
        modifier = Modifier
            .size(32.dp)
            .clip(CircleShape)
            .background(
                when {
                    isPassed -> BrandMuted
                    isCurrent -> BrandYellow
                    else -> BrandPurple
                }
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = order.toString(),
            color = Color.White,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun SubtitleOverlay(text: String) {
    Box(
        modifier = Modifier
            .padding(horizontal = 20.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(Color.Black.copy(alpha = 0.75f))
            .padding(horizontal = 20.dp, vertical = 12.dp)
    ) {
        Text(
            text = text,
            color = Color.White,
            fontSize = 16.sp,
            fontWeight = FontWeight.Medium,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun AudioControlsPanel(
    currentPoint: TourPoint?,
    currentPointIndex: Int,
    totalPoints: Int,
    isPlaying: Boolean,
    currentPosition: Long,
    duration: Long,
    onPlayPause: () -> Unit,
    onSeekTo: (Long) -> Unit,
    onSkipBackward: () -> Unit,
    onSkipForward: () -> Unit,
    onPreviousPoint: () -> Unit,
    onNextPoint: () -> Unit,
    language: String,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(20.dp),
        color = BrandPurple.copy(alpha = 0.95f),
        shadowElevation = 8.dp
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Point title
            Text(
                text = currentPoint?.getDisplayTitle(language) ?: stringResource(R.string.waiting_for_location),
                color = BrandCream,
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center,
                maxLines = 2
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Progress slider
            if (duration > 0) {
                Slider(
                    value = currentPosition.toFloat(),
                    onValueChange = { onSeekTo(it.toLong()) },
                    valueRange = 0f..duration.toFloat(),
                    colors = SliderDefaults.colors(
                        thumbColor = BrandYellow,
                        activeTrackColor = BrandYellow,
                        inactiveTrackColor = BrandMuted.copy(alpha = 0.3f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                // Time display
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = formatTime(currentPosition),
                        color = Color.White,
                        fontSize = 12.sp
                    )
                    Text(
                        text = formatTime(duration),
                        color = Color.White,
                        fontSize = 12.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Playback controls
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Previous point
                IconButton(
                    onClick = onPreviousPoint,
                    enabled = currentPointIndex > 0
                ) {
                    Icon(
                        imageVector = Icons.Default.SkipPrevious,
                        contentDescription = stringResource(R.string.previous_point),
                        tint = if (currentPointIndex > 0) BrandCream else BrandMuted,
                        modifier = Modifier.size(28.dp)
                    )
                }

                // Skip backward 10s
                IconButton(onClick = onSkipBackward) {
                    Icon(
                        imageVector = Icons.Default.Replay10,
                        contentDescription = stringResource(R.string.rewind),
                        tint = BrandCream,
                        modifier = Modifier.size(28.dp)
                    )
                }

                // Play/Pause
                FilledIconButton(
                    onClick = onPlayPause,
                    modifier = Modifier.size(64.dp),
                    colors = IconButtonDefaults.filledIconButtonColors(
                        containerColor = BrandYellow
                    )
                ) {
                    Icon(
                        imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                        contentDescription = if (isPlaying) stringResource(R.string.pause) else stringResource(R.string.play),
                        tint = Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                }

                // Skip forward 10s
                IconButton(onClick = onSkipForward) {
                    Icon(
                        imageVector = Icons.Default.Forward10,
                        contentDescription = stringResource(R.string.forward),
                        tint = BrandCream,
                        modifier = Modifier.size(28.dp)
                    )
                }

                // Next point
                IconButton(onClick = onNextPoint) {
                    Icon(
                        imageVector = Icons.Default.SkipNext,
                        contentDescription = stringResource(R.string.next_point),
                        tint = BrandCream,
                        modifier = Modifier.size(28.dp)
                    )
                }
            }
        }
    }
}

private fun formatTime(ms: Long): String {
    val totalSeconds = ms / 1000
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return String.format("%d:%02d", minutes, seconds)
}

private fun parseRoutePolyline(polyline: String): List<LatLng> {
    return try {
        polyline.split(";").mapNotNull { coord ->
            val parts = coord.split(",")
            if (parts.size == 2) {
                val lat = parts[0].toDoubleOrNull()
                val lng = parts[1].toDoubleOrNull()
                if (lat != null && lng != null) {
                    LatLng(lat, lng)
                } else null
            } else null
        }
    } catch (e: Exception) {
        emptyList()
    }
}
