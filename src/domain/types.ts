import type { TestContext } from "./protocol";
export type Brand =
  | "Phrozen"
  | "Anycubic"
  | "Elegoo"
  | "Creality"
  | "PioCreat / Aidis"
  | "PioNext";
export type Fit = "correct" | "tight" | "loose";
export type Supports = "stable" | "partial" | "failed";
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
export interface CalibrationMethod {
  exposureStep: number;
  compensationStep: number;
  chituboxOffsetsConfirmed: boolean;
}
export interface Trial {
  id: string;
  date: string;
  exposure: number;
  layer: number;
  x: number;
  y: number;
  pin?: Fit;
  /** Legacy two-fit records are retained only for historical consultation. */
  pin7?: Fit;
  pin5?: Fit;
  supports: Supports;
  notes: string;
  context?: TestContext;
  method?: CalibrationMethod;
  engineVersion?: string;
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
  context?: TestContext;
  startingPoint?: {
    calibrationId: string;
    trialId: string;
    sourceId: string | null;
    protocolVersion: string;
    parameters: Pick<
      Trial,
      | "exposure"
      | "layer"
      | "scaleX"
      | "scaleY"
      | "compensationA"
      | "compensationB"
    >;
  };
  method?: CalibrationMethod;
}
export interface Store {
  version: 1;
  sourceId?: string;
  models: PrinterModel[];
  printers: Printer[];
  resins: Resin[];
  calibrations: Calibration[];
}
