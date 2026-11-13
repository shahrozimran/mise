import { z } from "zod";
const value = z.number().finite().nonnegative().nullable();
export const nutrientsSchema = z.object({
  kcal: value,
  protein: value,
  carbs: value,
  fat: value,
  fiber: value,
});
export const foodSchema = z.object({
  id: z.string().min(1).max(150),
  name: z.string().min(1).max(300),
  aliases: z.array(z.string().max(300)).max(30),
  category: z.string().max(200),
  state: z.string().max(100),
  nutrients: nutrientsSchema,
  measures: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1).max(200),
        unit: z.string().max(30),
        amount: z.number().finite().positive(),
        grams: z.number().finite().positive(),
        convention: z.enum(["us", "metric"]).optional(),
      }),
    )
    .max(100),
  source: z.enum(["USDA SR Legacy", "USDA FoodData Central", "Custom"]),
  sourceId: z.string(),
  sourceVersion: z.string(),
  barcode: z.string().optional(),
});
export const recipeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  ingredients: z
    .array(
      z.object({
        id: z.string().min(1),
        food: foodSchema,
        quantity: z.number().finite().positive(),
        measureId: z.string(),
        grams: z.number().finite().positive(),
        originalText: z.string().optional(),
      }),
    )
    .max(300),
  servings: z.number().int().min(1).max(10000),
  yieldGrams: z.number().finite().positive().nullable(),
  notes: z.string().max(20000),
  updatedAt: z.iso.datetime(),
});
export const preferencesSchema = z.object({
  goal: z.enum(["lose", "gain", "muscle", "balanced", "prep"]),
  diet: z.enum(["any", "vegetarian", "vegan", "pescatarian"]),
  allergens: z
    .array(
      z.enum([
        "milk",
        "eggs",
        "peanuts",
        "tree-nuts",
        "soy",
        "gluten",
        "fish",
        "shellfish",
        "sesame",
      ]),
    )
    .max(9),
  avoidFoods: z.string().max(500),
  minutes: z.union([z.literal(15), z.literal(30), z.literal(45)]),
  servings: z.number().int().min(1).max(12),
  experience: z.enum(["new", "comfortable"]),
  name: z.string().max(40),
  completedAt: z.iso.datetime().nullable(),
});
export const appDataSchema = z.object({
  schemaVersion: z.literal(1),
  draft: recipeSchema,
  recipes: z.array(recipeSchema).max(10000),
  batches: z
    .array(
      z.object({
        id: z.string(),
        recipe: recipeSchema,
        createdAt: z.iso.datetime(),
      }),
    )
    .max(10000),
  customFoods: z.array(foodSchema).max(10000),
  grocerySelection: z.record(
    z.string(),
    z.number().finite().positive().max(10000),
  ),
  groceryChecked: z.array(z.string()).max(10000),
  groceryList: z
    .object({
      items: z
        .array(
          z.object({
            foodId: z.string(),
            name: z.string(),
            grams: z.number().finite().positive(),
            category: z.string(),
          }),
        )
        .max(10000),
      createdAt: z.iso.datetime(),
    })
    .nullable()
    .default(null),
  pantryGrams: z
    .record(z.string(), z.number().finite().nonnegative())
    .default({}),
  settings: z.object({ convention: z.enum(["us", "metric"]) }),
  preferences: preferencesSchema.nullable().default(null),
  onboardingStep: z.number().int().min(0).max(4).default(0),
});
export function importBackup(json: string) {
  if (json.length > 25 * 1024 * 1024)
    throw new Error("Backup must be smaller than 25 MB.");
  return appDataSchema.parse(JSON.parse(json));
}
