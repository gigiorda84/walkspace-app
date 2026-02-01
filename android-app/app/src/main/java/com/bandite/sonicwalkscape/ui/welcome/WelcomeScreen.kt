package com.bandite.sonicwalkscape.ui.welcome

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.outlined.CameraAlt
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.People
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.bandite.sonicwalkscape.R
import com.bandite.sonicwalkscape.data.api.ApiClient
import com.bandite.sonicwalkscape.data.api.FeedbackRequest
import com.bandite.sonicwalkscape.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WelcomeScreen(
    onStartExploring: () -> Unit,
    onSettingsClick: () -> Unit,
    viewModel: WelcomeViewModel = hiltViewModel()
) {
    var showAboutSheet by remember { mutableStateOf(false) }
    var showConnectSheet by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BrandPurple)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.weight(1f))

            // Logo
            Image(
                painter = painterResource(id = R.drawable.bandite_logo),
                contentDescription = "BANDITE Logo",
                modifier = Modifier
                    .size(200.dp)
                    .padding(top = 30.dp)
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Title
            Text(
                text = stringResource(R.string.app_name),
                fontSize = 36.sp,
                fontWeight = FontWeight.Bold,
                color = BrandCream,
                textAlign = TextAlign.Center,
                letterSpacing = (-1).sp,
                maxLines = 1
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Subtitle
            Text(
                text = stringResource(R.string.welcome_subtitle),
                fontSize = 22.sp,
                fontWeight = FontWeight.Medium,
                color = BrandYellow,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.weight(1f))

            // Action buttons
            Column(
                modifier = Modifier.padding(bottom = 60.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // About button (outlined pill)
                OutlinedButton(
                    onClick = { showAboutSheet = true },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = BrandCream
                    ),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderPurple)
                ) {
                    Text(
                        text = stringResource(R.string.about),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                // Start Exploring button (yellow gradient pill)
                Button(
                    onClick = onStartExploring,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = BrandYellow
                    )
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = stringResource(R.string.start_exploring),
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = BrandPurple
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Icon(
                            imageVector = Icons.Default.ArrowForward,
                            contentDescription = null,
                            tint = BrandPurple,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                // Connect button (outlined pill)
                OutlinedButton(
                    onClick = { showConnectSheet = true },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = BrandCream
                    ),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderPurple)
                ) {
                    Text(
                        text = stringResource(R.string.connect),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }

        // Settings button (top-right)
        IconButton(
            onClick = onSettingsClick,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(16.dp)
                .size(60.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Settings,
                contentDescription = stringResource(R.string.settings),
                tint = BrandYellow,
                modifier = Modifier.size(24.dp)
            )
        }
    }

    // About Modal
    if (showAboutSheet) {
        AboutBottomSheet(
            onDismiss = { showAboutSheet = false }
        )
    }

    // Connect Modal
    if (showConnectSheet) {
        ConnectBottomSheet(
            onDismiss = { showConnectSheet = false }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AboutBottomSheet(
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = BrandPurple,
        contentColor = BrandCream
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 40.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Title
            Text(
                text = stringResource(R.string.about),
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = BrandCream
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Logo
            Image(
                painter = painterResource(id = R.drawable.bandite_logo),
                contentDescription = "BANDITE Logo",
                modifier = Modifier.size(150.dp)
            )

            Spacer(modifier = Modifier.height(24.dp))

            // About text
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = SurfacePurple,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderPurple)
            ) {
                Text(
                    text = stringResource(R.string.about_text),
                    fontSize = 15.sp,
                    color = BrandCream,
                    lineHeight = 22.sp,
                    modifier = Modifier.padding(20.dp)
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConnectBottomSheet(
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = BrandPurple,
        contentColor = BrandCream
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 40.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Title
            Text(
                text = stringResource(R.string.connect),
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = BrandCream
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Social buttons row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                SocialButton(
                    icon = Icons.Outlined.CameraAlt,
                    label = stringResource(R.string.instagram),
                    onClick = {
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://www.instagram.com/bandite_artivism/")))
                    }
                )
                SocialButton(
                    icon = Icons.Outlined.People,
                    label = stringResource(R.string.facebook),
                    onClick = {
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://www.facebook.com/share/17aVMP7t4u/")))
                    }
                )
                SocialButton(
                    icon = Icons.Outlined.Language,
                    label = stringResource(R.string.website),
                    onClick = {
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://lebandite.wordpress.com/")))
                    }
                )
                SocialButton(
                    icon = Icons.Outlined.Email,
                    label = stringResource(R.string.email_label),
                    onClick = {
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("mailto:resonavisse@gmail.com")))
                    }
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Newsletter & Feedback Form
            NewsletterFeedbackForm()
        }
    }
}

@Composable
fun NewsletterFeedbackForm() {
    var email by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var feedback by remember { mutableStateOf("") }
    var subscribeToNewsletter by remember { mutableStateOf(false) }
    var isSubmitting by remember { mutableStateOf(false) }
    var showSuccess by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val scope = rememberCoroutineScope()

    val canSubmit = subscribeToNewsletter || feedback.trim().isNotEmpty()
    val isValidEmail = email.trim().let { e ->
        e.isNotEmpty() && e.split("@").let { parts ->
            parts.size == 2 && parts[1].contains(".")
        }
    }
    val needsEmail = subscribeToNewsletter && !isValidEmail

    if (showSuccess) {
        // Success state
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Outlined.Email,
                contentDescription = null,
                tint = Color.Green,
                modifier = Modifier.size(48.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = stringResource(R.string.thank_you),
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = BrandCream
            )
            Spacer(modifier = Modifier.height(16.dp))
            TextButton(onClick = { showSuccess = false }) {
                Text(
                    text = stringResource(R.string.send_another),
                    color = BrandYellow,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    } else {
        // Form
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Email field
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                placeholder = { Text(stringResource(R.string.email_hint), color = BrandCream.copy(alpha = 0.5f)) },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = BrandCream,
                    unfocusedTextColor = BrandCream,
                    focusedBorderColor = BrandYellow,
                    unfocusedBorderColor = BrandCream.copy(alpha = 0.3f),
                    cursorColor = BrandYellow
                ),
                shape = RoundedCornerShape(10.dp),
                singleLine = true
            )

            // Name field
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                placeholder = { Text(stringResource(R.string.name_optional), color = BrandCream.copy(alpha = 0.5f)) },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = BrandCream,
                    unfocusedTextColor = BrandCream,
                    focusedBorderColor = BrandYellow,
                    unfocusedBorderColor = BrandCream.copy(alpha = 0.3f),
                    cursorColor = BrandYellow
                ),
                shape = RoundedCornerShape(10.dp),
                singleLine = true
            )

            // Feedback field
            OutlinedTextField(
                value = feedback,
                onValueChange = { feedback = it },
                placeholder = { Text(stringResource(R.string.feedback_optional), color = BrandCream.copy(alpha = 0.5f)) },
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 80.dp, max = 120.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = BrandCream,
                    unfocusedTextColor = BrandCream,
                    focusedBorderColor = BrandYellow,
                    unfocusedBorderColor = BrandCream.copy(alpha = 0.3f),
                    cursorColor = BrandYellow
                ),
                shape = RoundedCornerShape(10.dp),
                maxLines = 4
            )

            // Newsletter checkbox
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                verticalAlignment = Alignment.Top
            ) {
                Checkbox(
                    checked = subscribeToNewsletter,
                    onCheckedChange = { subscribeToNewsletter = it },
                    colors = CheckboxDefaults.colors(
                        checkedColor = BrandYellow,
                        uncheckedColor = BrandCream.copy(alpha = 0.5f),
                        checkmarkColor = BrandPurple
                    )
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = stringResource(R.string.subscribe_newsletter),
                    fontSize = 14.sp,
                    color = BrandCream,
                    modifier = Modifier.padding(top = 12.dp)
                )
            }

            // Error message
            if (errorMessage != null) {
                Text(
                    text = errorMessage!!,
                    fontSize = 12.sp,
                    color = Color.Red
                )
            }

            // Submit button
            Button(
                onClick = {
                    if (!canSubmit) return@Button
                    if (needsEmail) {
                        errorMessage = "Email required for newsletter"
                        return@Button
                    }

                    isSubmitting = true
                    errorMessage = null

                    scope.launch {
                        try {
                            val request = FeedbackRequest(
                                email = email.trim().ifEmpty { null },
                                name = name.trim().ifEmpty { null },
                                feedback = feedback.trim().ifEmpty { null },
                                subscribeToNewsletter = subscribeToNewsletter
                            )
                            val response = ApiClient.apiService.submitFeedback(request)
                            if (response.isSuccessful) {
                                isSubmitting = false
                                showSuccess = true
                                email = ""
                                name = ""
                                feedback = ""
                                subscribeToNewsletter = false
                            } else {
                                isSubmitting = false
                                errorMessage = "Error sending. Please try again."
                            }
                        } catch (e: Exception) {
                            isSubmitting = false
                            errorMessage = "Error sending. Please try again."
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = canSubmit && !needsEmail && !isSubmitting,
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BrandYellow,
                    contentColor = BrandPurple,
                    disabledContainerColor = BrandYellow.copy(alpha = 0.5f),
                    disabledContentColor = BrandPurple.copy(alpha = 0.5f)
                )
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = BrandPurple,
                        strokeWidth = 2.dp
                    )
                } else {
                    Text(
                        text = stringResource(R.string.submit),
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}

@Composable
fun SocialButton(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        IconButton(
            onClick = onClick,
            modifier = Modifier
                .size(56.dp)
                .background(BrandYellow, CircleShape)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = Color.White,
                modifier = Modifier.size(24.dp)
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = label,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium,
            color = BrandCream
        )
    }
}
