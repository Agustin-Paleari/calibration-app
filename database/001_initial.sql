PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY);
INSERT OR IGNORE INTO schema_version VALUES (1);
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY, first_seen TEXT NOT NULL, last_seen TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS printer_models (
  id TEXT PRIMARY KEY, brand TEXT NOT NULL, name TEXT NOT NULL,
  catalog_status TEXT NOT NULL CHECK(catalog_status IN ('catalog','pending')),
  UNIQUE(brand, name)
) STRICT;
CREATE TABLE IF NOT EXISTS resin_products (
  id TEXT PRIMARY KEY, manufacturer TEXT NOT NULL, name TEXT NOT NULL, color TEXT NOT NULL,
  UNIQUE(manufacturer, name, color)
) STRICT;
CREATE TABLE IF NOT EXISTS printer_units (
  source_id TEXT NOT NULL REFERENCES sources(id), local_id TEXT NOT NULL,
  model_id TEXT NOT NULL REFERENCES printer_models(id), label TEXT NOT NULL,
  PRIMARY KEY(source_id, local_id)
) STRICT;
CREATE TABLE IF NOT EXISTS calibrations (
  source_id TEXT NOT NULL, local_id TEXT NOT NULL, printer_id TEXT NOT NULL,
  resin_id TEXT NOT NULL REFERENCES resin_products(id), name TEXT NOT NULL,
  created_at TEXT NOT NULL, completed_at TEXT, method_json TEXT, starting_point_json TEXT,
  PRIMARY KEY(source_id, local_id),
  FOREIGN KEY(source_id, printer_id) REFERENCES printer_units(source_id, local_id)
) STRICT;
CREATE TABLE IF NOT EXISTS protocols (
  id TEXT PRIMARY KEY, reference_version TEXT NOT NULL,
  nominal_x_mm REAL NOT NULL CHECK(nominal_x_mm>0), nominal_y_mm REAL NOT NULL CHECK(nominal_y_mm>0),
  tolerance_mm REAL NOT NULL CHECK(tolerance_mm>0), fit_schema TEXT NOT NULL CHECK(fit_schema IN ('single-pin','legacy-two-fit'))
) STRICT;
INSERT OR IGNORE INTO protocols VALUES ('block-12x10-single-pin-v1', 'block-12x10-single-pin-v1',12,10,0.05,'single-pin');
INSERT OR IGNORE INTO protocols VALUES ('legacy-two-fit-v1', 'unknown-legacy-reference',12,10,0.05,'legacy-two-fit');
CREATE TABLE IF NOT EXISTS trials (
  source_id TEXT NOT NULL, local_id TEXT NOT NULL, calibration_id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK(sequence>0), protocol_id TEXT NOT NULL REFERENCES protocols(id),
  measured_on TEXT NOT NULL, exposure_s REAL NOT NULL CHECK(exposure_s>0), layer_mm REAL NOT NULL CHECK(layer_mm>0 AND layer_mm<=1),
  measured_x_mm REAL NOT NULL CHECK(measured_x_mm>0), measured_y_mm REAL NOT NULL CHECK(measured_y_mm>0),
  pin_fit TEXT CHECK(pin_fit IN ('correct','tight','loose')), legacy_fits_json TEXT,
  supports TEXT NOT NULL CHECK(supports IN ('stable','partial','failed')),
  scale_x_percent REAL NOT NULL CHECK(scale_x_percent>0), scale_y_percent REAL NOT NULL CHECK(scale_y_percent>0),
  compensation_a_mm REAL NOT NULL, compensation_b_mm REAL NOT NULL,
  measurement_stage TEXT NOT NULL CHECK(measurement_stage IN ('post-cure','washed','unknown')),
  instrument TEXT NOT NULL CHECK(instrument IN ('caliper','micrometer','other','unknown')),
  slicer TEXT, slicer_version TEXT, resin_lot TEXT,
  wash_minutes REAL CHECK(wash_minutes>=0), cure_minutes REAL CHECK(cure_minutes>=0),
  notes TEXT NOT NULL, raw_json TEXT NOT NULL, digest TEXT NOT NULL, imported_at TEXT NOT NULL, method_json TEXT, engine_version TEXT,
  PRIMARY KEY(source_id,local_id), UNIQUE(source_id,calibration_id,sequence), UNIQUE(source_id,calibration_id,local_id),
  FOREIGN KEY(source_id,calibration_id) REFERENCES calibrations(source_id,local_id)
) STRICT;
CREATE INDEX IF NOT EXISTS trials_recipe ON trials(layer_mm,protocol_id,exposure_s);
CREATE INDEX IF NOT EXISTS calibrations_material ON calibrations(resin_id,printer_id);
CREATE TABLE IF NOT EXISTS candidate_profiles (
  source_id TEXT NOT NULL, calibration_id TEXT NOT NULL, trial_id TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'unreviewed' CHECK(review_status IN ('unreviewed','reviewed','rejected')),
  quality_json TEXT NOT NULL, active INTEGER NOT NULL CHECK(active IN (0,1)),
  PRIMARY KEY(source_id,calibration_id),
  FOREIGN KEY(source_id,calibration_id) REFERENCES calibrations(source_id,local_id),
  FOREIGN KEY(source_id,calibration_id,trial_id) REFERENCES trials(source_id,calibration_id,local_id)
) STRICT;
CREATE TABLE IF NOT EXISTS ingestion_batches (
  source_id TEXT NOT NULL REFERENCES sources(id), digest TEXT NOT NULL,
  imported_at TEXT NOT NULL, inserted_trials INTEGER NOT NULL,
  raw_json TEXT NOT NULL, PRIMARY KEY(source_id,digest)
) STRICT;
CREATE TABLE IF NOT EXISTS review_events (
  id TEXT PRIMARY KEY, source_id TEXT NOT NULL, calibration_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL, decision TEXT NOT NULL CHECK(decision IN ('reviewed','rejected')),
  reason TEXT NOT NULL, evidence_json TEXT NOT NULL, created_at TEXT NOT NULL,
  FOREIGN KEY(source_id,calibration_id) REFERENCES candidate_profiles(source_id,calibration_id)
) STRICT;

-- Measured observations are append-only. Corrections require a new trial ID.
CREATE TRIGGER IF NOT EXISTS trials_no_update BEFORE UPDATE ON trials
BEGIN SELECT RAISE(ABORT,'Archived trials are immutable; append a correction with a new ID'); END;
