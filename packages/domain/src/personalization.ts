import { Allergen, Diet, Food, Goal, Preferences, Recipe } from "./types";
import { calculateRecipe, equalPortion, makeIngredient } from "./nutrition";
import { normalizeText } from "./parser";

export const goalOptions: {
  id: Goal;
  title: string;
  detail: string;
  color: string;
}[] = [
  {
    id: "lose",
    title: "Lose weight",
    detail: "Explore filling meals with plenty of vegetables.",
    color: "#253745",
  },
  {
    id: "gain",
    title: "Gain weight",
    detail: "Find hearty meals and easy energy-rich options.",
    color: "#253745",
  },
  {
    id: "muscle",
    title: "Build muscle",
    detail: "Put protein-rich meal ideas within easy reach.",
    color: "#253745",
  },
  {
    id: "balanced",
    title: "Eat more balanced",
    detail: "Enjoy a little more variety on your plate.",
    color: "#253745",
  },
  {
    id: "prep",
    title: "Make cooking easier",
    detail: "Simple recipes. Fewer last-minute decisions.",
    color: "#253745",
  },
];
export const dietOptions: { id: Diet; title: string; detail: string }[] = [
  {
    id: "any",
    title: "I eat a bit of everything",
    detail: "Plant foods, meat, fish, eggs, and dairy.",
  },
  {
    id: "vegetarian",
    title: "Vegetarian",
    detail: "Plant foods, eggs, and dairy. No meat or fish.",
  },
  {
    id: "vegan",
    title: "Plant-based / vegan",
    detail: "Plant foods, without meat, eggs, or dairy.",
  },
  {
    id: "pescatarian",
    title: "Pescatarian",
    detail: "Plant foods, fish, eggs, and dairy. No meat.",
  },
];
export const allergenOptions: { id: Allergen; title: string }[] = [
  { id: "milk", title: "Milk / dairy" },
  { id: "eggs", title: "Eggs" },
  { id: "peanuts", title: "Peanuts" },
  { id: "tree-nuts", title: "Tree nuts" },
  { id: "soy", title: "Soy" },
  { id: "gluten", title: "Wheat / gluten" },
  { id: "fish", title: "Fish" },
  { id: "shellfish", title: "Shellfish" },
  { id: "sesame", title: "Sesame" },
];
export function defaultPreferences(): Preferences {
  return {
    goal: "balanced",
    diet: "any",
    allergens: [],
    avoidFoods: "",
    minutes: 30,
    servings: 4,
    experience: "new",
    name: "",
    completedAt: null,
  };
}
export interface MealIdea {
  id: string;
  title: string;
  description: string;
  minutes: number;
  diets: Diet[];
  allergens: Allergen[];
  ingredients: [string, number][];
  steps: string[];
  art: "chicken" | "plant" | "oats" | "fish" | "egg";
}
const plant: Diet[] = ["any", "vegetarian", "vegan", "pescatarian"];
const veggie: Diet[] = ["any", "vegetarian", "pescatarian"];
export const mealIdeas: MealIdea[] = [
  {
    id: "chicken-rice",
    title: "Chicken & rice bowls",
    description: "A familiar favorite with a colorful side of vegetables.",
    minutes: 30,
    diets: ["any"],
    allergens: [],
    art: "chicken",
    ingredients: [
      ["171077", 150],
      ["168877", 55],
      ["170379", 100],
      ["170000", 40],
      ["171413", 5],
    ],
    steps: [
      "Cook the dry rice according to its package instructions.",
      "Cook chicken with the onion and oil. Check that the chicken reaches 74°C / 165°F with a food thermometer.",
      "Cook the broccoli, combine, and divide into your chosen portions.",
    ],
  },
  {
    id: "lentil-pot",
    title: "One-pot lentils & rice",
    description: "A comforting pot of pantry staples and leafy greens.",
    minutes: 30,
    diets: plant,
    allergens: [],
    art: "plant",
    ingredients: [
      ["172420", 65],
      ["168877", 40],
      ["168462", 80],
      ["170457", 100],
      ["171413", 5],
    ],
    steps: [
      "Rinse the dry lentils and rice. Simmer in water until fully tender; follow package cooking instructions.",
      "Stir in chopped tomato, spinach, and oil; cook until the greens soften.",
      "Add seasoning to taste, recording any additions, and divide into portions.",
    ],
  },
  {
    id: "chickpea-bowl",
    title: "15-minute chickpea bowl",
    description: "A quick mix using canned chickpeas and already-cooked rice.",
    minutes: 15,
    diets: plant,
    allergens: [],
    art: "plant",
    ingredients: [
      ["173800", 150],
      ["168878", 100],
      ["170457", 100],
      ["168462", 40],
      ["171413", 5],
    ],
    steps: [
      "Drain the chickpeas and weigh the drained amount.",
      "Toss with tomato, spinach, and oil. Serve with safely stored, cooked rice.",
      "Divide into portions. Add and record any dressing you choose.",
    ],
  },
  {
    id: "tofu-rice",
    title: "Tofu & greens bowl",
    description: "Golden tofu, fluffy rice, and a generous handful of greens.",
    minutes: 30,
    diets: plant,
    allergens: ["soy"],
    art: "plant",
    ingredients: [
      ["172475", 180],
      ["168877", 45],
      ["168462", 100],
      ["170457", 80],
      ["171413", 5],
    ],
    steps: [
      "Cook the dry rice following the package instructions.",
      "Pan-cook the tofu in oil, then add tomato and spinach.",
      "Combine with the rice and divide into portions. Record any sauce you add.",
    ],
  },
  {
    id: "egg-potato",
    title: "Egg & potato skillet",
    description: "Everyday ingredients, all in one cozy pan.",
    minutes: 30,
    diets: veggie,
    allergens: ["eggs"],
    art: "egg",
    ingredients: [
      ["171287", 150],
      ["170026", 150],
      ["168462", 80],
      ["170000", 40],
      ["171413", 5],
    ],
    steps: [
      "Dice and cook the potatoes and onion until tender.",
      "Add spinach, then the eggs. Cook until the eggs are set throughout.",
      "Divide the skillet into portions and add any extra ingredients to your recipe.",
    ],
  },
  {
    id: "yogurt-oats",
    title: "Banana yogurt oats",
    description: "A make-ahead breakfast with a naturally creamy finish.",
    minutes: 15,
    diets: veggie,
    allergens: ["milk", "gluten"],
    art: "oats",
    ingredients: [
      ["169705", 50],
      ["171284", 170],
      ["173944", 100],
    ],
    steps: [
      "Mix oats and yogurt. Add water for your preferred texture and record its weight if measuring yield.",
      "Cover and refrigerate overnight, or cook the oats first following the package instructions and let them cool.",
      "Add sliced banana before serving. Check your oat label if avoiding gluten.",
    ],
  },
  {
    id: "peanut-oats",
    title: "Peanut & banana oats",
    description: "A hearty breakfast with an easy spoonful of peanut butter.",
    minutes: 15,
    diets: plant,
    allergens: ["peanuts", "gluten"],
    art: "oats",
    ingredients: [
      ["169705", 75],
      ["172470", 35],
      ["173944", 120],
    ],
    steps: [
      "Cook oats in water following the package instructions.",
      "Stir in the peanut butter and sliced banana.",
      "Add water to your preferred texture. Record any milk or other additions.",
    ],
  },
  {
    id: "tuna-beans",
    title: "Tuna & white bean bowl",
    description: "A no-fuss lunch made with drained canned staples.",
    minutes: 15,
    diets: ["any", "pescatarian"],
    allergens: ["fish"],
    art: "fish",
    ingredients: [
      ["171986", 120],
      ["175204", 130],
      ["170457", 100],
      ["168462", 50],
      ["171413", 8],
    ],
    steps: [
      "Drain and weigh the tuna. Prepare the canned beans as directed on the label.",
      "Combine with tomato and spinach, then toss with oil.",
      "Divide into portions. Record any dressing or extra ingredients.",
    ],
  },
  {
    id: "chicken-greens",
    title: "Chicken & vegetable skillet",
    description: "A colorful, vegetable-forward meal for a simple evening.",
    minutes: 30,
    diets: ["any"],
    allergens: [],
    art: "chicken",
    ingredients: [
      ["171077", 160],
      ["170379", 160],
      ["170026", 100],
      ["170457", 100],
      ["171413", 5],
    ],
    steps: [
      "Cook the diced potato until tender.",
      "Cook the chicken in oil; check for 74°C / 165°F internally using a food thermometer.",
      "Cook the broccoli and tomato, then combine and divide into portions.",
    ],
  },
];
export function recipeFromIdea(
  idea: MealIdea,
  foods: Food[],
  servings: number,
  newId: () => string,
): Recipe {
  if (!Number.isInteger(servings) || servings < 1 || servings > 12)
    throw new Error("Choose between 1 and 12 portions.");
  return {
    id: newId(),
    title: idea.title,
    servings,
    yieldGrams: null,
    updatedAt: new Date().toISOString(),
    ingredients: idea.ingredients.map(([fdcId, grams]) => {
      const food = foods.find((f) => f.sourceId === fdcId);
      if (!food) throw new Error("This meal idea is missing a catalog food.");
      return makeIngredient(food, grams * servings, "g", newId());
    }),
    notes: idea.steps
      .map((step, index) => `${index + 1}. ${step}`)
      .join("\n\n"),
  };
}
export function recommendMeals(preferences: Preferences, foods: Food[]) {
  const avoids = preferences.avoidFoods
    .split(/[,;\n]/)
    .map(normalizeText)
    .filter(Boolean);
  return mealIdeas
    .flatMap((idea) => {
      // Dietary choices and exclusions are hard filters. Never fill empty results with incompatible foods.
      if (
        !idea.diets.includes(preferences.diet) ||
        idea.minutes > preferences.minutes ||
        idea.allergens.some((a) => preferences.allergens.includes(a))
      )
        return [];
      const ingredients = idea.ingredients.map(([foodId]) =>
        foods.find((f) => f.sourceId === foodId),
      );
      if (ingredients.some((f) => !f)) return [];
      const names = [
        idea.title,
        ...ingredients.flatMap((f) => [f!.name, ...f!.aliases]),
      ]
        .map(normalizeText)
        .join(" ");
      if (avoids.some((word) => names.includes(word))) return [];
      let n = 0;
      const recipe = recipeFromIdea(
        idea,
        foods,
        1,
        () => `recommend-${idea.id}-${n++}`,
      );
      const nutrients = equalPortion(recipe);
      const vegetables =
        recipe.ingredients
          .filter((i) => /vegetable/i.test(i.food.category))
          .reduce((sum, i) => sum + i.grams, 0) /
        calculateRecipe(recipe).ingredientGrams;
      let score = 50 - idea.minutes / 3;
      if (preferences.experience === "new")
        score += Math.max(0, 6 - idea.ingredients.length) * 2;
      if (preferences.goal === "lose")
        score +=
          vegetables * 50 +
          (nutrients.protein ?? 0) / 3 -
          (nutrients.kcal ?? 0) / 100;
      if (preferences.goal === "gain") score += (nutrients.kcal ?? 0) / 20;
      if (preferences.goal === "muscle") score += (nutrients.protein ?? 0) * 2;
      if (preferences.goal === "balanced")
        score += vegetables * 30 + (nutrients.fiber ?? 0);
      if (preferences.goal === "prep")
        score += 40 - idea.ingredients.length * 3;
      const reason =
        preferences.goal === "muscle"
          ? `${Math.round(nutrients.protein ?? 0)} g protein per portion`
          : preferences.goal === "gain"
            ? "A hearty option for your goal"
            : preferences.goal === "lose"
              ? vegetables > 0.1
                ? "A filling idea with vegetables"
                : "A simple meal idea for your goal"
              : preferences.goal === "prep"
                ? `${idea.ingredients.length} everyday ingredients`
                : "A little variety for your plate";
      return [{ idea, nutrients, score, reason }];
    })
    .sort((a, b) => b.score - a.score || a.idea.id.localeCompare(b.idea.id));
}
