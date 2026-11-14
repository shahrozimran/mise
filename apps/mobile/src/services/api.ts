import { Food, foodSchema, publicProduct, productBarcode } from "@mise/domain";
import * as Network from "expo-network";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { z } from "zod";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
const secure = {
  async get(key: string) {
    return Platform.OS === "web"
      ? sessionStorage.getItem(key)
      : SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === "web") sessionStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
};
export { secure };
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!API_URL)
    throw new Error(
      "Online food search is not connected yet. Use the offline catalog or add a custom food.",
    );
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    signal: AbortSignal.timeout(18000),
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(
      body.message ??
        "The service is unavailable. Your offline foods are still available.",
    );
  return body as T;
}
export async function searchOnline(query: string): Promise<Food[]> {
  const result = await request<{ foods: unknown[] }>(
    `/v1/foods/search?q=${encodeURIComponent(query)}`,
  );
  return z.array(foodSchema).parse(result.foods);
}
const productFields = 'code,product_name,brands,ingredients_text,ingredients_text_en,allergens,nutriments,nutrition_data_per,no_nutrition_data,product_quantity_unit,serving_quantity_unit,serving_size,serving_quantity';
export async function lookupBarcode(code: string): Promise<Food[]> {
  const barcode = productBarcode(code);
  if (!barcode) throw new Error("This QR code does not contain a supported product identifier. Scan the package barcode or search by product name.");
  const lookupCode = barcode.length === 14 && barcode.startsWith('0') ? barcode.slice(1) : barcode;
  let publicError: unknown;
  try {
    const result = await publicLookup(`/api/v2/product/${lookupCode}.json?fields=${productFields}`);
    if (result.status !== 0 && result.product) {
      const food = publicProduct(result.product);
      if (!food) throw new Error("This product has no usable gram-based nutrition. Add it from the package label; liquid volumes need a measured gram weight.");
      if (food.barcode?.padStart(14, '0') !== barcode.padStart(14, '0')) throw new Error("The product identifier did not match. Try the printed barcode.");
      return [foodSchema.parse(food)];
    }
  } catch (error) { publicError = error; }
  if (API_URL) {
    try {
      const result = await request<{ foods: unknown[] }>(`/v1/barcodes/${encodeURIComponent(barcode)}`);
      const matches = z.array(foodSchema).parse(result.foods).filter((food) => food.barcode?.padStart(14, '0') === barcode.padStart(14, '0'));
      if (matches.length) return matches;
    } catch { /* Public label lookup remains available when the optional server is down. */ }
  }
  if (publicError) throw publicError;
  return [];
}
async function publicLookup(path: string): Promise<{status?:number;product?:Record<string,unknown>;products?:Record<string,unknown>[]}> {
  const state = await Network.getNetworkStateAsync();
  if (state.isConnected === false || state.isInternetReachable === false)
    throw new Error("You’re offline. Previously looked-up products and the local catalog still work. Reconnect to find a new product.");
  try {
    const response = await fetch(`https://world.openfoodfacts.org${path}`, {
      signal: AbortSignal.timeout(15000),
      headers: Platform.OS === 'web' ? {} : {'User-Agent':'Mise/0.8.0 (https://github.com/shahrozimran/mise)'},
    });
    if(response.status===404) return {status:0};
    if(response.status===429) throw new Error("Product lookup is busy. Please wait a minute and retry.");
    if(!response.ok) throw new Error("The product service is temporarily unavailable. Try again; your saved foods still work.");
    return await response.json();
  } catch (error) {
    if(error instanceof Error && /busy|temporarily unavailable/.test(error.message)) throw error;
    throw new Error("Couldn’t reach the product service. Check your internet connection and retry, or use saved foods.");
  }
}
export async function searchProducts(query: string): Promise<Food[]> {
  const result = await publicLookup(`/cgi/search.pl?search_terms=${encodeURIComponent(query.slice(0,100))}&search_simple=1&action=process&json=1&page_size=12&fields=${productFields}`);
  return (result.products??[]).map(publicProduct).filter((f):f is Food=>f!==null).map(f=>foodSchema.parse(f));
}
export async function installation(): Promise<{ id: string; secret: string }> {
  const stored = await secure.get("mise-installation");
  if (stored)
    return z
      .object({ id: z.string(), secret: z.string() })
      .parse(JSON.parse(stored));
  const result = await request<{ id: string; secret: string }>(
    "/v1/installations",
    { method: "POST", body: "{}" },
  );
  await secure.set("mise-installation", JSON.stringify(result));
  return result;
}
