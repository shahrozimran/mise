import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/server";
import { normalizeBarcode, normalizeFood } from "../src/usda";
import {
  decryptToken,
  encryptToken,
  signEntitlement,
  subscriptionAccess,
} from "../src/billing";
import { generateKeyPairSync, verify } from "node:crypto";

describe("USDA adapter", () => {
  it("selects one energy methodology and handles absent fiber", () => {
    const food = normalizeFood({
      fdcId: 1,
      description: "Test",
      foodNutrients: [
        { nutrient: { id: 1008, unitName: "kcal" }, amount: 100 },
        { nutrient: { id: 2048, unitName: "kcal" }, amount: 110 },
      ],
    });
    assert.equal(food.nutrients.kcal, 100);
    assert.equal(food.nutrients.fiber, null);
  });
  it("rejects ml-based branded nutrition without a mass conversion", () =>
    assert.throws(() =>
      normalizeFood({
        fdcId: 1,
        description: "Milk",
        dataType: "Branded",
        servingSizeUnit: "ml",
      }),
    ));
  it("normalizes UPC/EAN only when the checksum is valid", () => {
    assert.equal(normalizeBarcode("012345678905"), "00012345678905");
    assert.equal(normalizeBarcode("0012345678905"), "00012345678905");
    assert.throws(() => normalizeBarcode("012345678906"));
  });
});
describe("subscription verification rules", () => {
  const productId = "mise_pro";
  const expiryTime = new Date(Date.now() + 86400000).toISOString();
  it("keeps canceled-but-paid subscriptions active", () =>
    assert.equal(
      subscriptionAccess(
        {
          subscriptionState: "SUBSCRIPTION_STATE_CANCELED",
          lineItems: [{ productId, expiryTime }],
        },
        productId,
      ).active,
      true,
    ));
  for (const state of [
    "SUBSCRIPTION_STATE_PENDING",
    "SUBSCRIPTION_STATE_ON_HOLD",
    "SUBSCRIPTION_STATE_EXPIRED",
  ])
    it(`does not grant access for ${state}`, () =>
      assert.equal(
        subscriptionAccess(
          { subscriptionState: state, lineItems: [{ productId, expiryTime }] },
          productId,
        ).active,
        false,
      ));
  it("rejects a different subscription product", () =>
    assert.equal(
      subscriptionAccess(
        {
          subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
          lineItems: [{ productId: "other", expiryTime }],
        },
        productId,
      ).active,
      false,
    ));
  it("encrypts stored purchase tokens with authenticated encryption", () => {
    process.env.PURCHASE_ENCRYPTION_KEY = "01".repeat(32);
    const encrypted = encryptToken("secret-purchase-token");
    assert.ok(!encrypted.includes("secret"));
    assert.equal(decryptToken(encrypted), "secret-purchase-token");
    const data = Buffer.from(encrypted, "base64");
    data[15] ^= 1;
    assert.throws(() => decryptToken(data.toString("base64")));
  });
  it("signs offline leases that cannot be altered", () => {
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    process.env.ENTITLEMENT_PRIVATE_KEY = Buffer.from(
      privateKey.export({ type: "pkcs8", format: "pem" }),
    ).toString("base64");
    const token = signEntitlement("owner", true, Date.now() + 10000);
    assert.equal(
      verify(
        null,
        Buffer.from(token.payload),
        publicKey,
        Buffer.from(token.signature, "hex"),
      ),
      true,
    );
    assert.equal(
      verify(
        null,
        Buffer.from(token.payload.replace("owner", "other")),
        publicKey,
        Buffer.from(token.signature, "hex"),
      ),
      false,
    );
  });
});
describe("HTTP API", () => {
  it("responds to health checks, validates input, and requires billing authentication", async () => {
    const server = await createServer(":memory:");
    try {
      assert.equal((await server.inject({ url: "/health" })).statusCode, 200);
      assert.equal(
        (await server.inject({ url: "/v1/foods/search?q=x" })).statusCode,
        400,
      );
      assert.equal(
        (
          await server.inject({
            method: "POST",
            url: "/v1/billing/verify",
            payload: { token: "anything-long" },
          })
        ).statusCode,
        401,
      );
      const install = await server.inject({
        method: "POST",
        url: "/v1/installations",
        payload: {},
      });
      assert.equal(install.statusCode, 201);
      assert.equal(install.json().secret.length, 64);
      assert.equal(
        (
          await server.inject({
            url: "/v1/entitlements/me",
            headers: { Authorization: `Bearer ${install.json().id}:wrong` },
          })
        ).statusCode,
        401,
      );
    } finally {
      await server.close();
    }
  });
  it("returns an explicit offline fallback when USDA is unconfigured", async () => {
    const previous = process.env.USDA_API_KEY;
    delete process.env.USDA_API_KEY;
    const server = await createServer(":memory:");
    try {
      const response = await server.inject({
        url: "/v1/foods/search?q=chicken",
      });
      assert.equal(response.statusCode, 503);
      assert.match(response.json().message, /offline catalog/);
    } finally {
      await server.close();
      if (previous) process.env.USDA_API_KEY = previous;
    }
  });
});
