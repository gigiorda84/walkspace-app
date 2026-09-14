//
//  DonationCard.swift
//  SonicWalkscape
//
//  Donation hero card: "Support the project" + PayPal / Satispay buttons.
//  Shared by the tour completion screen, the Connect & Support sheet and the early-exit sheet.
//  Tapping a provider opens its page in Safari and reports the provider so the host view
//  can track `donation_link_clicked` with its own `source`.
//

import SwiftUI

struct DonationCard: View {
    let onDonate: (_ provider: String) -> Void

    private var strings: LocalizedStrings { LocalizedStrings.shared }

    private let paypalURL = "https://www.paypal.com/ncp/payment/BCCRZMKCREBBE"
    private let satispayURL = "https://web.satispay.com/app/open/shops/9e84213e-eae7-40de-9ded-952e7f2cb4f2"

    var body: some View {
        VStack(spacing: 14) {
            Text(strings.supportProject)
                .font(.headline)
                .foregroundColor(.brandCream)

            HStack(spacing: 10) {
                DonationButton(
                    title: "PayPal",
                    background: Color(red: 1.0, green: 0.77, blue: 0.22),
                    foreground: Color(red: 0.0, green: 0.19, blue: 0.53)
                ) {
                    openDonation(url: paypalURL, provider: "paypal")
                }
                DonationButton(
                    title: "Satispay",
                    background: Color(red: 1.0, green: 0.29, blue: 0.24),
                    foreground: .white
                ) {
                    openDonation(url: satispayURL, provider: "satispay")
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 18)
                .fill(Color.white.opacity(0.06))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(Color.brandYellow, lineWidth: 1)
        )
    }

    private func openDonation(url: String, provider: String) {
        onDonate(provider)
        if let donationURL = URL(string: url) {
            UIApplication.shared.open(donationURL)
        }
    }
}

// MARK: - Amount Chip Component

struct AmountChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 13, weight: isSelected ? .semibold : .regular))
                .foregroundColor(isSelected ? Color(red: 0.07, green: 0.07, blue: 0.06) : .brandCream)
                .padding(.horizontal, 14)
                .padding(.vertical, 6)
                .background(isSelected ? Color.brandYellow : Color.clear)
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .stroke(isSelected ? Color.clear : Color.brandMuted, lineWidth: 1)
                )
        }
    }
}

// MARK: - Donation Button Component

struct DonationButton: View {
    let title: String
    let background: Color
    let foreground: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(foreground)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 13)
                .background(background)
                .clipShape(Capsule())
        }
    }
}
