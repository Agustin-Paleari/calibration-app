import type { Store } from "../domain/types";
import { emptyStore } from "./catalog";
import { analyze, validateTrial } from "../domain/calibration";
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
      ![
        "Phrozen",
        "Anycubic",
        "Elegoo",
        "Creality",
        "PioCreat / Aidis",
      ].includes(String(m.brand)) ||
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
      !s.printers.some((p) => p.id === c.printerId) ||
      !s.resins.some((r) => r.id === c.resinId) ||
      !Array.isArray(c.trials) ||
      !(c.completedAt === null || text(c.completedAt))
    )
      throw new Error("Calibración inválida.");
    checkId(c.id);
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
    return raw ? parseStore(raw) : emptyStore();
  },
  save(store) {
    localStorage.setItem(KEY, JSON.stringify(store));
  },
};
