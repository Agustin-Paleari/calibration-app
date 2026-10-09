import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseStore } from "../src/data/storage";
import { analyze } from "../src/domain/calibration";
import { recipeQuality } from "../src/domain/recipes";
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
const hash = (v: unknown) =>
  createHash("sha256").update(canonical(v)).digest("hex");
const normalized = (s: string) =>
  s.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
export function openDatabase(path = ":memory:") {
  const db = new DatabaseSync(path);
  try {
    db.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      )
      .all();
    if (tables.length) {
      if (!tables.some((t) => t.name === "schema_version"))
        throw new Error(
          "El archivo pertenece a otra aplicación. Elegí una base SQLite nueva.",
        );
      const versions = db.prepare("SELECT version FROM schema_version").all();
      if (versions.length !== 1 || versions[0].version !== 1)
        throw new Error(
          "Versión de esquema no compatible; se requiere una migración explícita.",
        );
    }
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(
        readFileSync(
          new URL("../database/001_initial.sql", import.meta.url),
          "utf8",
        ),
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  } catch (error) {
    db.close();
    throw error;
  }
  return db;
}
/** Atomic archive ingestion. A repeated source/trial ID may never change its measured data. */
export function ingest(db: DatabaseSync, raw: string, legacySourceId?: string) {
  const store = parseStore(raw);
  const source = store.sourceId ?? legacySourceId;
  if (!source?.trim())
    throw new Error(
      "Este respaldo antiguo requiere --source con un identificador estable del origen.",
    );
  const digest = hash(JSON.parse(raw));
  const existing = db
    .prepare("SELECT 1 FROM ingestion_batches WHERE source_id=? AND digest=?")
    .get(source, digest);
  if (existing) return { source, insertedTrials: 0, replayed: true };
  const now = new Date().toISOString();
  let insertedTrials = 0;
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(
      "INSERT INTO sources VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen",
    ).run(source, now, now);
    const models = new Map<string, string>(),
      resins = new Map<string, string>();
    for (const model of store.models) {
      const brand = normalized(model.brand),
        name = normalized(model.name),
        id = hash(["printer", brand, name]);
      models.set(model.id, id);
      db.prepare(
        "INSERT INTO printer_models VALUES (?,?,?,?) ON CONFLICT(id) DO NOTHING",
      ).run(id, brand, name, model.validation);
    }
    for (const resin of store.resins) {
      const maker = normalized(resin.manufacturer),
        name = normalized(resin.name),
        color = normalized(resin.color),
        id = hash(["resin", maker, name, color]);
      resins.set(resin.id, id);
      db.prepare(
        "INSERT INTO resin_products VALUES (?,?,?,?) ON CONFLICT(id) DO NOTHING",
      ).run(id, maker, name, color);
    }
    for (const printer of store.printers) {
      const model = models.get(printer.modelId)!;
      const old = db
        .prepare(
          "SELECT model_id FROM printer_units WHERE source_id=? AND local_id=?",
        )
        .get(source, printer.id);
      if (old && old.model_id !== model)
        throw new Error(
          "El mismo equipo cambió de modelo. Creá un equipo nuevo para conservar el origen.",
        );
      db.prepare(
        "INSERT INTO printer_units VALUES (?,?,?,?) ON CONFLICT(source_id,local_id) DO UPDATE SET label=excluded.label",
      ).run(source, printer.id, model, printer.name);
    }
    for (const c of store.calibrations) {
      const resin = resins.get(c.resinId)!;
      const old = db
        .prepare(
          "SELECT printer_id,resin_id,created_at FROM calibrations WHERE source_id=? AND local_id=?",
        )
        .get(source, c.id);
      if (
        old &&
        (old.printer_id !== c.printerId ||
          old.resin_id !== resin ||
          old.created_at !== c.createdAt)
      )
        throw new Error("Cambió el origen de una calibración existente.");
      db.prepare(
        "INSERT INTO calibrations VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(source_id,local_id) DO UPDATE SET name=excluded.name,completed_at=excluded.completed_at,method_json=excluded.method_json,starting_point_json=excluded.starting_point_json",
      ).run(
        source,
        c.id,
        c.printerId,
        resin,
        c.name,
        c.createdAt,
        c.completedAt,
        c.method ? canonical(c.method) : null,
        c.startingPoint ? canonical(c.startingPoint) : null,
      );
      for (const [i, t] of c.trials.entries()) {
        const trialDigest = hash(t);
        const prior = db
          .prepare(
            "SELECT digest,calibration_id,sequence FROM trials WHERE source_id=? AND local_id=?",
          )
          .get(source, t.id);
        if (prior) {
          if (
            prior.digest !== trialDigest ||
            prior.calibration_id !== c.id ||
            prior.sequence !== i + 1
          )
            throw new Error(
              "Un ensayo importado cambió. Se rechazó el lote completo; conservá el original y registrá la corrección con otro ID.",
            );
          continue;
        }
        const context = t.context;
        db.prepare(
          `INSERT INTO trials VALUES (${Array(30).fill("?").join(",")})`,
        ).run(
          source,
          t.id,
          c.id,
          i + 1,
          t.pin !== undefined
            ? "block-12x10-single-pin-v1"
            : "legacy-two-fit-v1",
          t.date,
          t.exposure,
          t.layer,
          t.x,
          t.y,
          t.pin ?? null,
          t.pin === undefined ? canonical([t.pin7, t.pin5]) : null,
          t.supports,
          t.scaleX,
          t.scaleY,
          t.compensationA,
          t.compensationB,
          context?.measurementStage ?? "unknown",
          context?.instrument ?? "unknown",
          context?.slicer ?? null,
          context?.slicerVersion ?? null,
          context?.resinLot ?? null,
          context?.washMinutes ?? null,
          context?.cureMinutes ?? null,
          t.notes,
          canonical(t),
          trialDigest,
          now,
          t.method ? canonical(t.method) : null,
          t.engineVersion ?? null,
        );
        insertedTrials++;
      }
      const archivedCount = Number(
        db
          .prepare(
            "SELECT COUNT(*) AS n FROM trials WHERE source_id=? AND calibration_id=?",
          )
          .get(source, c.id)!.n,
      );
      if (archivedCount !== c.trials.length)
        throw new Error(
          "El respaldo está desactualizado o faltan ensayos: no reemplazamos el resultado más reciente.",
        );
      const last = c.trials.at(-1);
      // Qualifying a local result creates a candidate, never an independently reviewed profile.
      if (c.completedAt && last?.pin !== undefined && analyze(last).passed) {
        db.prepare(
          `INSERT INTO candidate_profiles VALUES (?,?,?,'unreviewed',?,1) ON CONFLICT(source_id,calibration_id) DO UPDATE SET trial_id=excluded.trial_id,quality_json=excluded.quality_json,active=1,review_status=CASE WHEN candidate_profiles.trial_id=excluded.trial_id THEN candidate_profiles.review_status ELSE 'unreviewed' END`,
        ).run(source, c.id, last.id, canonical(recipeQuality(c)));
      } else {
        db.prepare(
          "UPDATE candidate_profiles SET active=0 WHERE source_id=? AND calibration_id=?",
        ).run(source, c.id);
      }
    }
    db.prepare("INSERT INTO ingestion_batches VALUES (?,?,?,?,?)").run(
      source,
      digest,
      now,
      insertedTrials,
      raw,
    );
    db.exec("COMMIT");
    return { source, insertedTrials, replayed: false };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
export function stats(db: DatabaseSync) {
  return Object.fromEntries(
    [
      "sources",
      "printer_models",
      "resin_products",
      "printer_units",
      "calibrations",
      "trials",
      "candidate_profiles",
      "ingestion_batches",
    ].map((table) => [
      table,
      Number(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()!.n),
    ]),
  );
}

/** One row per calibration and contributor. No grouping/averaging by equipment + material + layer. */
export function listProfiles(db: DatabaseSync) {
  return db
    .prepare(
      `SELECT p.source_id,p.calibration_id,p.review_status,p.quality_json,c.name,c.completed_at,
    m.brand,m.name AS printer_model,r.manufacturer,r.name AS resin_name,r.color,
    t.local_id AS trial_id,t.exposure_s,t.layer_mm,t.scale_x_percent,t.scale_y_percent,t.compensation_a_mm,t.compensation_b_mm,t.measured_x_mm,t.measured_y_mm,t.measurement_stage,t.instrument,t.slicer_version,t.resin_lot
    FROM candidate_profiles p JOIN calibrations c ON c.source_id=p.source_id AND c.local_id=p.calibration_id
    JOIN printer_units u ON u.source_id=c.source_id AND u.local_id=c.printer_id
    JOIN printer_models m ON m.id=u.model_id JOIN resin_products r ON r.id=c.resin_id
    JOIN trials t ON t.source_id=p.source_id AND t.local_id=p.trial_id
    WHERE p.active=1 ORDER BY m.brand,m.name,r.manufacturer,r.name,t.layer_mm,p.source_id,p.calibration_id`,
    )
    .all();
}
