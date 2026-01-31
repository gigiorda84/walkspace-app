package com.bandite.sonicwalkscape.ui.player

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.CameraAlt
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.People
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.bandite.sonicwalkscape.R
import com.bandite.sonicwalkscape.ui.theme.*
import com.bandite.sonicwalkscape.ui.welcome.ConnectBottomSheet

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TourCompletionScreen(
    tourId: String,
    language: String = "en",
    onReturnHome: () -> Unit,
    onClose: () -> Unit,
    viewModel: TourCompletionViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val tour by viewModel.tour.collectAsState()

    var showBusInfoDialog by remember { mutableStateOf(false) }
    var showConnectSheet by remember { mutableStateOf(false) }

    LaunchedEffect(tourId) {
        viewModel.loadTour(tourId, language)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.92f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Checkmark icon + Title inline
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = null,
                    modifier = Modifier.size(40.dp),
                    tint = BrandYellow
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = stringResource(R.string.tour_complete_title),
                    fontSize = 34.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrandCream,
                    letterSpacing = (-1).sp
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Tour name in yellow
            tour?.let { t ->
                Text(
                    text = t.getDisplayTitle(language).uppercase(),
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Medium,
                    color = BrandYellow,
                    textAlign = TextAlign.Center
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Completion message (if available)
            tour?.getDisplayCompletionMessage(language)?.let { message ->
                Text(
                    text = message,
                    fontSize = 16.sp,
                    color = BrandCream,
                    textAlign = TextAlign.Center,
                    lineHeight = 24.sp,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 20.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Action buttons
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Info Bus button (only if busInfo exists)
                tour?.getDisplayBusInfo(language)?.let {
                    CompletionOutlinedButton(
                        text = stringResource(R.string.bus_info),
                        onClick = { showBusInfoDialog = true }
                    )
                }

                // Seguici / Follow Us button
                CompletionOutlinedButton(
                    text = stringResource(R.string.follow_us),
                    onClick = { showConnectSheet = true }
                )

                // Supporta / Support button
                CompletionOutlinedButton(
                    text = stringResource(R.string.support),
                    onClick = {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.produzionidalbasso.com/project/unseen-sonic-walkscape-at-the-border/"))
                        context.startActivity(intent)
                    }
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Return to Home button (yellow filled)
            Button(
                onClick = onReturnHome,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(50),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BrandYellow
                )
            ) {
                Text(
                    text = stringResource(R.string.return_home),
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White
                )
            }
        }

        // Close button (top-right)
        IconButton(
            onClick = onClose,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .statusBarsPadding()
                .padding(16.dp)
                .size(36.dp)
                .background(Color.Black.copy(alpha = 0.5f), CircleShape)
        ) {
            Icon(
                imageVector = Icons.Default.Close,
                contentDescription = stringResource(R.string.close),
                tint = BrandCream,
                modifier = Modifier.size(16.dp)
            )
        }
    }

    // Bus Info Dialog
    if (showBusInfoDialog) {
        AlertDialog(
            onDismissRequest = { showBusInfoDialog = false },
            title = {
                Text(
                    text = stringResource(R.string.bus_info),
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Text(
                    text = tour?.getDisplayBusInfo(language) ?: ""
                )
            },
            confirmButton = {
                TextButton(onClick = { showBusInfoDialog = false }) {
                    Text("OK")
                }
            },
            containerColor = BrandPurple,
            titleContentColor = BrandCream,
            textContentColor = BrandCream
        )
    }

    // Connect Bottom Sheet
    if (showConnectSheet) {
        ConnectBottomSheet(
            onDismiss = { showConnectSheet = false }
        )
    }
}

@Composable
private fun CompletionOutlinedButton(
    text: String,
    onClick: () -> Unit
) {
    OutlinedButton(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp),
        shape = RoundedCornerShape(50),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = Color.White
        ),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color.White)
    ) {
        Text(
            text = text,
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}
