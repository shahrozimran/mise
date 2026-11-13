import { create } from "zustand";
import * as Crypto from "expo-crypto";
import {
  AppData,
  appDataSchema,
  clone,
  Food,
  FREE_RECIPE_LIMIT,
  Ingredient,
  makeIngredient,
  Recipe,
} from "@mise/domain";
import { foods } from "./catalog";
import { readState, writeState } from "./storage";

export const id = () => Crypto.randomUUID();
export function blankRecipe(): Recipe {
  return {
    id: id(),
    title: "Untitled dish",
    ingredients: [],
    servings: 4,
    yieldGrams: null,
    notes: "",
    updatedAt: new Date().toISOString(),
  };
}
export function exampleRecipe(): Recipe {
  const recipe = blankRecipe();
  recipe.title = "Chicken & rice bowls";
  recipe.servings = 5;
  recipe.yieldGrams = 2000;
  recipe.notes =
    "A sample batch to get you started. Adjust the ingredients to match your own cooking. Weigh the finished dish without the pot.";
  recipe.ingredients = [
    ["171077", 500],
    ["168877", 200],
    ["170000", 150],
    ["170457", 200],
    ["171413", 15],
    ["168462", 100],
  ]
    .map(([fdc, grams]) => {
      const food = foods.find((f) => f.sourceId === fdc);
      return food ? makeIngredient(food, Number(grams), "g", id()) : null;
    })
    .filter((i): i is Ingredient => i !== null);
  return recipe;
}
export function initialData(): AppData {
  return {
    schemaVersion: 1,
    draft: blankRecipe(),
    recipes: [],
    batches: [],
    customFoods: [],
    grocerySelection: {},
    groceryChecked: [],
    groceryList: null,
    pantryGrams: {},
    settings: { convention: "us" },
    preferences: null,
    onboardingStep: 0,
  };
}
interface State {
  data: AppData | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  hydrate: () => Promise<void>;
  commit: (change: (data: AppData) => AppData) => void;
  updateDraft: (change: Partial<Recipe>) => void;
  addIngredient: (item: Ingredient) => void;
  removeIngredient: (itemId: string) => void;
  saveRecipe: (pro: boolean) => void;
  loadRecipe: (recipe: Recipe) => void;
  deleteRecipe: (recipeId: string) => void;
  addCustomFood: (food: Food) => void;
  replaceData: (data: AppData) => Promise<void>;
}
let queue = Promise.resolve();
export const useKitchen = create<State>((set, get) => ({
  data: null,
  loading: true,
  error: null,
  saving: false,
  hydrate: async () => {
    try {
      const stored = await readState();
      const data: AppData = stored
        ? appDataSchema.parse(JSON.parse(stored))
        : initialData();
      if (!stored) await writeState(JSON.stringify(data));
      set({ data, loading: false, error: null });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Unable to read local data.",
        loading: false,
      });
    }
  },
  commit: (change) => {
    const current = get().data;
    if (!current) return;
    const data = appDataSchema.parse(change(current));
    set({ data, saving: true, error: null });
    const payload = JSON.stringify(data);
    queue = queue.catch(() => {}).then(() => writeState(payload));
    const pending = queue;
    void pending
      .then(() => {
        if (pending === queue) set({ saving: false });
      })
      .catch((error) =>
        set({
          saving: false,
          error: `Could not save: ${error.message}. Export a backup and retry.`,
        }),
      );
  },
  updateDraft: (change) =>
    get().commit((data) => ({
      ...data,
      draft: { ...data.draft, ...change, updatedAt: new Date().toISOString() },
    })),
  addIngredient: (item) =>
    get().updateDraft({
      ingredients: [...get().data!.draft.ingredients, item],
    }),
  removeIngredient: (itemId) =>
    get().updateDraft({
      ingredients: get().data!.draft.ingredients.filter((i) => i.id !== itemId),
    }),
  saveRecipe: (pro) => {
    const data = get().data!;
    if (!data.draft.ingredients.length)
      throw new Error("Add at least one ingredient before saving.");
    const existing = data.recipes.some((r) => r.id === data.draft.id);
    if (!existing && !pro && data.recipes.length >= FREE_RECIPE_LIMIT)
      throw new Error(
        "Your three free recipe slots are full. Delete a recipe or upgrade to Pro.",
      );
    get().commit((d) => ({
      ...d,
      recipes: existing
        ? d.recipes.map((r) => (r.id === d.draft.id ? clone(d.draft) : r))
        : [clone(d.draft), ...d.recipes],
    }));
  },
  loadRecipe: (recipe) => get().updateDraft(clone(recipe)),
  deleteRecipe: (recipeId) =>
    get().commit((data) => ({
      ...data,
      recipes: data.recipes.filter((r) => r.id !== recipeId),
    })),
  addCustomFood: (food) =>
    get().commit((data) => ({
      ...data,
      customFoods: [food, ...data.customFoods.filter((f) => f.id !== food.id)],
    })),
  replaceData: async (data) => {
    const parsed = appDataSchema.parse(data);
    await queue.catch(() => {});
    await writeState(JSON.stringify(parsed));
    set({ data: parsed, error: null });
  },
}));
