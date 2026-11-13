export const nutrientKeys = [
  "kcal",
  "protein",
  "carbs",
  "fat",
  "fiber",
] as const;
export type NutrientKey = (typeof nutrientKeys)[number];
export type Nutrients = Record<NutrientKey, number | null>;
export type UnitConvention = "us" | "metric";
export interface FoodMeasure {
  id: string;
  label: string;
  unit: string;
  amount: number;
  grams: number;
  convention?: UnitConvention;
}
export interface Food {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  state: string;
  nutrients: Nutrients;
  measures: FoodMeasure[];
  source: "USDA SR Legacy" | "USDA FoodData Central" | "Custom";
  sourceId: string;
  sourceVersion: string;
  barcode?: string;
}
export interface Ingredient {
  id: string;
  food: Food;
  quantity: number;
  measureId: string;
  grams: number;
  originalText?: string;
}
export interface Recipe {
  id: string;
  title: string;
  ingredients: Ingredient[];
  servings: number;
  yieldGrams: number | null;
  notes: string;
  updatedAt: string;
}
export interface Batch {
  id: string;
  recipe: Recipe;
  createdAt: string;
}
export interface NutritionResult {
  totals: Nutrients;
  known: Record<NutrientKey, number>;
  missing: Record<NutrientKey, number>;
  ingredientGrams: number;
}
export interface GroceryItem {
  foodId: string;
  name: string;
  grams: number;
  category: string;
}
export interface ParsedLine {
  id: string;
  original: string;
  name: string;
  quantity: number | null;
  unit: string;
  issue: string | null;
  candidates: Food[];
  food: Food | null;
  measureId: string | null;
}
export interface Settings {
  convention: UnitConvention;
}
export type Goal = "lose" | "gain" | "muscle" | "balanced" | "prep";
export type Diet = "any" | "vegetarian" | "vegan" | "pescatarian";
export type Allergen =
  | "milk"
  | "eggs"
  | "peanuts"
  | "tree-nuts"
  | "soy"
  | "gluten"
  | "fish"
  | "shellfish"
  | "sesame";
export interface Preferences {
  goal: Goal;
  diet: Diet;
  allergens: Allergen[];
  avoidFoods: string;
  minutes: 15 | 30 | 45;
  servings: number;
  experience: "new" | "comfortable";
  name: string;
  completedAt: string | null;
}
export interface AppData {
  schemaVersion: 1;
  draft: Recipe;
  recipes: Recipe[];
  batches: Batch[];
  customFoods: Food[];
  grocerySelection: Record<string, number>;
  groceryChecked: string[];
  groceryList: { items: GroceryItem[]; createdAt: string } | null;
  pantryGrams: Record<string, number>;
  settings: Settings;
  preferences: Preferences | null;
  onboardingStep: number;
}
export const FREE_RECIPE_LIMIT = 3;
export const massMeasures: FoodMeasure[] = [
  { id: "g", label: "grams", unit: "g", amount: 1, grams: 1 },
  { id: "kg", label: "kilograms", unit: "kg", amount: 1, grams: 1000 },
  { id: "oz", label: "ounces", unit: "oz", amount: 1, grams: 28.349523125 },
  { id: "lb", label: "pounds", unit: "lb", amount: 1, grams: 453.59237 },
];
export const emptyNutrients = (): Nutrients => ({
  kcal: null,
  protein: null,
  carbs: null,
  fat: null,
  fiber: null,
});
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export function newId(): string {
  // Device and server IDs are generated with crypto; this fallback is for ephemeral domain/parser rows.
  return `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
