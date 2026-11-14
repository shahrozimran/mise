# Mise build verification

Latest verification: 14 November 2026.

## 0.8.0 product QR and label review

Barcode and supported product QR lookup now open a product review with available brand, ingredient/allergen text, and nutrition per 100 g. Users can choose an amount directly or save/edit a custom product and add it to normal meal/portion calculations. Source records can be refreshed online, personal copies remain available offline, and product-name/manual-label fallbacks handle unsupported identifiers and missing gram-based nutrition. Metadata and attribution survive saved recipes and backups. See `PRODUCT_SCANNING.md` for coverage and limits.

Workspace types/lint and 81 domain/API tests passed. All 20 browser workflows were verified, with affected product cases rerun after editor-spacing and locator corrections. Checks include GS1 lookup, online refresh, custom-copy editing and provenance, combined totals and portions, offline reuse, product-name fallback, and measured liquid-label entry. Android Hermes export passed. A live public lookup and browser review returned a named product, ingredients, and nutrition; phone layouts were reviewed in both appearances. Native QR/barcode camera recognition and device performance remain unverified.

## 0.7.0 personal profile and Settings

New installations enter a required name, age, current weight (kg), and height (cm) before the existing five preference steps. The Home avatar displays the saved initial and opens Settings. A separate profile editor validates changes, supports cancellation, and preserves meal preferences. The Good data card was removed; attribution remains in Privacy and data use. The ingredient picker no longer displays the food-count / Wi-Fi subtitle. Existing completed setups remain usable, with missing personal measurements represented as unknown until entered in Settings. Details are included in local backups.

Workspace type checks/lint, 78 domain/API tests, all 17 browser workflows, and Android Hermes export passed. Checks cover required fields, resumed preferences, avatar navigation, invalid age input, cancellation, comma-decimal weight entry, offline saving, reload persistence, and older-preference/backup migration. Phone and desktop profile screens and both appearances were visually reviewed. Native keyboard, system font scaling, and device-runtime validation remain outstanding.

## 0.6.1 portion card responsiveness

The portion card heading and description now stay within the card. Fields and save/record actions wrap based on available card width and the system font scale, stacking at phone widths and aligning inputs at the bottom when side by side. The decorative cube was removed. Button labels can wrap, and field containers can shrink within their parent.

Mobile types/lint passed. The offline save/history workflow and portion/scaling workflow passed, including layout bounds and input/action alignment checks at widths 320, 390, 768, 820, and 1280. Welcome/short-screen search, barcode caching, and both system-theme workflows also passed. Empty-card previews were visually reviewed in both light and dark modes. Native device and enlarged system-font verification remain outstanding.

## 0.6.0 interface refinement

Decorative stars and repeated food glyphs are removed. Main screens use direct titles, compact typography and consistent spacing. Home prioritizes cooking actions and a short preference summary. Shopping provides an actionable empty state, a secondary Pro explanation, named batch controls, recipe selection counts, and accessible checked-item progress. System appearance, offline editing, keyboard-aware dialogs, personalization, and subscription gates are preserved. See `DESIGN_SYSTEM.md`.

Workspace type checks/lint and all 75 domain/API tests passed. All 16 browser workflows were verified; affected grocery and access-control cases were rerun successfully after correcting the progress bar's web accessibility values. Android Hermes export passed. Light/dark phone layouts, a narrow 320 px viewport, desktop Shopping, the builder, and ingredient search were visually reviewed with no runtime errors in the visual-review session. Native device testing remains outstanding.

## 0.5.0 system light and dark appearance

The app follows device appearance automatically. Light mode uses off-white/charcoal with a subtle beige paper texture; dark mode matches the visible grayscale swatches in the latest reference. The image's printed brown/pink hex labels conflict with those swatches, so the visual colors were used. See `DESIGN_SYSTEM.md` and `apps/mobile/assets/TEXTURE.md` for implementation and asset details.

Local validation passed: workspace types/lint, 75 domain/API tests, 15 browser workflows, 20/20 Expo Doctor checks, and Android Hermes export. Tests verified in-place light/dark switching while a search dialog is open, preservation of the draft and entered text, Settings updates/reload, and dark welcome rendering. Phone screenshots for both modes were reviewed. Native system appearance detection requires installing the new binary; previous 0.4.0 builds forced dark mode. Native-device testing remains outstanding.

## 0.4.0 visual refresh

The earlier navy/slate palette, typography, photo assets, and removal of custom SVG/food illustrations were validated locally with workspace types/lint, 75 domain/API tests, 13 browser workflows, 20/20 Expo Doctor checks, and Android Hermes export including all nine bundled photos. Native compilation and publication succeeded as `v0.4.0-build.6`. Version 0.5.0 supersedes its forced-dark palette.

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
