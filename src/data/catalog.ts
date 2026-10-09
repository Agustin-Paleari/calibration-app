import type { Brand, Store } from "../domain/types";
export const BRANDS: Brand[] = [
  "Phrozen",
  "Anycubic",
  "Elegoo",
  "Creality",
  "PioCreat / Aidis",
  "PioNext",
];
const catalog: Record<Brand, string[]> = {
  Phrozen: [
    "Sonic Mini 8K S",
    "Sonic Mighty 8K",
    "Sonic Mighty Revo",
    "Sonic Mini 4K",
    "Sonic Mini 8K",
    "Sonic Mighty 4K",
    "Sonic Mighty 12K",
    "Sonic Mighty Revo 14K",
    "Sonic Mighty Revo 16K",
    "Sonic Mighty Revo 16K MAX",
    "Sonic Mega 8K",
    "Sonic Mega 8K S",
    "Sonic Mega 8K V2",
  ],
  Anycubic: [
    "Photon Mono 2",
    "Photon Mono M5s",
    "Photon Mono M7 Pro",
    "Photon Mono 4",
    "Photon Mono 4 Ultra",
    "Photon Mono M7",
    "Photon Mono M7 Max",
    "Photon Mono M5",
    "Photon Mono M5s Pro",
    "Photon Mono X 6K",
    "Photon Mono X6Ks",
    "Photon Mono X2",
    "Photon Mono 4K",
    "Photon M3",
    "Photon M3 Plus",
    "Photon M3 Premium",
    "Photon M3 Max",
    "Photon D2",
    "Photon Ultra",
  ],
  Elegoo: [
    "Mars 4",
    "Mars 5 Ultra",
    "Saturn 3 Ultra",
    "Saturn 4 Ultra",
    "Mars 3",
    "Mars 3 Pro",
    "Mars 4 Ultra",
    "Mars 4 Max",
    "Mars 4 DLP",
    "Mars 5",
    "Saturn S",
    "Saturn 8K",
    "Saturn 2",
    "Saturn 3",
    "Saturn 4",
    "Saturn 4 Ultra 16K",
    "Jupiter",
    "Jupiter SE",
    "Jupiter 2",
  ],
  Creality: [
    "HALOT-MAGE",
    "HALOT-MAGE Pro",
    "HALOT R6",
    "HALOT-X1",
    "HALOT X1 Neo",
    "HALOT-MAGE S",
    "HALOT-SKY",
    "HALOT-ONE",
    "HALOT-ONE PRO",
    "HALOT-ONE PLUS",
  ],
  "PioCreat / Aidis": [],
  PioNext: ["Mini"],
};
export function emptyStore(): Store {
  return {
    version: 1,
    sourceId: uid(),
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

export function withCurrentCatalog(store: Store): Store {
  const existing = new Set(
    store.models.map((m) => `${m.brand}:${m.name.toLowerCase()}`),
  );
  const additions = emptyStore().models.filter(
    (m) =>
      !existing.has(`${m.brand}:${m.name.toLowerCase()}`) &&
      !store.models.some((old) => old.id === m.id),
  );
  return additions.length
    ? { ...store, models: [...store.models, ...additions] }
    : store;
}
