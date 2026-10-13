import {
  ArrowRight,
  Box,
  CircleCheck,
  Droplets,
  FlaskConical,
  Layers3,
  Printer,
  Ruler,
} from "lucide-react";
import { fmt, REFERENCE } from "../domain/calibration";
import { MeasurementReference } from "./MeasurementReference";
import { Piece } from "./ui";

const steps = [
  {
    title: "Prepará el patrón",
    icon: Box,
    detail:
      "Usá la pieza propia de Calibration Hub: un bloque con un alojamiento central y un pin separado. X mide 12 mm e Y mide 10 mm.",
    hint: "El archivo STL todavía no está incluido en esta versión.",
  },
  {
    title: "Imprimí tu primer ensayo",
    icon: Printer,
    detail:
      "Elegí impresora, resina y altura de capa. Para empezar, usá la exposición recomendada por el fabricante y escala 100 %. Registrá los ajustes que aplicaste al imprimir.",
    hint: "Si estás verificando una receta, usá los parámetros de esa receta.",
  },
  {
    title: "Lavá, secá y curá",
    icon: Droplets,
    detail:
      "Seguí el procedimiento de tu resina. Conservá los mismos tiempos de lavado y curado entre ensayos, y medí en el mismo momento del proceso.",
    hint: "Podés registrar estos tiempos en Procedimiento del ensayo.",
  },
  {
    title: "Medí X e Y",
    icon: Ruler,
    detail:
      "Con un calibre o micrómetro, medí las caras exteriores del bloque en los dos ejes. Anotá lo que mediste, aunque difiera del nominal.",
    hint: "Podés ingresar decimales con punto o coma.",
  },
  {
    title: "Probá el encastre del pin",
    icon: CircleCheck,
    detail:
      "Insertá el pin en el único hueco central sin forzarlo. Registrá si entra con ajuste correcto, demasiado ajustado o suelto.",
    hint: "El dato funcional es cómo encastra, sin una medida del pin.",
  },
  {
    title: "Revisá los soportes",
    icon: Layers3,
    detail:
      "Indicá si resistieron, si hubo separación parcial o si fallaron. Una pieza con soportes fallidos necesita repetirse estable antes de ajustar sus dimensiones.",
    hint: "El estado de los soportes forma parte del resultado.",
  },
  {
    title: "Guardá y seguí la recomendación",
    icon: FlaskConical,
    detail:
      "Guardá el ensayo para ver qué cambiar y qué conservar. Prepará la siguiente impresión con ese ajuste; sus mediciones se completan de nuevo. Cada resultado queda en el historial.",
    hint: "Cambiá un mecanismo a la vez para poder comparar.",
  },
];

export function Guide({ onStart }: { onStart: () => void }) {
  return (
    <div className="guide-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">GUÍA DE CALIBRACIÓN</span>
          <h1>Tu primera calibración, paso a paso.</h1>
          <p>
            De la pieza impresa a los parámetros que funcionan en tu equipo.
          </p>
        </div>
      </div>
      <div className="guided-procedure">
        <aside
          className="panel guide-pattern"
          aria-label="Referencia para medir"
        >
          <span className="eyebrow">UN BLOQUE. UN PIN.</span>
          <Piece large />
          <div className="guide-nominals">
            <span>
              X nominal<b>{fmt(REFERENCE.x)} mm</b>
            </span>
            <span>
              Y nominal<b>{fmt(REFERENCE.y)} mm</b>
            </span>
          </div>
          <div className="guide-tolerance">
            <b>Tolerancia actual</b>
            <span>±{fmt(REFERENCE.tolerance)} mm</span>
            <small>En ambos ejes · ±{REFERENCE.tolerance * 1000} µm</small>
          </div>
          <p>
            Medí el bloque por fuera y comprobá el encastre dentro del hueco.
          </p>
        </aside>
        <ol className="procedure-steps" aria-label="Siete pasos de calibración">
          {steps.map(({ title, detail, hint, icon: Icon }, index) => (
            <li className="panel procedure-step" key={title}>
              <span className="procedure-number" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <h2>
                  <Icon size={20} />
                  {title}
                </h2>
                <p>{detail}</p>
                {index === 3 && <MeasurementReference />}
                <small>{hint}</small>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <section className="guide-faq" aria-label="Preguntas habituales">
        <details className="panel">
          <summary>¿Qué necesito para registrar un ensayo?</summary>
          <p>
            Exposición, altura de capa, medidas X/Y, encastre y soportes. Los
            ajustes aplicados en CHITUBOX, el procedimiento y las notas están en
            secciones desplegables del formulario.
          </p>
        </details>
        <details className="panel">
          <summary>¿Cuándo puedo finalizar?</summary>
          <p>
            Cuando el último ensayo tiene X e Y dentro de ±
            {fmt(REFERENCE.tolerance)} mm, encastre correcto y soportes
            estables. También podés repetir con esos parámetros para comprobar
            el resultado.
          </p>
        </details>
        <details className="panel">
          <summary>¿Cómo se calcula la corrección dimensional?</summary>
          <p>
            Error = medido − nominal. Error relativo = error ÷ nominal × 100.
            Escala sugerida = escala aplicada × nominal ÷ medido. La
            recomendación indica qué ajuste probar y qué mantener.
          </p>
        </details>
      </section>
      <section className="guide-start-card">
        <div>
          <span className="eyebrow">TODO LISTO PARA EMPEZAR</span>
          <h2>El próximo paso es tu primer ensayo.</h2>
          <p>Elegí equipo y resina juntos, y seguí el recorrido.</p>
        </div>
        <button className="btn primary" onClick={onStart}>
          Nueva calibración
          <ArrowRight size={17} />
        </button>
      </section>
    </div>
  );
}
