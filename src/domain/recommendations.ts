import { comparable } from "./protocol";
import { analyze, fitResults, fmt } from "./calibration";
import type { Calibration, Trial } from "./types";
export const ENGINE_VERSION = "rounds-v1";
export const DEFAULT_METHOD = {
  exposureStep: 0.1,
  compensationStep: 0.025,
  chituboxOffsetsConfirmed: false,
};
export const q3 = (n: number) =>
  Math.round((n + Math.sign(n) * Number.EPSILON) * 1000) / 1000;
export type NextParameters = Pick<
  Trial,
  "exposure" | "scaleX" | "scaleY" | "compensationA" | "compensationB"
>;
export interface ParameterChange {
  label: string;
  before: number;
  after: number;
  unit: "s" | "%" | "mm";
}
export interface Recommendation {
  title: string;
  detail: string;
  kind: "good" | "warning" | "neutral";
  stage: "exposure" | "dimensional";
  code: string;
  nextExposure: number;
  plan: NextParameters;
  changes: ParameterChange[];
  lockedExposure: number | null;
}
export function recommendRound(
  trials: Trial[],
  method: Calibration["method"] = DEFAULT_METHOD,
): Recommendation {
  const current = trials.at(-1);
  if (!current) throw new Error("Se necesita un ensayo para recomendar.");
  const config = method ?? DEFAULT_METHOD;
  const a = analyze(current),
    fits = fitResults(current);
  const before = trials.slice(0, -1).filter((t) => comparable(t, current));
  const baseline = [...before].reverse().find((t) => t.supports === "stable");
  const functional = [...before]
    .reverse()
    .find((t) => analyze(t).fit && t.supports === "stable");
  const locked =
    functional && Math.abs(functional.exposure - current.exposure) < 0.0005
      ? functional.exposure
      : null;
  const plan: NextParameters = {
    exposure: current.exposure,
    scaleX: current.scaleX,
    scaleY: current.scaleY,
    compensationA: current.compensationA,
    compensationB: current.compensationB,
  };
  let stage: Recommendation["stage"] =
    locked !== null ? "dimensional" : "exposure";
  const done = (
    code: string,
    title: string,
    detail: string,
    kind: Recommendation["kind"] = "neutral",
  ): Recommendation => {
    const changes: ParameterChange[] = [];
    for (const [key, label, unit] of [
      ["exposure", "Exposición", "s"],
      ["scaleX", "Escala X", "%"],
      ["scaleY", "Escala Y", "%"],
      ["compensationA", "A interna", "mm"],
      ["compensationB", "B externa", "mm"],
    ] as const) {
      plan[key] = q3(plan[key]);
      if (Math.abs(plan[key] - current[key]) >= 0.0005)
        changes.push({ label, before: current[key], after: plan[key], unit });
    }
    return {
      code,
      title,
      detail,
      kind,
      stage,
      nextExposure: plan.exposure,
      plan,
      changes,
      lockedExposure: locked ?? (a.fit && a.stable ? current.exposure : null),
    };
  };
  if (!a.stable) {
    if (baseline && baseline.exposure > current.exposure) {
      plan.exposure = baseline.exposure;
      return done(
        "SUPPORT_FLOOR",
        "Primero, recuperá los soportes",
        `Los soportes fallaron al reducir la exposición. Volvé al último valor estable: ${fmt(baseline.exposure)} s. No uses esta pieza para compensar dimensiones. Revisá también orientación y distribución de soportes.`,
        "warning",
      );
    }
    return done(
      "SUPPORT_REVIEW",
      "Primero, recuperá los soportes",
      "No sigas bajando la exposición ni compenses con esta pieza. Revisá orientación, diámetro y distribución de soportes; repetí el ensayo con soportes estables.",
      "warning",
    );
  }
  if (fits.includes("tight") && fits.includes("loose"))
    return done(
      "LEGACY_CONFLICT",
      "Los encastres del registro anterior difieren",
      "Este registro anterior contiene dos encastres opuestos. Repetí un ensayo con el único pin de referencia antes de cambiar parámetros.",
      "warning",
    );
  if (!a.fit) {
    if (locked !== null) {
      if (!config.chituboxOffsetsConfirmed)
        return done(
          "INTERNAL_REVIEW",
          "Conservá la exposición y revisá A interna",
          "Ya hubo un encastre correcto y soportes estables con esta exposición. El encastre cambió: revisá primero lavado y curado; luego evaluá A interna. En Ajustes del método podés confirmar la convención de tu CHITUBOX para proponer un paso experimental de A. No se necesita medir el pin ni el hueco.",
          "warning",
        );
      const tight = fits.includes("tight");
      plan.compensationA = q3(
        current.compensationA +
          (tight ? -config.compensationStep : config.compensationStep),
      );
      return done(
        tight ? "INTERNAL_OPEN" : "INTERNAL_CLOSE",
        tight
          ? "Probá abrir el alojamiento con A"
          : "Probá cerrar el alojamiento con A",
        `Conservá la exposición funcional y cambiá solo A: ${fmt(current.compensationA)} → ${fmt(plan.compensationA)} mm. En la convención que confirmaste, A menor abre el hueco y A mayor lo cierra. Es un paso experimental: verificá el nuevo encastre; no es una medida calculada del hueco.`,
        "warning",
      );
    }
    const tight = fits.includes("tight");
    plan.exposure = q3(
      Math.max(
        0.001,
        current.exposure + (tight ? -config.exposureStep : config.exposureStep),
      ),
    );
    return done(
      tight ? "LOWER_EXPOSURE" : "RAISE_EXPOSURE",
      tight
        ? "Probá una reducción pequeña de exposición"
        : "Evaluá aumentar la exposición",
      `${tight ? "El pin no entra o queda ajustado." : "El pin entra suelto."} Probá ${fmt(plan.exposure)} s, un paso de ${fmt(config.exposureStep)} s. Es una hipótesis para el próximo ensayo; mantené escala, A y B. Si los soportes fallan al reducir, volvé a la última exposición estable.`,
      "warning",
    );
  }
  stage = "dimensional";
  if (a.passed)
    return done(
      "READY",
      "El ensayo cumple todos los criterios",
      "X e Y están dentro de ±0,050 mm, el pin entra con ajuste correcto y los soportes son estables. Podés finalizar o repetir para comprobar la precisión.",
      "good",
    );
  // Similar relative errors suggest one proportional adjustment, not two simultaneous mechanisms.
  if (
    !a.x.pass &&
    !a.y.pass &&
    Math.sign(a.x.deviation) === Math.sign(a.y.deviation) &&
    Math.abs(a.x.percent - a.y.percent) <= 0.25
  ) {
    plan.scaleX = q3((current.scaleX * a.x.scale) / 100);
    plan.scaleY = q3((current.scaleY * a.y.scale) / 100);
    return done(
      "SCALE_BOTH",
      "Conservá la exposición y ajustá el escalado",
      `El error relativo es parecido en ambos ejes. Probá escala X ${fmt(plan.scaleX)} % e Y ${fmt(plan.scaleY)} %, calculadas a partir de sus medidas. Conservá exposición, A y B; comprobá el encastre en la siguiente impresión.`,
    );
  }
  // Uniform offset needs an explicitly confirmed sign convention and errors on both axes.
  if (
    config.chituboxOffsetsConfirmed &&
    !a.x.pass &&
    !a.y.pass &&
    Math.sign(a.x.deviation) === Math.sign(a.y.deviation) &&
    Math.abs(a.x.deviation - a.y.deviation) <= 0.03
  ) {
    plan.compensationB = q3(
      current.compensationB - (a.x.deviation + a.y.deviation) / 4,
    );
    return done(
      "EXTERNAL_B",
      "Conservá la exposición y ajustá B externa",
      `Los errores absolutos son similares. Probá B ${fmt(current.compensationB)} → ${fmt(plan.compensationB)} mm como corrección por pared. Conservá escalas y A. Usamos la convención confirmada de tu slicer: B positivo expande el exterior. Verificá el resultado en un nuevo ensayo.`,
    );
  }
  const axis =
    !a.x.pass && (a.y.pass || Math.abs(a.x.percent) >= Math.abs(a.y.percent))
      ? "X"
      : "Y";
  if (axis === "X") plan.scaleX = q3((current.scaleX * a.x.scale) / 100);
  else plan.scaleY = q3((current.scaleY * a.y.scale) / 100);
  return done(
    "SCALE_AXIS",
    `Conservá la exposición y ajustá escala ${axis}`,
    `El eje ${axis} necesita la corrección prioritaria. Probá solo escala ${axis}: ${fmt(axis === "X" ? plan.scaleX : plan.scaleY)} %. Mantené el otro eje, exposición, A y B. Esta sugerencia usa nominal ÷ medido × escala aplicada; repetí antes de ajustar otro mecanismo.`,
  );
}
