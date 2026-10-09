import { useState } from "react";
import type { Calibration } from "../domain/types";
import { DEFAULT_METHOD } from "../domain/recommendations";
import { Field } from "./ui";
type Method = NonNullable<Calibration["method"]>;
export function MethodFields({
  method,
  onChange,
}: {
  method: Method;
  onChange: (method: Method) => void;
}) {
  return (
    <>
      <div className="form-grid">
        <Field label="Paso de exposición · s">
          <input
            type="number"
            min="0.001"
            step="0.001"
            required
            value={Number.isNaN(method.exposureStep) ? "" : method.exposureStep}
            onChange={(e) =>
              onChange({ ...method, exposureStep: e.target.valueAsNumber })
            }
          />
        </Field>
        <Field label="Paso experimental de A · mm">
          <input
            type="number"
            min="0.001"
            step="0.001"
            required
            value={
              Number.isNaN(method.compensationStep)
                ? ""
                : method.compensationStep
            }
            onChange={(e) =>
              onChange({ ...method, compensationStep: e.target.valueAsNumber })
            }
          />
        </Field>
      </div>
      <label className="check-option">
        <input
          type="checkbox"
          checked={method.chituboxOffsetsConfirmed}
          onChange={(e) =>
            onChange({ ...method, chituboxOffsetsConfirmed: e.target.checked })
          }
        />
        <span>
          Confirmé en mi CHITUBOX: A positivo cierra el hueco y B positivo
          expande el exterior.
        </span>
      </label>
      <p className="setup-hint">
        A y B solo tendrán sugerencias numéricas si confirmás esta convención.
        Son ensayos exploratorios, no perfiles validados.
      </p>
    </>
  );
}
export function MethodSettings({
  method,
  onSave,
}: {
  method: Calibration["method"];
  onSave: (method: Method) => boolean;
}) {
  const [draft, setDraft] = useState(method ?? DEFAULT_METHOD),
    [message, setMessage] = useState("");
  return (
    <details className="analysis-details method-settings">
      <summary>Ajustes del método · pasos y convención de CHITUBOX</summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (
            !Number.isFinite(draft.exposureStep) ||
            draft.exposureStep < 0.001 ||
            !Number.isFinite(draft.compensationStep) ||
            draft.compensationStep < 0.001
          ) {
            setMessage("Los pasos deben ser al menos 0,001.");
            return;
          }
          setMessage(
            onSave(draft)
              ? "Método guardado para preparar el próximo ensayo."
              : "No se pudo guardar. Volvé a intentarlo.",
          );
        }}
      >
        <p className="muted">
          Estos ajustes se usan al preparar el siguiente ensayo. Cada ensayo
          guardado conserva el método que tenía en ese momento.
        </p>
        <MethodFields method={draft} onChange={setDraft} />
        <button className="btn secondary">Guardar método</button>
        {message && (
          <p role="status" className="muted">
            {message}
          </p>
        )}
      </form>
    </details>
  );
}
