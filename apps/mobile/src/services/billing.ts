import { create } from "zustand";
import { Platform } from "react-native";
import { ed25519 } from "@noble/curves/ed25519.js";
import { z } from "zod";
import type { Purchase } from "expo-iap";
import { API_URL, installation, request, secure } from "./api";

const PRODUCT = process.env.EXPO_PUBLIC_GOOGLE_PLAY_PRODUCT_ID ?? "mise_pro";
const PUBLIC_KEY = process.env.EXPO_PUBLIC_ENTITLEMENT_KEY ?? "";
export interface Plan {
  id: string;
  token: string;
  price: string;
  period: string;
  terms: string;
}
interface BillingState {
  pro: boolean;
  preview: boolean;
  busy: boolean;
  error: string;
  plans: Plan[];
  configured: boolean;
}
export const useBilling = create<BillingState>(() => ({
  pro: false,
  preview: __DEV__ && process.env.EXPO_PUBLIC_PRO_PREVIEW === "true",
  busy: false,
  error: "",
  plans: [],
  configured: !!API_URL && !!PUBLIC_KEY && Platform.OS === "android",
}));
const entitlementSchema = z.object({
  owner: z.string(),
  pro: z.boolean(),
  issuedAt: z.number(),
  paidThrough: z.number(),
  offlineValidUntil: z.number(),
});
const tokenSchema = z.object({
  payload: z.string(),
  signature: z.string().regex(/^[a-f0-9]{128}$/i),
});
function bytes(hex: string) {
  return Uint8Array.from(hex.match(/.{2}/g) ?? [], (v) => parseInt(v, 16));
}
let initialized: Promise<void> | undefined;
let client: typeof import("expo-iap") | undefined;
let expiryTimer: ReturnType<typeof setTimeout> | undefined;
function period(value: string) {
  return (
    (
      {
        P1M: "month",
        P1Y: "year",
        P1W: "week",
        P3M: "3 months",
        P6M: "6 months",
      } as Record<string, string>
    )[value] ?? value
  );
}
async function applyToken(raw: unknown, persist = true) {
  const token = tokenSchema.parse(raw);
  if (
    !/^[a-f0-9]{64}$/i.test(PUBLIC_KEY) ||
    !ed25519.verify(
      bytes(token.signature),
      new TextEncoder().encode(token.payload),
      bytes(PUBLIC_KEY),
    )
  )
    throw new Error("The subscription response could not be verified.");
  const value = entitlementSchema.parse(JSON.parse(token.payload));
  const userRaw = await secure.get("mise-installation");
  if (!userRaw || value.owner !== JSON.parse(userRaw).id)
    throw new Error("Restore purchases to verify this device.");
  const now = Date.now(),
    lastSeen = Number((await secure.get("mise-last-seen")) ?? now);
  const validClock =
    now >= lastSeen - 5 * 60 * 1000 && now >= value.issuedAt - 5 * 60 * 1000;
  useBilling.setState({
    pro: value.pro && value.offlineValidUntil > now && validClock,
  });
  if (expiryTimer) clearTimeout(expiryTimer);
  if (value.pro && value.offlineValidUntil > now)
    expiryTimer = setTimeout(
      () => {
        void refreshEntitlement();
      },
      Math.min(value.offlineValidUntil - now + 100, 2_147_000_000),
    );
  await secure.set("mise-last-seen", String(Math.max(now, lastSeen)));
  if (persist) await secure.set("mise-entitlement", JSON.stringify(token));
}
export async function refreshEntitlement() {
  if (!PUBLIC_KEY) return;
  try {
    const token = await secure.get("mise-entitlement");
    if (token) await applyToken(JSON.parse(token), false);
    const userRaw = await secure.get("mise-installation");
    if (userRaw && API_URL) {
      const user = JSON.parse(userRaw);
      await applyToken(
        await request("/v1/entitlements/me", {
          headers: { Authorization: `Bearer ${user.id}:${user.secret}` },
        }),
      );
    }
  } catch {
    // A network outage keeps only a still-valid, previously verified offline lease.
  }
}
async function verifyPurchase(purchase: Purchase) {
  if (purchase.productId !== PRODUCT) return;
  if (purchase.purchaseState !== "purchased" || !purchase.purchaseToken) {
    useBilling.setState({
      busy: false,
      error: "Payment is pending. Pro starts after Google Play confirms it.",
    });
    return;
  }
  useBilling.setState({ busy: true, error: "" });
  try {
    const user = await installation();
    await applyToken(
      await request("/v1/billing/verify", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.id}:${user.secret}` },
        body: JSON.stringify({ token: purchase.purchaseToken }),
      }),
    );
    await client?.finishTransaction({ purchase, isConsumable: false });
  } catch (e) {
    useBilling.setState({
      error: `${(e as Error).message} Use Restore purchases to retry verification.`,
    });
  } finally {
    useBilling.setState({ busy: false });
  }
}
export function initializeBilling(): Promise<void> {
  initialized ??= (async () => {
    await refreshEntitlement();
    if (!useBilling.getState().configured) return;
    try {
      client = await import("expo-iap");
      await client.initConnection();
      client.purchaseUpdatedListener((purchase) => {
        void verifyPurchase(purchase);
      });
      client.purchaseErrorListener((error) =>
        useBilling.setState({
          busy: false,
          error: error.code === "user-cancelled" ? "" : error.message,
        }),
      );
      const products = await client.fetchProducts({
        skus: [PRODUCT],
        type: "subs",
      });
      const plans: Plan[] = [];
      for (const product of products ?? []) {
        if (product.platform !== "android") continue;
        for (const offer of product.subscriptionOffers ?? []) {
          // Plain recurring base plans only: do not misrepresent introductory/trial prices.
          const phases = offer.pricingPhasesAndroid?.pricingPhaseList ?? [];
          if (
            !offer.offerTokenAndroid ||
            phases.length !== 1 ||
            offer.installmentPlanDetailsAndroid
          )
            continue;
          const regular = phases[0];
          plans.push({
            id: offer.basePlanIdAndroid ?? offer.id,
            token: offer.offerTokenAndroid,
            price: regular.formattedPrice,
            period: period(regular.billingPeriod),
            terms: `Renews at ${regular.formattedPrice} every ${period(regular.billingPeriod)} until canceled.`,
          });
        }
      }
      useBilling.setState({ plans });
      const purchases = await client.getAvailablePurchases();
      for (const purchase of purchases) await verifyPurchase(purchase);
    } catch (e) {
      useBilling.setState({ error: (e as Error).message });
    }
  })();
  return initialized;
}
export async function buyPlan(plan: Plan) {
  if (!client) throw new Error("Google Play checkout is not available.");
  useBilling.setState({ busy: true, error: "" });
  try {
    const user = await installation();
    await client.requestPurchase({
      type: "subs",
      request: {
        google: {
          skus: [PRODUCT],
          subscriptionOffers: [{ sku: PRODUCT, offerToken: plan.token }],
          obfuscatedAccountId: user.id,
        },
      },
    });
  } catch (e) {
    useBilling.setState({ busy: false, error: (e as Error).message });
  }
}
export async function restorePurchases() {
  if (!client) {
    useBilling.setState({
      error:
        "Restore purchases is available in a configured Android build through Google Play.",
    });
    return;
  }
  useBilling.setState({ busy: true, error: "" });
  try {
    const purchases = await client.getAvailablePurchases();
    if (!purchases.length)
      useBilling.setState({
        error: "No active purchases found for this Google Play account.",
      });
    for (const p of purchases) await verifyPurchase(p);
  } catch (e) {
    useBilling.setState({ error: (e as Error).message });
  } finally {
    useBilling.setState({ busy: false });
  }
}
