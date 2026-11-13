import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { pathToFileURL } from "node:url";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { openStore, hash } from "./store";
import { normalizeBarcode, normalizeFood } from "./usda";
import {
  decryptToken,
  encryptToken,
  signEntitlement,
  subscriptionAccess,
  verifyPlay,
} from "./billing";

function serviceError(message: string, statusCode = 503) {
  return Object.assign(new Error(message), { statusCode });
}
interface PurchaseRow {
  token_hash: string;
  encrypted_token: string;
  owner: string;
  expires: number;
  active: number;
  updated_at: number;
}
export async function createServer(
  databasePath = process.env.DATABASE_PATH ?? ".data/mise.sqlite",
) {
  const db = openStore(databasePath);
  const app = Fastify({ logger: false, bodyLimit: 64 * 1024 });
  const origins = (process.env.CORS_ORIGINS ?? "").split(",").filter(Boolean);
  await app.register(cors, { origin: origins.length ? origins : false });
  await app.register(rateLimit, { max: 60, timeWindow: "1 minute" });
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof z.ZodError)
      return reply.code(400).send({ message: "Check the request values." });
    const failure =
      error instanceof Error
        ? (error as Error & { statusCode?: number })
        : new Error("Unexpected service failure.");
    const status =
      "statusCode" in failure && typeof failure.statusCode === "number"
        ? failure.statusCode
        : 502;
    return reply
      .code(status)
      .send({
        message:
          status < 500 || status === 503
            ? failure.message
            : "The service could not complete this request. Please retry.",
      });
  });
  app.addHook("onClose", async () => {
    db.close();
  });
  const cached = (key: string) => {
    const row = db
      .prepare("SELECT payload FROM cache WHERE key = ? AND expires > ?")
      .get(key, Date.now()) as { payload: string } | undefined;
    return row ? JSON.parse(row.payload) : undefined;
  };
  const cache = (key: string, value: unknown, ttl = 24 * 3600000) => {
    db.prepare(
      "INSERT INTO cache VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload, expires=excluded.expires",
    ).run(key, JSON.stringify(value), Date.now() + ttl);
  };
  async function upstream(path: string, payload?: object): Promise<any> {
    const key = process.env.USDA_API_KEY;
    if (!key)
      throw serviceError(
        "Online USDA lookup is not configured. Use the offline catalog or a custom food.",
      );
    const quotaKey = `quota:${Math.floor(Date.now() / 3600000)}`;
    const used = Number(cached(quotaKey) ?? 0);
    if (used >= 900)
      throw serviceError(
        "Online lookup is busy. Your offline foods are still available.",
        429,
      );
    cache(quotaKey, used + 1, 3600000);
    const response = await fetch(`https://api.nal.usda.gov/fdc/v1/${path}`, {
      method: payload ? "POST" : "GET",
      headers: { "Content-Type": "application/json", "X-Api-Key": key },
      body: payload ? JSON.stringify(payload) : undefined,
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok)
      throw serviceError(
        response.status === 429
          ? "USDA lookup is rate limited. Please try again later."
          : "USDA is unavailable. Use the offline catalog.",
        response.status === 429 ? 429 : 503,
      );
    return response.json();
  }
  async function owner(authorization?: string): Promise<string> {
    const raw = authorization?.replace(/^Bearer /, "") ?? "";
    const [id, secret] = raw.split(":");
    const row = db
      .prepare("SELECT secret_hash FROM installations WHERE id = ?")
      .get(id ?? "") as { secret_hash: string } | undefined;
    if (
      !row ||
      !secret ||
      !timingSafeEqual(Buffer.from(row.secret_hash), Buffer.from(hash(secret)))
    )
      throw serviceError("Restore your session to continue.", 401);
    return id;
  }
  async function updatePurchase(token: string, user: string) {
    const play = await verifyPlay(token);
    const access = subscriptionAccess(
      play,
      process.env.GOOGLE_PLAY_PRODUCT_ID ?? "mise_pro",
    );
    db.prepare(
      "INSERT INTO purchases VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(token_hash) DO UPDATE SET owner=excluded.owner, encrypted_token=excluded.encrypted_token, expires=excluded.expires, active=excluded.active, updated_at=excluded.updated_at",
    ).run(
      hash(token),
      encryptToken(token),
      user,
      access.expires,
      access.active ? 1 : 0,
      Date.now(),
    );
    return access;
  }
  app.get("/health", async () => ({ status: "ok", version: "0.1.0" }));
  app.post(
    "/v1/installations",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (_request, reply) => {
      const id = randomUUID(),
        secret = randomBytes(32).toString("hex");
      db.prepare("INSERT INTO installations VALUES (?, ?, ?)").run(
        id,
        hash(secret),
        Date.now(),
      );
      return reply.code(201).send({ id, secret });
    },
  );
  app.get("/v1/foods/search", async (request) => {
    const { q } = z
      .object({ q: z.string().trim().min(2).max(100) })
      .parse(request.query);
    const key = `search:${q.toLowerCase()}`;
    const hit = cached(key);
    if (hit) return hit;
    const response = await upstream("foods/search", {
      query: q,
      pageSize: 16,
      dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"],
    });
    const foods = (response.foods ?? []).flatMap((food: any) => {
      try {
        return [normalizeFood(food)];
      } catch {
        return [];
      }
    });
    const result = { foods };
    cache(key, result);
    return result;
  });
  app.get("/v1/foods/:sourceId", async (request) => {
    const { sourceId } = z
      .object({ sourceId: z.string().regex(/^\d{1,12}$/) })
      .parse(request.params);
    const key = `food:${sourceId}`;
    const hit = cached(key);
    if (hit) return hit;
    const result = normalizeFood(await upstream(`food/${sourceId}`));
    cache(key, result, 7 * 24 * 3600000);
    return result;
  });
  app.get("/v1/barcodes/:code", async (request) => {
    const { code } = z
      .object({ code: z.string().regex(/^\d{8}$|^\d{12,14}$/) })
      .parse(request.params);
    let canonical: string;
    try {
      canonical = normalizeBarcode(code);
    } catch (e) {
      throw serviceError((e as Error).message, 400);
    }
    const key = `barcode:${canonical}`;
    const hit = cached(key);
    if (hit) return hit;
    const response = await upstream("foods/search", {
      query: code,
      pageSize: 30,
      dataType: ["Branded"],
    });
    const foods = (response.foods ?? []).flatMap((food: any) => {
      try {
        return food.gtinUpc && normalizeBarcode(food.gtinUpc) === canonical
          ? [normalizeFood(food)]
          : [];
      } catch {
        return [];
      }
    });
    const result = { foods };
    cache(key, result);
    return result;
  });
  app.post("/v1/billing/verify", async (request) => {
    const user = await owner(request.headers.authorization);
    const { token } = z
      .object({ token: z.string().min(10).max(6000) })
      .parse(request.body);
    const access = await updatePurchase(token, user);
    return signEntitlement(user, access.active, access.expires);
  });
  app.get("/v1/entitlements/me", async (request) => {
    const user = await owner(request.headers.authorization);
    const rows = db
      .prepare("SELECT * FROM purchases WHERE owner = ?")
      .all(user) as unknown as PurchaseRow[];
    for (const row of rows)
      if (row.updated_at < Date.now() - 3600000)
        await updatePurchase(decryptToken(row.encrypted_token), user);
    const current = db
      .prepare(
        "SELECT MAX(expires) AS expires FROM purchases WHERE owner = ? AND active = 1",
      )
      .get(user) as { expires: number | null };
    return signEntitlement(
      user,
      (current.expires ?? 0) > Date.now(),
      current.expires ?? 0,
    );
  });
  app.post("/v1/billing/google-notifications", async (request) => {
    const audience = process.env.RTDN_AUDIENCE,
      email = process.env.RTDN_SERVICE_ACCOUNT;
    if (!audience || !email)
      throw serviceError("Notifications are not configured.");
    const token = request.headers.authorization?.replace(/^Bearer /, "");
    if (!token) throw serviceError("Unauthorized notification.", 401);
    let identity;
    try {
      identity = (
        await new OAuth2Client().verifyIdToken({ idToken: token, audience })
      ).getPayload();
    } catch {
      throw serviceError("Unauthorized notification.", 401);
    }
    if (identity?.email !== email || !identity.email_verified)
      throw serviceError("Unauthorized notification.", 401);
    const envelope = z
      .object({
        message: z.object({
          messageId: z.string(),
          data: z.string().max(50000),
        }),
      })
      .parse(request.body);
    if (
      db
        .prepare("SELECT id FROM notifications WHERE id = ?")
        .get(envelope.message.messageId)
    )
      return { status: "duplicate" };
    const body = z
      .object({
        packageName: z.string(),
        subscriptionNotification: z
          .object({ purchaseToken: z.string() })
          .optional(),
        testNotification: z.unknown().optional(),
      })
      .parse(
        JSON.parse(
          Buffer.from(envelope.message.data, "base64").toString("utf8"),
        ),
      );
    if (body.packageName !== process.env.ANDROID_PACKAGE_NAME)
      throw serviceError("Unexpected package.", 400);
    const purchaseToken = body.subscriptionNotification?.purchaseToken;
    if (purchaseToken) {
      const existing = db
        .prepare("SELECT owner FROM purchases WHERE token_hash = ?")
        .get(hash(purchaseToken)) as { owner: string } | undefined;
      // Checkout verification/restore fetches authoritative state when a previously unknown token gains an owner.
      if (existing) await updatePurchase(purchaseToken, existing.owner);
    }
    db.prepare("INSERT OR IGNORE INTO notifications VALUES (?, ?, ?)").run(
      envelope.message.messageId,
      purchaseToken ? hash(purchaseToken) : null,
      Date.now(),
    );
    return { status: "ok" };
  });
  // Recovery for missed notifications, acknowledgement failures, and temporary upstream outages.
  const reconcile = setInterval(
    () => {
      const stale = db
        .prepare(
          "SELECT * FROM purchases WHERE active = 1 AND updated_at < ? LIMIT 30",
        )
        .all(Date.now() - 3600000) as unknown as PurchaseRow[];
      void (async () => {
        for (const row of stale) {
          try {
            await updatePurchase(decryptToken(row.encrypted_token), row.owner);
          } catch {
            app.log.warn("Purchase reconciliation will retry.");
          }
        }
      })();
    },
    15 * 60 * 1000,
  );
  reconcile.unref();
  app.addHook("onClose", async () => {
    clearInterval(reconcile);
  });
  return app;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const app = await createServer();
  const address = await app.listen({
    host: process.env.HOST ?? "127.0.0.1",
    port: Number(process.env.PORT ?? 3001),
  });
  console.log(`Mise API listening at ${address}`);
}
