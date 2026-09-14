package com.bandite.sonicwalkscape.ui.components

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bandite.sonicwalkscape.R
import com.bandite.sonicwalkscape.ui.theme.*

private const val PAYPAL_URL = "https://www.paypal.com/ncp/payment/T7WKLYNTXBDDL"
private const val SATISPAY_URL = "https://web.satispay.com/app/open/shops/9e84213e-eae7-40de-9ded-952e7f2cb4f2"

/**
 * Donation hero card: "Support the project" + amount chips + PayPal / Satispay buttons.
 * Shared by the tour completion screen, the Connect & Support sheet and the early-exit sheet.
 * Tapping a provider opens its page in the browser and reports (provider, selected amount)
 * so the host screen can track `donation_link_clicked` with its own `source`.
 */
@Composable
fun DonationCard(
    onDonate: (provider: String, amount: Int?) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var donationAmount by remember { mutableStateOf<Int?>(5) }

    fun openDonation(url: String, provider: String) {
        onDonate(provider, donationAmount)
        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
    }

    Column(
        modifier = modifier
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
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf(3, 5, 10).forEach { amount ->
                AmountChip(
                    label = "$amount €",
                    selected = donationAmount == amount,
                    onClick = { donationAmount = amount }
                )
            }
            AmountChip(
                label = stringResource(R.string.amount_free),
                selected = donationAmount == null,
                onClick = { donationAmount = null }
            )
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            DonationButton(
                text = "PayPal",
                background = Color(0xFFFFC439),
                foreground = Color(0xFF003087),
                modifier = Modifier.weight(1f),
                onClick = {
                    // NCP payment link has a fixed amount page; the amount
                    // can't be passed via URL, so open it as-is. The selected
                    // amount is still recorded in analytics via openDonation.
                    openDonation(PAYPAL_URL, "paypal")
                }
            )
            DonationButton(
                text = "Satispay",
                background = Color(0xFFFF4B3E),
                foreground = Color.White,
                modifier = Modifier.weight(1f),
                onClick = { openDonation(SATISPAY_URL, "satispay") }
            )
        }
    }
}

@Composable
private fun AmountChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(50),
        color = if (selected) BrandYellow else Color.Transparent,
        border = if (selected) null else androidx.compose.foundation.BorderStroke(1.dp, BrandMuted)
    ) {
        Text(
            text = label,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
            fontSize = 13.sp,
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
            color = if (selected) Color(0xFF121110) else BrandCream
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
