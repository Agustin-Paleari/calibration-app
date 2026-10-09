import type { Store } from "../domain/types";
import { BRANDS, emptyStore, withCurrentCatalog } from "./catalog";
import { validContext, PROTOCOL_VERSION } from "../domain/protocol";
import { analyze, validateTrial, validMethod } from "../domain/calibration";
const KEY = "calibration-hub:v1";
export interface Repository {
  load(): Store;
  save(store: Store): void;
}
function record(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
function text(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}
export function parseStore(raw: string): Store {
  const s: unknown = JSON.parse(raw);
  if (
    !record(s) ||
    s.version !== 1 ||
    !Array.isArray(s.models) ||
    !Array.isArray(s.printers) ||
    !Array.isArray(s.resins) ||
    !Array.isArray(s.calibrations)
  )
    throw new Error("Formato de respaldo no compatible.");
  if (s.sourceId !== undefined && !text(s.sourceId))
    throw new Error("Origen del respaldo inválido.");
  const ids = new Set<string>();
  const checkId = (v: unknown) => {
    if (!text(v) || ids.has(v))
      throw new Error("Identificadores inválidos o duplicados.");
    ids.add(v);
  };
  for (const m of s.models) {
    if (
      !record(m) ||
      !text(m.name) ||
      !BRANDS.includes(m.brand as Store["models"][number]["brand"]) ||
      !["catalog", "pending"].includes(String(m.validation))
    )
      throw new Error("Modelo inválido.");
    checkId(m.id);
  }
  for (const p of s.printers) {
    if (
      !record(p) ||
      !text(p.name) ||
      !s.models.some((m) => m.id === p.modelId)
    )
      throw new Error("Impresora inválida.");
    checkId(p.id);
  }
  for (const r of s.resins) {
    if (!record(r) || !text(r.name) || !text(r.manufacturer) || !text(r.color))
      throw new Error("Resina inválida.");
    checkId(r.id);
  }
  for (const c of s.calibrations) {
    if (
      !record(c) ||
      !text(c.name) ||
      !text(c.createdAt) ||
      !Number.isFinite(Date.parse(c.createdAt)) ||
      !s.printers.some((p) => p.id === c.printerId) ||
      !s.resins.some((r) => r.id === c.resinId) ||
      !Array.isArray(c.trials) ||
      !(
        c.completedAt === null ||
        (text(c.completedAt) &&
          Number.isFinite(Date.parse(c.completedAt)) &&
          Date.parse(c.completedAt) >= Date.parse(String(c.createdAt)))
      )
    )
      throw new Error("Calibración inválida.");
    checkId(c.id);
    if (c.context !== undefined && !validContext(c.context))
      throw new Error("Procedimiento de calibración inválido.");
    if (c.startingPoint !== undefined) {
      const seed = c.startingPoint;
      if (
        !record(seed) ||
        !text(seed.calibrationId) ||
        !text(seed.trialId) ||
        !(seed.sourceId === null || text(seed.sourceId)) ||
        seed.protocolVersion !== PROTOCOL_VERSION ||
        !record(seed.parameters)
      )
        throw new Error("Origen de la receta inválido.");
      const parameters = seed.parameters;
      for (const key of ["exposure", "layer", "scaleX", "scaleY"] as const)
        if (
          typeof parameters[key] !== "number" ||
          !Number.isFinite(parameters[key]) ||
          parameters[key] <= 0
        )
          throw new Error("Parámetros de la receta inválidos.");
      if (
        Number(parameters.layer) > 1 ||
        ["compensationA", "compensationB"].some(
          (key) =>
            typeof parameters[key] !== "number" ||
            !Number.isFinite(parameters[key]),
        )
      )
        throw new Error("Parámetros de la receta inválidos.");
    }
    if (c.method !== undefined && !validMethod(c.method))
      throw new Error("Parámetros del método inválidos.");

    for (const t of c.trials) {
      if (
        !record(t) ||
        typeof t.notes !== "string" ||
        validateTrial(
          t as unknown as Store["calibrations"][number]["trials"][number],
        )
      )
        throw new Error("Ensayo inválido.");
      checkId(t.id);
    }
    if (
      c.completedAt &&
      (!c.trials.length ||
        !analyze(
          c.trials.at(-1) as Store["calibrations"][number]["trials"][number],
        ).passed)
    )
      throw new Error(
        "Una calibración finalizada debe tener un último ensayo aprobado.",
      );
  }
  return s as unknown as Store;
}
export const localRepository: Repository = {
  load() {
    const raw = localStorage.getItem(KEY);
    const store = raw ? withCurrentCatalog(parseStore(raw)) : emptyStore();
    if (!store.sourceId) {
      const id =
        localStorage.getItem("calibration-hub:source") ?? crypto.randomUUID();
      localStorage.setItem("calibration-hub:source", id);
      return { ...store, sourceId: id };
    }
    return store;
  },
  save(store) {
    localStorage.setItem(KEY, JSON.stringify(store));
  },
};
