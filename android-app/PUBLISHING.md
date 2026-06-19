# Publishing to Google Play (Gradle Play Publisher)

Automated uploads use the [Gradle Play Publisher](https://github.com/Triple-T/gradle-play-publisher)
plugin (`com.github.triplet.play`), configured in `app/build.gradle.kts` (the `play { }` block).

## One-time setup: create a service account

You only do this once. It needs Google Play Console **admin** access.

1. **Link a Google Cloud project** (if not already): Play Console → **Setup → API access**.
2. **Create a service account**: from that page click **Create new service account** → it opens
   Google Cloud Console → **IAM & Admin → Service Accounts → Create service account**.
   - Give it a name (e.g. `play-publisher`). No Cloud roles needed. Click Done.
3. **Create a JSON key**: open the service account → **Keys → Add key → Create new key → JSON**.
   A `.json` file downloads.
4. **Save the key** to this repo as:
   ```
   android-app/play-service-account.json
   ```
   (Already gitignored — never commit it.)
5. **Grant Play access**: back in Play Console → **API access** → find the service account →
   **Manage Play permissions** → grant at least:
   - **Releases**: *Create and edit draft releases*, *Release to testing tracks*,
     and *Release to production* (if you publish to production).
   - Scope it to the **Sonic Walkscape** app.
   It can take a few minutes to propagate.

## Releasing

The target track is set by `track` in `app/build.gradle.kts` (currently **`internal`**).
Recommended first run: validate the pipeline on `internal`, then change `track` to your
real track (`beta` or `production`) and run again.

```bash
cd android-app
# builds the signed AAB and uploads it + release notes to the configured track
./gradlew :app:publishReleaseBundle
```

- Release notes are read from `app/src/main/play/release-notes/<locale>/default.txt`.
- `releaseStatus` is `COMPLETED`, so the release is submitted (Google auto-reviews new
  releases). For a draft you can promote manually, set it to `DRAFT`.
- To promote an already-uploaded build between tracks: `./gradlew :app:promoteReleaseArtifact`.

## Notes
- Signing uses `keystore.properties` + `sonic-walkscape.keystore` (both gitignored).
- `versionCode`/`versionName` live in `app/build.gradle.kts` `defaultConfig`.
