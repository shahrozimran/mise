import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  appDataSchema,
  defaultPreferences,
  Food,
  mealIdeas,
  preferencesSchema,
  recipeFromIdea,
  recommendMeals,
} from "../src";
const foods: Food[] = JSON.parse(
  readFileSync(
    new URL("../../../apps/mobile/src/data/catalog.json", import.meta.url),
    "utf8",
  ),
);

describe("personalization and profile migration", () => {
  it("resolves every starter recipe from source-linked nutrition", () => {
    for (const idea of mealIdeas) {
      let n = 0;
      const recipe = recipeFromIdea(idea, foods, 4, () => `id${n++}`);
      assert.equal(recipe.ingredients.length, idea.ingredients.length);
      assert.equal(recipe.yieldGrams, null);
      assert.ok(recipe.ingredients.every((i) => i.food.sourceId));
    }
  });
  it("resizes a suggested recipe to the preferred portion count", () => {
    const recipe = recipeFromIdea(mealIdeas[0], foods, 5, () => "id");
    assert.equal(recipe.servings, 5);
    assert.equal(recipe.ingredients[0].grams, 750);
  });
  it("never recommends animal foods for a vegan profile", () => {
    const profile = { ...defaultPreferences(), diet: "vegan" as const };
    const result = recommendMeals(profile, foods);
    assert.ok(result.length);
    assert.ok(
      result.every(
        (r) =>
          r.idea.diets.includes("vegan") &&
          !r.idea.allergens.includes("milk") &&
          !r.idea.allergens.includes("eggs") &&
          !r.idea.allergens.includes("fish"),
      ),
    );
  });
  it("treats allergen exclusions as hard filters", () => {
    const profile = {
      ...defaultPreferences(),
      allergens: ["soy", "peanuts", "milk", "eggs", "fish", "gluten"] as const,
    };
    const result = recommendMeals(
      { ...profile, allergens: [...profile.allergens] },
      foods,
    );
    assert.ok(result.length);
    assert.ok(
      result.every(
        (r) =>
          !r.idea.allergens.some((a) => profile.allergens.includes(a as never)),
      ),
    );
  });
  it("excludes named ingredients and aliases", () => {
    const results = recommendMeals(
      { ...defaultPreferences(), avoidFoods: "chicken, lentils, tofu" },
      foods,
    );
    assert.ok(results.length);
    assert.ok(!results.some((r) => /chicken|lentil|tofu/i.test(r.idea.title)));
  });
  it("does not relax time or food restrictions to fill empty results", () => {
    assert.deepEqual(
      recommendMeals(
        {
          ...defaultPreferences(),
          avoidFoods: "rice, oats, potato, beans, chickpeas, lentils, tuna",
        },
        foods,
      ),
      [],
    );
  });
  it("honors the 15-minute filter", () => {
    assert.ok(
      recommendMeals({ ...defaultPreferences(), minutes: 15 }, foods).every(
        (r) => r.idea.minutes <= 15,
      ),
    );
  });
  it("changes ranking for protein and higher-energy goals", () => {
    const muscle = recommendMeals(
      { ...defaultPreferences(), goal: "muscle" },
      foods,
    );
    const gain = recommendMeals(
      { ...defaultPreferences(), goal: "gain" },
      foods,
    );
    assert.notEqual(muscle[0].idea.id, gain[0].idea.id);
  });
  it("does not mutate preferences while generating suggestions", () => {
    const profile = defaultPreferences();
    const copy = JSON.stringify(profile);
    recommendMeals(profile, foods);
    assert.equal(JSON.stringify(profile), copy);
  });
  it("validates stored profiles and optional first names", () => {
    assert.equal(
      preferencesSchema.parse(defaultPreferences()).completedAt,
      null,
    );
    assert.throws(() =>
      preferencesSchema.parse({ ...defaultPreferences(), servings: 0 }),
    );
  });
  it("adds profile defaults to older backups while retaining recipes", () => {
    const recipe = recipeFromIdea(mealIdeas[0], foods, 4, () => "legacy");
    const migrated = appDataSchema.parse({
      schemaVersion: 1,
      draft: recipe,
      recipes: [recipe],
      batches: [],
      customFoods: [],
      grocerySelection: {},
      groceryChecked: [],
      settings: { convention: "us" },
    });
    assert.equal(migrated.preferences, null);
    assert.equal(migrated.onboardingStep, 0);
    assert.equal(migrated.recipes[0].id, "legacy");
  });
});
