import { availableMeasures } from "./nutrition";
import { Food, newId, ParsedLine, UnitConvention } from "./types";

const fractions: Record<string, string> = {
  "¼": " 1/4",
  "½": " 1/2",
  "¾": " 3/4",
  "⅓": " 1/3",
  "⅔": " 2/3",
  "⅛": " 1/8",
  "⅜": " 3/8",
  "⅝": " 5/8",
  "⅞": " 7/8",
};
const units: Record<string, string> = {
  g: "g",
  gram: "g",
  grams: "g",
  kg: "kg",
  kilogram: "kg",
  kilograms: "kg",
  oz: "oz",
  ounce: "oz",
  ounces: "oz",
  lb: "lb",
  lbs: "lb",
  pound: "lb",
  pounds: "lb",
  cup: "cup",
  cups: "cup",
  tbsp: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tsp: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  ml: "ml",
  milliliter: "ml",
  milliliters: "ml",
  piece: "piece",
  pieces: "piece",
  clove: "clove",
  cloves: "clove",
  medium: "medium",
  large: "large",
  small: "small",
};
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export function searchFoods(foods: Food[], query: string, limit = 30): Food[] {
  const q = normalizeText(query);
  if (!q) return foods.slice(0, limit);
  const tokens = q.split(" ").filter(Boolean);
  return foods
    .map((food) => {
      const name = normalizeText(food.name);
      const aliases = food.aliases.map(normalizeText);
      const hay = `${name} ${aliases.join(" ")}`;
      if (!tokens.every((t) => hay.includes(t))) return { food, score: 0 };
      let score =
        10 +
        (name === q || aliases.includes(q) ? 100 : 0) +
        (name.startsWith(q) ? 20 : 0);
      if (food.state === "raw" && !/cooked|boiled|roast|fried/.test(q))
        score += 5;
      score -= name.length / 500;
      return { food, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.food);
}
export function parseQuantity(raw: string): number | null {
  const normalized = raw.replace(/[¼½¾⅓⅔⅛⅜⅝⅞]/g, (c) => fractions[c]).trim();
  if (!/^(?:\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)$/.test(normalized))
    return null;
  const value = normalized.split(/\s+/).reduce((sum, token) => {
    if (!token.includes("/")) return sum + Number(token);
    const [n, d] = token.split("/").map(Number);
    return sum + n / d;
  }, 0);
  return Number.isFinite(value) && value > 0 ? value : null;
}
export function parseIngredientLine(
  original: string,
  foods: Food[],
  convention: UnitConvention = "us",
): ParsedLine {
  let line = original
    .trim()
    .replace(/^[•*\-]\s*/, "")
    .replace(/[¼½¾⅓⅔⅛⅜⅝⅞]/g, (c) => fractions[c]);
  let issue: string | null = null;
  if (
    /\b(or|to taste|as needed|handful|bunch|heaped|can|cans|packet|package|pinch)\b/i.test(
      line,
    )
  )
    issue =
      "Confirm the amount or alternative; package and drained weights can differ.";
  if (/\d\s*[–—-]\s*\d/.test(line))
    issue = "Choose a quantity from this range.";
  const quantityMatch = line.match(
    /^(\d+(?:\.\d+)?\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)(?:\s*|$)/,
  );
  const quantity = quantityMatch ? parseQuantity(quantityMatch[1]) : null;
  if (quantityMatch) line = line.slice(quantityMatch[0].length).trim();
  const first = line.match(/^([a-z]+)\.?\s*/i);
  let unit = (first && units[first[1].toLowerCase()]) || "piece";
  if (first && units[first[1].toLowerCase()])
    line = line.slice(first[0].length);
  if (quantity === null) issue = issue ?? "Enter a quantity.";
  const preparation = line
    .match(/\b(chopped|diced|sliced|minced|packed|grated|mashed)\b/i)?.[1]
    .toLowerCase();
  const name = line
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(finely|chopped|diced|sliced|minced|fresh|of)\b/gi, " ")
    .replace(/[,;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Singularization is intentionally conservative; fuzzy guesses always remain reviewable.
  let candidates = searchFoods(foods, name, 5);
  if (!candidates.length)
    candidates = searchFoods(
      foods,
      name.replace(/\beggs\b/gi, "egg").replace(/\bonions\b/gi, "onion"),
      5,
    );
  const food = candidates[0] ?? null;
  const measures = food ? availableMeasures(food, convention) : [];
  const matchingMeasures = measures.filter(
    (m) => m.id === unit || m.unit === unit || normalizeText(m.label) === unit,
  );
  const isVolume = ["cup", "tbsp", "tsp", "ml"].includes(unit);
  const measure =
    isVolume && preparation
      ? matchingMeasures.find((m) =>
          normalizeText(m.label).includes(preparation),
        )
      : matchingMeasures[0];
  if (unit === "piece")
    issue =
      issue ??
      "Choose the actual piece size or portion measure, or enter grams.";
  if (isVolume && !preparation && matchingMeasures.length > 1)
    issue = issue ?? "Choose the preparation-specific household measure.";
  if (!food) issue = issue ?? "Choose a matching food.";
  if (!measure)
    issue = issue ?? "No verified conversion. Choose a measure or enter grams.";
  unit = unit || "piece";
  return {
    id: newId(),
    original,
    name,
    quantity,
    unit,
    issue,
    candidates,
    food,
    measureId: measure?.id ?? null,
  };
}
export function parseRecipeText(
  text: string,
  foods: Food[],
  convention: UnitConvention = "us",
): ParsedLine[] {
  if (text.length > 50000)
    throw new Error("Paste up to 50,000 characters at a time.");
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(
      (l) =>
        l && !/^(ingredients|directions|instructions|method)\s*: ?$/i.test(l),
    )
    .slice(0, 150)
    .map((line) => parseIngredientLine(line, foods, convention));
}
