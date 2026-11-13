import { Food } from './types';

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
  return { id: `off-${code}`, name: name.slice(0,250), aliases: [], category: 'Packaged foods', state: 'as sold',
    source:'Open Food Facts', sourceId:code, sourceVersion:'Community product label · Open Database License (ODbL) · confirm against your package', barcode:code,
    nutrients:{kcal,protein:value('proteins_100g'),carbs:value('carbohydrates_100g'),fat:value('fat_100g'),fiber:value('fiber_100g')}, measures:[] };
}
