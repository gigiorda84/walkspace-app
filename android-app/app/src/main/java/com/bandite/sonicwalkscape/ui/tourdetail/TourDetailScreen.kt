package com.bandite.sonicwalkscape.ui.tourdetail

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.bandite.sonicwalkscape.R
import com.bandite.sonicwalkscape.ui.theme.*
import com.bandite.sonicwalkscape.utils.Constants

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TourDetailScreen(
    tourId: String,
    viewModel: TourDetailViewModel,
    onBack: () -> Unit,
    onStartTour: () -> Unit
) {
    val tour by viewModel.tour.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val isDownloaded by viewModel.isDownloaded.collectAsState()
    val isDownloading by viewModel.isDownloading.collectAsState()
    val downloadProgress by viewModel.downloadProgress.collectAsState()
    val preferredLanguage by viewModel.preferredLanguage.collectAsState(initial = "en")

    LaunchedEffect(tourId) {
        viewModel.loadTour(tourId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { },
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
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center),
                        color = AccentPrimary
                    )
                }
                error != null -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = error ?: stringResource(R.string.error_loading),
                            color = Error
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { viewModel.loadTour(tourId) }) {
                            Text(stringResource(R.string.retry))
                        }
                    }
                }
                tour != null -> {
                    val currentTour = tour!!

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                    ) {
                        // Cover image
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(250.dp)
                                .background(BackgroundCard)
                        ) {
                            currentTour.getFullCoverImageUrl(Constants.API_BASE_URL)?.let { url ->
                                AsyncImage(
                                    model = url,
                                    contentDescription = null,
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Crop
                                )
                            }
                        }

                        Column(
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Text(
                                text = currentTour.getDisplayTitle(preferredLanguage),
                                style = MaterialTheme.typography.headlineMedium,
                                color = TextPrimary
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = currentTour.city,
                                style = MaterialTheme.typography.bodyLarge,
                                color = TextMuted
                            )

                            Spacer(modifier = Modifier.height(16.dp))

                            // Stats
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(24.dp)
                            ) {
                                StatItem(
                                    icon = Icons.Default.Schedule,
                                    label = stringResource(R.string.duration),
                                    value = "${currentTour.durationMinutes} min"
                                )
                                StatItem(
                                    icon = Icons.Default.DirectionsWalk,
                                    label = stringResource(R.string.distance),
                                    value = String.format("%.1f km", currentTour.distanceKm)
                                )
                            }

                            Spacer(modifier = Modifier.height(24.dp))

                            Text(
                                text = currentTour.getDisplayDescription(preferredLanguage),
                                style = MaterialTheme.typography.bodyLarge,
                                color = TextSecondary
                            )

                            Spacer(modifier = Modifier.height(32.dp))

                            // Download/Delete button
                            if (isDownloading) {
                                Column {
                                    Text(
                                        text = stringResource(R.string.downloading),
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = TextSecondary
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    LinearProgressIndicator(
                                        progress = { downloadProgress },
                                        modifier = Modifier.fillMaxWidth(),
                                        color = AccentPrimary
                                    )
                                }
                            } else if (!isDownloaded) {
                                OutlinedButton(
                                    onClick = { viewModel.downloadTour(tourId) },
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Icon(Icons.Default.Download, null)
                                    Spacer(Modifier.width(8.dp))
                                    Text(stringResource(R.string.download_for_offline))
                                }
                            } else {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Default.CheckCircle,
                                        null,
                                        tint = Success,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Text(
                                        text = stringResource(R.string.downloaded),
                                        color = Success
                                    )
                                    Spacer(Modifier.weight(1f))
                                    TextButton(onClick = { viewModel.deleteTour(tourId) }) {
                                        Text(stringResource(R.string.delete), color = Error)
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(24.dp))

                            // Start button
                            Button(
                                onClick = onStartTour,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(56.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = AccentPrimary
                                ),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Default.PlayArrow, null)
                                Spacer(Modifier.width(8.dp))
                                Text(
                                    text = stringResource(R.string.start_tour),
                                    style = MaterialTheme.typography.titleMedium
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StatItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String
) {
    Column {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(20.dp),
                tint = AccentPrimary
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = TextMuted
            )
        }
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium,
            color = TextPrimary
        )
    }
}
