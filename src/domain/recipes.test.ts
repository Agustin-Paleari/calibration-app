import { expect, it } from "vitest";
import { sampleStore, sampleTrial } from "../../tests/data/fixtures";
import { recipeQuality, reuseRecipe, savedRecipes } from "./recipes";
import { defaultContext } from "./protocol";
import { parseStore } from "../data/storage";
it("dos recetas de una misma combinación y con exposiciones distintas se muestran por separado", () => {
  const s = sampleStore();
  s.calibrations.push({
    ...s.calibrations[0],
    id: "second",
    trials: [sampleTrial({ id: "second-trial", exposure: 2.8 })],
  });
  expect(savedRecipes(s)).toHaveLength(2);
});
it("reutilizar una receta crea una calibración vacía con origen y parámetros, sin copiar resultados", () => {
  const s = sampleStore(),
    before = JSON.stringify(s),
    { store, calibration } = reuseRecipe(s, s.calibrations[0].id);
  expect(JSON.stringify(s)).toBe(before);
  expect(calibration.trials).toEqual([]);
  expect(calibration.completedAt).toBeNull();
  expect(calibration.startingPoint).toMatchObject({
    sourceId: s.sourceId,
    trialId: "trial-a",
    parameters: { exposure: 2.5, layer: 0.05 },
  });
  expect(store.calibrations).toHaveLength(2);
  expect(parseStore(JSON.stringify(store))).toEqual(store);
});
it("contabiliza repeticiones solo con los mismos parámetros y procedimiento", () => {
  const c = sampleStore().calibrations[0];
  c.trials.push(
    sampleTrial({ id: "different", exposure: 2.8 }),
    sampleTrial({ id: "repeat" }),
  );
  expect(recipeQuality(c).repetitions).toBe(2);
  c.trials.push(
    sampleTrial({
      id: "cured",
      context: { ...defaultContext(), measurementStage: "post-cure" },
    }),
  );
  expect(recipeQuality(c).repetitions).toBe(1);
});
it("no llama trazable a un resultado que omite su procedimiento", () => {
  const c = sampleStore().calibrations[0];
  expect(recipeQuality(c).traceable).toBe(false);
  c.trials[0].context = {
    ...defaultContext(),
    measurementStage: "post-cure",
    instrument: "caliper",
    slicerVersion: "2.3",
    resinLot: "lot-a",
    washMinutes: 3,
    cureMinutes: 5,
  };
  expect(recipeQuality(c)).toMatchObject({
    traceable: true,
    missing: [],
    reviewStatus: "unreviewed",
  });
});
it("un registro antiguo no se convierte automáticamente en una receta del protocolo nuevo", () => {
  const s = sampleStore(),
    t = s.calibrations[0].trials[0];
  delete t.pin;
  t.pin7 = "correct";
  t.pin5 = "correct";
  expect(savedRecipes(s)).toEqual([]);
  expect(() => reuseRecipe(s, s.calibrations[0].id)).toThrow();
});
