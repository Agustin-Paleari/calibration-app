import { expect, it } from "vitest";
import { defaultContext, validContext, comparable } from "./protocol";
import { sampleTrial } from "../../tests/data/fixtures";
it("no inventa instrumento, lote ni procedimiento", () => {
  expect(defaultContext()).toMatchObject({
    instrument: "unknown",
    measurementStage: "unknown",
    washMinutes: null,
    cureMinutes: null,
    resinLot: "",
  });
});
it("valida el procedimiento y los tiempos opcionales", () => {
  expect(validContext(defaultContext())).toBe(true);
  for (const patch of [
    { washMinutes: -1 },
    { cureMinutes: NaN },
    { referenceVersion: "different" },
    { instrument: "unknown-instrument" },
    { slicer: "Other" },
  ])
    expect(validContext({ ...defaultContext(), ...patch })).toBe(false);
});
it("compara campos, independientemente del orden de claves de un respaldo", () => {
  const context = defaultContext(),
    reordered = Object.fromEntries(
      Object.entries(context).reverse(),
    ) as typeof context;
  expect(
    comparable(sampleTrial({ context }), sampleTrial({ context: reordered })),
  ).toBe(true);
});
