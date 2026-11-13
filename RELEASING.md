# Android test releases

The [Android release workflow](https://github.com/shahrozimran/mise/actions/workflows/android-release.yml) automatically builds and publishes an installable ARM64 APK after **every push to `main`**. No manual version bump, tag, Expo account, or additional repository secret is required. Publishing uses the workflow's built-in `GITHUB_TOKEN`.

## Automatic releases

Push changes to `main` as usual. After checks pass, the workflow creates a tag such as `v0.2.1-build.5` at the exact pushed commit, then publishes its APK and verification files. The workflow run number makes each tag unique, even when the source app version stays the same. The APK's version name includes that build suffix; its Android version code is `100000 + workflow run number`, allowing newer cloud builds to update older test installs. Keep this workflow's identity and run counter when editing it.

Version changes are applied only inside the build runner and are never committed back, so releasing cannot cause a push loop. Generated tags use `GITHUB_TOKEN` and do not start another release workflow. Pushes to feature branches and pull requests do not publish releases; merge them into `main` to release. Each push has an independent run, so a later push does not cancel an earlier pending release. Failed checks/builds do not publish an APK.

## Optional named version releases

1. Update `expo.version` and increment `expo.android.versionCode` in `apps/mobile/app.json`.
2. Commit and push those changes to `main` (this also creates an automatic build release).
3. Optionally create and push a matching version tag for a named release:

```sh
git tag -a v0.2.1 -m "Mise 0.2.1"
git push origin v0.2.1
```

Use the next version for later releases, for example `v0.3.0`. The workflow rejects a tag that disagrees with the checked-out app version or points outside `main`'s history. Existing published release assets are not overwritten; a duplicate release fails instead. To retry a failed build before publication, rerun its failed jobs in Actions or use **Run workflow** with the existing tag. Manual runs must use the main branch so the checks and selected tag both use trusted project code.

The workflow first runs TypeScript, lint, domain/API tests, release-numbering tests, Expo Doctor, and browser workflows against the exact pushed commit or selected tag. It then generates Android using Expo, builds with Java 17 and the matching Android SDK/NDK, verifies the APK signature and 16 KB native/ZIP alignment, and checks the downloaded artifact's checksum before publication. Action versions are pinned to reviewed commit SHAs.

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
