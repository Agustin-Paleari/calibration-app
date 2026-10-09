import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Save,
  SlidersHorizontal,
  Ruler,
  CircleCheck,
  TriangleAlert,
  ChevronDown,
} from "lucide-react";
import type { Calibration, Store, Trial, Fit, Supports } from "../domain/types";
import {
  analyze,
  externalCompensation,
  fmt,
  internalCompensation,
  recommend,
  REFERENCE,
  validateTrial,
} from "../domain/calibration";
import { today, uid } from "../data/catalog";
import { Badge, Criterion, Field } from "./ui";
import { Evolution } from "./Charts";
type Draft = Record<
  | "exposure"
  | "layer"
  | "x"
  | "y"
  | "date"
  | "pin7"
  | "pin5"
  | "supports"
  | "notes"
  | "scaleX"
  | "scaleY"
  | "compensationA"
  | "compensationB",
  string
>;
function blank(previous?: Trial, next = false, nextExposure?: number): Draft {
  return {
    exposure: previous
      ? String(
          next
            ? (nextExposure ?? recommend(previous).nextExposure)
            : previous.exposure,
        )
      : "2.5",
    layer: previous ? String(previous.layer) : "0.05",
    x: "",
    y: "",
    date: today(),
    pin7: "",
    pin5: "",
    supports: "",
    notes: "",
    scaleX: String(previous?.scaleX ?? 100),
    scaleY: String(previous?.scaleY ?? 100),
    compensationA: String(previous?.compensationA ?? 0),
    compensationB: String(previous?.compensationB ?? 0),
  };
}
const number = (v: string) =>
  v.trim() === "" ? NaN : Number(v.replace(",", "."));
const fitLabels: Record<Fit, string> = {
  correct: "Correcto",
  tight: "Ajustado",
  loose: "Suelto",
};
function TrialForm({
  previous,
  nextExposure,
  onSave,
  onCancel,
}: {
  previous?: Trial;
  nextExposure?: number;
  onSave: (t: Trial) => boolean;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(() =>
    blank(previous, true, nextExposure),
  );
  const [error, setError] = useState("");
  const change = (key: keyof Draft, value: string) =>
    setDraft({ ...draft, [key]: value });
  const numField = (key: keyof Draft, label: string, hint?: string) => (
    <Field label={label} hint={hint}>
      <input
        inputMode="decimal"
        required
        value={draft[key]}
        onChange={(e) => change(key, e.target.value)}
        placeholder="0,000"
      />
    </Field>
  );
  return (
    <section className="panel trial-form">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            ENSAYO {previous ? "SIGUIENTE" : "INICIAL"}
          </span>
          <h2>Una nueva medición</h2>
          <p className="muted">
            Usá la misma pieza, lavado y curado para comparar.
          </p>
        </div>
        <span className="step-pill">01 — Registrar</span>
      </div>
      {previous && (
        <div className="notice">
          Los resultados se limpiaron. La exposición inicial sugerida es{" "}
          {fmt(nextExposure ?? recommend(previous).nextExposure)} s; podés
          modificarla. Los ajustes aplicados se conservan.
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const t: Trial = {
            id: uid(),
            date: draft.date,
            exposure: number(draft.exposure),
            layer: number(draft.layer),
            x: number(draft.x),
            y: number(draft.y),
            pin7: draft.pin7 as Fit,
            pin5: draft.pin5 as Fit,
            supports: draft.supports as Supports,
            notes: draft.notes.trim(),
            scaleX: number(draft.scaleX),
            scaleY: number(draft.scaleY),
            compensationA: number(draft.compensationA),
            compensationB: number(draft.compensationB),
          };
          const validation = validateTrial(t);
          if (validation) {
            setError(validation);
            return;
          }
          if (!onSave(t))
            setError(
              "No se pudo guardar. Conservamos los campos para que vuelvas a intentarlo.",
            );
        }}
      >
        <h4 className="form-section">
          <SlidersHorizontal size={16} />
          Parámetros de impresión
        </h4>
        <div className="form-grid three">
          {numField("exposure", "Exposición normal · s")}
          {numField("layer", "Altura de capa · mm")}
          <Field label="Fecha del ensayo">
            <input
              required
              type="date"
              value={draft.date}
              onChange={(e) => change("date", e.target.value)}
            />
          </Field>
        </div>
        <h4 className="form-section">
          <Ruler size={16} />
          Resultados de la pieza
        </h4>
        <div className="form-grid">
          {numField("x", "Dimensión X medida · mm", "Nominal: 12,000 mm")}
          {numField("y", "Dimensión Y medida · mm", "Nominal: 10,000 mm")}
        </div>
        <div className="form-grid three">
          {(["pin7", "pin5"] as const).map((key) => (
            <Field
              key={key}
              label={`Encastre del pin ${key === "pin7" ? "7" : "5"} mm`}
            >
              <select
                required
                value={draft[key]}
                onChange={(e) => change(key, e.target.value)}
              >
                <option value="">Seleccioná el resultado</option>
                <option value="correct">Correcto</option>
                <option value="tight">Demasiado ajustado</option>
                <option value="loose">Suelto</option>
              </select>
            </Field>
          ))}
          <Field label="Estado de los soportes">
            <select
              required
              value={draft.supports}
              onChange={(e) => change("supports", e.target.value)}
            >
              <option value="">Seleccioná el resultado</option>
              <option value="stable">Estables · resistieron</option>
              <option value="failed">Fallaron</option>
            </select>
          </Field>
        </div>
        <details className="adjustments">
          <summary>
            Ajustes aplicados en CHITUBOX <ChevronDown size={16} />
          </summary>
          <p className="muted">
            Registrá los valores realmente utilizados, no los sugeridos. A y B
            se guardan según el signo de tu versión del slicer.
          </p>
          <div className="form-grid">
            {numField("scaleX", "Escala X aplicada · %")}
            {numField("scaleY", "Escala Y aplicada · %")}
            {numField("compensationA", "A · compensación interna · mm")}
            {numField("compensationB", "B · compensación externa · mm")}
          </div>
        </details>
        <Field label="Observaciones">
          <textarea
            rows={3}
            maxLength={2000}
            value={draft.notes}
            onChange={(e) => change("notes", e.target.value)}
            placeholder="Lavado, curado, cambios aplicados o algo que quieras recordar…"
          />
        </Field>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <span className="muted">
            Los datos se guardan al analizar el ensayo.
          </span>
          <button type="button" className="btn secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn primary">
            <Save size={16} />
            Guardar y analizar
          </button>
        </div>
      </form>
    </section>
  );
}
function Compensation({ trial }: { trial: Trial }) {
  const a = analyze(trial),
    b = externalCompensation(trial);
  const [hole7, setHole7] = useState(""),
    [hole5, setHole5] = useState("");
  return (
    <div className="panel compensation">
      <div className="section-heading">
        <div>
          <span className="eyebrow">CHITUBOX</span>
          <h3>Tres ajustes, tres propósitos</h3>
        </div>
        <SlidersHorizontal size={20} />
      </div>
      <div className="mechanisms">
        <div>
          <span className="mechanism-index">01</span>
          <h4>Exposición</h4>
          <p>
            Modifica el curado y el encastre. Resolvé pines y soportes antes de
            ajustar dimensiones.
          </p>
        </div>
        <div>
          <span className="mechanism-index">02</span>
          <h4>Escalado por eje</h4>
          <p>
            Modifica proporcionalmente toda la pieza. Nominal ÷ medido × escala
            aplicada.
          </p>
          <div className="mini-values">
            <span>
              X <b>{fmt((a.x.scale * trial.scaleX) / 100)} %</b>
            </span>
            <span>
              Y <b>{fmt((a.y.scale * trial.scaleY) / 100)} %</b>
            </span>
          </div>
          <small>
            Escala total sugerida. Evaluar solo si la exposición es estable y el
            eje está fuera de tolerancia.
          </small>
        </div>
        <div>
          <span className="mechanism-index">03</span>
          <h4>B · Contorno externo</h4>
          <p>
            Desplazamiento adicional por pared para corregir el tamaño exterior.
          </p>
          <div className="mini-values">
            <span>
              X <b>{fmt(b.xPerWall)} mm</b>
            </span>
            <span>
              Y <b>{fmt(b.yPerWall)} mm</b>
            </span>
          </div>
          <small>
            Positivo = expandir; negativo = contraer.{" "}
            {b.uniform
              ? "Los ejes sugieren una corrección similar."
              : "Los ejes difieren: un único valor B no corrige ambos."}
          </small>
        </div>
      </div>
      <details className="adjustments">
        <summary>
          A · Calcular compensación interna
          <ChevronDown size={16} />
        </summary>
        <p className="muted">
          El encastre por sí solo no permite calcular A. Medí los alojamientos:
          el desplazamiento geométrico por pared es (nominal − medido) ÷ 2.
        </p>
        <div className="form-grid">
          {[
            {
              label: "Alojamiento 7,10 mm",
              value: hole7,
              set: setHole7,
              nominal: REFERENCE.hole7,
            },
            {
              label: "Alojamiento 5,10 mm",
              value: hole5,
              set: setHole5,
              nominal: REFERENCE.hole5,
            },
          ].map((h) => (
            <div key={h.label}>
              <Field label={`${h.label} · medida real`}>
                <input
                  inputMode="decimal"
                  value={h.value}
                  onChange={(e) => h.set(e.target.value)}
                  placeholder="mm"
                />
              </Field>
              {Number.isFinite(number(h.value)) && number(h.value) > 0 ? (
                <p className="calc-result">
                  {fmt(internalCompensation(number(h.value), h.nominal))} mm por
                  pared
                </p>
              ) : (
                h.value && <p className="error">Ingresá una medida positiva.</p>
              )}
            </div>
          ))}
        </div>
      </details>
      <p className="footnote">
        <TriangleAlert size={14} />
        Estas son correcciones geométricas adicionales, no valores finales
        universales de A/B. Verificá la dirección y unidades en la documentación
        de tu versión de CHITUBOX. No combines escalado y compensación en el
        mismo ensayo; validá el cambio con otra impresión.
      </p>
    </div>
  );
}
export function CalibrationDetail({
  calibration: c,
  store,
  onUpdate,
  onBack,
  notify,
}: {
  calibration: Calibration;
  store: Store;
  onUpdate: (c: Calibration) => boolean;
  onBack: () => void;
  notify: (s: string) => void;
}) {
  const [form, setForm] = useState(!c.trials.length);
  const [selected, setSelected] = useState<string | null>(null);
  const printer = store.printers.find((p) => p.id === c.printerId)!;
  const resin = store.resins.find((r) => r.id === c.resinId)!;
  const model = store.models.find((m) => m.id === printer.modelId)!;
  const last = c.trials.at(-1);
  const current = c.trials.find((t) => t.id === selected) ?? last;
  const index = current ? c.trials.indexOf(current) : 0;
  const a = current ? analyze(current) : null;
  const rec = current ? recommend(current, c.trials[index - 1]) : null;
  return (
    <>
      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={16} />
        Todas las calibraciones
      </button>
      <div className="page-heading detail-heading">
        <div>
          <span className="eyebrow">
            {model.brand} / {model.name}
          </span>
          <h1>{c.name}</h1>
          <p>
            {printer.name}
            <span className="dot-separator">·</span>
            {resin.manufacturer} {resin.name}
            <span className="dot-separator">·</span>
            {resin.color}
          </p>
        </div>
        <Badge tone={c.completedAt ? "good" : "warning"}>
          {c.completedAt ? "Calibrated" : "En progreso"}
        </Badge>
      </div>
      <div className="workflow-strip">
        {[
          "Registrar ensayo",
          "Analizar resultados",
          "Ajustar y comparar",
          "Finalizar",
        ].map((s, i) => (
          <span
            className={c.completedAt || (!form && i < 3) ? "active" : ""}
            key={s}
          >
            <i>{c.completedAt ? <Check size={12} /> : `0${i + 1}`}</i>
            {s}
            {i < 3 && <ArrowRight size={14} />}
          </span>
        ))}
      </div>
      {form && !c.completedAt ? (
        <TrialForm
          previous={last}
          nextExposure={
            last ? recommend(last, c.trials.at(-2)).nextExposure : undefined
          }
          onCancel={() => {
            if (!last) onBack();
            else setForm(false);
          }}
          onSave={(t) => {
            if (onUpdate({ ...c, trials: [...c.trials, t] })) {
              setForm(false);
              setSelected(t.id);
              notify("Ensayo guardado. El análisis ya está disponible.");
              return true;
            }
            return false;
          }}
        />
      ) : current && a && rec ? (
        <>
          <div className="section-heading results-heading">
            <div>
              <span className="eyebrow">RESULTADOS</span>
              <h2>
                Ensayo #{index + 1}
                <span className="muted inline-date">
                  {new Date(current.date + "T12:00:00").toLocaleDateString(
                    "es-AR",
                  )}
                </span>
              </h2>
            </div>
            <div className="result-settings">
              <span>
                {fmt(current.exposure)} s <small>exposición</small>
              </span>
              <span>
                {fmt(current.layer)} mm <small>capa</small>
              </span>
            </div>
          </div>
          <div className="results-grid">
            {(["x", "y"] as const).map((axis) => (
              <article className="panel result-card" key={axis}>
                <div className="section-heading">
                  <span className="eyebrow">
                    DIMENSIÓN {axis.toUpperCase()}
                  </span>
                  <Badge tone={a[axis].pass ? "good" : "warning"}>
                    {a[axis].pass ? "En tolerancia" : "Fuera de tolerancia"}
                  </Badge>
                </div>
                <div className="measurement">
                  {fmt(current[axis])}
                  <span>mm</span>
                </div>
                <p className="muted">Nominal {fmt(REFERENCE[axis])} mm</p>
                <div className="deviation-values">
                  <span>
                    Desviación{" "}
                    <b>
                      {a[axis].deviation > 0 ? "+" : ""}
                      {fmt(a[axis].deviation)} mm
                    </b>
                  </span>
                  <span>
                    Diferencia relativa{" "}
                    <b>
                      {a[axis].percent > 0 ? "+" : ""}
                      {fmt(a[axis].percent)} %
                    </b>
                  </span>
                </div>
              </article>
            ))}
            <article className="panel validation-card">
              <span className="eyebrow">VALIDACIÓN DEL ENSAYO</span>
              <h3>
                {a.passed ? "Todo está en su lugar." : "Cada detalle cuenta."}
              </h3>
              <Criterion
                label="X e Y · ±0,050 mm"
                pass={a.x.pass && a.y.pass}
              />
              <Criterion label="Pines 7 y 5 mm" pass={a.fit} />
              <Criterion label="Soportes estables" pass={a.stable} />
            </article>
          </div>
          <div className={`recommendation ${rec.kind}`}>
            <div className="recommend-icon">
              {rec.kind === "good" ? (
                <CircleCheck size={23} />
              ) : (
                <SlidersHorizontal size={23} />
              )}
            </div>
            <div>
              <span className="eyebrow">PRÓXIMO PASO SUGERIDO</span>
              <h3>{rec.title}</h3>
              <p>{rec.detail}</p>
              <small>
                Reglas orientativas para ensayos: no son conclusiones
                científicas verificadas.
              </small>
            </div>
          </div>
          <Compensation trial={current} />
          {current.notes && (
            <div className="panel notes">
              <span className="eyebrow">OBSERVACIONES DEL ENSAYO</span>
              <p>{current.notes}</p>
            </div>
          )}
          {!c.completedAt && (
            <div className="next-actions">
              <div>
                <h3>La precisión se construye.</h3>
                <p className="muted">Un cambio por vez. Un ensayo más cerca.</p>
              </div>
              <button
                className="btn secondary"
                disabled={!last || !analyze(last).passed}
                title={
                  !last || !analyze(last).passed
                    ? "El último ensayo debe aprobar los tres criterios"
                    : "Finalizar calibración"
                }
                onClick={() => {
                  if (
                    last &&
                    analyze(last).passed &&
                    onUpdate({ ...c, completedAt: new Date().toISOString() })
                  )
                    notify("Calibración finalizada: Calibrated.");
                }}
              >
                <Check size={17} />
                Finalizar calibración
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  setSelected(null);
                  setForm(true);
                }}
              >
                <Plus size={17} />
                Preparar próximo ensayo
              </button>
            </div>
          )}
          {c.completedAt && (
            <div className="notice good">
              <CircleCheck size={18} />
              Calibración finalizada con el último ensayo aprobado.{" "}
              <button
                className="text-btn"
                onClick={() => {
                  if (onUpdate({ ...c, completedAt: null }))
                    notify("Calibración reabierta. El historial se conserva.");
                }}
              >
                Reabrir para continuar
              </button>
            </div>
          )}
        </>
      ) : null}
      {c.trials.length > 0 && (
        <>
          <div className="panel chart-panel">
            <Evolution trials={c.trials} />
          </div>
          <div className="panel history-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">HISTORIAL DE ESTA CALIBRACIÓN</span>
                <h3>
                  {c.trials.length}{" "}
                  {c.trials.length === 1
                    ? "ensayo registrado"
                    : "ensayos registrados"}
                </h3>
              </div>
              <span className="muted">
                Seleccioná un ensayo para consultar su análisis
              </span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Ensayo / fecha</th>
                    <th>Exposición / capa</th>
                    <th>Δ X / Δ Y · mm</th>
                    <th>Pines 7 / 5</th>
                    <th>Soportes</th>
                    <th>A / B · mm</th>
                    <th>Escala X / Y · %</th>
                    <th>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {c.trials.map((t, i) => {
                    const r = analyze(t);
                    return (
                      <tr
                        key={t.id}
                        className={current?.id === t.id ? "selected" : ""}
                      >
                        <td>
                          <button
                            className="table-link"
                            onClick={() => {
                              setSelected(t.id);
                              setForm(false);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            #{i + 1}
                            <small>{t.date}</small>
                          </button>
                        </td>
                        <td>
                          {fmt(t.exposure)} s<small>{fmt(t.layer)} mm</small>
                        </td>
                        <td>
                          {fmt(r.x.deviation)}
                          <small>{fmt(r.y.deviation)}</small>
                        </td>
                        <td>
                          {fitLabels[t.pin7]}
                          <small>{fitLabels[t.pin5]}</small>
                        </td>
                        <td>
                          {t.supports === "stable" ? "Estables" : "Fallaron"}
                        </td>
                        <td>
                          {fmt(t.compensationA)}
                          <small>{fmt(t.compensationB)}</small>
                        </td>
                        <td>
                          {fmt(t.scaleX)}
                          <small>{fmt(t.scaleY)}</small>
                        </td>
                        <td>
                          <Badge tone={r.passed ? "good" : "warning"}>
                            {r.passed ? "Aprobado" : "Ajustar"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
