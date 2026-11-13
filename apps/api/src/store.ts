import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createHash } from "node:crypto";

export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function openStore(path: string) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS installations (id TEXT PRIMARY KEY, secret_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, payload TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS purchases (token_hash TEXT PRIMARY KEY, encrypted_token TEXT NOT NULL, owner TEXT NOT NULL, expires INTEGER NOT NULL, active INTEGER NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, token_hash TEXT, processed_at INTEGER NOT NULL);`);
  return db;
}
