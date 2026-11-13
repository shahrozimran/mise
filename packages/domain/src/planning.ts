import { calculateRecipe, positive } from "./nutrition";
import { clone, GroceryItem, Recipe } from "./types";

export function scaleRecipe(
  recipe: Recipe,
  targetKcal: number,
  mode: "batch" | "serving" = "serving",
): Recipe {
  positive(targetKcal, "Calorie target");
  const calories = calculateRecipe(recipe).totals.kcal;
  if (calories === null || calories <= 0)
    throw new Error("Complete calorie data is needed to scale this recipe.");
  const factor =
    (targetKcal * (mode === "serving" ? recipe.servings : 1)) / calories;
  return {
    ...clone(recipe),
    title: `${recipe.title} · scaled`.slice(0, 200),
    ingredients: recipe.ingredients.map((i) => ({
      ...clone(i),
      quantity: i.quantity * factor,
      grams: i.grams * factor,
    })),
    // Actual yield must be measured again; it is not a linear cooking guarantee.
    yieldGrams: null,
    updatedAt: new Date().toISOString(),
  };
}
export function aggregateGroceries(
  selections: { recipe: Recipe; batches: number }[],
): GroceryItem[] {
  const map = new Map<string, GroceryItem>();
  for (const { recipe, batches } of selections) {
    positive(batches, "Batch multiplier");
    for (const item of recipe.ingredients) {
      const key = item.food.id; // Canonical ID preserves cooked/raw and product distinctions.
      const current = map.get(key) ?? {
        foodId: key,
        name: item.food.name,
        grams: 0,
        category: item.food.category,
      };
      current.grams += positive(item.grams, "Ingredient weight") * batches;
      map.set(key, current);
    }
  }
  return [...map.values()].sort(
    (a, b) =>
      a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  );
}
export function purchaseNeeded(
  requiredGrams: number,
  pantryGrams: number,
): number {
  if (![requiredGrams, pantryGrams].every((v) => Number.isFinite(v) && v >= 0))
    throw new Error("Weights cannot be negative.");
  return Math.max(0, requiredGrams - pantryGrams);
}
export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
}
