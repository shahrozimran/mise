import {
  clone,
  Food,
  FoodMeasure,
  Ingredient,
  massMeasures,
  nutrientKeys,
  Nutrients,
  NutritionResult,
  Recipe,
  UnitConvention,
} from "./types";

export function positive(value: number, label = "Amount"): number {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${label} must be greater than zero.`);
  return value;
}
export function validateRecipe(recipe: Recipe): void {
  positive(recipe.servings, "Container count");
  if (!Number.isInteger(recipe.servings))
    throw new Error("Container count must be a whole number.");
  if (recipe.yieldGrams !== null) positive(recipe.yieldGrams, "Cooked yield");
  for (const item of recipe.ingredients) {
    positive(item.quantity);
    positive(item.grams, "Ingredient weight");
  }
}
export function availableMeasures(
  food: Food,
  convention: UnitConvention = "us",
): FoodMeasure[] {
  return [
    ...massMeasures,
    ...food.measures.filter(
      (m) => !m.convention || m.convention === convention,
    ),
  ];
}
export function resolveGrams(
  food: Food,
  quantity: number,
  measureId: string,
  convention: UnitConvention = "us",
): number {
  positive(quantity);
  const measure = availableMeasures(food, convention).find(
    (m) => m.id === measureId,
  );
  if (!measure)
    throw new Error(
      "No verified gram conversion for this food and measure. Enter a weight in grams.",
    );
  return positive(
    (quantity / positive(measure.amount)) * positive(measure.grams),
    "Ingredient weight",
  );
}
export function calculateRecipe(recipe: Recipe): NutritionResult {
  validateRecipe(recipe);
  const known = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const missing = { ...known };
  let ingredientGrams = 0;
  for (const item of recipe.ingredients) {
    ingredientGrams += item.grams;
    for (const key of nutrientKeys) {
      const value = item.food.nutrients[key];
      if (value === null || !Number.isFinite(value) || value < 0)
        missing[key]++;
      else known[key] += (item.grams * value) / 100;
    }
  }
  const totals = Object.fromEntries(
    nutrientKeys.map((key) => [key, missing[key] ? null : known[key]]),
  ) as Nutrients;
  return { totals, known, missing, ingredientGrams };
}
export function multiplyNutrients(
  nutrients: Nutrients,
  factor: number,
): Nutrients {
  if (!Number.isFinite(factor) || factor < 0)
    throw new Error("Invalid nutrition multiplier.");
  return Object.fromEntries(
    nutrientKeys.map((key) => [
      key,
      nutrients[key] === null ? null : nutrients[key]! * factor,
    ]),
  ) as Nutrients;
}
export function equalPortion(recipe: Recipe): Nutrients {
  return multiplyNutrients(calculateRecipe(recipe).totals, 1 / recipe.servings);
}
export function weighedPortion(recipe: Recipe, grams: number): Nutrients {
  positive(grams, "Portion weight");
  if (recipe.yieldGrams === null)
    throw new Error("Enter the measured cooked yield first.");
  positive(recipe.yieldGrams, "Cooked yield");
  if (grams > recipe.yieldGrams)
    throw new Error("The portion exceeds the cooked batch weight.");
  return multiplyNutrients(
    calculateRecipe(recipe).totals,
    grams / recipe.yieldGrams,
  );
}
export function makeIngredient(
  food: Food,
  quantity: number,
  measureId: string,
  id: string,
  convention: UnitConvention = "us",
): Ingredient {
  return {
    id,
    food: clone(food),
    quantity,
    measureId,
    grams: resolveGrams(food, quantity, measureId, convention),
  };
}
export function formatNumber(value: number | null, decimals = 1): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", { maximumFractionDigits: decimals });
}
