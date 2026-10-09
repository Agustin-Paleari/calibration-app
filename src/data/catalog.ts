import type { Brand, Store } from "../domain/types";
export const BRANDS: Brand[] = [
  "Phrozen",
  "Anycubic",
  "Elegoo",
  "Creality",
  "PioCreat / Aidis",
];
const catalog: Record<Brand, string[]> = {
  Phrozen: ["Sonic Mini 8K S", "Sonic Mighty 8K", "Sonic Mighty Revo"],
  Anycubic: ["Photon Mono 2", "Photon Mono M5s", "Photon Mono M7 Pro"],
  Elegoo: ["Mars 4", "Mars 5 Ultra", "Saturn 3 Ultra", "Saturn 4 Ultra"],
  Creality: ["HALOT-MAGE", "HALOT-MAGE Pro", "HALOT R6"],
  "PioCreat / Aidis": [],
};
export function emptyStore(): Store {
  return {
    version: 1,
    models: BRANDS.flatMap((brand, i) =>
      catalog[brand].map((name, j) => ({
        id: `model-${i}-${j}`,
        brand,
        name,
        validation: "catalog" as const,
      })),
    ),
    printers: [],
    resins: [],
    calibrations: [],
  };
}
export const uid = () => crypto.randomUUID();
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
