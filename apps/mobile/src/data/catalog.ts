import type { Food } from "@mise/domain";
import catalog from "./catalog.json";
export const foods = catalog as Food[];
export { default as catalogManifest } from "./catalog-manifest.json";
