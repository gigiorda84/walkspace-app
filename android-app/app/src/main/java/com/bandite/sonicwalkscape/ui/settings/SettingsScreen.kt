package com.bandite.sonicwalkscape.ui.settings

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.ClickableText
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bandite.sonicwalkscape.BuildConfig
import com.bandite.sonicwalkscape.R
import com.bandite.sonicwalkscape.ui.theme.*
import com.bandite.sonicwalkscape.utils.Constants
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    onBack: () -> Unit,
    onOpenDebug: () -> Unit = {}
) {
    val preferredLanguage by viewModel.preferredLanguage.collectAsState(initial = "en")
    val context = LocalContext.current
    var tapCount by remember { mutableStateOf(0) }
    val scope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        text = stringResource(R.string.settings),
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = BrandCream
                    )
                },
                navigationIcon = {},
                actions = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = stringResource(R.string.close),
                            tint = BrandCream
                        )
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = BrandPurple
                )
            )
        },
        containerColor = BrandPurple
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Language section
            SettingsSection(title = stringResource(R.string.language)) {
                LanguageRow(
                    code = "en",
                    name = "English",
                    flag = "\uD83C\uDDEC\uD83C\uDDE7",
                    isSelected = preferredLanguage == "en",
                    onClick = { viewModel.setPreferredLanguage("en") }
                )
                HorizontalDivider(color = BorderPurple)
                LanguageRow(
                    code = "fr",
                    name = "Fran\u00E7ais",
                    flag = "\uD83C\uDDEB\uD83C\uDDF7",
                    isSelected = preferredLanguage == "fr",
                    onClick = { viewModel.setPreferredLanguage("fr") }
                )
                HorizontalDivider(color = BorderPurple)
                LanguageRow(
                    code = "it",
                    name = "Italiano",
                    flag = "\uD83C\uDDEE\uD83C\uDDF9",
                    isSelected = preferredLanguage == "it",
                    onClick = { viewModel.setPreferredLanguage("it") }
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Location section — in-app prominent disclosure of how location data is used
            SettingsSection(title = stringResource(R.string.location)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = stringResource(R.string.location_settings_disclosure),
                        fontSize = 13.sp,
                        color = BrandCream,
                        lineHeight = 18.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    val privacyUrl = "${Constants.API_BASE_URL}privacy"
                    val privacyText = buildAnnotatedString {
                        pushStringAnnotation(tag = "URL", annotation = privacyUrl)
                        withStyle(SpanStyle(color = BrandYellow, textDecoration = TextDecoration.Underline)) {
                            append(stringResource(R.string.privacy_policy))
                        }
                        pop()
                    }
                    ClickableText(
                        text = privacyText,
                        style = TextStyle(color = BrandYellow, fontSize = 13.sp),
                        onClick = { offset ->
                            privacyText.getStringAnnotations(tag = "URL", start = offset, end = offset)
                                .firstOrNull()?.let { annotation ->
                                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(annotation.item)))
                                }
                        }
                    )
                }
                HorizontalDivider(color = BorderPurple)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            // Open OS app settings so the user can manage the location permission
                            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                                data = Uri.fromParts("package", context.packageName, null)
                            }
                            context.startActivity(intent)
                        }
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = stringResource(R.string.manage_location_access),
                        fontSize = 16.sp,
                        color = BrandCream,
                        modifier = Modifier.weight(1f)
                    )
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = null,
                        tint = BrandCream.copy(alpha = 0.7f)
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // App Info section (triple-tap version to open diagnostics)
            SettingsSection(title = stringResource(R.string.about)) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            tapCount++
                            if (tapCount >= 5) {
                                tapCount = 0
                                onOpenDebug()
                            }
                            scope.launch {
                                delay(2000)
                                tapCount = 0
                            }
                        }
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = stringResource(R.string.version),
                        fontSize = 16.sp,
                        color = BrandCream
                    )
                    Text(
                        text = BuildConfig.VERSION_NAME,
                        fontSize = 16.sp,
                        color = BrandCream.copy(alpha = 0.7f)
                    )
                }
                HorizontalDivider(color = BorderPurple)
                InfoRow(
                    title = stringResource(R.string.build),
                    value = BuildConfig.VERSION_CODE.toString()
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Credits section
            SettingsSection(title = stringResource(R.string.credits)) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.bandite_logo),
                        contentDescription = "BANDITE Logo",
                        modifier = Modifier.size(80.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = stringResource(R.string.developed_by),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = BrandCream
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = stringResource(R.string.get_in_touch),
                        fontSize = 12.sp,
                        color = BrandCream
                    )
                }
            }

            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}

@Composable
fun SettingsSection(
    title: String,
    content: @Composable ColumnScope.() -> Unit
) {
    Column {
        Text(
            text = title,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = BrandCream,
            modifier = Modifier.padding(horizontal = 4.dp, vertical = 8.dp)
        )
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            color = SurfacePurple
        ) {
            Column(content = content)
        }
    }
}

@Composable
fun LanguageRow(
    code: String,
    name: String,
    flag: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = flag,
            fontSize = 20.sp
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = name,
            fontSize = 16.sp,
            color = BrandCream,
            modifier = Modifier.weight(1f)
        )
        if (isSelected) {
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = null,
                tint = BrandYellow
            )
        }
    }
}

@Composable
fun InfoRow(
    title: String,
    value: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            fontSize = 16.sp,
            color = BrandCream
        )
        Text(
            text = value,
            fontSize = 16.sp,
            color = BrandCream.copy(alpha = 0.7f)
        )
    }
}
