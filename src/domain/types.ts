export type Brand =
  "Phrozen" | "Anycubic" | "Elegoo" | "Creality" | "PioCreat / Aidis";
export type Fit = "correct" | "tight" | "loose";
export type Supports = "stable" | "failed";
export interface PrinterModel {
  id: string;
  brand: Brand;
  name: string;
  validation: "catalog" | "pending";
}
export interface Printer {
  id: string;
  modelId: string;
  name: string;
}
export interface Resin {
  id: string;
  name: string;
  manufacturer: string;
  color: string;
}
export interface Trial {
  id: string;
  date: string;
  exposure: number;
  layer: number;
  x: number;
  y: number;
  pin7: Fit;
  pin5: Fit;
  supports: Supports;
  notes: string;
  scaleX: number;
  scaleY: number;
  compensationA: number;
  compensationB: number;
}
export interface Calibration {
  id: string;
  printerId: string;
  resinId: string;
  name: string;
  createdAt: string;
  completedAt: string | null;
  trials: Trial[];
}
export interface Store {
  version: 1;
  models: PrinterModel[];
  printers: Printer[];
  resins: Resin[];
  calibrations: Calibration[];
}
