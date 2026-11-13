# Mise · interface and system appearance

Version 0.6.0 follows the device appearance automatically using React Native `useColorScheme`. Expo is configured with `userInterfaceStyle: automatic`; no saved manual override forces the application into one mode.

## Interface refinement

Direct screen names and task-based instructions replace repeated marketing headings and footers. Decorative stars, sparkles, and repeated food-category glyphs have been removed. Outline icons remain for actions such as search, camera access, navigation, editing, and selection. Home presents a compact preference summary and clear cooking actions; meal photography is reserved for suggested recipes.

Shared surfaces use 16 px card corners, readable secondary text, and compact page headers. Primary buttons have a 48 px minimum height; small buttons, chips, and icon actions use at least 44 px targets. Buttons expose loading/disabled state, and screen titles are accessible headings. System light/dark appearance and reduced-motion behavior continue to apply.

Shopping starts with one useful action when no recipes exist. The Pro explanation is secondary and uses a neutral text badge. Saved recipes expose selection counts and named batch controls. A Pro user must select a recipe before building a list; reducing the final batch to zero removes the selection. Existing lists show checked-item progress and retain pantry subtraction and saved checks. Creating a recipe from Shopping opens the current draft without clearing it.

Visual review covers light and dark phone layouts, a narrow 320 px viewport, desktop Shopping, the meal builder, and ingredient search. Browser workflows exercise empty Shopping, paid-feature gating, batch counts, and progress alongside existing offline, personalization, and persistence checks. These checks do not establish native device behavior.

## Light appearance

Off-white `#F8F6F1` forms the background, white cards provide structure, and charcoal `#252422` carries headings and primary actions. Warm beige `#EEE8DF` is limited to raised feature surfaces and small accents. A faint bundled paper texture appears only on light-mode feature cards.

## Dark appearance

The supplied image visually shows neutral grayscale swatches, although its printed hex labels describe brown/pink colors. This implementation follows the visible swatches: near-black `#0E0E0E`, middle gray `#585858`, silver gray `#A2A2A2`, soft gray `#B7B7B7`, and off-white `#EDEDED`. Slightly darker neutral card tones keep the app usable as a dark interface. This replaces the earlier navy/slate palette.

## Runtime behavior

The theme provider publishes stable semantic color objects. Components subscribe through `useTheme`; shared styles are cached separately per mode rather than holding colors from the first render. Theme changes update open dialogs and forms in place, preserving drafts, entered search text, and navigation state. Status-bar foreground and the native root background follow the active mode. Settings explains that appearance follows the phone.

The bundled Three.js welcome renderer also responds to appearance changes, including its embedded Android WebView and web iframe. Its reduced-motion and resource-cleanup behavior remains intact. Native OS appearance detection requires installing a newly built APK because the earlier 0.4.0 binary explicitly forced dark appearance.

Food photography, typographic branding, keyboard-aware sheets, navigation safe areas, and online/offline product behavior remain. No custom SVG illustrations were reintroduced. Printable cards stay paper-friendly using charcoal and beige accents.

## Assets and verification

Nine bundled generated meal photos and their exact prompts are documented in `apps/mobile/assets/food/PHOTOGRAPHY.md`. The generated paper texture and its prompt are documented in `apps/mobile/assets/TEXTURE.md`.

Browser tests exercise light startup, dark startup, an in-place system appearance change while an ingredient search is open, preservation of the entered meal name, surface updates in Settings, and reload behavior. Real-device system-bar, keyboard, and accessibility checks remain necessary.
