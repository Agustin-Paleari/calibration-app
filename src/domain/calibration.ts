import type { Trial } from "./types";
export const REFERENCE = Object.freeze({
  x: 12,
  y: 10,
  pin7: 7,
  pin5: 5,
  hole7: 7.1,
  hole5: 5.1,
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
export function analyze(t: Trial) {
  const x = dimension(t.x, REFERENCE.x),
    y = dimension(t.y, REFERENCE.y);
  const fit = t.pin7 === "correct" && t.pin5 === "correct";
  const stable = t.supports === "stable";
  return { x, y, fit, stable, passed: x.pass && y.pass && fit && stable };
}
export interface Recommendation {
  title: string;
  detail: string;
  kind: "good" | "warning" | "neutral";
  nextExposure: number;
}
export function recommend(t: Trial, previous?: Trial): Recommendation {
  const a = analyze(t);
  if (!a.stable)
    return {
      title: "Primero, recuperá los soportes",
      detail: `${previous && t.exposure < previous.exposure ? "Los soportes fallaron al reducir la exposición. " : ""}No sigas bajando la exposición. Revisá orientación, diámetro y distribución de soportes; repetí el ensayo. Si la falla apareció al reducir exposición, probá el último valor estable.`,
      kind: "warning",
      nextExposure:
        previous &&
        previous.supports === "stable" &&
        previous.exposure > t.exposure
          ? previous.exposure
          : t.exposure,
    };
  if (
    (t.pin7 === "tight" && t.pin5 === "loose") ||
    (t.pin7 === "loose" && t.pin5 === "tight")
  )
    return {
      title: "Los encastres dan señales opuestas",
      detail:
        "Revisá limpieza, curado y ambos alojamientos. Repetí con la misma exposición antes de hacer un ajuste global.",
      kind: "warning",
      nextExposure: t.exposure,
    };
  if (t.pin7 === "tight" || t.pin5 === "tight")
    return {
      title: "Probá una reducción pequeña de exposición",
      detail:
        "El encastre ajustado puede indicar sobreexposición. Como ensayo exploratorio, reducí un 5 % y verificá nuevamente los pines y soportes. Si los soportes fallan, volvé al último valor estable; no continúes reduciendo.",
      kind: "warning",
      nextExposure: Math.round(t.exposure * 0.95 * 1000) / 1000,
    };
  if (t.pin7 === "loose" || t.pin5 === "loose")
    return {
      title: "Evaluá aumentar la exposición",
      detail:
        "Los pines sueltos pueden sugerir exposición insuficiente. Probá un incremento exploratorio del 5 % y verificá que el encastre mejore. También revisá lavado, curado y desgaste de la pieza.",
      kind: "warning",
      nextExposure: Math.round(t.exposure * 1.05 * 1000) / 1000,
    };
  if (!a.x.pass || !a.y.pass)
    return {
      title: "Conservá la exposición y ajustá dimensiones",
      detail:
        "Los pines encastran y los soportes resistieron. Mantené la exposición; evaluá compensación externa o escalado por eje, de a un mecanismo por vez, y repetí la medición.",
      kind: "neutral",
      nextExposure: t.exposure,
    };
  return {
    title: "El ensayo cumple todos los criterios",
    detail:
      "X e Y están dentro de ±0,050 mm, ambos pines encastran y los soportes son estables. Podés finalizar la calibración. Un ensayo adicional permite comprobar repetibilidad.",
    kind: "good",
    nextExposure: t.exposure,
  };
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
export function validateTrial(t: Trial): string | null {
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
  if (
    !["correct", "tight", "loose"].includes(t.pin7) ||
    !["correct", "tight", "loose"].includes(t.pin5) ||
    !["stable", "failed"].includes(t.supports)
  )
    return "Completá los resultados de pines y soportes.";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(t.date) ||
    Number.isNaN(Date.parse(t.date)) ||
    new Date(t.date).toISOString().slice(0, 10) !== t.date
  )
    return "Ingresá una fecha válida.";
  return null;
}
