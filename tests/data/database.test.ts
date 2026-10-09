import { afterEach, expect, it } from "vitest";
import {
  openDatabase,
  ingest,
  stats,
  listProfiles,
} from "../../scripts/database";
import { sampleStore, sampleTrial } from "./fixtures";
const databases: ReturnType<typeof openDatabase>[] = [];
function database() {
  const db = openDatabase();
  databases.push(db);
  return db;
}
afterEach(() => databases.splice(0).forEach((db) => db.close()));
it("conserva exposiciones distintas de dos personas para el mismo modelo, resina y capa", () => {
  const db = database();
  ingest(db, JSON.stringify(sampleStore("person-a", 2.4)));
  ingest(db, JSON.stringify(sampleStore("person-b", 2.8)));
  const profiles = listProfiles(db);
  expect(profiles).toHaveLength(2);
  expect(profiles.map((p) => p.exposure_s).sort()).toEqual([2.4, 2.8]);
  expect(new Set(profiles.map((p) => p.source_id)).size).toBe(2);
  expect(stats(db)).toMatchObject({
    sources: 2,
    resin_products: 1,
    printer_units: 2,
    calibrations: 2,
    trials: 2,
    candidate_profiles: 2,
  });
  expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
});
it("conserva dos calibraciones de una misma persona con exposiciones diferentes sin deduplicar resultados", () => {
  const db = database(),
    store = sampleStore();
  store.calibrations.push({
    ...store.calibrations[0],
    id: "calibration-b",
    trials: [sampleTrial({ id: "trial-b", exposure: 3.1 })],
  });
  ingest(db, JSON.stringify(store));
  expect(listProfiles(db)).toHaveLength(2);
});
it("reimportar exactamente el mismo respaldo es idempotente", () => {
  const db = database(),
    raw = JSON.stringify(sampleStore());
  expect(ingest(db, raw).insertedTrials).toBe(1);
  expect(ingest(db, raw)).toMatchObject({ replayed: true, insertedTrials: 0 });
  expect(stats(db).trials).toBe(1);
});
it("rechaza la modificación de un ensayo y revierte todo el lote", () => {
  const db = database(),
    store = sampleStore();
  ingest(db, JSON.stringify(store));
  const counts = stats(db);
  store.printers.push({
    id: "new-printer",
    modelId: store.models[0].id,
    name: "Nuevo equipo",
  });
  store.calibrations[0].trials[0].exposure = 3;
  expect(() => ingest(db, JSON.stringify(store))).toThrow(
    "ensayo importado cambió",
  );
  expect(stats(db)).toEqual(counts);
  expect(listProfiles(db)[0].exposure_s).toBe(2.5);
});
it("admite nuevos ensayos y preserva los anteriores al reabrir y finalizar", () => {
  const db = database(),
    store = sampleStore();
  ingest(db, JSON.stringify(store));
  store.calibrations[0].completedAt = null;
  store.calibrations[0].trials.push(
    sampleTrial({ id: "trial-b", exposure: 2.8 }),
  );
  ingest(db, JSON.stringify(store));
  expect(stats(db).trials).toBe(2);
  expect(listProfiles(db)).toHaveLength(0);
  store.calibrations[0].completedAt = "2026-10-09T02:00:00Z";
  ingest(db, JSON.stringify(store));
  expect(listProfiles(db)[0].exposure_s).toBe(2.8);
  expect(stats(db).trials).toBe(2);
});
it("rechaza respaldos truncados y no permite que un resultado anterior reemplace el último", () => {
  const db = database(),
    store = sampleStore();
  store.calibrations[0].trials.push(
    sampleTrial({ id: "trial-b", exposure: 2.8 }),
  );
  ingest(db, JSON.stringify(store));
  store.calibrations[0].trials.pop();
  store.calibrations[0].name = "Nombre cambiado";
  expect(() => ingest(db, JSON.stringify(store))).toThrow("faltan ensayos");
  expect(listProfiles(db)[0].exposure_s).toBe(2.8);
});
it("requiere origen estable para respaldos antiguos y conserva su protocolo separado", () => {
  const db = database(),
    store = sampleStore();
  delete store.sourceId;
  const t = store.calibrations[0].trials[0];
  delete t.pin;
  t.pin7 = "correct";
  t.pin5 = "correct";
  delete t.context;
  expect(() => ingest(db, JSON.stringify(store))).toThrow(
    "identificador estable",
  );
  ingest(db, JSON.stringify(store), "legacy-a");
  expect(stats(db).trials).toBe(1);
  expect(listProfiles(db)).toHaveLength(0);
  expect(db.prepare("SELECT protocol_id FROM trials").get()!.protocol_id).toBe(
    "legacy-two-fit-v1",
  );
});
it("un perfil nuevo nunca se presenta como revisado por un tercero", () => {
  const db = database();
  ingest(db, JSON.stringify(sampleStore()));
  expect(listProfiles(db)[0].review_status).toBe("unreviewed");
});
it("no borra recetas ni ensayos cuando un respaldo omite una calibración", () => {
  const db = database(),
    store = sampleStore();
  ingest(db, JSON.stringify(store));
  store.calibrations = [];
  ingest(db, JSON.stringify(store));
  expect(stats(db).trials).toBe(1);
  expect(listProfiles(db)).toHaveLength(1);
});
it("SQLite impide actualizar directamente una observación archivada", () => {
  const db = database();
  ingest(db, JSON.stringify(sampleStore()));
  expect(() => db.prepare("UPDATE trials SET exposure_s=3").run()).toThrow(
    "immutable",
  );
  expect(listProfiles(db)[0].exposure_s).toBe(2.5);
});
it("distingue colores y fabricantes en vez de fusionar productos que comparten nombre", () => {
  const db = database(),
    a = sampleStore("a"),
    b = sampleStore("b"),
    c = sampleStore("c");
  b.resins[0].color = "Negro";
  c.resins[0].manufacturer = "Otro fabricante";
  for (const s of [a, b, c]) ingest(db, JSON.stringify(s));
  expect(stats(db).resin_products).toBe(3);
  expect(listProfiles(db)).toHaveLength(3);
});
