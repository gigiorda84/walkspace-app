//
//  TourCompletionView.swift
//  SonicWalkscape
//
//  Tour completion celebration screen
//

import SwiftUI

struct TourCompletionView: View {
    let tour: Tour
    let pointsVisited: Int
    let durationMinutes: Int
    let distanceKm: Double
    let onReturnToHome: () -> Void
    let onClose: () -> Void

    @State private var showBusInfo = false
    @State private var showFollowUs = false
    @State private var rating = 0
    @State private var ratingComment = ""
    @State private var isSendingRating = false
    @State private var ratingSent = false

    private var strings: LocalizedStrings { LocalizedStrings.shared }

    private let paypalURL = "https://www.paypal.com/donate/?hosted_button_id=BUD638ZGFSJ3C"
    private let satispayURL = "https://tag.satispay.com/Resonavisse"

    var body: some View {
        ZStack {
            // Semi-transparent background overlay
            Color.black.opacity(0.92)
                .ignoresSafeArea()

            VStack(spacing: 24) {
                // Completion icon + Title inline
                HStack(spacing: 12) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 40))
                        .foregroundColor(.brandYellow)

                    Text(strings.tourCompleted)
                        .font(.system(size: 34, weight: .bold))
                        .tracking(-1)
                        .foregroundColor(.brandCream)
                }

                // Tour name
                Text(tour.displayTitle)
                    .font(.title3)
                    .foregroundColor(.brandYellow)
                    .multilineTextAlignment(.center)

                // Custom completion message (if available)
                if let completionMessage = tour.displayCompletionMessage {
                    Text(completionMessage)
                        .font(.system(size: 16))
                        .foregroundColor(.brandCream)
                        .multilineTextAlignment(.center)
                        .lineLimit(nil)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.horizontal, 16)
                }

                // Explicit donation ask
                Text(strings.donationAsk)
                    .font(.system(size: 15))
                    .foregroundColor(.brandCream)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, 16)

                // Donation hero card
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

                // Inline star rating
                VStack(spacing: 10) {
                    if ratingSent {
                        Text(strings.ratingThanks)
                            .font(.subheadline)
                            .foregroundColor(.brandYellow)
                    } else {
                        Text(strings.ratingQuestion)
                            .font(.subheadline)
                            .foregroundColor(.brandMuted)

                        HStack(spacing: 10) {
                            ForEach(1...5, id: \.self) { star in
                                Button {
                                    rating = star
                                } label: {
                                    Image(systemName: star <= rating ? "star.fill" : "star")
                                        .font(.system(size: 26))
                                        .foregroundColor(star <= rating ? .brandYellow : .brandMuted)
                                }
                            }
                        }

                        if rating > 0 {
                            HStack(spacing: 8) {
                                TextField("", text: $ratingComment, prompt: Text(strings.ratingCommentPlaceholder).foregroundColor(.brandCream.opacity(0.5)))
                                    .padding(10)
                                    .background(Color.white.opacity(0.1))
                                    .cornerRadius(10)
                                    .foregroundColor(.brandCream)

                                Button {
                                    sendRating()
                                } label: {
                                    if isSendingRating {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .brandPurple))
                                            .padding(10)
                                    } else {
                                        Text(strings.submit)
                                            .font(.subheadline)
                                            .fontWeight(.semibold)
                                            .foregroundColor(.brandPurple)
                                            .padding(.horizontal, 14)
                                            .padding(.vertical, 10)
                                    }
                                }
                                .background(Color.brandYellow)
                                .cornerRadius(10)
                                .disabled(isSendingRating)
                            }
                        }
                    }
                }

                // Secondary links row
                HStack(spacing: 28) {
                    if tour.displayBusInfo != nil {
                        SecondaryLink(icon: "bus", title: strings.busInfo) {
                            showBusInfo = true
                        }
                    }
                    SecondaryLink(icon: "heart", title: strings.followUs) {
                        AnalyticsService.shared.trackFollowUsClicked(tourId: tour.id)
                        showFollowUs = true
                    }
                }
                .padding(.top, 4)

                // Return to Home (demoted to text link)
                Button(action: onReturnToHome) {
                    Text(strings.returnToHome)
                        .font(.subheadline)
                        .foregroundColor(.brandMuted)
                        .underline()
                }
            }
            .padding(.horizontal, 32)

            // Close button (top-right)
            VStack {
                HStack {
                    Spacer()
                    Button(action: onClose) {
                        Image(systemName: "xmark")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.brandCream)
                            .frame(width: 36, height: 36)
                            .background(Color.black.opacity(0.5))
                            .clipShape(Circle())
                            .shadow(color: .black.opacity(0.3), radius: 8, x: 0, y: 4)
                    }
                    .padding()
                }
                Spacer()
            }
        }
        .alert("Info Bus", isPresented: $showBusInfo) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(tour.displayBusInfo ?? "")
        }
        .sheet(isPresented: $showFollowUs) {
            FollowUsModal(tourId: tour.id)
        }
    }

    private func openDonation(url: String, provider: String) {
        AnalyticsService.shared.trackDonationLinkClicked(tourId: tour.id, provider: provider)
        if let donationURL = URL(string: url) {
            UIApplication.shared.open(donationURL)
        }
    }

    private func sendRating() {
        guard rating > 0, !isSendingRating else { return }
        isSendingRating = true

        let comment = ratingComment.trimmingCharacters(in: .whitespacesAndNewlines)
        let feedbackText = "Tour \(tour.displayTitle) — rating \(rating)/5" + (comment.isEmpty ? "" : " — \(comment)")

        Task {
            do {
                try await APIService.shared.submitFeedback(
                    email: nil,
                    name: nil,
                    feedback: feedbackText,
                    subscribeToNewsletter: false
                )
                await MainActor.run {
                    isSendingRating = false
                    ratingSent = true
                }
            } catch {
                print("❌ Rating submission error: \(error)")
                await MainActor.run {
                    isSendingRating = false
                }
            }
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

// MARK: - Secondary Link Component

struct SecondaryLink: View {
    let icon: String
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 14))
                    .foregroundColor(.brandYellow)
                Text(title)
                    .font(.system(size: 14))
                    .foregroundColor(.brandCream)
            }
        }
    }
}

// MARK: - Stat Item Component

struct StatItem: View {
    let icon: String
    let value: String
    let label: String

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(.brandYellow)
            Text(value)
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(.brandCream)
            Text(label)
                .font(.system(size: 14))
                .foregroundColor(.brandMuted)
        }
    }
}

// MARK: - Action Button Component

struct ActionButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(Color.clear)
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .stroke(Color.white, lineWidth: 1)
                )
        }
    }
}

// MARK: - Follow Us Modal

struct FollowUsModal: View {
    var tourId: String? = nil
    @Environment(\.dismiss) private var dismiss

    private var strings: LocalizedStrings { LocalizedStrings.shared }

    var body: some View {
        NavigationView {
            ZStack {
                Color.brandPurple.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 32) {
                        // Circular social buttons row
                        HStack(spacing: 24) {
                            CircularSocialButton(
                                icon: "camera.fill",
                                label: "Instagram",
                                url: "https://www.instagram.com/bandite_artivism/",
                                tourId: tourId
                            )
                            CircularSocialButton(
                                icon: "person.2.fill",
                                label: "Facebook",
                                url: "https://www.facebook.com/share/17aVMP7t4u/",
                                tourId: tourId
                            )
                            CircularSocialButton(
                                icon: "globe",
                                label: "Website",
                                url: "https://lebandite.wordpress.com/",
                                tourId: tourId
                            )
                            CircularSocialButton(
                                icon: "envelope.fill",
                                label: "Email",
                                url: "mailto:resonavisse@gmail.com",
                                tourId: tourId
                            )
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 20)

                        // Newsletter & Feedback Form
                        NewsletterFeedbackForm()
                            .padding(.horizontal, 20)

                        Spacer(minLength: 40)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .navigationTitle("")
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text(strings.connect)
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundColor(.white)
                    }
                }
            }
        }
    }
}

// MARK: - Newsletter & Feedback Form

struct NewsletterFeedbackForm: View {
    @State private var email = ""
    @State private var name = ""
    @State private var feedback = ""
    @State private var subscribeToNewsletter = false
    @State private var isSubmitting = false
    @State private var showSuccess = false
    @State private var errorMessage: String?

    private var strings: LocalizedStrings { LocalizedStrings.shared }

    private var canSubmit: Bool {
        subscribeToNewsletter || !feedback.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private var isValidEmail: Bool {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return false }
        // Simple email validation: contains @ and at least one . after @
        let parts = trimmed.split(separator: "@")
        return parts.count == 2 && parts[1].contains(".")
    }

    private var needsEmail: Bool {
        subscribeToNewsletter && !isValidEmail
    }

    var body: some View {
        VStack(spacing: 16) {
            if showSuccess {
                // Success state
                VStack(spacing: 16) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 48))
                        .foregroundColor(.green)

                    Text(strings.thankYou)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.brandCream)

                    Button(strings.sendAnother) {
                        showSuccess = false
                    }
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(.brandYellow)
                    .padding(.top, 8)
                }
                .padding(.vertical, 24)
            } else {
                // Form
                VStack(spacing: 12) {
                    // Email field
                    TextField("", text: $email, prompt: Text(strings.email).foregroundColor(.brandCream.opacity(0.5)))
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .padding(14)
                        .background(Color.white.opacity(0.1))
                        .cornerRadius(10)
                        .foregroundColor(.brandCream)

                    // Name field
                    TextField("", text: $name, prompt: Text(strings.nameOptional).foregroundColor(.brandCream.opacity(0.5)))
                        .textContentType(.name)
                        .padding(14)
                        .background(Color.white.opacity(0.1))
                        .cornerRadius(10)
                        .foregroundColor(.brandCream)

                    // Feedback field
                    ZStack(alignment: .topLeading) {
                        // Background to match other fields
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Color.white.opacity(0.1))

                        if feedback.isEmpty {
                            Text(strings.feedbackOptional)
                                .foregroundColor(.brandCream.opacity(0.5))
                                .padding(.horizontal, 14)
                                .padding(.vertical, 12)
                        }

                        TextEditor(text: $feedback)
                            .foregroundColor(.brandCream)
                            .padding(6)
                            .frame(minHeight: 80, maxHeight: 120)
                            .textEditorTransparentBackground()
                    }

                    // Newsletter checkbox
                    Button {
                        subscribeToNewsletter.toggle()
                    } label: {
                        HStack(alignment: .top, spacing: 12) {
                            Image(systemName: subscribeToNewsletter ? "checkmark.square.fill" : "square")
                                .font(.system(size: 22))
                                .foregroundColor(subscribeToNewsletter ? .brandYellow : .brandMuted)

                            Text(strings.subscribeNewsletter)
                                .font(.subheadline)
                                .foregroundColor(.white)
                                .multilineTextAlignment(.leading)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(.vertical, 8)

                    // Error message
                    if let error = errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                    }

                    // Submit button
                    Button {
                        submitForm()
                    } label: {
                        HStack {
                            if isSubmitting {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .brandPurple))
                            } else {
                                Text(strings.submit)
                                    .fontWeight(.semibold)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(canSubmit && !needsEmail ? Color.brandYellow : Color.brandYellow.opacity(0.5))
                        .foregroundColor(.brandPurple)
                        .cornerRadius(10)
                    }
                    .disabled(!canSubmit || needsEmail || isSubmitting)
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 8)
    }

    private func submitForm() {
        guard canSubmit else { return }

        if needsEmail {
            errorMessage = strings.emailRequired
            return
        }

        isSubmitting = true
        errorMessage = nil

        Task {
            do {
                try await APIService.shared.submitFeedback(
                    email: email.isEmpty ? nil : email,
                    name: name.isEmpty ? nil : name,
                    feedback: feedback.isEmpty ? nil : feedback,
                    subscribeToNewsletter: subscribeToNewsletter
                )

                await MainActor.run {
                    isSubmitting = false
                    showSuccess = true
                    email = ""
                    name = ""
                    feedback = ""
                    subscribeToNewsletter = false
                }
            } catch {
                print("❌ Feedback submission error: \(error)")
                await MainActor.run {
                    isSubmitting = false
                    errorMessage = strings.submitError
                }
            }
        }
    }
}

// MARK: - Circular Social Button

struct CircularSocialButton: View {
    let icon: String
    let label: String
    let url: String
    var tourId: String? = nil

    var body: some View {
        Button {
            // Track contact click with channel
            if let tourId = tourId {
                AnalyticsService.shared.trackContactClicked(tourId: tourId, channel: label.lowercased())
            }
            if let url = URL(string: url) {
                UIApplication.shared.open(url)
            }
        } label: {
            VStack(spacing: 8) {
                ZStack {
                    Circle()
                        .fill(Color.brandYellow)
                        .frame(width: 56, height: 56)

                    Image(systemName: icon)
                        .font(.system(size: 24))
                        .foregroundColor(.white)
                }

                Text(label)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.brandCream)
            }
        }
    }
}


// MARK: - Preview

#Preview {
    TourCompletionView(
        tour: Tour(
            id: "1",
            slug: "demo-tour",
            title: ["en": "Historic Downtown Walk"],
            descriptionPreview: ["en": "Explore the rich history"],
            completionMessage: ["en": "Thank you for exploring with us! We hope you enjoyed this journey through history."],
            city: "Milan",
            durationMinutes: 45,
            distanceKm: 2.5,
            languages: ["en"],
            isProtected: false,
            coverImageUrl: nil,
            routePolyline: nil
        ),
        pointsVisited: 8,
        durationMinutes: 42,
        distanceKm: 2.3,
        onReturnToHome: { print("Return to Home") },
        onClose: { print("Close") }
    )
}
