import { validContext } from "./protocol";
import type { Fit, Trial, CalibrationMethod } from "./types";
export const REFERENCE = Object.freeze({
  x: 12,
  y: 10,
  tolerance: 0.05,
});
export const fmt = (n: number) =>
  n.toLocaleString("es-AR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
export function dimension(measured: number, nominal: number) {
  if (
    !Number.isFinite(measured) ||
    measured <= 0 ||
    !Number.isFinite(nominal) ||
    nominal <= 0
  )
    throw new Error("La medida debe ser un número positivo.");
  const deviation = measured - nominal;
  return {
    deviation,
    percent: (deviation / nominal) * 100,
    scale: (nominal / measured) * 100,
    pass: Math.abs(deviation) <= REFERENCE.tolerance + 1e-9,
  };
}
export function fitResults(t: Trial): Fit[] {
  return t.pin !== undefined
    ? [t.pin]
    : [t.pin7, t.pin5].filter((fit): fit is Fit => fit !== undefined);
}
export function analyze(t: Trial) {
  const x = dimension(t.x, REFERENCE.x),
    y = dimension(t.y, REFERENCE.y);
  const fit =
    t.pin !== undefined
      ? t.pin === "correct"
      : t.pin7 === "correct" && t.pin5 === "correct";
  const stable = t.supports === "stable";
  return { x, y, fit, stable, passed: x.pass && y.pass && fit && stable };
}
export function externalCompensation(t: Trial) {
  const a = analyze(t);
  // Geometric change per wall, NOT a claim about CHITUBOX's version-specific sign convention.
  return {
    xPerWall: -a.x.deviation / 2,
    yPerWall: -a.y.deviation / 2,
    uniform: Math.abs(a.x.deviation - a.y.deviation) <= REFERENCE.tolerance,
  };
}
export function internalCompensation(
  measuredHole: number,
  nominalHole: number,
) {
  return -dimension(measuredHole, nominalHole).deviation / 2;
}
export function validMethod(value: unknown): value is CalibrationMethod {
  if (!value || typeof value !== "object") return false;
  const m = value as CalibrationMethod;
  return (
    Number.isFinite(m.exposureStep) &&
    m.exposureStep >= 0.001 &&
    Number.isFinite(m.compensationStep) &&
    m.compensationStep >= 0.001 &&
    typeof m.chituboxOffsetsConfirmed === "boolean"
  );
}
export function validateTrial(t: Trial): string | null {
  if (t.method !== undefined && !validMethod(t.method))
    return "El método del ensayo no es válido.";
  if (
    t.engineVersion !== undefined &&
    (typeof t.engineVersion !== "string" || !t.engineVersion.trim())
  )
    return "La versión del análisis no es válida.";

  if (t.context !== undefined && !validContext(t.context))
    return "El procedimiento del ensayo no es válido.";
  for (const [label, value] of [
    ["Exposición", t.exposure],
    ["Altura de capa", t.layer],
    ["Medida X", t.x],
    ["Medida Y", t.y],
    ["Escala X", t.scaleX],
    ["Escala Y", t.scaleY],
  ] as const)
    if (!Number.isFinite(value) || value <= 0)
      return `${label}: ingresá un número mayor a cero.`;
  if (t.layer > 1) return "La altura de capa debe ser menor o igual a 1 mm.";
  if (!Number.isFinite(t.compensationA) || !Number.isFinite(t.compensationB))
    return "Las compensaciones deben ser números válidos.";
  const validFits = ["correct", "tight", "loose"];
  if (t.pin !== undefined) {
    if (!validFits.includes(t.pin)) return "Seleccioná el encastre del pin.";
  } else if (
    !validFits.includes(t.pin7 ?? "") ||
    !validFits.includes(t.pin5 ?? "")
  )
    return "Completá el resultado de encastre.";
  if (!["stable", "partial", "failed"].includes(t.supports))
    return "Completá el estado de los soportes.";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(t.date) ||
    Number.isNaN(Date.parse(t.date)) ||
    new Date(t.date).toISOString().slice(0, 10) !== t.date
  )
    return "Ingresá una fecha válida.";
  return null;
}
