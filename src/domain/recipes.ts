import { analyze } from "./calibration";
import { comparable, PROTOCOL_VERSION } from "./protocol";
import type { Calibration, Store, Trial } from "./types";
import { uid } from "../data/catalog";
export function recipeQuality(c: Calibration) {
  const last = c.trials.at(-1);
  if (!last)
    return {
      repetitions: 0,
      traceable: false,
      missing: ["Sin ensayos"],
      reviewStatus: "unreviewed" as const,
    };
  const missing: string[] = [];
  if (!last.context || last.context.measurementStage === "unknown")
    missing.push("Momento de medición");
  if (!last.context || last.context.instrument === "unknown")
    missing.push("Instrumento");
  if (!last.context?.slicerVersion.trim()) missing.push("Versión de CHITUBOX");
  if (!last.context?.resinLot.trim()) missing.push("Lote de resina");
  if (last.context?.washMinutes == null) missing.push("Tiempo de lavado");
  if (last.context?.cureMinutes == null) missing.push("Tiempo de curado");
  if (last.pin === undefined)
    missing.push("Protocolo anterior de dos encastres");
  const parameters = (t: Trial) => [
    t.exposure,
    t.scaleX,
    t.scaleY,
    t.compensationA,
    t.compensationB,
  ];
  const repetitions = c.trials.filter(
    (t) =>
      analyze(t).passed &&
      t.pin !== undefined &&
      comparable(t, last) &&
      parameters(t).every((v, i) => v === parameters(last)[i]),
  ).length;
  return {
    repetitions,
    traceable: missing.length === 0,
    missing,
    reviewStatus: "unreviewed" as const,
  };
}
export function savedRecipes(store: Store) {
  return store.calibrations.filter(
    (c) =>
      c.completedAt &&
      c.trials.at(-1)?.pin !== undefined &&
      analyze(c.trials.at(-1)!).passed,
  );
}
export function reuseRecipe(
  store: Store,
  id: string,
): { store: Store; calibration: Calibration } {
  const original = savedRecipes(store).find((c) => c.id === id);
  if (!original)
    throw new Error("La receta debe estar finalizada con el protocolo actual.");
  const last = original.trials.at(-1)!;
  const calibration: Calibration = {
    id: uid(),
    name: `Verificar · ${original.name}`,
    printerId: original.printerId,
    resinId: original.resinId,
    createdAt: new Date().toISOString(),
    completedAt: null,
    trials: [],
    method: last.method ?? original.method,
    context: last.context,
    startingPoint: {
      calibrationId: original.id,
      trialId: last.id,
      sourceId: store.sourceId ?? null,
      protocolVersion: PROTOCOL_VERSION,
      parameters: {
        exposure: last.exposure,
        layer: last.layer,
        scaleX: last.scaleX,
        scaleY: last.scaleY,
        compensationA: last.compensationA,
        compensationB: last.compensationB,
      },
    },
  };
  return {
    store: { ...store, calibrations: [...store.calibrations, calibration] },
    calibration,
  };
}
