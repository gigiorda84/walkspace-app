# TestFlight Deployment Summary

**Date**: January 9, 2026
**App**: Sonic Walkscape
**Bundle ID**: com.bandite.SonicWalkscape
**Version**: 1.0
**Build**: 3

---

## ✅ Completed Tasks

### 1. App Configuration
- ✅ Updated app icon to Sonic Walkscape logo (blue S, green W, orange pin)
- ✅ Added `CFBundleIconName` to Info.plist
- ✅ Set target device to iPhone only (removed iPad)
- ✅ Removed development HTTP exceptions from Info.plist
- ✅ Configured production backend URL: `https://walkspace-api.onrender.com`
- ✅ Incremented build number to 3

### 2. Build & Archive
- ✅ Created Release configuration build
- ✅ Archived app successfully
- ✅ Exported IPA for App Store distribution
- ✅ Code signed with Team ID: V7Q6885JT4

### 3. App Store Connect Setup
- ✅ Uploaded build 1.0 (3) to App Store Connect
- ✅ Configured Privacy Policy URL
- ✅ Set Primary Category: Travel
- ✅ Completed Age Rating questionnaire (4+)
- ✅ Set Content Rights information
- ✅ Added Contact Information
- ✅ Attached build to version 1.0

### 4. TestFlight Configuration
- ✅ Created internal testing group
- ✅ Added build 1.0 (3) to testing group
- ✅ Added 2 internal testers to App Store Connect team
- ✅ Invited testers to TestFlight group
- ✅ Successfully tested app installation and functionality

### 5. App Store Preparation
- ✅ Added app screenshots
- ✅ Completed app description and keywords
- ✅ Set up support URL
- ✅ Configured marketing materials

---

## 📱 App Information

### Technical Details
- **Platform**: iOS
- **Minimum iOS Version**: 15.0
- **Architecture**: arm64 (iPhone only)
- **Team**: Giuseppe Giordano (Team ID: V7Q6885JT4)

### App Store Metadata
- **Category**: Travel
- **Age Rating**: 4+
- **Price**: Free (presumed)
- **Privacy Policy**: https://walkspace-api.onrender.com/privacy

### Capabilities
- ✅ Background Audio
- ✅ Background Location Updates
- ✅ Location Services (Always & When In Use)

---

## 🧪 TestFlight Status

### Internal Testing
- **Status**: Active
- **Group Name**: Internal Testers
- **Number of Testers**: 2
- **Build Available**: 1.0 (3)
- **Expires**: April 9, 2026 (90 days)

### Test Results
- ✅ App installs successfully via TestFlight
- ✅ App launches without crashes
- ✅ Functionality verified by testers

---

## 📋 Pre-Launch Checklist

### Before App Store Submission
- [ ] Gather feedback from internal testers
- [ ] Fix any bugs or issues reported
- [ ] Update privacy policy to permanent URL (if needed)
- [ ] Test on multiple iOS versions and devices
- [ ] Verify all tour content is uploaded to backend
- [ ] Test offline functionality thoroughly
- [ ] Verify GPS/location triggering accuracy
- [ ] Test background audio playback
- [ ] Check analytics implementation
- [ ] Review and test voucher redemption flow

### App Store Review Preparation
- [ ] Prepare demo account credentials (if needed)
- [ ] Write review notes for Apple (explain GPS/audio features)
- [ ] Ensure all content is appropriate (4+ rating)
- [ ] Test payment flows (if using In-App Purchases)
- [ ] Prepare promotional text and What's New notes

---

## 🚀 Next Deployment Steps

### For Future Updates
1. Increment build number: `agvtool next-version -all`
2. Archive: `xcodebuild archive -project SonicWalkscape.xcodeproj -scheme SonicWalkscape -configuration Release -destination "generic/platform=iOS"`
3. Export: `xcodebuild -exportArchive -archivePath [path] -exportPath [path] -exportOptionsPlist exportOptions.plist`
4. Upload via Xcode Organizer
5. Add build to TestFlight group
6. Notify testers of update

### For App Store Submission
1. Ensure all App Store metadata is complete
2. Add all required screenshots (iPhone sizes)
3. Set release date and pricing
4. Submit for review via App Store Connect
5. Respond to any review feedback within 24 hours
6. Typical review time: 1-3 days

---

## 📊 Metrics to Monitor

### TestFlight Analytics
- Number of installs
- Session duration
- Crash reports
- Beta feedback submissions
- Device distribution

### App Performance
- GPS accuracy and triggering reliability
- Audio playback stability
- Background mode battery usage
- Download success rate
- Backend API response times

---

## 🔧 Configuration Files

### Important Paths
- Xcode Project: `/Users/juicy/Documents/sonic-walkspace/mobile-app/ios/SonicWalkscape/SonicWalkscape.xcodeproj`
- Info.plist: `/Users/juicy/Documents/sonic-walkspace/mobile-app/ios/SonicWalkscape/SonicWalkscape/Info.plist`
- Assets: `/Users/juicy/Documents/sonic-walkspace/mobile-app/ios/SonicWalkscape/SonicWalkscape/Assets.xcassets/`
- App Icon: `/Users/juicy/Documents/sonic-walkspace/mobile-app/ios/SonicWalkscape/SonicWalkscape/Assets.xcassets/AppIcon.appiconset/icon.png`

### Backend Configuration
- Production API: `https://walkspace-api.onrender.com`
- Constants File: `/Users/juicy/Documents/sonic-walkspace/mobile-app/ios/SonicWalkscape/SonicWalkscape/Utilities/Constants.swift`

---

## ✅ Deployment Complete

**Status**: ✅ Successfully deployed to TestFlight
**Date Completed**: January 9, 2026
**Build**: 1.0 (3)
**Testers**: 2 active internal testers
**Next Milestone**: App Store submission (when ready)

---

## 🤖 Automated upload (App Store Connect API key)

Uploads an archive from the command line, without signing in to Xcode with an Apple ID.

**One-time setup** (Account Holder / Admin):
1. App Store Connect → Users and Access → Integrations → App Store Connect API → **Team Keys**
   → Generate API Key, access **Admin** (use a team key; individual keys fail with xcodebuild).
   API keys cannot use Apple's cloud-managed distribution certificate ("Cloud signing permission
   error", even with Admin), so this Mac needs its own **Apple Distribution** certificate:
   Xcode → Settings → Accounts → Apple ID → team → Manage Certificates… → **+** → Apple Distribution.
   The first signing may show a keychain prompt for that key: enter the Mac password, "Always Allow".
2. Download `AuthKey_<KEYID>.p8` (only possible once) to `~/.appstoreconnect/private_keys/`
   (`chmod 600`). Keep it outside the repo — the repo is in iCloud Drive.
3. Put the identifiers in `~/.appstoreconnect/sonicwalkscape.env`:
   ```
   ASC_KEY_ID=<Key ID>
   ASC_ISSUER_ID=<Issuer ID shown at the top of the API keys page>
   ```
4. Create + install the App Store provisioning profile for that certificate (manual signing — the
   Xcode-managed "iOS Team Store" profile can't be regenerated with an API key):
   ```bash
   python3 -I mobile-app/ios/create-app-store-profile.py
   ```
   It creates "SonicWalkscape App Store CLI" (or reuses it if active) and installs it for Xcode.
   Re-run it when the distribution certificate is renewed (current one expires 24 Oct 2027) —
   change `CERT_NAME` in the script if the certificate name changes.

**Upload** (after `xcodebuild … archive`; bump `MARKETING_VERSION`/`CURRENT_PROJECT_VERSION` first):
```bash
mobile-app/ios/upload-to-app-store.sh mobile-app/ios/SonicWalkscape/build/SonicWalkscape-X.Y-N.xcarchive
```
- `--dry-run` as 2nd argument exports a signed `.ipa` locally instead of uploading (checks key + signing).
- Export options: `mobile-app/ios/SonicWalkscape/ExportOptions-AppStore.plist` (manual signing with
  "Apple Distribution" + profile "SonicWalkscape App Store CLI"; versions are not changed by Xcode:
  `manageAppVersionAndBuildNumber = false`).
- After processing, the build appears in TestFlight; submit it for review in App Store Connect.

---

## 📞 Support Contacts

- **Developer Email**: gigiorda@hotmail.it
- **Apple Developer Account**: gigiorda@hotmail.it
- **Team ID**: V7Q6885JT4

---

## 📝 Notes

- Privacy policy currently uses placeholder URL - update before external testing or App Store release
- Build expires in 90 days (April 9, 2026)
- Internal testing allows up to 100 testers maximum
- External testing requires Apple review (1-2 days)
- App Store review typically takes 1-3 days

---

**Congratulations on your successful TestFlight deployment! 🎉**
