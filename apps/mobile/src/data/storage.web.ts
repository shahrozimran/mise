// The browser preview uses browser storage; Android uses the SQLite implementation.
export async function readState(): Promise<string | null> {
  return localStorage.getItem("mise-state-v1");
}
export async function writeState(payload: string): Promise<void> {
  localStorage.setItem("mise-state-v1", payload);
}
