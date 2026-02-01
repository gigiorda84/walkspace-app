package com.bandite.sonicwalkscape.ui.welcome

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.windowInsetsPadding
import com.bandite.sonicwalkscape.R
import com.bandite.sonicwalkscape.ui.theme.*
import kotlinx.coroutines.launch

data class OnboardingPage(
    val icon: ImageVector,
    val titleRes: Int,
    val textResA: Int,
    val textResB: Int,
    val textResC: Int
)

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun OnboardingCarouselScreen(
    onComplete: () -> Unit
) {
    val pages = listOf(
        OnboardingPage(
            icon = Icons.Default.GraphicEq,  // Waveform
            titleRes = R.string.onboarding_title_1,
            textResA = R.string.onboarding_text_1a,
            textResB = R.string.onboarding_text_1b,
            textResC = R.string.onboarding_text_1c
        ),
        OnboardingPage(
            icon = Icons.Default.Shield,
            titleRes = R.string.onboarding_title_2,
            textResA = R.string.onboarding_text_2a,
            textResB = R.string.onboarding_text_2b,
            textResC = R.string.onboarding_text_2c
        ),
        OnboardingPage(
            icon = Icons.Default.Headphones,
            titleRes = R.string.onboarding_title_3,
            textResA = R.string.onboarding_text_3a,
            textResB = R.string.onboarding_text_3b,
            textResC = R.string.onboarding_text_3c
        )
    )

    val pagerState = rememberPagerState(pageCount = { pages.size })
    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BrandPurple)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .windowInsetsPadding(WindowInsets.navigationBars)
        ) {
            // Close button (top-right)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.End
            ) {
                IconButton(onClick = onComplete) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = stringResource(R.string.close),
                        tint = BrandCream
                    )
                }
            }

            // Pager content
            HorizontalPager(
                state = pagerState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) { page ->
                OnboardingPageContent(pages[page])
            }

            // Page indicators (yellow, filled up to current)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.Center
            ) {
                repeat(pages.size) { index ->
                    Box(
                        modifier = Modifier
                            .padding(horizontal = 4.dp)
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(
                                if (index <= pagerState.currentPage) BrandYellow
                                else BrandMuted.copy(alpha = 0.3f)
                            )
                    )
                }
            }

            // Continue button (yellow capsule)
            Button(
                onClick = {
                    if (pagerState.currentPage < pages.size - 1) {
                        scope.launch {
                            pagerState.animateScrollToPage(pagerState.currentPage + 1)
                        }
                    } else {
                        onComplete()
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 32.dp)
                    .padding(bottom = 32.dp)
                    .height(52.dp),
                shape = RoundedCornerShape(50),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BrandYellow
                )
            ) {
                Text(
                    text = stringResource(R.string.continue_button),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = BrandPurple
                )
            }
        }
    }
}

@Composable
fun OnboardingPageContent(page: OnboardingPage) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Icon (no circle background, just yellow icon like iOS)
        Icon(
            imageVector = page.icon,
            contentDescription = null,
            modifier = Modifier.size(53.dp),
            tint = BrandYellow
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Title
        Text(
            text = stringResource(page.titleRes),
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = BrandCream,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Text lines (3 separate texts)
        Column(
            modifier = Modifier.padding(horizontal = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = stringResource(page.textResA),
                fontSize = 19.sp,
                color = BrandCream,
                textAlign = TextAlign.Start,
                lineHeight = 26.sp
            )
            Text(
                text = stringResource(page.textResB),
                fontSize = 19.sp,
                color = BrandCream,
                textAlign = TextAlign.Start,
                lineHeight = 26.sp
            )
            Text(
                text = stringResource(page.textResC),
                fontSize = 19.sp,
                color = BrandCream,
                textAlign = TextAlign.Start,
                lineHeight = 26.sp
            )
        }
    }
}
