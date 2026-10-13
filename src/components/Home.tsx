import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Clock3,
  FlaskConical,
  Plus,
} from "lucide-react";
import type { Store } from "../domain/types";
import { fmt, REFERENCE } from "../domain/calibration";
import { savedRecipes } from "../domain/recipes";
import { Badge, Piece } from "./ui";
import { ParameterSearch } from "./ParameterSearch";
import type { ParameterFilters } from "./ParameterSearch";

export function Home({
  store,
  onStart,
  onConsult,
  onOpen,
  onHistory,
  onGuide,
}: {
  store: Store;
  onStart: () => void;
  onConsult: (filters?: ParameterFilters) => void;
  onOpen: (id: string) => void;
  onHistory: () => void;
  onGuide: () => void;
}) {
  const pending = [...store.calibrations].reverse().find((c) => !c.completedAt);
  const recent = savedRecipes(store).slice().reverse().slice(0, 3);
  return (
    <div className="home-page">
      <section className="calibration-hero" aria-labelledby="home-title">
        <div className="calibration-hero-copy">
          <span className="product-label">
            <FlaskConical size={15} />
            CALIBRATION HUB
          </span>
          <h1 id="home-title">
            Calibrá tu combinación de <span>impresora y resina.</span>
          </h1>
          <p>
            Medí una pieza, seguí el próximo ajuste y conservá los parámetros
            que funcionaron.
          </p>
          <div className="home-actions">
            <button className="btn primary" onClick={onStart}>
              <Plus size={18} />
              Nueva calibración
            </button>
            <button className="btn secondary" onClick={() => onConsult()}>
              Consultar parámetros
              <ArrowRight size={17} />
            </button>
          </div>
          <p className="hero-footnote">
            Sin crear una cuenta · Un ensayo a la vez
          </p>
        </div>
        <div className="calibration-hero-reference">
          <span className="reference-caption">TU PIEZA DE REFERENCIA</span>
          <Piece />
          <div className="reference-chips">
            <span>
              X <b>12 mm</b>
            </span>
            <span>
              Y <b>10 mm</b>
            </span>
            <span>
              Un pin <b>Encastre</b>
            </span>
          </div>
          <p>Medí el exterior del bloque. Probá cómo entra el pin.</p>
        </div>
      </section>
      {pending && (
        <section className="resume-card" aria-label="Calibración pendiente">
          <span className="section-icon">
            <Clock3 size={23} />
          </span>
          <div>
            <span className="eyebrow">RETOMÁ DONDE QUEDASTE</span>
            <h2>
              <button className="home-name" onClick={() => onOpen(pending.id)}>
                {pending.name}
              </button>
            </h2>
            <p>
              {pending.trials.length
                ? `${pending.trials.length} ${pending.trials.length === 1 ? "ensayo registrado" : "ensayos registrados"}. El historial y tus ajustes están guardados.`
                : "Equipo y resina listos. Registrá tu primera impresión."}
            </p>
          </div>
          <button className="btn secondary" onClick={() => onOpen(pending.id)}>
            Continuar calibración
            <ArrowRight size={17} />
          </button>
        </section>
      )}
      <ParameterSearch store={store} onConsult={onConsult} />
      {recent.length > 0 && (
        <section className="recent-recipes" aria-labelledby="recent-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LO QUE YA FUNCIONÓ</span>
              <h2 id="recent-title">Tus últimas recetas</h2>
            </div>
            <button className="text-btn" onClick={() => onConsult()}>
              Ver parámetros
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="home-recipe-grid">
            {recent.map((c) => {
              const printer = store.printers.find((p) => p.id === c.printerId)!;
              const resin = store.resins.find((r) => r.id === c.resinId)!;
              const last = c.trials.at(-1)!;
              return (
                <article className="panel home-recipe-card" key={c.id}>
                  <Badge tone="good">Calibrada</Badge>
                  <h3>
                    <button className="home-name" onClick={() => onOpen(c.id)}>
                      {c.name}
                    </button>
                  </h3>
                  <p>
                    {printer.name}
                    <br />
                    {resin.manufacturer} · {resin.name}
                  </p>
                  <div>
                    <span>
                      <small>Exposición</small>
                      <b>{fmt(last.exposure)} s</b>
                    </span>
                    <span>
                      <small>Capa</small>
                      <b>{fmt(last.layer)} mm</b>
                    </span>
                  </div>
                  <button className="text-btn" onClick={() => onOpen(c.id)}>
                    Ver sus ensayos
                    <ArrowUpRight size={16} />
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}
      <section className="home-guide-card">
        <span className="section-icon">
          <BookOpen size={25} />
        </span>
        <div>
          <span className="eyebrow">¿ES TU PRIMERA CALIBRACIÓN?</span>
          <h2>De la impresión a tu receta, en siete pasos.</h2>
          <p>
            Cómo preparar la pieza, medir X/Y y comprobar el encastre.
            Tolerancia actual: ±{fmt(REFERENCE.tolerance)} mm.
          </p>
        </div>
        <button className="btn secondary" onClick={onGuide}>
          Ver la guía
          <ArrowRight size={17} />
        </button>
      </section>
      {store.calibrations.length > 0 && (
        <button className="home-history-link text-btn" onClick={onHistory}>
          Ver todas mis calibraciones y ensayos
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
