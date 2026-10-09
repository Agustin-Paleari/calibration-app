import type { Brand, Store, Printer, Resin } from "./types";
import { uid } from "../data/catalog";
export interface PrinterDraft {
  brand: Brand | "";
  modelId: string;
  newModel: string;
  name: string;
}
export interface ResinDraft {
  manufacturer: string;
  customManufacturer: string;
  name: string;
  customName: string;
  color: string;
  customColor: string;
}
export const newPrinterDraft = (): PrinterDraft => ({
  brand: "",
  modelId: "",
  newModel: "",
  name: "",
});
export const newResinDraft = (): ResinDraft => ({
  manufacturer: "",
  customManufacturer: "",
  name: "",
  customName: "",
  color: "Gris",
  customColor: "",
});
export const CUSTOM = "__custom__";
export const ADD = "__add__";
export const RESIN_NAMES: Record<string, string[]> = {
  Phrozen: [
    "Aqua Gray 8K",
    "Aqua Gray 4K",
    "Aqua Ivory 4K",
    "Aqua 4K Resin",
    "Aqua 8K Resin",
    "Aqua Hyperfine Resin",
    "Standard Speed Resin",
    "Standard Speed Plus Resin",
    "Standard Water-Washable Resin",
    "Engineering Tough ABS-Like+ Resin",
    "Engineering Tough 100E Resin",
    "Engineering Tough Nylon Resin",
    "Engineering Protowhite Tough Resin",
    "Engineering Ultra-High Temp TR300 Resin",
    "Engineering High Temp TR250LV Resin",
    "Engineering Rigid Rock-Black Stiff Resin",
  ],
  Anycubic: [
    "Standard Resin",
    "Standard Resin+",
    "Standard Resin V2",
    "Plant-Based Resin",
    "Plant-Based Resin+",
    "DLP Craftsman Resin",
    "UV Tough Resin",
    "Water-Wash Resin+",
    "High Clear Resin",
    "ABS-Like Resin V2",
    "High Speed Resin 2.0",
    "ABS-Like Resin Pro 2",
    "Tough Resin 2.0",
    "Tough Resin Ultra",
    "ABS-Like Resin Pro",
    "ABS-Like Resin+",
  ],
  Elegoo: [
    "Standard Photopolymer Resin",
    "ABS-Like Resin 2.0",
    "Water Washable Resin",
    "Standard Resin",
    "Standard Resin V2.0",
    "Rapid Standard Resin",
    "8K Standard Resin",
    "Water-Washable Resin",
    "Water-Washable Resin V2.0",
    "8K Water-Washable Resin",
    "Water-Washable ABS-Like Resin",
    "ABS-Like Resin",
    "ABS-Like Resin V2.0",
    "ABS-Like Resin V3.0",
    "ABS-Like Resin V3.0+",
    "ABS-Like Resin V3.0 Pro",
    "8K ABS-Like Resin V3.0",
    "ABS-Like Ultra Resin",
    "Tough Resin",
    "Plant-Based Resin",
  ],
  Creality: [
    "Standard Resin",
    "Water Washable Resin",
    "High Precision Resin",
    "Fast Resin",
  ],
  "Siraya Tech": ["Fast", "Blu", "Tenacious"],
  SUNLU: ["Standard Resin", "ABS-Like Resin"],
  "PioCreat / Aidis": [
    "16K Standard Resin",
    "16K Water-washable Resin",
    "Water-washable Resin 2.0",
    "Low Odor Rigid Resin",
    "ABS 2.0",
  ],
};
export function addPrinter(
  store: Store,
  draft: PrinterDraft,
): { store: Store; printer: Printer } {
  if (!draft.brand) throw new Error("Seleccioná la marca de tu impresora.");
  const modelName = draft.newModel.trim();
  let model = store.models.find(
    (m) => m.id === draft.modelId && m.brand === draft.brand,
  );
  let models = store.models;
  if (draft.modelId === CUSTOM) {
    if (!modelName) throw new Error("Ingresá el nombre del modelo.");
    model = store.models.find(
      (m) =>
        m.brand === draft.brand &&
        m.name.toLowerCase() === modelName.toLowerCase(),
    );
    if (!model) {
      model = {
        id: uid(),
        brand: draft.brand,
        name: modelName,
        validation: "pending",
      };
      models = [...models, model];
    }
  }
  if (!model) throw new Error("Seleccioná el modelo de tu impresora.");
  const printer: Printer = {
    id: uid(),
    modelId: model.id,
    name: draft.name.trim() || `${model.brand} ${model.name}`,
  };
  return {
    store: { ...store, models, printers: [...store.printers, printer] },
    printer,
  };
}
export function addResin(
  store: Store,
  draft: ResinDraft,
): { store: Store; resin: Resin } {
  const manufacturer = (
    draft.manufacturer === CUSTOM
      ? draft.customManufacturer
      : draft.manufacturer
  ).trim();
  const name = (draft.name === CUSTOM ? draft.customName : draft.name).trim();
  const color = (
    draft.color === CUSTOM ? draft.customColor : draft.color
  ).trim();
  if (!manufacturer || !name || !color)
    throw new Error("Completá el fabricante, la resina y el color.");
  // Reuse an identical material rather than silently multiplying catalog entries.
  const existing = store.resins.find(
    (r) =>
      r.manufacturer.toLowerCase() === manufacturer.toLowerCase() &&
      r.name.toLowerCase() === name.toLowerCase() &&
      r.color.toLowerCase() === color.toLowerCase(),
  );
  if (existing) return { store, resin: existing };
  const resin: Resin = { id: uid(), name, manufacturer, color };
  return { store: { ...store, resins: [...store.resins, resin] }, resin };
}
