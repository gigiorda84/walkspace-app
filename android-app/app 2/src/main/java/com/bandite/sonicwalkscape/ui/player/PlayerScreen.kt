package com.bandite.sonicwalkscape.ui.player

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.bandite.sonicwalkscape.R
import com.bandite.sonicwalkscape.ui.theme.BackgroundCard
import com.bandite.sonicwalkscape.ui.theme.BackgroundDark
import com.bandite.sonicwalkscape.ui.theme.BackgroundElevated
import com.bandite.sonicwalkscape.ui.theme.BrandAccent
import com.bandite.sonicwalkscape.ui.theme.MapPointActive
import com.bandite.sonicwalkscape.ui.theme.ProgressBackground
import com.bandite.sonicwalkscape.ui.theme.TextMuted
import com.bandite.sonicwalkscape.ui.theme.TextPrimary
import com.bandite.sonicwalkscape.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlayerScreen(
    tourId: String,
    language: String,
    onExit: () -> Unit,
    onTourComplete: () -> Unit,
    viewModel: PlayerViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val nearbyPoint by viewModel.nearbyPoint.collectAsState()
    val currentPointIndex by viewModel.currentPointIndex.collectAsState()
    val distanceToNextPoint by viewModel.distanceToNextPoint.collectAsState()
    val isPlaying by viewModel.isPlaying.collectAsState()
    val currentTime by viewModel.currentTime.collectAsState()
    val duration by viewModel.duration.collectAsState()
    val isBuffering by viewModel.isBuffering.collectAsState()
    val isPointActive by viewModel.isPointActive.collectAsState()

    var showExitDialog by remember { mutableStateOf(false) }

    // Handle completion
    LaunchedEffect(uiState) {
        if (uiState is PlayerUiState.Completed) {
            onTourComplete()
        }
    }

    // Handle back press
    BackHandler {
        showExitDialog = true
    }

    // Exit confirmation dialog
    if (showExitDialog) {
        AlertDialog(
            onDismissRequest = { showExitDialog = false },
            title = { Text(stringResource(R.string.player_exit_title)) },
            text = { Text(stringResource(R.string.player_exit_message)) },
            confirmButton = {
                Button(
                    onClick = {
                        showExitDialog = false
                        viewModel.exitTour()
                        onExit()
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = BrandAccent
                    )
                ) {
                    Text(stringResource(R.string.player_exit_confirm))
                }
            },
            dismissButton = {
                TextButton(onClick = { showExitDialog = false }) {
                    Text(stringResource(R.string.player_exit_cancel))
                }
            },
            containerColor = BackgroundCard
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    val state = uiState as? PlayerUiState.Playing
                    state?.let {
                        Text(
                            text = stringResource(
                                R.string.player_point,
                                currentPointIndex + 1,
                                it.points.size
                            ),
                            color = TextPrimary
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { showExitDialog = true }) {
                        Icon(
                            imageVector = Icons.Default.Close,
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
        when (val state = uiState) {
            is PlayerUiState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator(color = BrandAccent)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = stringResource(R.string.loading),
                            color = TextSecondary
                        )
                    }
                }
            }

            is PlayerUiState.Playing -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .padding(16.dp)
                ) {
                    // Map placeholder (would integrate Google Maps here)
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f)
                            .clip(RoundedCornerShape(16.dp))
                            .background(BackgroundElevated),
                        contentAlignment = Alignment.Center
                    ) {
                        // TODO: Integrate Google Maps with route and points
                        Text(
                            text = "Map View\n(Route: ${state.points.size} points)",
                            color = TextMuted,
                            textAlign = TextAlign.Center
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Current point info
                    val currentPoint = viewModel.getCurrentPoint()
                    if (currentPoint != null) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(BackgroundCard)
                                .padding(16.dp)
                        ) {
                            // Point title
                            Row(
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .clip(CircleShape)
                                        .background(if (isPointActive) MapPointActive else BackgroundElevated),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Place,
                                        contentDescription = null,
                                        tint = TextPrimary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = currentPoint.title,
                                        style = MaterialTheme.typography.titleMedium,
                                        color = TextPrimary
                                    )
                                    distanceToNextPoint?.let { distance ->
                                        Text(
                                            text = stringResource(
                                                R.string.player_distance_to_next,
                                                distance.toInt()
                                            ),
                                            style = MaterialTheme.typography.bodySmall,
                                            color = TextMuted
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            // Audio progress
                            if (duration > 0) {
                                Column {
                                    Slider(
                                        value = currentTime.toFloat(),
                                        onValueChange = { viewModel.seekTo(it.toLong()) },
                                        valueRange = 0f..duration.toFloat(),
                                        colors = SliderDefaults.colors(
                                            thumbColor = BrandAccent,
                                            activeTrackColor = BrandAccent,
                                            inactiveTrackColor = ProgressBackground
                                        )
                                    )

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(
                                            text = formatTime(currentTime),
                                            style = MaterialTheme.typography.bodySmall,
                                            color = TextMuted
                                        )
                                        Text(
                                            text = formatTime(duration),
                                            style = MaterialTheme.typography.bodySmall,
                                            color = TextMuted
                                        )
                                    }
                                }
                            } else if (isBuffering) {
                                LinearProgressIndicator(
                                    modifier = Modifier.fillMaxWidth(),
                                    color = BrandAccent,
                                    trackColor = ProgressBackground
                                )
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            // Play/Pause button
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.Center
                            ) {
                                IconButton(
                                    onClick = {
                                        if (duration > 0) {
                                            viewModel.togglePlayPause()
                                        } else {
                                            viewModel.playCurrentPoint()
                                        }
                                    },
                                    modifier = Modifier
                                        .size(64.dp)
                                        .clip(CircleShape)
                                        .background(BrandAccent)
                                ) {
                                    Icon(
                                        imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                                        contentDescription = if (isPlaying) "Pause" else "Play",
                                        tint = TextPrimary,
                                        modifier = Modifier.size(32.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            is PlayerUiState.Completed -> {
                // Will navigate to completion screen
            }

            is PlayerUiState.Error -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = state.message,
                        style = MaterialTheme.typography.bodyLarge,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = onExit,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = BrandAccent,
                            contentColor = TextPrimary
                        )
                    ) {
                        Text(stringResource(R.string.close))
                    }
                }
            }
        }
    }
}

private fun formatTime(timeMs: Long): String {
    val totalSeconds = timeMs / 1000
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return "%d:%02d".format(minutes, seconds)
}
