# Tour completion screen redesign — donations + feedback (iOS + Android)

## Approved design (user reviewed mockup 2026-06-12)

Top to bottom:
1. ✓ Tour completato! + tour name (unchanged)
2. CMS completion message (unchanged) + explicit localized donation ask line
3. **Donation hero card** (yellow border): two brand-colored deep-link buttons
   - PayPal (#FFC439 bg, #003087 text): https://www.paypal.com/donate/?hosted_button_id=BUD638ZGFSJ3C
   - Satispay (#FF4B3E bg, white text): https://tag.satispay.com/Resonavisse
   - Both URLs verified live (HTTP 200). Hardcoded per user decision. NO amount chips.
4. **Inline 5-star rating** ("Com'è stata la tua esperienza?") — tapping a star reveals an
   optional comment field + send → existing `submitFeedback` API, rating encoded in the
   feedback text ("Tour <title> — rating X/5 — <comment>"). No backend change.
5. Secondary small links row: Info bus (existing alert/dialog) · Seguici (existing sheet)
6. "Torna alla home" demoted to text/underline button (no longer the dominant yellow CTA)

Analytics: donation buttons send existing `donation_link_clicked` event with new
`provider` property ("paypal" / "satispay"). No new event names.

## Todo

- [x] 1. iOS `TourCompletionView.swift`: donation card + stars/comment + demote home button
- [x] 2. iOS `LocalizedStrings.swift`: new strings (donation ask, donate title, rating
      question, comment placeholder) in en/it/fr
- [x] 3. iOS `AnalyticsService.swift`: add `provider` param to trackDonationLinkClicked
- [x] 4. Android `TourCompletionScreen.kt`: same redesign (Compose)
- [x] 5. Android `strings.xml` (values, values-it, values-fr): same new strings
- [x] 6. Android: donation tracking via existing `track()` with provider property
      (added to `TourCompletionViewModel`, no AnalyticsService change needed)
- [x] 7. Build both: Android `compileDebugKotlin` ✅ exit 0 + iOS `xcodebuild build` ✅ exit 0

## Review

Both platforms build cleanly. Changes per file:

**iOS**
- `TourCompletionView.swift` — replaced the three equal outlined buttons + yellow home
  button with: explicit donation ask text → yellow-bordered donation card with PayPal
  (#FFC439/navy) and Satispay (#FF4B3E/white) capsule buttons that deep-link out →
  inline 5-star rating that reveals an optional comment field + send (POSTs to the
  existing feedback endpoint as "Tour <title> — rating X/5 — <comment>"; thanks state
  only on success, silent retry on failure) → small icon links for Info bus / Seguici →
  underlined muted "Torna alla home" text button. New `DonationButton` and
  `SecondaryLink` components.
- `LocalizedStrings.swift` — 5 new strings (donationAsk, supportProject, ratingQuestion,
  ratingCommentPlaceholder, ratingThanks) in en/it/fr.
- `AnalyticsService.swift` — `trackDonationLinkClicked` gains optional `provider`
  parameter sent as event property.

**Android**
- `TourCompletionScreen.kt` — same redesign in Compose; Column gains verticalScroll for
  small screens. New `DonationButton`/`SecondaryLink` composables replace
  `CompletionOutlinedButton`.
- `TourCompletionViewModel.kt` — added `trackDonationClicked(provider)` (reuses the
  whitelisted `donation_link_clicked` event with `provider` property — backend enum
  verified) and `submitRating()` via existing `POST /feedback`.
- `strings.xml` ×3 (en/it/fr) — 6 new strings (incl. `send`).

**Decisions implemented:** no amount chips; URLs hardcoded
(PayPal hosted button BUD638ZGFSJ3C, Satispay tag Resonavisse — both verified HTTP 200);
both platforms shipped together. Old Produzioni dal Basso link removed.
