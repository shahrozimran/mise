import { Food, foodSchema } from "@mise/domain";
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
  const result = await request<{ foods: unknown[] }>(
    `/v1/barcodes/${encodeURIComponent(code)}`,
  );
  return z.array(foodSchema).parse(result.foods);
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
