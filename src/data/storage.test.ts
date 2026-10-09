import { expect, it } from "vitest";
import { parseStore } from "./storage";
import { emptyStore } from "./catalog";
it("exporta e importa un catálogo sin alterar sus datos", () => {
  const s = emptyStore();
  expect(parseStore(JSON.stringify(s))).toEqual(s);
});
it("rechaza JSON inválido, versión incompatible y referencias rotas", () => {
  expect(() => parseStore("{")).toThrow();
  expect(() => parseStore('{"version":2}')).toThrow();
  expect(() =>
    parseStore(
      JSON.stringify({
        ...emptyStore(),
        printers: [{ id: "p", name: "Equipo", modelId: "missing" }],
      }),
    ),
  ).toThrow();
});
it("rechaza identificadores duplicados", () => {
  const s = emptyStore();
  s.models.push(s.models[0]);
  expect(() => parseStore(JSON.stringify(s))).toThrow();
});
it("no acepta una calibración finalizada sin un ensayo aprobado", () => {
  const s = emptyStore();
  s.printers = [{ id: "p", name: "Equipo", modelId: s.models[0].id }];
  s.resins = [
    { id: "r", name: "Resina", manufacturer: "Marca", color: "Gris" },
  ];
  s.calibrations = [
    {
      id: "c",
      name: "Calibración",
      printerId: "p",
      resinId: "r",
      createdAt: "2026-10-08T00:00:00Z",
      completedAt: "2026-10-08T00:00:00Z",
      trials: [],
    },
  ];
  expect(() => parseStore(JSON.stringify(s))).toThrow("último ensayo aprobado");
});
it("rechaza métodos, procedimiento y parámetros de origen inválidos sin inventar valores", async () => {
  const { sampleStore } = await import("../../tests/data/fixtures");
  for (const patch of [
    {
      method: {
        exposureStep: 0,
        compensationStep: 0.025,
        chituboxOffsetsConfirmed: false,
      },
    },
    { context: { measurementStage: "post-cure" } },
    { startingPoint: { parameters: { exposure: 0 } } },
  ]) {
    const s = sampleStore();
    Object.assign(s.calibrations[0], patch);
    expect(() => parseStore(JSON.stringify(s))).toThrow();
  }
});
it("mantiene campos antiguos y fechas reales al restaurar", async () => {
  const { sampleStore } = await import("../../tests/data/fixtures");
  const s = sampleStore(),
    t = s.calibrations[0].trials[0];
  delete t.pin;
  delete t.context;
  t.pin7 = "correct";
  t.pin5 = "correct";
  delete s.sourceId;
  expect(parseStore(JSON.stringify(s))).toEqual(s);
  s.calibrations[0].createdAt = "fecha inventada";
  expect(() => parseStore(JSON.stringify(s))).toThrow("Calibración inválida");
});
