import { useState } from "react";
import {
  Plus,
  Printer as PrinterIcon,
  Droplets,
  Trash2,
  Search,
} from "lucide-react";
import type { Store, Printer, Resin } from "../domain/types";
import {
  addPrinter,
  addResin,
  newPrinterDraft,
  newResinDraft,
} from "../domain/setup";
import { PrinterFields, ResinFields } from "./SetupFields";
import { Modal, Badge, Empty } from "./ui";
export function PrinterForm({
  store,
  onSave,
  onClose,
}: {
  store: Store;
  onSave: (s: Store) => boolean;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(newPrinterDraft),
    [error, setError] = useState("");
  return (
    <Modal
      title="Registrá tu impresora"
      subtitle="Marca y modelo. El nombre del equipo es opcional."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            if (!onSave(addPrinter(store, draft).store))
              setError("No se pudo guardar. Volvé a intentarlo.");
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Revisá los datos.",
            );
          }
        }}
      >
        <PrinterFields store={store} draft={draft} onChange={setDraft} />
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
  onSave: (s: Store) => boolean;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(newResinDraft),
    [error, setError] = useState("");
  return (
    <Modal
      title="Una nueva resina"
      subtitle="Elegí el material en los desplegables o agregá uno propio."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            if (!onSave(addResin(store, draft).store))
              setError("No se pudo guardar. Volvé a intentarlo.");
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Revisá los datos.",
            );
          }
        }}
      >
        <ResinFields draft={draft} onChange={setDraft} />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
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
