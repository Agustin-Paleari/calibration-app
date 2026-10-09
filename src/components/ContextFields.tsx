import type { TestContext } from "../domain/protocol";
import { Field } from "./ui";
export function ContextFields({
  context,
  onChange,
}: {
  context: TestContext;
  onChange: (context: TestContext) => void;
}) {
  return (
    <>
      <p className="muted">
        Estos datos ayudan a reproducir tu resultado. Si no los conocés, dejalos
        sin registrar; no inventamos condiciones.
      </p>
      <div className="form-grid">
        <Field label="Momento de la medición">
          <select
            value={context.measurementStage}
            onChange={(e) =>
              onChange({
                ...context,
                measurementStage: e.target
                  .value as TestContext["measurementStage"],
              })
            }
          >
            <option value="unknown">No registrado</option>
            <option value="post-cure">Después del curado final</option>
            <option value="washed">Después del lavado, antes del curado</option>
          </select>
        </Field>
        <Field label="Instrumento de medición">
          <select
            value={context.instrument}
            onChange={(e) =>
              onChange({
                ...context,
                instrument: e.target.value as TestContext["instrument"],
              })
            }
          >
            <option value="unknown">No registrado</option>
            <option value="caliper">Calibre</option>
            <option value="micrometer">Micrómetro</option>
            <option value="other">Otro instrumento</option>
          </select>
        </Field>
        <Field label="Versión de CHITUBOX">
          <input
            maxLength={80}
            value={context.slicerVersion}
            onChange={(e) =>
              onChange({ ...context, slicerVersion: e.target.value })
            }
            placeholder="Ej. Basic 2.3"
          />
        </Field>
        <Field label="Lote de resina · opcional">
          <input
            maxLength={100}
            value={context.resinLot}
            onChange={(e) => onChange({ ...context, resinLot: e.target.value })}
            placeholder="Código del envase"
          />
        </Field>
        {(["washMinutes", "cureMinutes"] as const).map((key) => (
          <Field
            key={key}
            label={
              key === "washMinutes"
                ? "Tiempo de lavado · min"
                : "Tiempo de curado · min"
            }
          >
            <input
              type="number"
              min="0"
              step="0.1"
              value={context[key] ?? ""}
              onChange={(e) =>
                onChange({
                  ...context,
                  [key]: Number.isNaN(e.target.valueAsNumber)
                    ? null
                    : e.target.valueAsNumber,
                })
              }
              placeholder="Sin registrar"
            />
          </Field>
        ))}
      </div>
    </>
  );
}
