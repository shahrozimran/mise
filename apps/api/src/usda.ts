import type { Food, FoodMeasure, Nutrients } from "@mise/domain";

interface NutrientEntry {
  nutrient?: { id: number; unitName?: string };
  nutrientId?: number;
  unitName?: string;
  amount?: number;
  value?: number;
}
interface RawFood {
  fdcId: number;
  description: string;
  dataType?: string;
  publicationDate?: string;
  gtinUpc?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodCategory?: { description?: string };
  foodNutrients?: NutrientEntry[];
  foodPortions?: {
    id?: number;
    amount: number;
    gramWeight: number;
    modifier?: string;
    portionDescription?: string;
    measureUnit?: { name?: string };
  }[];
}
export function normalizeFood(raw: RawFood): Food {
  if (!Number.isInteger(raw.fdcId) || !raw.description)
    throw new Error("Invalid USDA food record.");
  const list = raw.foodNutrients ?? [];
  function nutrient(ids: number[], unit: string): number | null {
    for (const id of ids) {
      const row = list.find(
        (n) =>
          (n.nutrient?.id ?? n.nutrientId) === id &&
          (n.nutrient?.unitName ?? n.unitName ?? "").toLowerCase() === unit,
      );
      const value = row?.amount ?? row?.value;
      if (typeof value === "number" && Number.isFinite(value) && value >= 0)
        return value;
    }
    return null;
  }
  // FDC normalizes foodNutrients to 100 g. Never use labelNutrients (per-serving values) here.
  // Reject ml-serving branded products without a mass basis rather than inventing liquid density.
  if (
    raw.dataType === "Branded" &&
    raw.servingSizeUnit?.toLowerCase() === "ml"
  ) {
    throw new Error(
      "This liquid product needs a verified gram basis. Add it as a custom food using its label and measured mass.",
    );
  }
  const nutrients: Nutrients = {
    kcal: nutrient([1008, 2048, 2047], "kcal"),
    protein: nutrient([1003], "g"),
    carbs: nutrient([1005], "g"),
    fat: nutrient([1004], "g"),
    fiber: nutrient([1079], "g"),
  };
  const measures: FoodMeasure[] = (raw.foodPortions ?? [])
    .filter((p) => p.amount > 0 && p.gramWeight > 0)
    .map((p, index) => {
      const label =
        p.portionDescription ||
        [
          p.measureUnit?.name === "undetermined" ? "" : p.measureUnit?.name,
          p.modifier,
        ]
          .filter(Boolean)
          .join(" ") ||
        "portion";
      const unit = /cup/i.test(label)
        ? "cup"
        : /tablespoon|tbsp/i.test(label)
          ? "tbsp"
          : /teaspoon|tsp/i.test(label)
            ? "tsp"
            : /clove/i.test(label)
              ? "clove"
              : "piece";
      return {
        id: `fdc-${p.id ?? index}`,
        label,
        unit,
        amount: p.amount,
        grams: p.gramWeight,
        ...(["cup", "tbsp", "tsp"].includes(unit)
          ? { convention: "us" as const }
          : {}),
      };
    });
  if (raw.servingSize && raw.servingSizeUnit?.toLowerCase() === "g")
    measures.push({
      id: "label-serving",
      label: "label serving",
      unit: "serving",
      amount: 1,
      grams: raw.servingSize,
    });
  return {
    id: `fdc-${raw.fdcId}`,
    source: "USDA FoodData Central",
    sourceId: String(raw.fdcId),
    sourceVersion: raw.publicationDate ?? "API",
    name: raw.description,
    aliases: [],
    category: raw.foodCategory?.description ?? "Other",
    state: /raw/i.test(raw.description)
      ? "raw"
      : /cooked|boiled|roasted/i.test(raw.description)
        ? "cooked"
        : "prepared",
    nutrients,
    measures,
    barcode: raw.gtinUpc,
  };
}
export function normalizeBarcode(code: string): string {
  if (!/^\d{8}$|^\d{12,14}$/.test(code))
    throw new Error("Enter a valid 8, 12, 13, or 14 digit barcode.");
  const digits = code.split("").map(Number);
  const check = digits.pop()!;
  const sum = digits
    .reverse()
    .reduce((n, d, index) => n + d * (index % 2 === 0 ? 3 : 1), 0);
  if ((10 - (sum % 10)) % 10 !== check)
    throw new Error("The barcode check digit is invalid.");
  return code.padStart(14, "0");
}
