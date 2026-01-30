package com.bandite.sonicwalkscape.ui.discovery

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Route
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.bandite.sonicwalkscape.R
import com.bandite.sonicwalkscape.data.models.Tour
import com.bandite.sonicwalkscape.ui.theme.BackgroundCard
import com.bandite.sonicwalkscape.ui.theme.BackgroundElevated
import com.bandite.sonicwalkscape.ui.theme.BrandAccent
import com.bandite.sonicwalkscape.ui.theme.DifficultyEasy
import com.bandite.sonicwalkscape.ui.theme.DifficultyModerate
import com.bandite.sonicwalkscape.ui.theme.DifficultyChallenging
import com.bandite.sonicwalkscape.ui.theme.StatusSuccess
import com.bandite.sonicwalkscape.ui.theme.TextMuted
import com.bandite.sonicwalkscape.ui.theme.TextPrimary
import com.bandite.sonicwalkscape.ui.theme.TextSecondary
import com.bandite.sonicwalkscape.utils.Constants

@Composable
fun TourCard(
    tour: Tour,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = BackgroundCard)
    ) {
        Column {
            // Cover Image
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(16f / 9f)
                    .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
                    .background(BackgroundElevated)
            ) {
                tour.getFullCoverImageUrl(Constants.Api.BASE_URL)?.let { imageUrl ->
                    AsyncImage(
                        model = imageUrl,
                        contentDescription = tour.getDisplayTitle(),
                        modifier = Modifier.matchParentSize(),
                        contentScale = ContentScale.Crop
                    )
                }

                // Badges row
                Row(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    if (tour.isDownloaded) {
                        Badge(
                            icon = Icons.Default.CheckCircle,
                            text = stringResource(R.string.tour_downloaded),
                            color = StatusSuccess
                        )
                    }
                    if (tour.isProtected) {
                        Badge(
                            icon = Icons.Default.Lock,
                            text = stringResource(R.string.tour_protected),
                            color = BrandAccent
                        )
                    }
                }

                // Difficulty badge
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(8.dp)
                ) {
                    DifficultyBadge(tour.difficulty)
                }
            }

            // Content
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                // City
                Text(
                    text = tour.city.uppercase(),
                    style = MaterialTheme.typography.labelSmall,
                    color = BrandAccent
                )

                Spacer(modifier = Modifier.height(4.dp))

                // Title
                Text(
                    text = tour.getDisplayTitle(),
                    style = MaterialTheme.typography.titleLarge,
                    color = TextPrimary,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Description
                Text(
                    text = tour.getDisplayDescription(),
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Stats row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    StatItem(
                        icon = Icons.Default.AccessTime,
                        text = stringResource(R.string.tour_duration, tour.durationMinutes)
                    )
                    StatItem(
                        icon = Icons.Default.Route,
                        text = stringResource(R.string.tour_distance, tour.distanceKm)
                    )
                    StatItem(
                        icon = Icons.Default.Place,
                        text = stringResource(R.string.tour_points, tour.points.size.takeIf { it > 0 } ?: 0)
                    )
                }
            }
        }
    }
}

@Composable
private fun Badge(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    text: String,
    color: androidx.compose.ui.graphics.Color
) {
    Row(
        modifier = Modifier
            .background(
                color = color.copy(alpha = 0.9f),
                shape = RoundedCornerShape(4.dp)
            )
            .padding(horizontal = 6.dp, vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(12.dp),
            tint = TextPrimary
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = TextPrimary
        )
    }
}

@Composable
private fun DifficultyBadge(difficulty: Tour.Difficulty) {
    val (color, textRes) = when (difficulty) {
        Tour.Difficulty.EASY -> DifficultyEasy to R.string.difficulty_easy
        Tour.Difficulty.MODERATE -> DifficultyModerate to R.string.difficulty_moderate
        Tour.Difficulty.CHALLENGING -> DifficultyChallenging to R.string.difficulty_challenging
    }

    Text(
        text = stringResource(textRes),
        style = MaterialTheme.typography.labelSmall,
        color = TextPrimary,
        modifier = Modifier
            .background(
                color = color.copy(alpha = 0.9f),
                shape = RoundedCornerShape(4.dp)
            )
            .padding(horizontal = 8.dp, vertical = 4.dp)
    )
}

@Composable
private fun StatItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    text: String
) {
    Row(
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(16.dp),
            tint = TextMuted
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.bodySmall,
            color = TextMuted
        )
    }
}
