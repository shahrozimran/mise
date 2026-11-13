import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  aggregateGroceries,
  appDataSchema,
  availableMeasures,
  calculateRecipe,
  clone,
  equalPortion,
  escapeHtml,
  Food,
  foodSchema,
  importBackup,
  makeIngredient,
  parseIngredientLine,
  parseQuantity,
  parseRecipeText,
  purchaseNeeded,
  Recipe,
  resolveGrams,
  scaleRecipe,
  searchFoods,
  weighedPortion,
} from "../src";

const foods: Food[] = JSON.parse(
  readFileSync(
    new URL("../../../apps/mobile/src/data/catalog.json", import.meta.url),
    "utf8",
  ),
);
const chicken = foods.find((f) => f.sourceId === "171077")!;
const onion = foods.find((f) => f.sourceId === "170000")!;
function recipe(): Recipe {
  return {
    id: "r1",
    title: "A batch",
    ingredients: [makeIngredient(chicken, 500, "g", "i1")],
    servings: 5,
    yieldGrams: 2000,
    notes: "",
    updatedAt: new Date().toISOString(),
  };
}

describe("source catalog", () => {
  it("contains 7,793 valid source-linked foods", () => {
    assert.equal(foods.length, 7793);
    for (const food of foods) foodSchema.parse(food);
  });
  it("preserves actual raw chicken nutrition rather than a display fixture", () => {
    assert.equal(chicken.nutrients.kcal, 120);
    assert.equal(chicken.nutrients.protein, 22.5);
  });
  it("keeps raw and cooked rice as distinct records", () => {
    assert.notEqual(
      foods.find((f) => f.sourceId === "168877")!.nutrients.kcal,
      foods.find((f) => f.sourceId === "168878")!.nutrients.kcal,
    );
  });
});
describe("measurement resolution", () => {
  it("converts kg and ounces using mass factors", () => {
    assert.equal(resolveGrams(chicken, 0.5, "kg"), 500);
    assert.ok(Math.abs(resolveGrams(chicken, 1, "oz") - 28.349523125) < 1e-9);
  });
  it("uses the food measure amount as its divisor", () => {
    const food = {
      ...onion,
      measures: [
        { id: "half", amount: 0.5, grams: 80, label: "cup", unit: "cup" },
      ],
    };
    assert.equal(resolveGrams(food, 1.5, "half"), 240);
  });
  it("refuses unknown measures rather than assuming density", () => {
    assert.throws(() => resolveGrams(chicken, 1, "invented-cup"));
  });
  it("does not offer US cups in metric mode", () => {
    assert.ok(
      !availableMeasures(onion, "metric").some((m) => m.convention === "us"),
    );
  });
  for (const input of [0, -1, NaN, Infinity])
    it(`rejects invalid quantity ${input}`, () => {
      assert.throws(() => resolveGrams(chicken, input, "g"));
    });
  it("snapshots food data without retaining a mutable reference", () => {
    const food = clone(chicken);
    const item = makeIngredient(food, 100, "g", "i");
    food.nutrients.kcal = 999;
    assert.equal(item.food.nutrients.kcal, 120);
  });
});
describe("nutrition and cooked portions", () => {
  it("calculates per-100-g values without rounding ingredients", () => {
    const r = recipe();
    r.ingredients[0].grams = 123.45;
    assert.equal(calculateRecipe(r).totals.kcal, 148.14);
  });
  it("changes density while preserving batch and equal-container calories", () => {
    const r = recipe();
    assert.equal(calculateRecipe(r).totals.kcal, 600);
    assert.equal(equalPortion(r).kcal, 120);
    assert.equal(weighedPortion(r, 250).kcal, 75);
    r.yieldGrams = 1600;
    assert.equal(calculateRecipe(r).totals.kcal, 600);
    assert.equal(equalPortion(r).kcal, 120);
    assert.equal(weighedPortion(r, 250).kcal, 93.75);
  });
  it("handles the plan arithmetic fixture exactly", () => {
    const r = recipe();
    r.ingredients[0].grams = 100;
    r.ingredients[0].food.nutrients = {
      kcal: 2000,
      protein: 160,
      carbs: 200,
      fat: 60,
      fiber: 24,
    };
    assert.deepEqual(equalPortion(r), {
      kcal: 400,
      protein: 32,
      carbs: 40,
      fat: 12,
      fiber: 4.800000000000001,
    });
    assert.deepEqual(weighedPortion(r, 250), {
      kcal: 250,
      protein: 20,
      carbs: 25,
      fat: 7.5,
      fiber: 3,
    });
  });
  it("tracks unknown nutrients separately from known subtotals", () => {
    const r = recipe();
    r.ingredients.push(makeIngredient(onion, 100, "g", "i2"));
    r.ingredients[1].food.nutrients.fiber = null;
    const value = calculateRecipe(r);
    assert.equal(value.totals.fiber, null);
    assert.equal(value.missing.fiber, 1);
    assert.notEqual(value.totals.kcal, null);
  });
  it("requires a measured yield for weighed portions", () => {
    const r = recipe();
    r.yieldGrams = null;
    assert.throws(() => weighedPortion(r, 100));
    assert.equal(equalPortion(r).kcal, 120);
  });
  it("rejects a portion larger than the cooked batch", () => {
    assert.throws(() => weighedPortion(recipe(), 2001));
  });
  it("rejects fractional containers and zero cooked yield", () => {
    const r = recipe();
    r.servings = 1.5;
    assert.throws(() => calculateRecipe(r));
    r.servings = 5;
    r.yieldGrams = 0;
    assert.throws(() => calculateRecipe(r));
  });
});
describe("paste parser and search", () => {
  it("requires a size for unspecified pieces instead of choosing a jumbo egg", () =>
    assert.ok(parseIngredientLine("3 eggs", foods).issue));
  it("uses a preparation-specific cup when chopped is specified", () => {
    const row = parseIngredientLine("1 cup chopped onion", foods);
    assert.match(
      row.food!.measures.find((m) => m.id === row.measureId)!.label,
      /chopped/,
    );
  });
  for (const [input, expected] of [
    ["1½", 1.5],
    ["½", 0.5],
    ["1 1/4", 1.25],
    ["3/4", 0.75],
    ["2.5", 2.5],
  ] as const)
    it(`reads ${input}`, () => assert.equal(parseQuantity(input), expected));
  for (const input of ["0", "-1", "1/0", "1-2", "", "NaN"])
    it(`refuses ambiguous/invalid quantity ${input}`, () =>
      assert.equal(parseQuantity(input), null));
  it("finds exact curated chicken ahead of branded/prepared matches", () =>
    assert.equal(searchFoods(foods, "chicken")[0].id, chicken.id));
  it("parses mass without whitespace", () => {
    const row = parseIngredientLine("500g chicken breast", foods);
    assert.equal(row.quantity, 500);
    assert.equal(row.measureId, "g");
    assert.equal(row.food?.id, chicken.id);
  });
  it("parses unicode mixed quantities", () => {
    const row = parseIngredientLine("1½ cups chopped onion", foods);
    assert.equal(row.quantity, 1.5);
    assert.equal(row.unit, "cup");
    assert.ok(row.measureId);
  });
  for (const line of [
    "2–3 cloves garlic",
    "salt to taste",
    "1 can (400 g) chickpeas, drained",
    "100 g chicken or tofu",
    "heat the oil until hot",
  ])
    it(`requires review for ${line}`, () =>
      assert.ok(parseIngredientLine(line, foods).issue));
  it("caps paste size", () =>
    assert.throws(() => parseRecipeText("x".repeat(50001), foods)));
});
describe("planning and portable data", () => {
  it("scales per-serving targets and clears old measured yield", () => {
    const scaled = scaleRecipe(recipe(), 240, "serving");
    assert.equal(scaled.ingredients[0].grams, 1000);
    assert.equal(equalPortion(scaled).kcal, 240);
    assert.equal(scaled.yieldGrams, null);
  });
  it("blocks scaling when calories are incomplete", () => {
    const r = recipe();
    r.ingredients[0].food.nutrients.kcal = null;
    assert.throws(() => scaleRecipe(r, 500));
  });
  it("aggregates same food identity across multipliers", () => {
    const a = recipe();
    const b = recipe();
    b.ingredients[0].grams = 300;
    assert.equal(
      aggregateGroceries([
        { recipe: a, batches: 1 },
        { recipe: b, batches: 2 },
      ])[0].grams,
      1100,
    );
  });
  it("keeps distinct purchase states separate", () => {
    const a = recipe();
    const b = recipe();
    b.ingredients[0].food.id = "cooked-chicken";
    assert.equal(
      aggregateGroceries([
        { recipe: a, batches: 1 },
        { recipe: b, batches: 1 },
      ]).length,
      2,
    );
  });
  it("clamps pantry subtraction at zero", () =>
    assert.equal(purchaseNeeded(100, 120), 0));
  it("rejects hostile/malformed backups", () => {
    assert.throws(() => importBackup('{"schemaVersion":999}'));
    assert.throws(() => importBackup("x".repeat(25 * 1024 * 1024 + 1)));
  });
  it("strips unrecognized entitlement claims on import", () => {
    const data = appDataSchema.parse({
      schemaVersion: 1,
      draft: recipe(),
      recipes: [],
      batches: [],
      customFoods: [],
      grocerySelection: {},
      groceryChecked: [],
      settings: { convention: "us" },
      pro: true,
    });
    assert.equal("pro" in data, false);
  });
  it("escapes recipe text for PDF HTML", () =>
    assert.equal(escapeHtml('<script>"&'), "&lt;script&gt;&quot;&amp;"));
});
