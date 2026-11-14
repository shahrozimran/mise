# Product scanning and custom products

Version 0.8.0 adds a review-and-save flow for packaged products. Camera scanning runs on the device; online label lookup uses Open Food Facts with the optional USDA proxy as a fallback. A found product is cached for offline reuse before any amount is added to a meal.

## Flow

1. Choose Scan barcode or QR code in the meal builder. Camera permission is optional; barcode digits or a product QR link can also be pasted.
2. Review the matched name, brand, available ingredient/allergen text, and nutrition per 100 g. The record must match the package. Missing label text is described as unavailable; unknown nutrients remain unknown.
3. Choose amount to add the product directly, or Save as custom product to review/correct the label values and save a personal copy. Existing custom products can be edited. Gram-based label serving sizes are retained when the source supplies them.
4. Choose the amount used and add it to the dish. The regular recipe engine combines it with other foods and calculates whole-batch and per-portion values. The label's ingredient text is descriptive; its sub-ingredients are not counted a second time.

Personal copies retain product metadata and source attribution in local storage, recipes, and backups. Scanner lookup prioritizes the local custom copy of the same barcode. Online Refresh product data is available for cached source records; it does not overwrite a personal copy. A manually entered label can be saved and added to the meal immediately.

## QR coverage

The identifier parser supports 8/12/13/14-digit package codes, uncompressed GS1 Digital Link `/01/<GTIN-14>` paths, `(01)` human-readable identifiers, Open Food Facts product links, and explicit `gtin` / `ean` / `upc` / `barcode` URL parameters. A leading-zero GTIN-14 is queried using its equivalent 13-digit identifier, while cache matching compares padded identifiers.

Scanned URLs are parsed for identifiers and are never opened or scraped. Generic marketing URLs, arbitrary QR text, and compressed GS1 links are not resolved automatically. Product-name search and manual label entry remain available. Camera configuration includes QR alongside the existing package barcode formats; this does not imply every barcode payload contains a supported food identifier.

## Data limits

Online product coverage and completeness vary. The app does not infer calories, ingredient weights, or allergens from an ingredient list. Public records without a usable explicit 100 g basis are not treated as gram nutrition. A liquid labeled by volume requires the user to provide its measured gram weight and nutrition basis. Community records and edited custom values must be checked against the package, including allergen and cross-contact statements.

## Verification

Domain checks cover supported and unsupported identifiers, metadata round trips, gram servings, absent nutrition, liquid-basis rejection, and mixed-recipe arithmetic. Browser checks cover cached barcode reuse, online refresh, GS1 QR lookup, editable custom copies, label provenance, combined totals/portions, offline reuse, product-name fallback, manual liquid labels, and multiline editor spacing. Live public lookup and browser review succeeded for a known packaged-food identifier. Native camera recognition, focus, permission handling, and performance still require physical-device verification.

References: [Expo SDK 58 Camera](https://docs.expo.dev/versions/v58.0.0/sdk/camera/), [Open Food Facts API](https://openfoodfacts.github.io/openfoodfacts-server/api/), and [GS1 Digital Link URI syntax](https://ref.gs1.org/standards/digital-link/uri-syntax/).
