package com.bandite.sonicwalkscape.ui.discovery

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.bandite.sonicwalkscape.R
import com.bandite.sonicwalkscape.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiscoveryScreen(
    viewModel: DiscoveryViewModel,
    onTourClick: (String) -> Unit,
    onSettingsClick: () -> Unit
) {
    val tours by viewModel.tours.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val preferredLanguage by viewModel.preferredLanguage.collectAsState(initial = "en")

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = stringResource(R.string.discover_tours),
                        color = TextPrimary
                    )
                },
                actions = {
                    IconButton(onClick = { viewModel.refreshTours() }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = stringResource(R.string.refresh),
                            tint = TextPrimary
                        )
                    }
                    IconButton(onClick = onSettingsClick) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = stringResource(R.string.settings),
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
                            color = Error,
                            style = MaterialTheme.typography.bodyLarge
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = { viewModel.refreshTours() },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = AccentPrimary
                            )
                        ) {
                            Text(stringResource(R.string.retry))
                        }
                    }
                }
                tours.isEmpty() -> {
                    Text(
                        text = stringResource(R.string.no_tours),
                        modifier = Modifier
                            .align(Alignment.Center)
                            .padding(16.dp),
                        color = TextSecondary,
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        items(tours, key = { it.id }) { tour ->
                            TourCard(
                                tour = tour,
                                language = preferredLanguage,
                                onClick = { onTourClick(tour.id) }
                            )
                        }
                    }
                }
            }
        }
    }
}
