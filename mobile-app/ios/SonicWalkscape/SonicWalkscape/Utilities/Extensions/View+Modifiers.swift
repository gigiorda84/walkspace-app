import SwiftUI

extension View {
    func cardStyle() -> some View {
        self
            .background(Color.brandSurfacePurple)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 2)
    }

    func primaryButton() -> some View {
        self
            .font(.headline)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.brandYellow)
            .cornerRadius(12)
    }

    func secondaryButton() -> some View {
        self
            .font(.headline)
            .foregroundColor(.brandYellow)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.brandYellow.opacity(0.1))
            .cornerRadius(12)
    }

    // Glassmorphic card with frosted glass effect (square corners)
    func glassmorphicCard() -> some View {
        self
            .background(
                RoundedRectangle(cornerRadius: 0)
                    .fill(Color.brandSurfacePurple.opacity(0.8))
                    .overlay(
                        RoundedRectangle(cornerRadius: 0)
                            .stroke(Color.white.opacity(0.1), lineWidth: 1)
                    )
            )
            .background(.ultraThinMaterial.opacity(0.5), in: RoundedRectangle(cornerRadius: 0))
            .shadow(color: Color.black.opacity(0.7), radius: 25, x: 0, y: 15)
    }

    // Primary CTA button with yellow gradient (pill shape)
    func primaryCTAButton() -> some View {
        self
            .font(.system(size: 17, weight: .bold))
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .padding(.horizontal, 24)
            .background(
                LinearGradient(
                    colors: [Color.brandYellow, Color(hex: "c99600")],  // Yellow to darker yellow
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .clipShape(Capsule())  // Full pill shape (9999px border radius)
            .shadow(color: Color.brandYellow.opacity(0.4), radius: 10, x: 0, y: 10)
    }

    // Icon button with glassmorphic background
    func iconButton() -> some View {
        self
            .frame(width: 48, height: 48)
            .background(
                Circle()
                    .fill(Color.brandSurfacePurple)
                    .overlay(
                        Circle()
                            .stroke(Color.brandBorderPurple, lineWidth: 1)
                    )
            )
            .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 4)
    }

    // Styled input field
    func inputField() -> some View {
        self
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.brandSurfacePurple)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.brandBorderPurple, lineWidth: 1)
                    )
            )
    }

    // Make TextEditor background transparent (iOS 15+ compatible)
    @ViewBuilder
    func textEditorTransparentBackground() -> some View {
        if #available(iOS 16.0, *) {
            self.scrollContentBackground(.hidden)
        } else {
            self.onAppear {
                UITextView.appearance().backgroundColor = .clear
            }
        }
    }
}
