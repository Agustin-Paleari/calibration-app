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
