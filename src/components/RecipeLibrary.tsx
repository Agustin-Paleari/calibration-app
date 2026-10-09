import { useState } from "react";
import { ArrowUpRight, BookOpen, FlaskConical } from "lucide-react";
import type { Store } from "../domain/types";
import { fmt } from "../domain/calibration";
import { recipeQuality, savedRecipes } from "../domain/recipes";
import { Badge, Empty, Field } from "./ui";
export function RecipeLibrary({
  store,
  onOpen,
  onReuse,
  onStart,
}: {
  store: Store;
  onOpen: (id: string) => void;
  onReuse: (id: string) => void;
  onStart: () => void;
}) {
  const [printer, setPrinter] = useState("all"),
    [resin, setResin] = useState("all"),
    [layer, setLayer] = useState("all");
  const all = savedRecipes(store),
    recipes = all.filter(
      (c) =>
        (printer === "all" || c.printerId === printer) &&
        (resin === "all" || c.resinId === resin) &&
        (layer === "all" || String(c.trials.at(-1)!.layer) === layer),
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">TU CONOCIMIENTO, GUARDADO</span>
          <h1>Recetas de tu taller</h1>
          <p>
            Encontrá parámetros que ya funcionaron y verificalos con una nueva
            impresión.
          </p>
        </div>
        <BookOpen size={28} />
      </div>
      {all.length > 0 && (
        <div className="panel recipe-filters form-grid">
          <Field label="Filtrar por impresora">
            <select
              value={printer}
              onChange={(e) => setPrinter(e.target.value)}
            >
              <option value="all">Todas las impresoras</option>
              {store.printers
                .filter((p) => all.some((c) => c.printerId === p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Filtrar por resina">
            <select value={resin} onChange={(e) => setResin(e.target.value)}>
              <option value="all">Todas las resinas</option>
              {store.resins
                .filter((r) => all.some((c) => c.resinId === r.id))
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.manufacturer} · {r.name} · {r.color}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Filtrar por capa">
            <select value={layer} onChange={(e) => setLayer(e.target.value)}>
              <option value="all">Todas las alturas</option>
              {[...new Set(all.map((c) => c.trials.at(-1)!.layer))]
                .sort((a, b) => a - b)
                .map((n) => (
                  <option key={n} value={n}>
                    {fmt(n)} mm
                  </option>
                ))}
            </select>
          </Field>
        </div>
      )}
      {all.length > 0 && (
        <p className="recipe-match-count">
          {recipes.length}{" "}
          {recipes.length === 1 ? "receta encontrada" : "recetas encontradas"} ·
          Cada calibración conserva su propio resultado.
        </p>
      )}
      {!recipes.length ? (
        <div className="panel">
          <Empty
            title={
              all.length
                ? "Sin recetas para estos filtros"
                : "Tu primera receta sale de una calibración"
            }
            detail={
              all.length
                ? "Probá otra combinación de impresora, resina o altura de capa."
                : "Empezá una calibración y finalizala cuando X/Y, encastre y soportes estén aprobados. Guardamos acá los parámetros que funcionaron."
            }
            action={all.length ? "Limpiar filtros" : "Nueva calibración"}
            onAction={
              all.length
                ? () => {
                    setPrinter("all");
                    setResin("all");
                    setLayer("all");
                  }
                : onStart
            }
          />
        </div>
      ) : (
        <div className="recipe-grid">
          {recipes.map((c) => {
            const last = c.trials.at(-1)!,
              p = store.printers.find((p) => p.id === c.printerId)!,
              r = store.resins.find((r) => r.id === c.resinId)!,
              q = recipeQuality(c);
            return (
              <article className="panel recipe-card" key={c.id}>
                <Badge tone="good">Cumple tus criterios</Badge>
                <h2>{c.name}</h2>
                <p>
                  {p.name}
                  <br />
                  {r.manufacturer} · {r.name} · {r.color}
                </p>
                <div className="recipe-numbers">
                  {[
                    ["Exposición", last.exposure, "s"],
                    ["Capa", last.layer, "mm"],
                    ["Escala X", last.scaleX, "%"],
                    ["Escala Y", last.scaleY, "%"],
                    ["A interna", last.compensationA, "mm"],
                    ["B externa", last.compensationB, "mm"],
                  ].map(([label, value, unit]) => (
                    <span key={label}>
                      <small>{label}</small>
                      <b>
                        {fmt(Number(value))} {unit}
                      </b>
                    </span>
                  ))}
                </div>
                <p className="recipe-evidence">
                  {q.repetitions === 1
                    ? "Una impresión aprobada"
                    : `${q.repetitions} impresiones aprobadas con estos parámetros`}
                  . Sin revisión independiente.
                </p>
                <details className="setup-optional">
                  <summary>
                    {q.traceable
                      ? "Procedimiento registrado"
                      : "Podés completar la trazabilidad"}
                  </summary>
                  <p className="muted">
                    {q.traceable
                      ? "Instrumento, lavado, curado, lote y versión del slicer quedaron registrados."
                      : "Falta registrar: " + q.missing.join(", ") + "."}
                  </p>
                  <p className="muted">
                    Repetí con los mismos parámetros y procedimiento para
                    comprobar consistencia.
                  </p>
                </details>
                <div className="recipe-actions">
                  <button
                    className="btn secondary"
                    onClick={() => onOpen(c.id)}
                  >
                    Ver ensayos
                    <ArrowUpRight size={15} />
                  </button>
                  <button className="btn primary" onClick={() => onReuse(c.id)}>
                    Usar como punto de partida
                    <FlaskConical size={15} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <div className="notice">
        Esta biblioteca reúne tus calibraciones locales. Las recetas dependen de
        la impresora, la resina y el procedimiento; verificá una pieza nueva
        antes de reutilizarlas.
      </div>
    </>
  );
}
