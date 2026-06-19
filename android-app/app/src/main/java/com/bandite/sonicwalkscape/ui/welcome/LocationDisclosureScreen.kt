package com.bandite.sonicwalkscape.ui.welcome

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.ClickableText
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bandite.sonicwalkscape.R
import com.bandite.sonicwalkscape.ui.theme.*
import com.bandite.sonicwalkscape.utils.Constants
import kotlinx.coroutines.flow.first

/**
 * First-launch prominent disclosure for location data (Google Play User Data policy).
 *
 * Shown before any location access on the path every user/reviewer follows
 * (Welcome -> Onboarding -> here -> Discovery). Returning users who already accepted
 * are forwarded straight through without re-showing it.
 */
@Composable
fun LocationDisclosureScreen(
    viewModel: WelcomeViewModel,
    onAccept: () -> Unit,
    onDecline: () -> Unit
) {
    val context = LocalContext.current

    // Read the persisted flag once. null = still loading.
    var accepted by remember { mutableStateOf<Boolean?>(null) }
    LaunchedEffect(Unit) {
        accepted = viewModel.locationDisclosureAccepted.first()
    }

    // Already accepted previously -> skip straight to content.
    LaunchedEffect(accepted) {
        if (accepted == true) onAccept()
    }

    // While loading or forwarding, render only the background to avoid a flash.
    if (accepted != false) {
        Box(modifier = Modifier.fillMaxSize().background(BrandPurple))
        return
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BrandPurple)
            .padding(24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.LocationOn,
                contentDescription = null,
                tint = BrandYellow,
                modifier = Modifier.size(64.dp)
            )
            Spacer(modifier = Modifier.height(24.dp))
            Text(
                text = stringResource(R.string.foreground_location_title),
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = BrandCream,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(16.dp))

            val privacyUrl = "${Constants.API_BASE_URL}privacy"
            val annotatedText = buildAnnotatedString {
                append(stringResource(R.string.foreground_location_explanation))
                append("\n\n")
                pushStringAnnotation(tag = "URL", annotation = privacyUrl)
                withStyle(SpanStyle(color = BrandYellow, textDecoration = TextDecoration.Underline)) {
                    append(stringResource(R.string.privacy_policy))
                }
                pop()
            }
            ClickableText(
                text = annotatedText,
                style = TextStyle(
                    color = BrandCream,
                    fontSize = 16.sp,
                    lineHeight = 24.sp
                ),
                onClick = { offset ->
                    annotatedText.getStringAnnotations(tag = "URL", start = offset, end = offset)
                        .firstOrNull()?.let { annotation ->
                            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(annotation.item)))
                        }
                }
            )

            Spacer(modifier = Modifier.height(32.dp))
            Button(
                onClick = {
                    viewModel.acceptLocationDisclosure()
                    onAccept()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(50),
                colors = ButtonDefaults.buttonColors(containerColor = BrandYellow)
            ) {
                Text(
                    text = stringResource(R.string.continue_button),
                    fontWeight = FontWeight.SemiBold,
                    color = BrandPurple,
                    fontSize = 16.sp
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            TextButton(
                onClick = onDecline,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = stringResource(R.string.cancel),
                    color = BrandCream,
                    fontSize = 16.sp
                )
            }
        }
    }
}
