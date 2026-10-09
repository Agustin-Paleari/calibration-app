import { DatabaseSync } from "node:sqlite";
import { listProfiles } from "./database";
let db: DatabaseSync | undefined;
try {
  const path = process.argv[2];
  if (!path)
    throw new Error("Uso: npm run data:profiles -- .data/calibrations.sqlite");
  db = new DatabaseSync(path, { readOnly: true });
  console.log(JSON.stringify(listProfiles(db), null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  db?.close();
}
