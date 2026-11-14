import { Food } from './types';

/** Extract an identifier, never navigate to or fetch a scanned URL. */
export function productBarcode(input: string): string | null {
  const text = input.trim();
  const valid = (value: string) => /^(?:\d{8}|\d{12,14})$/.test(value);
  const digits = text.replace(/\s/g, '');
  if (valid(digits)) return digits;
  if (text.length > 4096) return null;
  const gs1 = text.match(/^\(01\)(\d{14})(?:\(|$)/);
  if (gs1) return gs1[1];
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    const ai = segments.indexOf('01');
    if (ai >= 0 && /^\d{14}$/.test(segments[ai + 1] ?? '')) return segments[ai + 1];
    if (/^(?:[a-z-]+\.)?openfoodfacts\.(?:org|net)$/.test(url.hostname)) {
      const index = segments.findIndex((s) => s === 'product' || s === 'produit');
      if (index >= 0 && valid(segments[index + 1] ?? '')) return segments[index + 1];
    }
    for (const key of ['gtin', 'ean', 'upc', 'barcode']) {
      const value = url.searchParams.get(key);
      if (value && valid(value)) return value;
    }
  } catch { /* Not a recognized product identifier. */ }
  return null;
}

export function publicProduct(product: Record<string, unknown>): Food | null {
  const code = String(product.code ?? '');
  const name = String(product.product_name ?? '').trim();
  if (!/^\d{8}$|^\d{12,14}$/.test(code) || !name) return null;
  // OFF's _100g fields can mean 100 ml on liquids: never invent gram density.
  const units = [product.nutrition_data_per, product.product_quantity_unit, product.serving_quantity_unit, product.serving_size].join(' ');
  if (/100ml|\b(?:ml|cl|litre|liter|litres|liters|l)\b/i.test(units)) return null;
  if (product.nutrition_data_per !== '100g') return null;
  if (product.no_nutrition_data === 'on') return null;
  const n = product.nutriments as Record<string, unknown> | undefined;
  if (!n) return null;
  function value(key: string) {
    const x=n![key];
    return typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : null;
  }
  const kcal = value('energy-kcal_100g') ?? (value('energy-kj_100g') === null ? null : value('energy-kj_100g')! / 4.184);
  if (kcal === null && value('proteins_100g') === null) return null;
  const label = (value: unknown, limit: number) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim().slice(0, limit) || undefined : undefined;
  const serving = typeof product.serving_quantity === 'number' ? product.serving_quantity : Number(product.serving_quantity);
  const servingGrams = product.serving_quantity_unit === 'g' && Number.isFinite(serving) && serving > 0 ? serving : null;
  return { id: `off-${code}`, name: name.slice(0,250), aliases: [], category: 'Packaged foods', state: 'as sold',
    brand: label(product.brands, 300), ingredientsText: label(product.ingredients_text, 12000) ?? label(product.ingredients_text_en, 12000), allergensText: label(product.allergens, 3000),
    source:'Open Food Facts', sourceId:code, sourceVersion:'Community product label · Open Database License (ODbL) · confirm against your package', barcode:code,
    nutrients:{kcal,protein:value('proteins_100g'),carbs:value('carbohydrates_100g'),fat:value('fat_100g'),fiber:value('fiber_100g')},
    measures: servingGrams ? [{id:'label-serving',label:'label serving',unit:'serving',amount:1,grams:servingGrams}] : [] };
}
