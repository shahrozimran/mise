# Mise · navy and slate

Version 0.4.0 replaces the earlier green/pastel theme and custom food illustrations.

| Supplied color | Role |
| --- | --- |
| `#06141B` | App background, input fill, text on primary buttons |
| `#11212D` | Cards, dialogs, bottom navigation |
| `#253745` | Raised surfaces, selected cards, subtle dividers |
| `#4A5C6A` | Stronger borders and low-emphasis details |
| `#9BA8AB` | Secondary text and icons |
| `#CCD0CF` | Main text, primary actions, selected indicators |

The theme lives in `apps/mobile/src/components/theme.ts`. The app uses dark system UI and a matching root background. Forms, empty states, preferences, search, barcode lookup, recipe editing, shopping, settings, and macro summaries share the same palette. Printable macro cards use the same navy/slate colors on a paper background.

Headings use sans-serif typography. Selection uses borders, checked icons, and accessible state as well as color. Error messages retain explicit text and alert semantics within the monochrome theme. Touch targets, safe-area spacing, keyboard-aware sheets, and online/offline behavior from 0.3.0 remain in place.

Custom plate illustrations, the leaf SVG logo, and the old rasterization script were removed. `MealPhoto` chooses a bundled image for each of the nine starter recipes. The image-generation tool created the editorial food assets; they illustrate serving ideas and are not evidence of measured portions or nutrition. Exact prompts and filenames are recorded in `apps/mobile/assets/food/PHOTOGRAPHY.md`.

The launcher uses a simple typographic monogram rendered directly to PNG. `tools/render-icon.py` regenerates those assets with Pillow and a supplied local font, without SVG. The offline Three.js welcome now uses a restrained silver dial rather than a cartoon food model. It retains entrance/exit transitions, reduced-motion support, resource cleanup, and a typographic fallback.
