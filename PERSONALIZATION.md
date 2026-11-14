# Personalized kitchen experience

Introduced in version 0.2.0; personal details added in 0.7.0.

## First install

Every new installation opens a six-step setup before the main tabs. Existing saved recipes and batches remain intact.

1. Enter a name, whole-number age, current weight in kilograms, and height in centimeters. All four fields are required before continuing to preferences.
2. Choose a goal: lose weight, gain weight, build muscle, eat more balanced, or make cooking easier.
3. Choose an eating style: everything, vegetarian, vegan, or pescatarian.
4. Select ingredient exclusions and optionally enter other avoided foods.
5. Choose available cooking time, usual portions, and cooking confidence.
6. Review the choices.

Continue saves the personal details locally; Continue and Back retain preference progress. After the details step, Skip finishes with the current meal choices. The Home avatar shows the first character of the saved name and opens Settings. A neutral profile icon is used for legacy users who have not entered a name. Settings provides a separate Edit profile dialog and a Change my preferences flow; closing either discards unsaved edits. Personal details and preferences stay in local state and portable backups. No account is needed.

Older preferences and backups load with unknown age, weight, and height represented by null values. Existing users who completed setup are not forced through it again; they can complete their profile in Settings. Personal details do not change the existing recommendation formula or generate a calorie prescription. The former Good data card is removed from Settings; source attribution remains available in Privacy and data use.

## Home and meal building

Home offers two prominent actions: build a meal or paste an ingredient list. A current draft can be continued. Starting a different meal requires an explicit replacement choice if the draft has ingredients.

The first three matching meal ideas appear as photo cards. Each shows its reason, cooking time, calories, and protein per portion. Opening an idea reveals ingredients and amounts; Use this recipe creates an editable draft scaled to the preferred portion count. Its instructions are stored in cooking notes. Finished cooked yield is left blank until measured.

The meal builder uses plain labels, quick gram amounts, optional notes, and expandable source/advanced-tool details. Nutrition and equal portions work without a kitchen scale. A small help sheet explains calories, nutrients, and batch portions.

## Recommendation rules and limits

The starter collection contains nine curated templates linked to actual bundled USDA food records. Nutrition is calculated with the same engine as user recipes. Eating style, declared template allergens, named avoided foods/aliases, and time are hard filters. Empty results stay empty and offer preference editing or manual cooking; restrictions are never relaxed to fill the cards.

Matching templates are ranked by the selected goal: vegetable/protein emphasis, higher meal energy, protein content, vegetable/fiber variety, or fewer ingredients. Beginners receive a small simplicity preference. This is deterministic offline discovery, not generative AI. Portions scale ingredient quantities, not the underlying ranking. Time estimates are approximate, exclude passive overnight refrigeration, and presume already-cooked rice where stated.

The collection is small and ingredient-name matching does not understand every synonym, medical condition, product formulation, or cross-contact risk. Package-label checks remain essential. Restrictions filter suggestions only; manual foods and existing recipes remain editable. Goals do not create daily calorie targets, clinical diet plans, or promised weight changes. Additional cultural dietary patterns and larger regional recipe collections are future work.

## Motion and accessibility

Native React Native Animated provides short fade/slide entrances and spring press feedback. Selection is also conveyed through labels, icons, borders, and radio/checkbox state. Reduced-motion system settings suppress these effects. Meal photos are bundled and work offline. Three.js is limited to the welcome scene; setup cards use native animation.

Responsive layouts, scrollable cards, persistent navigation controls, and bottom safe-area spacing support phone and larger screens. Browser checks cover phone layouts and reduced motion; native TalkBack, large font scaling, keyboard behavior, and low-end device performance still need device validation.

## References

- [Expo JavaScript tabs](https://docs.expo.dev/router/advanced/tabs/) and the installed SDK 58 router implementation inform navigation. In SDK 58, `href: null` can redirect away from a hidden route; the meal editor instead hides only its tab button.
- [React Native Animated](https://reactnative.dev/docs/animated) and [AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo) cover motion and reduced-motion support.
- [Canada's food guide: building meals](https://www.canada.ca/en/health-canada/services/food-guide/eating-support/cooking/make-healthy-meals-plate.html) provides general balanced-meal context, not personalized prescriptions.
- [USDA FSIS poultry temperature guidance](https://ask.fsis.usda.gov/article/What-is-a-safe-internal-temperature-for-cooking-meat-and-poultry) supports the chicken templates' thermometer instruction.
