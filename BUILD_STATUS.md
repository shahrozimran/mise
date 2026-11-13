# Mise build verification

Verified on 13 November 2026.

## 0.4.0 visual refresh

The supplied navy/slate palette, typography, photo assets, and removal of custom SVG/food illustrations are documented in `DESIGN_SYSTEM.md`. Local validation passed: workspace types/lint, 75 domain/API tests, 13 browser workflows, 20/20 Expo Doctor checks, and Android Hermes export including all nine bundled photos. Phone and desktop captures were visually reviewed; the focused mobile/onboarding flows were rerun after system-theme integration. A new main push starts the native APK release build.

## 0.3.0 mobile fixes

The new Three.js welcome, Android bottom insets, keyboard-aware sheets, connection status, and public product lookup are documented in `MOBILE_FIXES.md`. Workspace type checks/lint, 75 domain/API tests, 13 browser workflows, 20/20 Expo Doctor checks, and Android Hermes export passed locally. The focused welcome/short-screen and barcode/offline flows were rerun after visual fixes. Live Open Food Facts lookup succeeded; the screenshot's barcode has no usable name/nutrition in its upstream record.

The 0.3.0 native build and publication succeeded as `v0.3.0-build.5` on GitHub, including signature/checksum and native-library alignment checks. The artifact details below describe the earlier local 0.2.0 build, not a native-device verification of 0.3.0 or 0.4.0. No Android device was connected for testing the reported Samsung keyboard/navigation behavior.

## Delivered artifacts

- Android test APK: `artifacts/mise-0.2.0-arm64.apk`.
- Source mobile app: `apps/mobile`.
- Optional backend: `apps/api`.
- Setup and service configuration: `README.md` and the two app `.env.example` files.
- Onboarding, personalization rules, UI decisions, and limitations: `PERSONALIZATION.md`.
- Test screenshots and printable macro-card sample: `artifacts/` (generated, ignored by Git).

## Passed checks

| Check | Result |
| --- | --- |
| Workspace TypeScript checks | Passed for mobile, API, and shared domain |
| Expo lint | Passed |
| Domain/API tests | 72 passed, including profile migration, strict exclusions, source-linked meal ideas, portions, and goal-based ranking |
| Browser workflows | 11 passed, including first-run/resumed setup, preference save/cancel/reload, filtered suggestions, personalized portions, draft replacement and paste shortcut, reduced motion, airplane-mode editing simulation, saved library, recorded yield, scaling, grocery persistence, backups, printable PDF, and free-slot gating |
| Expo Doctor | 20/20 checks passed |
| Production web export | Passed; first-run setup and personalized recipe smoke check passed with no runtime errors; development Pro controls absent |
| Android Hermes bundle | Passed during native build; source map confirms the delivered editor, onboarding, and motion code matches current source |
| Live USDA proxy smoke check | Passed using the public demo key; a 16-result search returned HTTP 200 |
| Backend startup and health | Passed |
| Native Android release compilation | Passed after Windows CMake path configuration |
| APK signature | Verified; Android Debug certificate, suitable for local testing |
| Native ELF alignment | All 29 packaged native libraries passed 16 KB load-segment alignment |
| APK ZIP alignment | `zipalign -c -P 16 4` passed |

## APK identity

- Application ID: `com.mise.macroarchitect`.
- Version: `0.2.0`, version code `2`.
- Architecture: `arm64-v8a`.
- Minimum SDK: `24`; target SDK: `36`; compile SDK: `37`.
- File size: `41,899,519` bytes.
- SHA-256 is recorded in `artifacts/apk-verification.json` alongside machine-readable artifact metadata.

## Remaining release work

No Android device or configured emulator was connected. Native runtime behavior, camera permissions/scanning, SQLite process-death recovery, native sharing/PDF rendering, TalkBack, and device performance require device testing. Browser storage checks use localStorage and do not establish native SQLite behavior.

Real Google Play purchase/restore, acknowledgements and RTDN need the operator's Play Console products, service-account permissions, signing, Pub/Sub configuration, and license testers. These integrations are implemented but have not been tested against a real paid product. The app is delivered with subscriptions and new online USDA searches unconfigured; its bundled catalog and free recipe/portion features work without those services. Development builds offer an explicitly labeled Pro tool preview; production builds do not.

Before store release, supply a production signing identity, privacy policy/support contact, actual deployment/retention configuration, listing assets and declarations, and complete the release criteria in the implementation plan. See the README for the observed upstream tooling advisory and known initial storage architecture limits.

The Windows config plugin places generated native files under a short, per-project drive cache to avoid Ninja's path-length limit. It does not modify dependency source files or Windows registry settings.
