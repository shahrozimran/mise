import {
  createCipheriv,
  createDecipheriv,
  createPrivateKey,
  randomBytes,
  sign,
} from "node:crypto";
import { GoogleAuth } from "google-auth-library";

export interface PlaySubscription {
  subscriptionState: string;
  acknowledgementState?: string;
  lineItems?: { productId: string; expiryTime: string }[];
}
export function subscriptionAccess(
  subscription: PlaySubscription,
  product: string,
  now = Date.now(),
) {
  const lines = (subscription.lineItems ?? []).filter(
    (line) => line.productId === product,
  );
  const expires = Math.max(
    0,
    ...lines.map((l) => Date.parse(l.expiryTime)).filter(Number.isFinite),
  );
  const allowed = [
    "SUBSCRIPTION_STATE_ACTIVE",
    "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
    "SUBSCRIPTION_STATE_CANCELED",
  ];
  return {
    active: allowed.includes(subscription.subscriptionState) && expires > now,
    expires,
  };
}
function encryptionKey() {
  const raw = process.env.PURCHASE_ENCRYPTION_KEY ?? "";
  if (!/^[a-f0-9]{64}$/i.test(raw))
    throw new Error("Purchase encryption is not configured.");
  return Buffer.from(raw, "hex");
}
export function encryptToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  return Buffer.concat([
    iv,
    cipher.update(token, "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]).toString("base64");
}
export function decryptToken(value: string): string {
  const data = Buffer.from(value, "base64");
  const cipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    data.subarray(0, 12),
  );
  cipher.setAuthTag(data.subarray(-16));
  return Buffer.concat([
    cipher.update(data.subarray(12, -16)),
    cipher.final(),
  ]).toString("utf8");
}
export function signEntitlement(
  owner: string,
  active: boolean,
  paidThrough: number,
) {
  if (!process.env.ENTITLEMENT_PRIVATE_KEY)
    throw new Error("Entitlement signing is not configured.");
  const now = Date.now();
  const payload = JSON.stringify({
    owner,
    pro: active,
    issuedAt: now,
    paidThrough,
    offlineValidUntil: active ? paidThrough + 72 * 60 * 60 * 1000 : now,
  });
  const privateKey = createPrivateKey(
    Buffer.from(process.env.ENTITLEMENT_PRIVATE_KEY, "base64").toString("utf8"),
  );
  return {
    payload,
    signature: sign(null, Buffer.from(payload), privateKey).toString("hex"),
  };
}
export async function verifyPlay(token: string): Promise<PlaySubscription> {
  const packageName = process.env.ANDROID_PACKAGE_NAME;
  if (
    !packageName ||
    !process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    !process.env.ENTITLEMENT_PRIVATE_KEY
  )
    throw new Error("Google Play verification is not configured.");
  encryptionKey(); // Check storage readiness before acknowledging a real purchase.
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });
  const client = await auth.getClient();
  const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptions`;
  const response = await client.request<PlaySubscription>({
    url: `${base}v2/tokens/${encodeURIComponent(token)}`,
    timeout: 15000,
  });
  const subscription = response.data;
  const product = process.env.GOOGLE_PLAY_PRODUCT_ID ?? "mise_pro";
  const access = subscriptionAccess(subscription, product);
  if (
    access.active &&
    subscription.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING"
  ) {
    await client.request({
      url: `${base}/${encodeURIComponent(product)}/tokens/${encodeURIComponent(token)}:acknowledge`,
      method: "POST",
      data: {},
      timeout: 15000,
    });
  }
  return subscription;
}
