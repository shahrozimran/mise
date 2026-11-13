import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
let connection: Promise<SQLiteDatabase> | undefined;
async function database() {
  connection ??= (async () => {
    const db = await openDatabaseAsync("mise.sqlite");
    const row = await db.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    if ((row?.user_version ?? 0) > 1)
      throw new Error("This database needs a newer app version.");
    await db.execAsync(
      "PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id = 1), payload TEXT NOT NULL); PRAGMA user_version = 1;",
    );
    return db;
  })();
  return connection;
}
export async function readState(): Promise<string | null> {
  const db = await database();
  return (
    (
      await db.getFirstAsync<{ payload: string }>(
        "SELECT payload FROM app_state WHERE id = 1",
      )
    )?.payload ?? null
  );
}
export async function writeState(payload: string): Promise<void> {
  const db = await database();
  await db.runAsync(
    "INSERT INTO app_state (id, payload) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload",
    payload,
  );
}
