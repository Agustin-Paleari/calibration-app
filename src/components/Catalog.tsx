import { useState } from "react";
import {
  Plus,
  Printer as PrinterIcon,
  Droplets,
  Trash2,
  Search,
} from "lucide-react";
import type { Brand, Store, Printer, Resin } from "../domain/types";
import { BRANDS, uid } from "../data/catalog";
import { Modal, Field, Badge, Empty } from "./ui";
export function PrinterForm({
  store,
  onSave,
  onClose,
}: {
  store: Store;
  onSave: (s: Store) => void;
  onClose: () => void;
}) {
  const [brand, setBrand] = useState<Brand>("Phrozen");
  const [model, setModel] = useState("");
  const [custom, setCustom] = useState(false);
  const [newModel, setNewModel] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  return (
    <Modal
      title="Registrá tu impresora"
      subtitle="Elegí el modelo y dale un nombre a tu equipo."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          let modelId = model;
          let models = store.models;
          if (custom) {
            const trimmed = newModel.trim();
            if (!trimmed) {
              setError("Ingresá el nombre del modelo.");
              return;
            }
            const existing = models.find(
              (m) =>
                m.brand === brand &&
                m.name.toLowerCase() === trimmed.toLowerCase(),
            );
            if (existing) modelId = existing.id;
            else {
              modelId = uid();
              models = [
                ...models,
                { id: modelId, brand, name: trimmed, validation: "pending" },
              ];
            }
          }
          if (!modelId || !name.trim()) {
            setError("Seleccioná un modelo y un nombre para el equipo.");
            return;
          }
          onSave({
            ...store,
            models,
            printers: [
              ...store.printers,
              { id: uid(), modelId, name: name.trim() },
            ],
          });
        }}
      >
        <Field label="Marca">
          <select
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value as Brand);
              setModel("");
            }}
          >
            {BRANDS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </Field>
        {brand === "PioCreat / Aidis" && (
          <p className="form-note">
            PioCreat y Aidis comparten una familia de catálogo para evitar
            modelos duplicados.
          </p>
        )}
        {!custom ? (
          <Field label="Modelo">
            <select
              required
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="">Seleccioná un modelo</option>
              {store.models
                .filter((m) => m.brand === brand)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.validation === "pending"
                      ? " · pendiente de validación"
                      : ""}
                  </option>
                ))}
            </select>
          </Field>
        ) : (
          <Field label="Nuevo modelo">
            <input
              required
              maxLength={80}
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              placeholder="Nombre del modelo"
            />
          </Field>
        )}
        <button
          type="button"
          className="text-btn"
          onClick={() => setCustom(!custom)}
        >
          {custom ? "Volver al catálogo" : "+ Mi modelo no está en el catálogo"}
        </button>
        {custom && (
          <div className="notice warning">
            El modelo quedará pendiente de validación administrativa. Podés
            utilizarlo; esta versión no realiza aprobaciones.
          </div>
        )}
        <Field label="Nombre de tu impresora">
          <input
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Saturn del taller"
          />
        </Field>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="btn primary full">
          Registrar impresora
          <Plus size={17} />
        </button>
      </form>
    </Modal>
  );
}
export function ResinForm({
  store,
  onSave,
  onClose,
}: {
  store: Store;
  onSave: (s: Store) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(""),
    [manufacturer, setManufacturer] = useState(""),
    [color, setColor] = useState("Gris");
  return (
    <Modal
      title="Una nueva resina"
      subtitle="Conservá una referencia de los materiales que usás."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !manufacturer.trim() || !color.trim()) return;
          onSave({
            ...store,
            resins: [
              ...store.resins,
              {
                id: uid(),
                name: name.trim(),
                manufacturer: manufacturer.trim(),
                color: color.trim(),
              },
            ],
          });
        }}
      >
        <Field label="Fabricante">
          <input
            required
            maxLength={80}
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            placeholder="Ej. Phrozen"
          />
        </Field>
        <Field label="Nombre de la resina">
          <input
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Aqua Gray 8K"
          />
        </Field>
        <Field label="Color">
          <input
            required
            maxLength={40}
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </Field>
        <button className="btn primary full">
          Registrar resina
          <Plus size={17} />
        </button>
      </form>
    </Modal>
  );
}
export function Catalog({
  kind,
  store,
  onAdd,
  onDelete,
}: {
  kind: "printers" | "resins";
  store: Store;
  onAdd: () => void;
  onDelete: (kind: "printers" | "resins", id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const isPrinter = kind === "printers";
  const items = (isPrinter ? store.printers : store.resins).filter((item) => {
    const p = item as Printer,
      r = item as Resin,
      m = store.models.find((m) => m.id === p.modelId);
    return `${item.name} ${m?.brand ?? r.manufacturer} ${m?.name ?? r.color}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">TU LABORATORIO</span>
          <h1>{isPrinter ? "Impresoras" : "Resinas"}</h1>
          <p>
            Todo empieza por conocer tu {isPrinter ? "equipo" : "material"}.
          </p>
        </div>
        <button className="btn primary" onClick={onAdd}>
          <Plus size={18} />
          Registrar {isPrinter ? "impresora" : "resina"}
        </button>
      </div>
      <div className="catalog-toolbar">
        <div className="search">
          <Search size={17} />
          <input
            aria-label="Buscar en catálogo"
            placeholder="Buscar en tu catálogo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="muted">
          {items.length} {isPrinter ? "equipos" : "materiales"}
        </span>
      </div>
      {!items.length ? (
        <div className="panel">
          <Empty
            title={
              search
                ? "No encontramos coincidencias"
                : `Tu catálogo de ${isPrinter ? "impresoras" : "resinas"} empieza acá`
            }
            detail={
              search
                ? "Probá con otro nombre o marca."
                : `Registrá ${isPrinter ? "tu primera impresora" : "la resina que utilizás"} para comenzar una calibración.`
            }
            action={search ? undefined : "Agregar al catálogo"}
            onAction={onAdd}
          />
        </div>
      ) : (
        <div className="catalog-grid">
          {items.map((item) => {
            const p = item as Printer,
              r = item as Resin,
              m = store.models.find((m) => m.id === p.modelId);
            const count = store.calibrations.filter((c) =>
              isPrinter ? c.printerId === item.id : c.resinId === item.id,
            ).length;
            return (
              <article className="panel catalog-card" key={item.id}>
                <div className="catalog-visual">
                  {isPrinter ? (
                    <PrinterIcon size={52} strokeWidth={1} />
                  ) : (
                    <Droplets size={52} strokeWidth={1} />
                  )}
                  <span>{isPrinter ? "RESIN PRINTER" : "PHOTOPOLYMER"}</span>
                </div>
                <div className="catalog-content">
                  <span className="eyebrow">
                    {isPrinter ? m?.brand : r.manufacturer}
                  </span>
                  <h3>{item.name}</h3>
                  <p className="muted">{isPrinter ? m?.name : r.color}</p>
                  <div className="catalog-footer">
                    <Badge
                      tone={m?.validation === "pending" ? "warning" : "neutral"}
                    >
                      {isPrinter
                        ? m?.validation === "pending"
                          ? "Modelo pendiente"
                          : "Modelo de catálogo"
                        : r.color}
                    </Badge>
                    <button
                      className="icon-btn"
                      aria-label={`Eliminar ${item.name}`}
                      title={
                        count ? "Tiene calibraciones vinculadas" : "Eliminar"
                      }
                      disabled={count > 0}
                      onClick={() => onDelete(kind, item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <small className="muted">
                    {count} calibraciones vinculadas
                  </small>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p className="footnote">
        {isPrinter
          ? "Los modelos agregados por usuarios permanecen pendientes. No hay aprobación administrativa en esta versión."
          : "Cada calibración queda asociada a una resina para que puedas comparar resultados del mismo material."}
      </p>
    </>
  );
}
