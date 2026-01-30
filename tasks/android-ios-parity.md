# Android App - iOS Parity Update

## Overview
Port the iOS app design and functionality to the Android app to ensure consistency across platforms.

## Key Differences Identified

### Colors
- **iOS** uses **teal** colors: `#1A5C61` (BrandPurple), `#2A6F75` (Surface), `#3D8389` (Border)
- **Android** uses **purple** colors: `#1A1625`, `#2A1F3D`, `#3D2F52`
- Must update Android to match iOS teal palette

### Welcome Screen
- **iOS**: Logo, "Sonic WalkScape" title, "BANDITE _ Artivism" subtitle, About/Start Exploring/Connect buttons (pill-shaped), Settings gear (top-right)
- **Android**: Simple title, subtitle, language selector, Continue button
- Need complete redesign

### Onboarding Carousel
- **iOS**: 3 slides with icon, title, and multiple text bullet points per slide. Yellow step indicators (fill up to current). Yellow capsule "Continue" button.
- **Android**: 3 slides with icon in circle, title, single description. Orange indicators. Orange/outlined buttons.
- Need UI updates to match iOS

### Settings Screen
- **iOS**: Sections - Language (with flags + checkmark), Location toggle, App Info (Version/Build), Credits with logo
- **Android**: Language dialog, Preferences toggles (notifications, auto-download), Privacy section (analytics), About (version)
- Need restructuring to match iOS

### Tour Detail Screen
- **iOS**: Video trailer support, language badges with globe icon, Info badges (clock, map, figure.walk) in rounded chips, yellow capsule Start button
- **Android**: Cover image only, simple stats row, orange rounded Start button
- Need UI updates

### Tour Setup Sheet (NEW)
- **iOS**: Multi-step flow - Language selection -> Subtitles toggle -> Download choice with progress
- **Android**: None - goes straight to player
- Need to add new component

---

## Tasks

### Phase 1: Colors & Theme
- [x] Update Color.kt to match iOS teal palette

### Phase 2: Welcome Screen
- [x] Add BanditeLogo drawable asset
- [x] Redesign WelcomeScreen with logo, title, subtitle, 3 buttons
- [x] Add AboutModal (bottom sheet)
- [x] Add ConnectBottomSheet (Connect button sheet)
- [x] Add Settings gear button (top-right)

### Phase 3: Onboarding Carousel
- [x] Update slide layout: icon (no circle bg), title, multiple text lines
- [x] Update page indicators: yellow filled up to current
- [x] Update button: yellow capsule "Continue"
- [x] Add close (X) button top-right

### Phase 4: Settings Screen
- [x] Restructure to match iOS: Language, Location, App Info, Credits
- [x] Add flag emojis to language options
- [x] Add Location toggle section
- [x] Add Credits section with logo

### Phase 5: Discovery Screen
- [x] Add Home button (left) + Settings gear (right) header
- [x] Center "Discover" title
- [ ] (Future) Add map background with tour markers

### Phase 6: Tour Detail Screen
- [x] Add language badges row with globe icon
- [x] Add Info badges (duration/distance/difficulty) in rounded chips
- [x] Update Start button to yellow capsule shape
- [x] Add gradient fade at bottom

### Phase 7: Tour Setup Sheet (New Component)
- [ ] Create TourSetupSheet composable
- [ ] Step 1: Audio language selection
- [ ] Step 2: Subtitles toggle
- [ ] Step 3: Download choice
- [ ] Downloading progress view
- [ ] Integrate with TourDetailScreen

### Phase 8: Player Screen (Lower Priority)
- [ ] Match iOS layout with map
- [ ] Add subtitle overlay toggle
- [ ] Add debug overlay toggle

---

## Review

### Summary
Updated Android app to match iOS design across 6 phases. The app now uses the same teal color palette, has a matching Welcome screen with logo and buttons, updated onboarding carousel, iOS-style Settings, Discovery header, and Tour Detail layout.

### Files Changed

**Colors & Theme:**
- `app/src/main/java/com/bandite/sonicwalkscape/ui/theme/Color.kt` - Updated to iOS teal palette

**Assets:**
- `app/src/main/res/drawable/bandite_logo.png` - Added logo from iOS

**Strings:**
- `app/src/main/res/values/strings.xml` - Added new strings for About, Connect, onboarding slides, settings sections

**Welcome:**
- `app/src/main/java/com/bandite/sonicwalkscape/ui/welcome/WelcomeScreen.kt` - Complete redesign with logo, 3 buttons, About/Connect bottom sheets

**Onboarding:**
- `app/src/main/java/com/bandite/sonicwalkscape/ui/welcome/OnboardingCarouselScreen.kt` - Updated to iOS format with 3 text lines per slide, yellow indicators

**Settings:**
- `app/src/main/java/com/bandite/sonicwalkscape/ui/settings/SettingsScreen.kt` - Restructured to match iOS sections

**Discovery:**
- `app/src/main/java/com/bandite/sonicwalkscape/ui/discovery/DiscoveryScreen.kt` - Added Home/Settings header like iOS

**Tour Detail:**
- `app/src/main/java/com/bandite/sonicwalkscape/ui/tourdetail/TourDetailScreen.kt` - Added language badges, info chips, gradient bottom

**Navigation:**
- `app/src/main/java/com/bandite/sonicwalkscape/ui/navigation/NavGraph.kt` - Updated for new screen parameters

### Remaining Work
- Phase 7: Tour Setup Sheet (3-step flow before starting tour)
- Phase 8: Player Screen improvements
- Map integration for Discovery screen
