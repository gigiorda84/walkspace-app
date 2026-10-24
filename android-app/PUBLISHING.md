# Publishing to Google Play (Gradle Play Publisher)

Automated uploads use the [Gradle Play Publisher](https://github.com/Triple-T/gradle-play-publisher)
plugin (`com.github.triplet.play`), configured in `app/build.gradle.kts` (the `play { }` block).

## One-time setup: create a service account

You only do this once. It needs Google Play Console **admin** access.

1. **Google Cloud project**: in [Google Cloud Console](https://console.cloud.google.com) pick or
   create a project (e.g. `sonic-walkscape-publishing`).
2. **Enable the API**: APIs & Services → Library → **Google Play Android Developer API** → Enable.
3. **Create a service account**: IAM & Admin → Service Accounts → Create service account
   (e.g. `play-publisher`). No Cloud roles needed. Click Done.
4. **Create a JSON key**: open the service account → **Keys → Add key → Create new key → JSON**.
   A `.json` file downloads. Note the account e-mail (`…@….iam.gserviceaccount.com`).
5. **Save the key outside the repo** (the repo lives in iCloud Drive, which would sync it):
   ```bash
   mkdir -p ~/.config/sonicwalkscape
   mv ~/Downloads/<key>.json ~/.config/sonicwalkscape/play-service-account.json
   chmod 600 ~/.config/sonicwalkscape/play-service-account.json
   ```
   (`android-app/play-service-account.json` is still picked up as a fallback and is gitignored —
   never commit it.)
6. **Grant Play access**: Play Console → **Users and permissions → Invite new users** → the
   service-account e-mail → **App permissions** → Sonic Walkscape with at least:
   - *Release apps to testing tracks*
   - *Release to production, exclude devices, and use Play App Signing*
   - *View app information*
   It can take a while to propagate.

## Releasing

The target track is set by `track` in `app/build.gradle.kts` (currently **`internal`**).

```bash
cd android-app
# builds the signed AAB and uploads it + release notes to the configured track
./gradlew :app:publishReleaseBundle
```

Upload an AAB that is already built (e.g. one built outside iCloud with the init script) instead of
rebuilding — pass a directory that contains **only** that AAB (every bundle in it gets uploaded):

```bash
./gradlew :app:publishReleaseBundle --artifact-dir /path/to/dir-with-one-aab
```

Promote what is on `internal` to production once it has been checked:

```bash
./gradlew :app:promoteReleaseArtifact --from-track internal --promote-track production
```

- Release notes are read from `app/src/main/play/release-notes/<locale>/default.txt`.
- `releaseStatus` is `COMPLETED`, so the release is submitted (Google auto-reviews new
  releases). For a draft you can promote manually, set it to `DRAFT`.
- The version code must be new: Play rejects a `versionCode` it has already seen.

## Notes
- Signing uses `keystore.properties` + `sonic-walkscape.keystore` (both gitignored).
- `versionCode`/`versionName` live in `app/build.gradle.kts` `defaultConfig`.
