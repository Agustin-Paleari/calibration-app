import type { Store, Brand } from "../domain/types";
import { BRANDS } from "../data/catalog";
import { CUSTOM, RESIN_NAMES } from "../domain/setup";
import type { PrinterDraft, ResinDraft } from "../domain/setup";
import { Field } from "./ui";
export function PrinterFields({
  store,
  draft,
  onChange,
}: {
  store: Store;
  draft: PrinterDraft;
  onChange: (draft: PrinterDraft) => void;
}) {
  return (
    <>
      <div className="form-grid">
        <Field label="Marca de impresora">
          <select
            required
            value={draft.brand}
            onChange={(e) =>
              onChange({
                ...draft,
                brand: e.target.value as Brand,
                modelId: "",
                newModel: "",
              })
            }
          >
            <option value="">Seleccioná una marca</option>
            {BRANDS.map((brand) => (
              <option key={brand}>{brand}</option>
            ))}
          </select>
        </Field>
        <Field label="Modelo">
          <select
            required
            disabled={!draft.brand}
            value={draft.modelId}
            onChange={(e) => onChange({ ...draft, modelId: e.target.value })}
          >
            <option value="">Seleccioná un modelo</option>
            {store.models
              .filter((m) => m.brand === draft.brand)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.validation === "pending" ? " · pendiente" : ""}
                </option>
              ))}
            <option value={CUSTOM}>Otro modelo · agregar</option>
          </select>
        </Field>
      </div>
      {draft.modelId === CUSTOM && (
        <>
          <Field label="Nuevo modelo">
            <input
              required
              maxLength={80}
              value={draft.newModel}
              onChange={(e) => onChange({ ...draft, newModel: e.target.value })}
              placeholder="Nombre del modelo"
            />
          </Field>
          <p className="setup-hint">
            Podés usarlo ahora. Quedará pendiente de validación administrativa.
          </p>
        </>
      )}
      {draft.brand === "PioCreat / Aidis" && (
        <p className="setup-hint">
          PioCreat y Aidis comparten el catálogo para evitar duplicaciones.
        </p>
      )}
      <details className="setup-optional">
        <summary>Nombre personalizado del equipo · opcional</summary>
        <Field label="Nombre de tu impresora">
          <input
            maxLength={80}
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            placeholder="Usaremos la marca y el modelo"
          />
        </Field>
      </details>
    </>
  );
}
export function ResinFields({
  draft,
  onChange,
}: {
  draft: ResinDraft;
  onChange: (draft: ResinDraft) => void;
}) {
  return (
    <>
      <div className="form-grid">
        <Field label="Fabricante">
          <select
            required
            value={draft.manufacturer}
            onChange={(e) =>
              onChange({
                ...draft,
                manufacturer: e.target.value,
                name: "",
                customName: "",
              })
            }
          >
            <option value="">Seleccioná un fabricante</option>
            {Object.keys(RESIN_NAMES).map((name) => (
              <option key={name}>{name}</option>
            ))}
            <option value={CUSTOM}>Otro fabricante</option>
          </select>
        </Field>
        <Field label="Resina">
          <select
            required
            disabled={!draft.manufacturer}
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
          >
            <option value="">Seleccioná una resina</option>
            {(RESIN_NAMES[draft.manufacturer] ?? []).map((name) => (
              <option key={name}>{name}</option>
            ))}
            <option value={CUSTOM}>Otra resina · agregar</option>
          </select>
        </Field>
      </div>
      {draft.manufacturer === CUSTOM && (
        <Field label="Nombre del fabricante">
          <input
            required
            maxLength={80}
            value={draft.customManufacturer}
            onChange={(e) =>
              onChange({ ...draft, customManufacturer: e.target.value })
            }
            placeholder="Fabricante de tu resina"
          />
        </Field>
      )}
      {draft.name === CUSTOM && (
        <Field label="Nombre de la resina">
          <input
            required
            maxLength={100}
            value={draft.customName}
            onChange={(e) => onChange({ ...draft, customName: e.target.value })}
            placeholder="Nombre que aparece en el envase"
          />
        </Field>
      )}
      <Field label="Color">
        <select
          required
          value={draft.color}
          onChange={(e) => onChange({ ...draft, color: e.target.value })}
        >
          {[
            "Gris",
            "Negro",
            "Blanco",
            "Transparente",
            "Beige",
            "Verde",
            "Azul",
            "Rojo",
          ].map((color) => (
            <option key={color}>{color}</option>
          ))}
          <option value={CUSTOM}>Otro color</option>
        </select>
      </Field>
      {draft.color === CUSTOM && (
        <Field label="Nombre del color">
          <input
            required
            maxLength={40}
            value={draft.customColor}
            onChange={(e) =>
              onChange({ ...draft, customColor: e.target.value })
            }
          />
        </Field>
      )}
    </>
  );
}
