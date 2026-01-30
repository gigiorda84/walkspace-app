package com.bandite.sonicwalkscape.ui.tourdetail

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BrandPurple)
    ) {
        when {
            isLoading -> {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = BrandYellow
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
                    Button(
                        onClick = { viewModel.loadTour(tourId) },
                        colors = ButtonDefaults.buttonColors(containerColor = BrandYellow)
                    ) {
                        Text(stringResource(R.string.retry), color = BrandPurple)
                    }
                }
            }
            tour != null -> {
                val currentTour = tour!!

                Box(modifier = Modifier.fillMaxSize()) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                    ) {
                        // Cover image
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(300.dp)
                                .background(SurfacePurple)
                        ) {
                            currentTour.getFullCoverImageUrl(Constants.API_BASE_URL)?.let { url ->
                                AsyncImage(
                                    model = url,
                                    contentDescription = null,
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Crop
                                )
                            } ?: Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Image,
                                    contentDescription = null,
                                    tint = BrandMuted,
                                    modifier = Modifier.size(64.dp)
                                )
                            }
                        }

                        Column(
                            modifier = Modifier.padding(20.dp)
                        ) {
                            // Title with lock icon if protected
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = currentTour.getDisplayTitle(preferredLanguage),
                                    fontSize = 28.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = BrandCream,
                                    letterSpacing = (-1).sp,
                                    modifier = Modifier.weight(1f)
                                )
                                if (currentTour.isProtected) {
                                    Icon(
                                        imageVector = Icons.Default.Lock,
                                        contentDescription = null,
                                        tint = BrandYellow
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            // City
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.LocationOn,
                                    contentDescription = null,
                                    tint = BrandCream,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = currentTour.city,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = BrandCream
                                )
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            // Language badges
                            if (currentTour.languages.isNotEmpty()) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Language,
                                        contentDescription = null,
                                        tint = BrandCream,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    currentTour.languages.forEach { lang ->
                                        Surface(
                                            shape = RoundedCornerShape(6.dp),
                                            color = BrandYellow.copy(alpha = 0.3f)
                                        ) {
                                            Text(
                                                text = lang.uppercase(),
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Medium,
                                                color = BrandYellow,
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                            )
                                        }
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            // Info badges row
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                InfoBadge(
                                    icon = Icons.Default.Schedule,
                                    text = "${currentTour.durationMinutes} min"
                                )
                                InfoBadge(
                                    icon = Icons.Default.Map,
                                    text = String.format("%.1f km", currentTour.distanceKm)
                                )
                                InfoBadge(
                                    icon = Icons.Default.DirectionsWalk,
                                    text = stringResource(R.string.difficulty_easy)
                                )
                            }

                            Spacer(modifier = Modifier.height(20.dp))

                            // Description
                            Text(
                                text = currentTour.getDisplayDescription(preferredLanguage),
                                fontSize = 16.sp,
                                color = BrandCream,
                                lineHeight = 24.sp
                            )

                            // Add bottom padding for the button
                            Spacer(modifier = Modifier.height(120.dp))
                        }
                    }

                    // Back button (top-left, overlaid on image)
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier
                            .padding(16.dp)
                            .size(40.dp)
                            .background(
                                color = androidx.compose.ui.graphics.Color.Black.copy(alpha = 0.5f),
                                shape = RoundedCornerShape(50)
                            )
                    ) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = stringResource(R.string.back),
                            tint = BrandCream
                        )
                    }

                    // Bottom Start button with gradient fade
                    Column(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .fillMaxWidth()
                    ) {
                        // Gradient fade
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(40.dp)
                                .background(
                                    brush = Brush.verticalGradient(
                                        colors = listOf(
                                            BrandPurple.copy(alpha = 0f),
                                            BrandPurple
                                        )
                                    )
                                )
                        )

                        // Button area
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(BrandPurple)
                                .padding(horizontal = 20.dp, vertical = 16.dp)
                        ) {
                            Button(
                                onClick = onStartTour,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(56.dp),
                                shape = RoundedCornerShape(50),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = BrandYellow
                                )
                            ) {
                                Icon(
                                    imageVector = Icons.Default.PlayArrow,
                                    contentDescription = null,
                                    tint = BrandPurple
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = stringResource(R.string.start_tour),
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = BrandPurple
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
fun InfoBadge(
    icon: ImageVector,
    text: String
) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = SurfacePurple.copy(alpha = 0.5f),
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderPurple)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = BrandCream,
                modifier = Modifier.size(14.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = text,
                fontSize = 12.sp,
                color = BrandCream
            )
        }
    }
}
