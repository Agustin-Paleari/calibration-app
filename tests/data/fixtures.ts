import type { Store, Trial } from "../../src/domain/types";
import { emptyStore } from "../../src/data/catalog";
import { defaultContext } from "../../src/domain/protocol";
export function sampleTrial(patch: Partial<Trial> = {}): Trial {
  return {
    id: "trial-a",
    date: "2026-10-09",
    exposure: 2.5,
    layer: 0.05,
    x: 12,
    y: 10,
    pin: "correct",
    supports: "stable",
    notes: "",
    scaleX: 100,
    scaleY: 100,
    compensationA: 0,
    compensationB: 0,
    context: defaultContext(),
    ...patch,
  };
}
/** Synthetic fixture only; never presented as a measured public recipe. */
export function sampleStore(sourceId = "source-a", exposure = 2.5): Store {
  const s = emptyStore();
  return {
    ...s,
    sourceId,
    printers: [
      { id: "printer-a", modelId: s.models[0].id, name: "Equipo de prueba" },
    ],
    resins: [
      {
        id: "resin-a",
        name: "Resina de prueba",
        manufacturer: "Fabricante de prueba",
        color: "Gris",
      },
    ],
    calibrations: [
      {
        id: "calibration-a",
        printerId: "printer-a",
        resinId: "resin-a",
        name: "Calibración de prueba",
        createdAt: "2026-10-09T00:00:00Z",
        completedAt: "2026-10-09T01:00:00Z",
        trials: [sampleTrial({ exposure })],
      },
    ],
  };
}
