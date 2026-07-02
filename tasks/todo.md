# Analytics end-to-end verification & fixes

## Goal
Make sure both apps (Android + iOS) send correct analytics to the CMS, that the CMS
dashboard displays the relevant data, and that all tour started / completed / donation
data can be saved (exported).

## What already works (verified this session)
- Both apps POST to `https://walkspace-api.onrender.com/analytics/events` with matching
  field names (`anonymousId`, `tourId`, `pointId`, `language`, `device`, `osVersion`,
  `timestamp`, `properties`) and matching event-name strings.
- Backend ingests + stores every event (`AnalyticsEvent` table, JSONB `properties`).
- Backend aggregates via `/admin/analytics/{overview,duration,engagement,tours,sessions}`.
- CMS dashboard (`cms/src/app/analytics/page.tsx`) shows: starts, completions, completion
  rate, unique devices, platform split, trigger split, duration analytics, contact-channel
  breakdown, donation provider breakdown, per-tour table, recent sessions.
- CSV/JSON export of raw events already exists (`/admin/analytics/export`).

## Confirmed gaps (root causes)
1. **Android sends NO post-tour engagement events.**
   - iOS fires `follow_us_clicked` and `contact_clicked` (channel = instagram/facebook/
     website/email). Android's "Follow Us" button (TourCompletionScreen.kt:287) + the four
     social buttons in `ConnectBottomSheet` (WelcomeScreen.kt:301-328) fire nothing.
   - Effect: CMS engagement/contact breakdown reflects iOS users only.
2. **CMS never displays `follow_us_clicked`.**
   - Backend returns `followUsClicks` / `followUsPercent` in the engagement DTO, but the
     dashboard doesn't render them.
3. **(Consistency) `tour_started` triggerType differs by platform.**
   - Android always sends `triggerType:"gps"` on start; iOS sends `"manual"` initially.
     Skews the start-time "Trigger Method" split. Completion triggerType is correct on both.
4. **(Enhancement) Donation amount not captured.**
   - Both apps let the user pick €3/€5/€10/custom but only send `provider`, not the amount.

## Plan (CONFIRMED — full scope, Android now, add summary export)
### Android (new build required)
- [ ] Fire `follow_us_clicked` from `TourCompletionScreen` "Follow Us" button.
- [ ] Fire `contact_clicked` (channel = instagram/facebook/website/email) from the four
      `ConnectBottomSheet` social buttons (only when opened from the completion screen,
      matching iOS which tracks only when a tourId is present).
- [ ] Add donation `amount` (€) to `donation_link_clicked` properties (Android has the
      amount chips; iOS has none, so amount stays Android-only + optional server-side).

### Backend
- [ ] Engagement: aggregate donation amount (total raised + avg + per-provider total).
- [ ] Make the GPS/Manual trigger split authoritative: compute overview + per-tour trigger
      breakdown from `tour_completed` events (real primary trigger) instead of the
      provisional `tour_started` placeholder. No app discontinuity, platform-independent.
- [ ] Add aggregated **summary** export (overview + per-tour + donations) via
      `/admin/analytics/export?type=summary`, alongside the existing raw export.

### CMS
- [ ] Show Follow-Us clicks (+ % of completions) in Post-Tour Engagement.
- [ ] Show donation amount (total raised + avg) and per-provider amount in Donations.
- [ ] Add "Export Summary" button (CSV/JSON).
- [ ] Note the trigger split is "among completed tours".

### Not doing (documented follow-ups)
- iOS donation-amount selector: iOS uses a fixed PayPal NCP link with no amount field, so
  adding amount there needs a UI + payment-link change — out of scope, flagged for later.

## Review
All changes implemented and compile-verified (backend `tsc` clean, CMS `tsc` clean,
Android `compileDebugKotlin` exit 0). iOS needed no changes — it already fires the
engagement events correctly.

### Android (needs a new Play build to take effect)
- `TourCompletionViewModel`: `trackDonationClicked` now takes an optional `amount`;
  added `trackFollowUsClicked()` and `trackContactClicked(channel)`.
- `TourCompletionScreen`: "Follow Us" now fires `follow_us_clicked`; donation buttons pass
  the selected amount; the Connect sheet receives a contact callback.
- `WelcomeScreen.ConnectBottomSheet`: added optional `onContactClick(channel)` fired by the
  Instagram/Facebook/Website/Email buttons (no-op when opened outside the completion flow,
  matching iOS which only tracks contacts with a tour context).

### Backend
- `getEngagementAnalytics`: aggregates donation amount — per-provider `totalAmount`, plus
  `totalDonationAmount`, `donationsWithAmount`, `avgDonationAmount`. Amount is optional, so
  iOS clicks (no amount) are simply excluded from money totals.
- `getOverview` + `getTourAnalytics`: GPS/Manual split now computed from `tour_completed`
  (the authoritative "primary trigger type") instead of the provisional `tour_started`
  placeholder — meaningful and platform-independent, with no historical discontinuity.
- Added `exportSummary()` + `type=summary` on `/admin/analytics/export`: aggregated CSV/JSON
  report (overview + per-tour + donations) alongside the existing raw export. Read-only.
- DTOs updated to match.

### CMS
- Donations card shows total € raised and average when amounts are present, plus per-provider €.
- Contact & Social card now shows Follow-Us clicks.
- "Export Summary" button (aggregated report) added next to the raw CSV/JSON buttons.
- Trigger Method card labelled "How completed tours were experienced".

### Verification
- backend `npx tsc --noEmit`: clean.
- cms `npx tsc --noEmit`: clean.
- android `./gradlew compileDebugKotlin`: exit 0.
- Live browser check of /analytics not run: page is auth-gated and renders only from a
  running backend + seeded data, which isn't available in this session.

### Deploy notes
- Backend + CMS changes deploy immediately (Render / CMS host).
- Android engagement + donation-amount events require a new versionCode build + Play release.
- iOS donation amount is NOT captured (no amount selector; fixed PayPal NCP link). Documented
  as a follow-up if per-amount donation reporting is wanted on iOS too.
