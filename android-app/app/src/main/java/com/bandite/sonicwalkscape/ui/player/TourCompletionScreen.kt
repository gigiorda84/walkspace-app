package com.bandite.sonicwalkscape.ui.player

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.CameraAlt
import androidx.compose.material.icons.outlined.DirectionsBus
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.People
import androidx.compose.material.icons.outlined.StarBorder
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
    val isSendingRating by viewModel.isSendingRating.collectAsState()
    val ratingSent by viewModel.ratingSent.collectAsState()

    var showBusInfoDialog by remember { mutableStateOf(false) }
    var showConnectSheet by remember { mutableStateOf(false) }
    var rating by remember { mutableStateOf(0) }
    var ratingComment by remember { mutableStateOf("") }

    val paypalUrl = "https://www.paypal.com/donate/?hosted_button_id=BUD638ZGFSJ3C"
    val satispayUrl = "https://tag.satispay.com/Resonavisse"

    fun openDonation(url: String, provider: String) {
        viewModel.trackDonationClicked(provider)
        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
    }

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
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 32.dp, vertical = 48.dp),
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
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
                )
            }

            // Explicit donation ask
            Text(
                text = stringResource(R.string.donation_ask),
                fontSize = 15.sp,
                color = BrandCream,
                textAlign = TextAlign.Center,
                lineHeight = 22.sp,
                modifier = Modifier.padding(horizontal = 16.dp)
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Donation hero card
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BrandYellow, RoundedCornerShape(18.dp))
                    .background(Color.White.copy(alpha = 0.06f), RoundedCornerShape(18.dp))
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(
                    text = stringResource(R.string.support_project),
                    fontSize = 17.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = BrandCream
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    DonationButton(
                        text = "PayPal",
                        background = Color(0xFFFFC439),
                        foreground = Color(0xFF003087),
                        modifier = Modifier.weight(1f),
                        onClick = { openDonation(paypalUrl, "paypal") }
                    )
                    DonationButton(
                        text = "Satispay",
                        background = Color(0xFFFF4B3E),
                        foreground = Color.White,
                        modifier = Modifier.weight(1f),
                        onClick = { openDonation(satispayUrl, "satispay") }
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Inline star rating
            if (ratingSent) {
                Text(
                    text = stringResource(R.string.rating_thanks),
                    fontSize = 14.sp,
                    color = BrandYellow
                )
            } else {
                Text(
                    text = stringResource(R.string.rating_question),
                    fontSize = 14.sp,
                    color = BrandMuted
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    for (star in 1..5) {
                        IconButton(onClick = { rating = star }) {
                            Icon(
                                imageVector = if (star <= rating) Icons.Default.Star else Icons.Outlined.StarBorder,
                                contentDescription = null,
                                modifier = Modifier.size(28.dp),
                                tint = if (star <= rating) BrandYellow else BrandMuted
                            )
                        }
                    }
                }
                if (rating > 0) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = ratingComment,
                            onValueChange = { ratingComment = it },
                            modifier = Modifier.weight(1f),
                            placeholder = {
                                Text(
                                    text = stringResource(R.string.rating_comment_hint),
                                    fontSize = 13.sp,
                                    color = BrandCream.copy(alpha = 0.5f)
                                )
                            },
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = BrandCream,
                                unfocusedTextColor = BrandCream,
                                focusedBorderColor = BrandYellow,
                                unfocusedBorderColor = BrandMuted
                            )
                        )
                        Button(
                            onClick = { viewModel.submitRating(rating, ratingComment, language) },
                            enabled = !isSendingRating,
                            colors = ButtonDefaults.buttonColors(containerColor = BrandYellow)
                        ) {
                            if (isSendingRating) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(18.dp),
                                    color = BrandPurple,
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Text(
                                    text = stringResource(R.string.send),
                                    fontWeight = FontWeight.SemiBold,
                                    color = BrandPurple
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Secondary links row
            Row(
                horizontalArrangement = Arrangement.spacedBy(24.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                tour?.getDisplayBusInfo(language)?.let {
                    SecondaryLink(
                        icon = Icons.Outlined.DirectionsBus,
                        text = stringResource(R.string.bus_info),
                        onClick = { showBusInfoDialog = true }
                    )
                }
                SecondaryLink(
                    icon = Icons.Default.FavoriteBorder,
                    text = stringResource(R.string.follow_us),
                    onClick = { showConnectSheet = true }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Return to Home (demoted to text link)
            TextButton(onClick = onReturnHome) {
                Text(
                    text = stringResource(R.string.return_home),
                    fontSize = 14.sp,
                    color = BrandMuted,
                    textDecoration = androidx.compose.ui.text.style.TextDecoration.Underline
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
private fun DonationButton(
    text: String,
    background: Color,
    foreground: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        modifier = modifier.height(48.dp),
        shape = RoundedCornerShape(50),
        colors = ButtonDefaults.buttonColors(containerColor = background)
    ) {
        Text(
            text = text,
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            color = foreground
        )
    }
}

@Composable
private fun SecondaryLink(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    text: String,
    onClick: () -> Unit
) {
    TextButton(onClick = onClick) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(16.dp),
            tint = BrandYellow
        )
        Spacer(modifier = Modifier.width(6.dp))
        Text(
            text = text,
            fontSize = 14.sp,
            color = BrandCream
        )
    }
}
