package com.bandite.sonicwalkscape.ui.debug

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bandite.sonicwalkscape.ui.theme.*
import com.bandite.sonicwalkscape.utils.DebugLogger

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DebugScreen(
    viewModel: DebugViewModel,
    onBack: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        viewModel.refresh()
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        text = "Diagnostics",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = BrandCream
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = BrandCream)
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.refresh() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = BrandCream)
                    }
                    IconButton(onClick = {
                        val text = viewModel.getExportText()
                        val intent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_SUBJECT, "Sonic Walkscape Debug Report")
                            putExtra(Intent.EXTRA_TEXT, text)
                        }
                        context.startActivity(Intent.createChooser(intent, "Share Debug Report"))
                    }) {
                        Icon(Icons.Default.Share, contentDescription = "Export", tint = BrandYellow)
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = BrandPurple
                )
            )
        },
        containerColor = BrandPurple
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Device Info
            item {
                Spacer(modifier = Modifier.height(4.dp))
                SectionCard(title = "Device Info") {
                    InfoLine("Device", state.deviceModel)
                    InfoLine("Android", state.androidVersion)
                    InfoLine("App version", state.appVersion)
                    InfoLine("Build code", state.appVersionCode)
                }
            }

            // GPS Status
            item {
                SectionCard(title = "GPS Status") {
                    InfoLine("Permission", state.locationPermission)
                    InfoLine("GPS enabled", if (state.gpsEnabled) "Yes" else "NO")
                }
            }

            // Audio Status
            item {
                SectionCard(title = "Audio Status") {
                    InfoLine("State", state.audioState)
                }
            }

            // Crash Logs
            if (state.crashCount > 0) {
                item {
                    SectionCard(
                        title = "Crashes (${state.crashCount})",
                        action = {
                            IconButton(onClick = { viewModel.clearCrashes() }) {
                                Icon(Icons.Default.Delete, contentDescription = "Clear", tint = Error, modifier = Modifier.size(20.dp))
                            }
                        }
                    ) {
                        Text(
                            text = state.crashText.take(2000),
                            color = Error,
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            modifier = Modifier.horizontalScroll(rememberScrollState())
                        )
                    }
                }
            }

            // Recent Logs
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Logs (${state.logs.size})",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = BrandCream
                    )
                    TextButton(onClick = { viewModel.clearLogs() }) {
                        Text("Clear", color = BrandYellow, fontSize = 12.sp)
                    }
                }
            }

            items(state.logs) { entry ->
                LogLine(entry)
            }

            item {
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

@Composable
private fun SectionCard(
    title: String,
    action: @Composable (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = title,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = BrandCream,
                modifier = Modifier.padding(horizontal = 4.dp, vertical = 8.dp)
            )
            action?.invoke()
        }
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            color = SurfacePurple
        ) {
            Column(
                modifier = Modifier.padding(12.dp),
                content = content
            )
        }
    }
}

@Composable
private fun InfoLine(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, color = BrandCream.copy(alpha = 0.7f), fontSize = 13.sp)
        Text(text = value, color = BrandCream, fontSize = 13.sp, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun LogLine(entry: DebugLogger.LogEntry) {
    val levelColor = when (entry.level) {
        "E" -> Error
        "W" -> Warning
        "I" -> Color(0xFF64B5F6)
        else -> BrandCream.copy(alpha = 0.8f)
    }

    Text(
        text = entry.formatted(),
        color = levelColor,
        fontSize = 10.sp,
        fontFamily = FontFamily.Monospace,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 1.dp)
    )
}
