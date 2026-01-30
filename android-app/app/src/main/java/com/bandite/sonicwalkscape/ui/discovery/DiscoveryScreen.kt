package com.bandite.sonicwalkscape.ui.discovery

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bandite.sonicwalkscape.R
import com.bandite.sonicwalkscape.data.models.Tour
import com.bandite.sonicwalkscape.ui.theme.*
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import com.google.maps.android.compose.*

@Composable
fun DiscoveryScreen(
    viewModel: DiscoveryViewModel,
    onTourClick: (String) -> Unit,
    onSettingsClick: () -> Unit,
    onHomeClick: () -> Unit = {}
) {
    val tours by viewModel.tours.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val preferredLanguage by viewModel.preferredLanguage.collectAsState(initial = "en")

    // Calculate camera position to fit all tour markers
    val tourLocations = remember(tours) {
        tours.mapNotNull { tour ->
            tour.points?.firstOrNull()?.let { point ->
                TourLocation(
                    tour = tour,
                    position = LatLng(point.location.lat, point.location.lng)
                )
            }
        }
    }

    // Default position (Montgenèvre area - matches iOS screenshot)
    val defaultPosition = LatLng(44.9324, 6.7262)

    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(defaultPosition, 12f)
    }

    // Fit bounds to show all markers when tours load
    LaunchedEffect(tourLocations) {
        if (tourLocations.isNotEmpty()) {
            val boundsBuilder = LatLngBounds.builder()
            tourLocations.forEach { boundsBuilder.include(it.position) }
            val bounds = boundsBuilder.build()
            cameraPositionState.animate(
                CameraUpdateFactory.newLatLngBounds(bounds, 100)
            )
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BrandPurple)
    ) {
        when {
            isLoading -> {
                // Loading state
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = BrandYellow)
                }
            }
            error != null -> {
                // Error state
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = error ?: stringResource(R.string.error_loading),
                        color = Error,
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = { viewModel.refreshTours() },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = BrandYellow
                        )
                    ) {
                        Text(
                            text = stringResource(R.string.retry),
                            color = BrandPurple
                        )
                    }
                }
            }
            else -> {
                // Map with tour markers
                GoogleMap(
                    modifier = Modifier.fillMaxSize(),
                    cameraPositionState = cameraPositionState,
                    properties = MapProperties(
                        mapType = MapType.HYBRID // Satellite/terrain style like iOS
                    ),
                    uiSettings = MapUiSettings(
                        zoomControlsEnabled = false,
                        mapToolbarEnabled = false,
                        myLocationButtonEnabled = false
                    )
                ) {
                    tourLocations.forEach { tourLocation ->
                        TourMarker(
                            tourLocation = tourLocation,
                            language = preferredLanguage,
                            onClick = { onTourClick(tourLocation.tour.id) }
                        )
                    }
                }
            }
        }

        // Header overlay (always visible on top of map)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Home button
            IconButton(
                onClick = onHomeClick,
                modifier = Modifier
                    .size(60.dp)
                    .background(
                        color = androidx.compose.ui.graphics.Color.Black.copy(alpha = 0.5f),
                        shape = CircleShape
                    )
            ) {
                Icon(
                    imageVector = Icons.Default.Home,
                    contentDescription = stringResource(R.string.home),
                    tint = BrandYellow,
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.weight(1f))

            // Centered title
            Text(
                text = stringResource(R.string.discover),
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = BrandCream
            )

            Spacer(modifier = Modifier.weight(1f))

            // Settings button
            IconButton(
                onClick = onSettingsClick,
                modifier = Modifier
                    .size(60.dp)
                    .background(
                        color = androidx.compose.ui.graphics.Color.Black.copy(alpha = 0.5f),
                        shape = CircleShape
                    )
            ) {
                Icon(
                    imageVector = Icons.Default.Settings,
                    contentDescription = stringResource(R.string.settings),
                    tint = BrandYellow,
                    modifier = Modifier.size(24.dp)
                )
            }
        }
    }
}

// Helper data class
private data class TourLocation(
    val tour: Tour,
    val position: LatLng
)

// Custom tour marker with yellow pill label (always visible like iOS)
@Composable
private fun TourMarker(
    tourLocation: TourLocation,
    language: String,
    onClick: () -> Unit
) {
    val markerState = rememberMarkerState(position = tourLocation.position)

    MarkerComposable(
        state = markerState,
        onClick = {
            onClick()
            true
        },
        anchor = Offset(0.5f, 1f)
    ) {
        // Yellow dot + pill label (like iOS)
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Yellow pill label
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(BrandYellow)
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Text(
                    text = tourLocation.tour.getDisplayTitle(language).uppercase(),
                    color = BrandPurple,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
            }
            // Small yellow dot below label
            Spacer(modifier = Modifier.height(4.dp))
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .clip(CircleShape)
                    .background(BrandYellow)
                    .border(1.dp, BrandPurple, CircleShape)
            )
        }
    }
}
