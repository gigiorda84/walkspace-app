# Replace Logo and Change Accent Color to Yellow

## Overview
Replace the BANDITE logo with the new golden version and change the accent color from orange (#d95808) to yellow (#F5B400) throughout the iOS app.

## Analysis
- Current logo location: `mobile-app/ios/SonicWalkscape/SonicWalkscape/Assets.xcassets/BanditeLogo.imageset/logo_BANDITE.png`
- New logo provided: `/Users/juicy/Downloads/logo cerchio oro Bandite - sfondo trasparente.png`
- Color definitions in: `Color+Brand.swift` (yellow already defined as `brandYellow = #F5B400`)
- Found 40+ occurrences of `.brandOrange` across 9 Swift files that need to be changed to `.brandYellow`

## Todo Items

- [x] Replace logo image in Assets.xcassets
- [x] Update WelcomeView.swift - change settings icon color
- [x] Update TourCardView.swift - change all orange references to yellow
- [x] Update VideoPlayerView.swift - change video player tint
- [x] Update AudioControlsView.swift - change accent colors and gradient
- [x] Update SettingsView.swift - change all accent colors
- [x] Update DiscoveryView.swift - change all icon and accent colors
- [x] Update TourCompletionView.swift - change completion screen colors
- [x] Update TourDetailView.swift - change detail view accents
- [x] Update TourSetupSheet.swift - change setup flow colors
- [x] Update MapView.swift - change current point marker color
- [x] Update View+Modifiers.swift - change button backgrounds and gradients

## Files to Modify
1. `mobile-app/ios/SonicWalkscape/SonicWalkscape/Assets.xcassets/BanditeLogo.imageset/logo_BANDITE.png` - Replace image
2. `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Welcome/WelcomeView.swift` - 1 occurrence
3. `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Discovery/TourCardView.swift` - 3 occurrences
4. `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Discovery/VideoPlayerView.swift` - 1 occurrence
5. `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Player/AudioControlsView.swift` - 3 occurrences
6. `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Settings/SettingsView.swift` - 4 occurrences
7. `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Discovery/DiscoveryView.swift` - 4 occurrences
8. `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Player/TourCompletionView.swift` - 9 occurrences
9. `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/TourDetail/TourDetailView.swift` - 3 occurrences
10. `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/TourDetail/TourSetupSheet.swift` - 9 occurrences
11. `mobile-app/ios/SonicWalkscape/SonicWalkscape/Views/Player/MapView.swift` - 1 occurrence
12. `mobile-app/ios/SonicWalkscape/SonicWalkscape/Utilities/Extensions/View+Modifiers.swift` - 5 occurrences (including gradient update)

## Implementation Notes
- Simple find-and-replace: `.brandOrange` → `.brandYellow`
- The yellow color (#F5B400) is already defined in Color+Brand.swift
- For gradients in View+Modifiers.swift, replace orange gradient `Color(hex: "b94807")` with darker yellow `Color(hex: "c99600")`
- Logo replacement is a simple file copy operation

## Review

### Summary
Successfully replaced the BANDITE logo and changed the accent color from orange (#d95808) to yellow (#F5B400) throughout the iOS app.

### Changes Made
1. **Logo Replacement**: Replaced `logo_BANDITE.png` in `Assets.xcassets/BanditeLogo.imageset/` with the new golden version from `/Users/juicy/Downloads/logo_oro_bandite.png`

2. **Color Changes**: Replaced all 40+ occurrences of `.brandOrange` with `.brandYellow` across 11 Swift files:
   - WelcomeView.swift (1 occurrence - settings icon)
   - TourCardView.swift (3 occurrences - lock badge, language tags)
   - VideoPlayerView.swift (1 occurrence - loading indicator)
   - AudioControlsView.swift (3 occurrences - progress bar, play button gradient, shadow)
   - SettingsView.swift (4 occurrences - various UI accents)
   - DiscoveryView.swift (4 occurrences - icon colors)
   - TourCompletionView.swift (9 occurrences - completion screen elements)
   - TourDetailView.swift (3 occurrences - detail view accents)
   - TourSetupSheet.swift (9 occurrences - setup flow UI)
   - MapView.swift (1 occurrence - current point marker)
   - View+Modifiers.swift (5 occurrences - button styles, gradients, shadows)

3. **Gradient Updates**: Updated button gradient in `View+Modifiers.swift` from orange tones `[.brandOrange, Color(hex: "b94807")]` to yellow tones `[.brandYellow, Color(hex: "c99600")]`

4. **Comment Updates**: Updated code comments in `View+Modifiers.swift` to reflect "yellow gradient" instead of "orange gradient"

### Verification
- Confirmed no remaining `.brandOrange` references in any View or Utility files
- All changes were minimal and focused - only affected color references
- Logo file successfully replaced in Assets catalog

### Impact
- Entire app now uses yellow (#F5B400) as the primary accent color
- New golden logo appears on welcome screen and about modal
- Consistent yellow theming across buttons, icons, progress bars, and interactive elements
