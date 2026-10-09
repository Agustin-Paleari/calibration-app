import { readFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { openDatabase, ingest, stats } from "./database";
const args = process.argv.slice(2);
function option(flag: string) {
  const i = args.indexOf(flag);
  if (i < 0) return undefined;
  if (!args[i + 1] || args[i + 1].startsWith("--"))
    throw new Error(`Falta el valor de ${flag}`);
  return args[i + 1];
}
let db: ReturnType<typeof openDatabase> | undefined;
try {
  const file = args[0];
  if (!file || file.startsWith("--"))
    throw new Error(
      "Uso: npm run data:import -- respaldo.json [--db .data/calibrations.sqlite] [--source identificador-legacy]",
    );
  for (let i = 1; i < args.length; i += 2)
    if (!["--db", "--source"].includes(args[i]))
      throw new Error(`Opción desconocida: ${args[i]}`);
  const path = option("--db") ?? ".data/calibrations.sqlite";
  mkdirSync(dirname(path), { recursive: true });
  db = openDatabase(path);
  console.log(
    JSON.stringify(
      {
        database: path,
        result: ingest(db, readFileSync(file, "utf8"), option("--source")),
        counts: stats(db),
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  db?.close();
}
