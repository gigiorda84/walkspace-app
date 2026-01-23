# Task: Onboarding Carousel Implementation

## Problem
Add a swipeable onboarding carousel between the "Inizia ad esplorare" button and DiscoveryView. The carousel should explain how the app works and provide safety information.

## Requirements
- Navigable carousel with swipe support (3 slides)
- Same visual style as TourSetupSheet (purple background, yellow icons, cream text)
- Step indicators at bottom
- Only show on first launch (persist in UserDefaults)
- Yellow icons for each slide

## Tasks

- [x] **1. Add localized strings to LocalizedStrings.swift**
  - Add strings for all 3 slides (Italian, English, French)
  - Slide 1: "Come funziona" / How it works
  - Slide 2: "Sicurezza prima di tutto" / Safety first
  - Slide 3: "Prima di partire" / Before you go

- [x] **2. Create OnboardingCarouselView.swift**
  - New file in Views/Welcome folder
  - Use TabView with PageTabViewStyle for swipeable carousel
  - Match TourSetupSheet visual styling
  - Step indicators at bottom
  - "Continua" button on last slide

- [x] **3. Modify WelcomeView.swift**
  - Add state to track if onboarding should show
  - Check UserDefaults for hasSeenOnboarding flag
  - Show OnboardingCarouselView before DiscoveryView on first launch
  - Set hasSeenOnboarding = true after carousel completion

---

## Review

### Changes Summary

**1. LocalizedStrings.swift** (added 13 new localized strings)
- Added `continueButton` for the continue button
- Added 9 content strings for the 3 slides (title + 3 text items each)
- All strings support Italian, English, and French

**2. OnboardingCarouselView.swift** (new file, ~100 lines)
- Created swipeable carousel using `TabView` with `PageTabViewStyle`
- 3 slides with yellow SF Symbol icons: `waveform.path`, `shield.fill`, `headphones`
- Step indicators at bottom (yellow dots)
- "Continua" button advances slides or completes onboarding
- Close (X) button to skip onboarding
- Matches existing TourSetupSheet visual styling

**3. WelcomeView.swift** (minimal changes)
- Added `@State private var showOnboarding = false`
- Added `@AppStorage("hasSeenOnboarding")` to persist onboarding completion
- Modified "Inizia ad esplorare" button: shows onboarding first (if not seen), then discovery
- Added `fullScreenCover` for `OnboardingCarouselView`

### Flow
```
"Inizia ad esplorare" clicked
    ↓
First time? → OnboardingCarouselView (swipeable 3 slides)
    ↓
User completes/skips → hasSeenOnboarding = true → DiscoveryView
    ↓
Subsequent visits → Direct to DiscoveryView (onboarding skipped)
```

### Files Modified
1. `mobile-app/ios/SonicWalkscape/SonicWalkscape/Utilities/LocalizedStrings.swift`
2. `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Welcome/OnboardingCarouselView.swift` (new)
3. `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Welcome/WelcomeView.swift`
