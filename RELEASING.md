# Android test releases

The [Android release workflow](https://github.com/shahrozimran/mise/actions/workflows/android-release.yml) builds and publishes an installable ARM64 APK when a `v*` tag is pushed. It can also be run manually for an existing version tag. No Expo account or repository secrets are needed for these offline test builds; publishing uses the workflow's built-in `GITHUB_TOKEN`.

## Publish a version

1. Update `expo.version` and increment `expo.android.versionCode` in `apps/mobile/app.json`.
2. Commit and push those changes to `main`.
3. Create and push a matching version tag:

```sh
git tag -a v0.2.1 -m "Mise 0.2.1"
git push origin v0.2.1
```

Use the next version for later releases, for example `v0.3.0`. The workflow rejects a tag that disagrees with the checked-out app version or points outside `main`'s history. Existing published release assets are not overwritten; a duplicate release fails instead. To retry a failed build before publication, rerun its failed jobs in Actions or use **Run workflow** with the existing tag. Manual runs must use the main branch so the checks and selected tag both use trusted project code.

The workflow first runs TypeScript, lint, domain/API tests, Expo Doctor, and the browser workflows against the selected tag, including for manual runs. It then generates Android using Expo, builds with Java 17 and the matching Android SDK/NDK, verifies the APK signature and 16 KB native/ZIP alignment, and checks the downloaded artifact's checksum before publication. Action versions are pinned to reviewed commit SHAs.

Each successful run creates a **prerelease** containing:

- `mise-<version>-arm64.apk`: Android 7.0/API 24 or later, ARM64 devices.
- `SHA256SUMS.txt`: SHA-256 checksum of that APK.
- `native-alignment.json`: native-library alignment verification.

APK output is also retained in the Actions run artifacts for 14 days. Browser screenshots and failure traces are retained for 7 days. The Releases assets persist independently of the artifact retention period.

## Signing and production

These APKs use Expo's template Android **debug certificate**, including when compiled with the release build type. They are for sideload testing and are labeled accordingly. The workflow does not publish to Google Play, configure a backend, or enable real paid subscriptions. Production signing, Play Console/testing, device validation, and service configuration remain as described in `README.md` and `BUILD_STATUS.md`.

For store distribution, configure a permanent signing identity and the EAS production profile, then build a signed AAB and complete the release checks. Keep signing credentials and service keys outside Git. Do not add real `.env` files or generated native build directories to commits.

## CI

The Checks workflow runs on `main` pushes, pull requests, manual dispatch, and as a reusable gate for Android releases. Playwright automatically starts its own development preview in CI. It runs the same React Native screens as the Android app; it does not establish native SQLite, camera, billing, TalkBack, or device-performance behavior.
