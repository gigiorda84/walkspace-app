package com.bandite.sonicwalkscape.ui.tourdetail

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.view.ViewGroup
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.core.content.PermissionChecker
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import coil.compose.AsyncImage
import com.bandite.sonicwalkscape.R
import com.bandite.sonicwalkscape.ui.theme.*
import com.bandite.sonicwalkscape.utils.Constants

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TourDetailScreen(
    tourId: String,
    availableLanguages: List<String> = emptyList(),
    viewModel: TourDetailViewModel,
    onBack: () -> Unit,
    onStartTour: (TourSetupConfig) -> Unit
) {
    val tour by viewModel.tour.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val isDownloaded by viewModel.isDownloaded.collectAsState()
    val isDownloading by viewModel.isDownloading.collectAsState()
    val downloadProgress by viewModel.downloadProgress.collectAsState()
    val downloadError by viewModel.downloadError.collectAsState()
    val preferredLanguage by viewModel.preferredLanguage.collectAsState(initial = "en")

    var showSetupSheet by remember { mutableStateOf(false) }
    var showPermissionDeniedDialog by remember { mutableStateOf(false) }
    var showBackgroundLocationRationale by remember { mutableStateOf(false) }
    val context = LocalContext.current

    // Check if location permission is granted
    fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PermissionChecker.PERMISSION_GRANTED
    }

    fun hasBackgroundLocationPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_BACKGROUND_LOCATION
            ) == PermissionChecker.PERMISSION_GRANTED
        } else true
    }

    // Background location permission launcher (requested after fine location is granted)
    val backgroundPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { _ ->
        // Proceed regardless — background is recommended but not required
        showSetupSheet = true
    }

    // Fine location permission launcher
    val locationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && !hasBackgroundLocationPermission()) {
                showBackgroundLocationRationale = true
            } else {
                showSetupSheet = true
            }
        } else {
            showPermissionDeniedDialog = true
        }
    }

    // Function to handle start tour button click
    fun onStartTourClick() {
        if (hasLocationPermission()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && !hasBackgroundLocationPermission()) {
                showBackgroundLocationRationale = true
            } else {
                showSetupSheet = true
            }
        } else {
            locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        }
    }

    LaunchedEffect(tourId) {
        viewModel.loadTour(tourId, availableLanguages)
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
                        onClick = { viewModel.loadTour(tourId, availableLanguages) },
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
                        // Cover video or image
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(300.dp)
                                .background(SurfacePurple)
                        ) {
                            val trailerUrl = currentTour.getFullCoverTrailerUrl(Constants.API_BASE_URL)
                            val imageUrl = currentTour.getFullCoverImageUrl(Constants.API_BASE_URL)

                            when {
                                trailerUrl != null -> {
                                    // Show video trailer
                                    VideoPlayer(
                                        videoUrl = trailerUrl,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                }
                                imageUrl != null -> {
                                    // Fallback to cover image
                                    AsyncImage(
                                        model = imageUrl,
                                        contentDescription = null,
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    )
                                }
                                else -> {
                                    // Placeholder
                                    Box(
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

                    // Back button (top-left, overlaid on image, below status bar)
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier
                            .statusBarsPadding()
                            .padding(start = 16.dp, top = 8.dp)
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

                        // Button area (above navigation bar)
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(BrandPurple)
                                .navigationBarsPadding()
                                .padding(horizontal = 20.dp, vertical = 16.dp)
                        ) {
                            Button(
                                onClick = { onStartTourClick() },
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

                // Tour Setup Sheet
                if (showSetupSheet) {
                    TourSetupSheet(
                        availableLanguages = currentTour.languages.ifEmpty { listOf(preferredLanguage) },
                        defaultLanguage = if (currentTour.languages.contains(preferredLanguage)) {
                            preferredLanguage
                        } else {
                            currentTour.languages.firstOrNull() ?: preferredLanguage
                        },
                        isDownloading = isDownloading,
                        downloadProgress = downloadProgress,
                        downloadError = downloadError,
                        onDownloadStart = { language ->
                            viewModel.downloadTour(tourId, language)
                        },
                        onComplete = { config ->
                            showSetupSheet = false
                            onStartTour(config)
                        },
                        onDismiss = {
                            showSetupSheet = false
                            viewModel.clearDownloadError()
                        }
                    )
                }

                // Background Location Rationale Dialog
                if (showBackgroundLocationRationale) {
                    AlertDialog(
                        onDismissRequest = {
                            showBackgroundLocationRationale = false
                            showSetupSheet = true
                        },
                        title = {
                            Text(
                                text = stringResource(R.string.background_location_title),
                                color = BrandCream
                            )
                        },
                        text = {
                            Text(
                                text = stringResource(R.string.background_location_explanation),
                                color = BrandCream
                            )
                        },
                        confirmButton = {
                            TextButton(
                                onClick = {
                                    showBackgroundLocationRationale = false
                                    backgroundPermissionLauncher.launch(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
                                }
                            ) {
                                Text(stringResource(R.string.continue_button), color = BrandYellow)
                            }
                        },
                        dismissButton = {
                            TextButton(onClick = {
                                showBackgroundLocationRationale = false
                                showSetupSheet = true
                            }) {
                                Text(stringResource(R.string.skip), color = BrandCream)
                            }
                        },
                        containerColor = BrandPurple
                    )
                }

                // Permission Denied Dialog
                if (showPermissionDeniedDialog) {
                    AlertDialog(
                        onDismissRequest = { showPermissionDeniedDialog = false },
                        title = {
                            Text(
                                text = stringResource(R.string.location_permission_required),
                                color = BrandCream
                            )
                        },
                        text = {
                            Text(
                                text = stringResource(R.string.location_permission_explanation),
                                color = BrandCream
                            )
                        },
                        confirmButton = {
                            TextButton(
                                onClick = {
                                    showPermissionDeniedDialog = false
                                    // Open app settings
                                    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                                        data = Uri.fromParts("package", context.packageName, null)
                                    }
                                    context.startActivity(intent)
                                }
                            ) {
                                Text(stringResource(R.string.open_settings), color = BrandYellow)
                            }
                        },
                        dismissButton = {
                            TextButton(onClick = { showPermissionDeniedDialog = false }) {
                                Text(stringResource(R.string.cancel), color = BrandCream)
                            }
                        },
                        containerColor = BrandPurple
                    )
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

@Composable
@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
fun VideoPlayer(
    videoUrl: String,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current

    val exoPlayer = remember {
        ExoPlayer.Builder(context).build().apply {
            setMediaItem(MediaItem.fromUri(videoUrl))
            repeatMode = Player.REPEAT_MODE_ALL
            volume = 0f // Muted like iOS trailer
            prepare()
            playWhenReady = true
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            exoPlayer.release()
        }
    }

    AndroidView(
        factory = { ctx ->
            PlayerView(ctx).apply {
                player = exoPlayer
                useController = false // No playback controls
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
            }
        },
        modifier = modifier
    )
}
