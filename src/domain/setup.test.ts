import { expect, it } from "vitest";
import { emptyStore } from "../data/catalog";
import {
  addPrinter,
  addResin,
  CUSTOM,
  newPrinterDraft,
  newResinDraft,
} from "./setup";
it("agregar equipo devuelve un catálogo nuevo y no altera el original", () => {
  const source = emptyStore();
  const model = source.models[0];
  const result = addPrinter(source, {
    ...newPrinterDraft(),
    brand: model.brand,
    modelId: model.id,
  });
  expect(source.printers).toHaveLength(0);
  expect(result.store.printers).toHaveLength(1);
  expect(result.printer.name).toBe(`${model.brand} ${model.name}`);
});
it("un modelo nuevo queda pendiente y su nombre no duplica el catálogo", () => {
  const draft = {
    ...newPrinterDraft(),
    brand: "PioCreat / Aidis" as const,
    modelId: CUSTOM,
    newModel: "Equipo nuevo",
  };
  const first = addPrinter(emptyStore(), draft);
  const second = addPrinter(first.store, {
    ...draft,
    newModel: "EQUIPO NUEVO",
  });
  expect(
    second.store.models.filter((m) => m.brand === "PioCreat / Aidis"),
  ).toHaveLength(1);
  expect(second.store.models.at(-1)?.validation).toBe("pending");
});
it("reutiliza una resina idéntica y valida entradas de nombre vacío", () => {
  const draft = {
    ...newResinDraft(),
    manufacturer: "Phrozen",
    name: "Aqua Gray 8K",
  };
  const first = addResin(emptyStore(), draft);
  const second = addResin(first.store, draft);
  expect(second.store.resins).toHaveLength(1);
  expect(second.resin.id).toBe(first.resin.id);
  expect(() =>
    addResin(first.store, { ...draft, name: CUSTOM, customName: " " }),
  ).toThrow();
});
