# Mise · Smart Recipe & Meal-Prep Macro Architect

[![Checks](https://github.com/shahrozimran/mise/actions/workflows/check.yml/badge.svg)](https://github.com/shahrozimran/mise/actions/workflows/check.yml)
[![Android release](https://github.com/shahrozimran/mise/actions/workflows/android-release.yml/badge.svg)](https://github.com/shahrozimran/mise/actions/workflows/android-release.yml)

[Download Android test builds](https://github.com/shahrozimran/mise/releases) · [Release workflow guide](RELEASING.md)

Every push to `main` automatically runs checks and publishes a uniquely numbered Android test release with an APK and checksum. No manual tag or version bump is needed.

An offline-first React Native Android app for composing recipes, calculating nutrition, and dividing cooked batches into portions. This repository contains a working mobile app, a browser preview of the same React Native screens, a shared calculation/parser package, and an optional food lookup and subscription backend.

Download ARM64 APKs from [GitHub Releases](https://github.com/shahrozimran/mise/releases). Local verification also produced `artifacts/mise-0.2.0-arm64.apk` (about 40 MB); generated artifacts are excluded from Git. Test builds use the release configuration and the template's **debug signing certificate**, for sideload testing only. They are not Play Store submission builds. Build verification and the remaining device/configuration checks are recorded in `BUILD_STATUS.md`.

## Run the app

Prerequisites: Node.js 24+, npm, and an Android SDK/JDK for local native builds. The app uses Expo SDK 58 / React Native 0.88.1, as resolved from the current Expo template in November 2026. The October planning document's SDK 57 baseline has been superseded.

```powershell
npm install
npm run web
```

Open http://localhost:8081. The browser preview uses localStorage; the Android app uses SQLite. The browser preview is not a standalone installable offline PWA. The native app bundles the full catalog and does not require an API key, login, or internet connection for the core recipe workflow.

For a native development build:

```powershell
cd apps/mobile
npx expo run:android
```

Use an emulator or connected Android device. This app includes a native billing module, so use a development build rather than Expo Go. Generated `android/` and `ios/` directories are ignored; change native configuration through `app.json` and config plugins.

From the repository root, `npm run prebuild:android` regenerates the correct mobile project. A local config plugin sets a Windows-safe CMake object-path limit and uses a short generated cache at `<workspace-drive>:\.mise-cxx\<project-hash>\` for native build files, without editing `node_modules` or moving source files. Launcher PNGs use a typographic monogram; regenerate with Pillow using `python tools/render-icon.py [path/to/font.ttf]`. No custom SVG illustrations are used.

Cloud build profiles are in `apps/mobile/eas.json`:

```powershell
cd apps/mobile
npx eas-cli@latest build --platform android --profile preview
# For a Play Store AAB, after configuring your Expo account and signing:
npx eas-cli@latest build --platform android --profile production
```

The preview profile creates an installable APK. Production uses real Play entitlements; the development Pro preview is compiled out when `__DEV__` is false. Set your permanent Android application ID before publishing.

## What works

- A five-step first-run setup with animated goal cards, eating styles, ingredient exclusions, cooking time, portions, and cooking confidence. Setup can be skipped, resumed, or changed later.
- A personalized Home screen with nine source-linked starter meals, goal-based ranking, ingredient/time filters, and recipes sized to the preferred portion count.
- A simple meal builder with a blank starting dish, optional cooking notes, quick ingredient amounts, plain-language nutrition help, and advanced tools tucked away.
- 7,793 bundled USDA foods, local search, source attribution, and food-specific household measurements.
- Gram, kg, oz, lb, supported household measures, and explicit unknown nutrition states.
- Custom foods from nutrition labels with a known gram basis.
- Offline recipe-text parsing, fraction handling, and mandatory review of uncertain rows.
- Live batch calories, protein, carbohydrate, fat, and fiber.
- Equal containers, measured cooked yield, per-100-g and custom weighed portions.
- Three free recipe slots, an autosaved working draft, copies, and immutable cooked-batch snapshots.
- Barcode scanner, manual barcode input, cached product lookup, and an optional exact-match USDA proxy.
- Online barcode and packaged-food search through Open Food Facts works without a configured server. Confirm the community label values before use; only records with an explicit 100 g nutrition basis are accepted. Successful lookups and manual barcode labels are cached on the device for offline reuse. Unlisted products and liquids without gram weights can be entered manually.
- A bundled monochrome Three.js welcome scene, responsive keyboard-aware sheets, live connection status, and Android navigation safe-area spacing.
- Automatic system-matched light/dark themes: off-white, charcoal, and subtle beige in light mode; the supplied visible grayscale palette in dark mode. Typographic branding and nine bundled editorial meal photos remain. Asset provenance and prompts are in `apps/mobile/assets/food/PHOTOGRAPHY.md`.
- Pro grocery aggregation with recipe multipliers, persisted list snapshots/checks, and pantry subtraction.
- Pro uniform calorie scaling that preserves ingredient proportions and clears old measured yield.
- Local PDF macro cards on Android; printable/save-to-PDF cards in the browser.
- Portable JSON backup/import with schema validation, import preview, and transactional native replacement.
- Server-side Google Play verification, purchase acknowledgement, authenticated RTDN, reconciliation, encrypted purchase tokens, and signed offline entitlements.

To try the Pro tools during development, open Settings and select **Preview Pro tools in this development build**. This is visibly labeled as a preview and does not simulate a paid subscription. It is unavailable in production builds.

## Repository layout

```text
apps/mobile/src/app/          Expo Router screens
apps/mobile/src/components/   UI, ingredient picker, paste review, scanner
apps/mobile/src/data/         Bundled catalog, SQLite/web persistence, application store
apps/mobile/src/services/     Optional API, billing, backup, PDF
apps/api/src/                 Food proxy/cache and Google Play verification
packages/domain/src/          Pure nutrition, units, parsing, scaling, grocery, schemas
packages/domain/tests/        Domain and source-catalog checks
apps/api/tests/               Adapter, entitlement, and HTTP tests
tests/e2e/                    Browser workflows using the React Native web build
tools/catalog/                Reproducible USDA CSV importer
IMPLEMENTATION_PLAN.md        Original detailed product/implementation plan
```

For this first implementation, local application data is stored as one versioned, validated SQLite state record with immutable recipe/batch snapshots. Food search uses the bundled in-memory catalog. The larger normalized table model and SQLite FTS in the original plan are future migrations, not features already implemented. The optional backend similarly uses SQLite for an easy single-instance deployment; multiple-instance hosting requires a shared persistent database/cache and coordinated quotas.

## Connect USDA lookup

The app remains useful without this service. Never put a USDA API key in an `EXPO_PUBLIC_` variable.

1. Copy `apps/api/.env.example` to `apps/api/.env` and set `USDA_API_KEY` from data.gov.
2. Copy `apps/mobile/.env.example` to `apps/mobile/.env.local` and set `EXPO_PUBLIC_API_URL`.
3. Start `npm run api` from the repository root. By default the server listens on 127.0.0.1:3001.
4. Restart Expo after changing public environment variables.

For an Android emulator, a host API can be reached at `http://10.0.2.2:3001`. For a physical device use a reachable LAN host during development (`HOST=0.0.0.0` on a trusted network) or an HTTPS deployment. Production should use HTTPS. Browser origins must be explicitly allowed through `CORS_ORIGINS`.

The proxy caches responses, validates input, caps upstream requests below the default USDA hourly quota, and returns an offline fallback when unconfigured/unavailable. Brand liquids without a verified gram basis are rejected rather than assigned an invented density. New barcode lookups need connectivity and actual database coverage; an unlisted product can be added from its label.

## Configure paid subscriptions

Real payment testing requires your own Play Console products, service account, package identity, a Play test track, and a physical Android device. No subscriptions or cloud resources have been provisioned by this code.

1. Create a `mise_pro` subscription and recurring base plans in Play Console, or update both product-ID environment variables to your chosen ID. The UI currently displays eligible single-phase recurring plans; introductory offers/installment plans are intentionally not offered.
2. Grant a service account the appropriate Play Developer API permissions and set `GOOGLE_APPLICATION_CREDENTIALS` on the backend. Keep the credentials file outside the repository.
3. Generate local signing/encryption keys from `apps/api` with `npm exec tsx src/keys.ts`. Store the private and encryption keys in backend secrets. Put only the generated public verification key in `EXPO_PUBLIC_ENTITLEMENT_KEY`.
4. Set matching `ANDROID_PACKAGE_NAME` and product IDs on the backend. Build the app with the matching public API URL/key and upload it to a Play internal test track.
5. Configure Google Play RTDN through Pub/Sub authenticated push to `/v1/billing/google-notifications`. Set `RTDN_AUDIENCE` and `RTDN_SERVICE_ACCOUNT`; use HTTPS and configure Pub/Sub retries/dead lettering.
6. Test checkout, pending payments, interrupted verification, acknowledgement, renewals, canceled-but-paid access, holds, refunds, restores, and offline expiry with license testers.

The server signs entitlements; the app verifies them with the pinned public key. Cached access lasts to the verified paid-through date plus at most 72 hours of offline grace. A foreground check refreshes state. Local gates are not tamper-proof on a user-controlled device. First purchase/restore require connectivity. Reinstalling can restore Play access but does not restore local recipes without a backup.

The server is designed for one long-running process with persistent storage. Deploy behind TLS, protect service credentials, back up entitlement records, monitor reconciliation/acknowledgement failures, and set an explicit data-retention policy before a public launch. RTDN and reconciliation retry upstream verification failures; unknown purchase tokens are associated with an owner when checkout verification or restoration establishes one.

## Calculation rules

```text
Ingredient nutrient = ingredient grams × nutrient per 100 g / 100
Batch nutrient      = sum of resolved ingredient nutrients
Per container       = batch nutrient / container count
Per 100 g cooked    = batch nutrient × 100 / cooked yield grams
Weighed portion     = batch nutrient × portion grams / cooked yield grams
```

Cooked yield changes density without changing ingredient-derived total energy by itself. The calculation assumes entered edible ingredients are retained. Drained fat/liquid, bones, discarded material, and uneven serving composition need user judgment. Unknown values remain unknown; fiber is reported separately without adding it again to carbohydrate totals. Scaling is uniform resizing, not macro optimization or a guarantee about cooking time or finished yield.

## Data provenance and catalog rebuild

U.S. Department of Agriculture, Agricultural Research Service. **FoodData Central, SR Legacy, April 2018.** Public-domain / CC0 data. [Download/source documentation](https://fdc.nal.usda.gov/download-datasets/).

The catalog contains original food IDs, selected nutrient IDs, and household weights from the downloaded CSV release. A small set of common foods has reviewed display aliases; original names remain aliases. `catalog-manifest.json` records the source release, count, and SHA-256. Catalog updates do not rewrite saved ingredient/batch snapshots.

```powershell
python tools/catalog/build_catalog.py path/to/FoodData_Central_sr_legacy_food_csv_2018-04
```

The importer uses Python's standard library. Download archives/extracted upstream data are not committed. Regional brand coverage, newer datasets, and further recipe-parser corpus evaluation remain release-readiness work.

## Checks

```powershell
npm run check
cd apps/mobile
npx expo-doctor
cd ../..
npx playwright install chromium
# Start npm run web in another terminal first:
npx playwright test
```

The browser suite covers first-install setup, setup resumption, preference editing/canceling, filtered suggestions, portion sizing, protected draft replacement, offline editing, save/relaunch, recorded batches, paste review, mobile scaling, grocery snapshots/checks, backup import/export, printable cards, and runtime-error checks. Test screenshots/PDFs are written to ignored `artifacts/`. Native camera, SQLite lifecycle, Play checkout, Android accessibility, and device performance still require real-device validation; browser tests do not substitute for those checks.

At implementation time, `npm audit` reports a moderate `minimatch` advisory through Expo's fingerprint/build tooling and the TypeScript lint toolchain (eight affected dependency entries). The supported non-breaking update did not resolve it. Do not apply npm's suggested forced Expo downgrade to SDK 52; reassess upstream compatible releases before publishing.

## Before publishing

Configure your own signing, backend credentials, support contact, privacy policy URL and retention policy, Play products, listing assets, Data safety and Health declarations. Recheck current target API, Billing Library and 16 KB requirements. Validate free-slot expiry behavior, migration recovery, scanner permission denial, low-end performance, and native PDF sharing. The original implementation plan contains the full launch criteria and deferred scope, including cloud sync and Bluetooth scales.
