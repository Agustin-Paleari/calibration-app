import type { Trial } from "./types";
export const PROTOCOL_VERSION = "block-12x10-single-pin-v1";
export interface TestContext {
  referenceVersion: string;
  slicer: "CHITUBOX";
  slicerVersion: string;
  measurementStage: "post-cure" | "washed" | "unknown";
  instrument: "caliper" | "micrometer" | "other" | "unknown";
  washMinutes: number | null;
  cureMinutes: number | null;
  resinLot: string;
}
export const defaultContext = (): TestContext => ({
  referenceVersion: PROTOCOL_VERSION,
  slicer: "CHITUBOX",
  slicerVersion: "",
  measurementStage: "unknown",
  instrument: "unknown",
  washMinutes: null,
  cureMinutes: null,
  resinLot: "",
});
export function validContext(value: unknown): value is TestContext {
  if (!value || typeof value !== "object") return false;
  const c = value as TestContext;
  return (
    c.referenceVersion === PROTOCOL_VERSION &&
    c.slicer === "CHITUBOX" &&
    typeof c.slicerVersion === "string" &&
    typeof c.resinLot === "string" &&
    ["post-cure", "washed", "unknown"].includes(c.measurementStage) &&
    ["caliper", "micrometer", "other", "unknown"].includes(c.instrument) &&
    [c.washMinutes, c.cureMinutes].every(
      (n) =>
        n === null || (typeof n === "number" && Number.isFinite(n) && n >= 0),
    )
  );
}
export function comparable(a: Trial, b: Trial) {
  if (a.layer !== b.layer || (a.pin === undefined) !== (b.pin === undefined))
    return false;
  const left = a.context ?? defaultContext(),
    right = b.context ?? defaultContext();
  return (Object.keys(defaultContext()) as (keyof TestContext)[]).every(
    (key) => left[key] === right[key],
  );
}
