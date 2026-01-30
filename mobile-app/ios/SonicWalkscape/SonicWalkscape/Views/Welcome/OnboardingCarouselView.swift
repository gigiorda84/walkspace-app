import SwiftUI

struct OnboardingCarouselView: View {
    let onComplete: () -> Void

    @State private var currentPage = 0
    private var strings: LocalizedStrings { LocalizedStrings.shared }

    var body: some View {
        ZStack {
            Color.brandPurple
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Close button
                HStack {
                    Spacer()
                    Button(action: { onComplete() }) {
                        Image(systemName: "xmark")
                            .font(.title3)
                            .foregroundColor(.brandCream)
                    }
                }
                .padding()

                // Swipeable carousel
                TabView(selection: $currentPage) {
                    slideView(
                        icon: "waveform.path",
                        title: strings.onboardingTitle1,
                        texts: [strings.onboardingText1a, strings.onboardingText1b, strings.onboardingText1c]
                    )
                    .tag(0)

                    slideView(
                        icon: "shield.fill",
                        title: strings.onboardingTitle2,
                        texts: [strings.onboardingText2a, strings.onboardingText2b, strings.onboardingText2c]
                    )
                    .tag(1)

                    slideView(
                        icon: "headphones",
                        title: strings.onboardingTitle3,
                        texts: [strings.onboardingText3a, strings.onboardingText3b, strings.onboardingText3c]
                    )
                    .tag(2)
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))

                // Step indicators
                HStack(spacing: 8) {
                    ForEach(0..<3, id: \.self) { index in
                        Circle()
                            .fill(index <= currentPage ? Color.brandYellow : Color.brandMuted.opacity(0.3))
                            .frame(width: 8, height: 8)
                    }
                }
                .padding(.bottom, 16)

                // Continue button (only on last slide)
                Button(action: {
                    if currentPage < 2 {
                        withAnimation {
                            currentPage += 1
                        }
                    } else {
                        onComplete()
                    }
                }) {
                    Text(strings.continueButton)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.brandPurple)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.brandYellow)
                        .clipShape(Capsule())
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 32)
            }
        }
    }

    private func slideView(icon: String, title: String, texts: [String]) -> some View {
        VStack(spacing: 24) {
            Image(systemName: icon)
                .font(.system(size: 53))
                .foregroundColor(.brandYellow)

            Text(title)
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.brandCream)

            VStack(alignment: .leading, spacing: 16) {
                ForEach(texts, id: \.self) { text in
                    Text(text)
                        .font(.system(size: 19))
                        .foregroundColor(.brandCream)
                        .multilineTextAlignment(.leading)
                }
            }
            .padding(.horizontal, 8)
        }
        .padding(.horizontal, 32)
    }
}

#Preview {
    OnboardingCarouselView(onComplete: {})
}
