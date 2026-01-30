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

    private var strings: LocalizedStrings { LocalizedStrings.shared }

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
                        .padding(.vertical, 20)
                        .onAppear {
                            print("✅ Displaying completion message: \(completionMessage)")
                        }
                } else {
                    EmptyView()
                        .onAppear {
                            print("⚠️ No completion message available for tour: \(tour.displayTitle)")
                        }
                }

                // Action buttons
                VStack(spacing: 12) {
                    if tour.displayBusInfo != nil {
                        ActionButton(title: strings.busInfo) {
                            showBusInfo = true
                        }
                    }
                    ActionButton(title: strings.followUs) {
                        AnalyticsService.shared.trackFollowUsClicked(tourId: tour.id)
                        showFollowUs = true
                    }
                    ActionButton(title: strings.support) {
                        AnalyticsService.shared.trackDonationLinkClicked(tourId: tour.id)
                        if let url = URL(string: "https://www.produzionidalbasso.com/project/unseen-sonic-walkscape-at-the-border/") {
                            UIApplication.shared.open(url)
                        }
                    }
                }

                // Return to Home button
                Button(action: onReturnToHome) {
                    Text(strings.returnToHome)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.brandYellow)
                        .clipShape(Capsule())
                        .shadow(color: .brandYellow.opacity(0.3), radius: 8, x: 0, y: 4)
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
