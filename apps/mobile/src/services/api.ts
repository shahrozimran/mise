import { Food, foodSchema, publicProduct } from "@mise/domain";
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
export async function lookupBarcode(code: string): Promise<Food[]> {
  const barcode = code.trim();
  if (!/^\d{8}$|^\d{12,14}$/.test(barcode)) throw new Error("Enter the 8, 12, 13, or 14 digits printed on the package.");
  if (API_URL) {
    try {
      const result = await request<{ foods: unknown[] }>(`/v1/barcodes/${encodeURIComponent(barcode)}`);
      const matches = z.array(foodSchema).parse(result.foods);
      if (matches.length) return matches;
    } catch { /* Public label lookup remains available when the optional server is down. */ }
  }
  const result = await publicLookup(`/api/v2/product/${barcode}.json?fields=code,product_name,nutriments,nutrition_data_per,no_nutrition_data,product_quantity_unit,serving_quantity_unit,serving_size`);
  if (result.status === 0 || !result.product) return [];
  const food = publicProduct(result.product);
  if (!food) throw new Error("This product has no usable gram-based nutrition. Add it from the package label; liquid volumes need a measured gram weight.");
  return [foodSchema.parse(food)];
}
async function publicLookup(path: string): Promise<{status?:number;product?:Record<string,unknown>;products?:Record<string,unknown>[]}> {
  const state = await Network.getNetworkStateAsync();
  if (state.isConnected === false || state.isInternetReachable === false)
    throw new Error("You’re offline. Previously looked-up products and the local catalog still work. Reconnect to find a new product.");
  try {
    const response = await fetch(`https://world.openfoodfacts.org${path}`, {
      signal: AbortSignal.timeout(15000),
      headers: Platform.OS === 'web' ? {} : {'User-Agent':'Mise/0.3.0 (https://github.com/shahrozimran/mise)'},
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
  const result = await publicLookup(`/cgi/search.pl?search_terms=${encodeURIComponent(query.slice(0,100))}&search_simple=1&action=process&json=1&page_size=12&fields=code,product_name,nutriments,nutrition_data_per,no_nutrition_data,product_quantity_unit,serving_quantity_unit,serving_size`);
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
