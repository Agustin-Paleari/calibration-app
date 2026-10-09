import { useState } from "react";
import { ArrowRight, Droplets, Printer as PrinterIcon } from "lucide-react";
import type { Store } from "../domain/types";
import { uid } from "../data/catalog";
import {
  ADD,
  CUSTOM,
  addPrinter,
  addResin,
  newPrinterDraft,
  newResinDraft,
} from "../domain/setup";
import { defaultContext } from "../domain/protocol";
import { ContextFields } from "./ContextFields";
import { DEFAULT_METHOD } from "../domain/recommendations";
import { FlowSteps } from "./FlowSteps";
import { Field, Modal } from "./ui";
import { MethodFields } from "./MethodSettings";
import { PrinterFields, ResinFields } from "./SetupFields";
export function NewCalibration({
  store,
  onSave,
  onClose,
}: {
  store: Store;
  onSave: (store: Store, id: string) => boolean;
  onClose: () => void;
}) {
  const last = store.calibrations.at(-1);
  const [printerId, setPrinterId] = useState(
    last?.printerId ?? store.printers[0]?.id ?? ADD,
  );
  const [resinId, setResinId] = useState(
    last?.resinId ?? store.resins[0]?.id ?? ADD,
  );
  const [printer, setPrinter] = useState(newPrinterDraft),
    [resin, setResin] = useState(newResinDraft);
  const [context, setContext] = useState(defaultContext);
  const [method, setMethod] = useState(DEFAULT_METHOD);
  const [name, setName] = useState(""),
    [error, setError] = useState("");
  const selectedPrinter = store.printers.find((p) => p.id === printerId);
  const selectedResin = store.resins.find((r) => r.id === resinId);
  const modelLabel =
    printer.modelId === CUSTOM
      ? printer.newModel.trim()
      : store.models.find((m) => m.id === printer.modelId)?.name;
  const printerLabel =
    selectedPrinter?.name ??
    (printer.brand && modelLabel
      ? printer.name.trim() || `${printer.brand} ${modelLabel}`
      : "");
  const resinManufacturer =
    resin.manufacturer === CUSTOM
      ? resin.customManufacturer.trim()
      : resin.manufacturer;
  const resinName =
    resin.name === CUSTOM ? resin.customName.trim() : resin.name;
  const resinColor =
    resin.color === CUSTOM ? resin.customColor.trim() : resin.color;
  const resinLabel = selectedResin
    ? `${selectedResin.manufacturer} · ${selectedResin.name} · ${selectedResin.color}`
    : resinManufacturer && resinName && resinColor
      ? `${resinManufacturer} · ${resinName} · ${resinColor}`
      : "";
  return (
    <Modal
      title="Nueva calibración"
      subtitle="Elegí tu impresora y resina. En la siguiente pantalla vas a registrar la impresión y sus medidas."
      onClose={onClose}
      wide
    >
      <FlowSteps current={0} compact />
      <form
        className="calibration-setup"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          try {
            if (
              !Number.isFinite(method.exposureStep) ||
              method.exposureStep < 0.001 ||
              !Number.isFinite(method.compensationStep) ||
              method.compensationStep < 0.001
            )
              throw new Error("Los pasos del método deben ser al menos 0,001.");
            let next = store;
            let selectedPrinter = store.printers.find(
              (p) => p.id === printerId,
            );
            let selectedResin = store.resins.find((r) => r.id === resinId);
            if (printerId === ADD) {
              const result = addPrinter(next, printer);
              next = result.store;
              selectedPrinter = result.printer;
            }
            if (resinId === ADD) {
              const result = addResin(next, resin);
              next = result.store;
              selectedResin = result.resin;
            }
            if (!selectedPrinter || !selectedResin)
              throw new Error("Seleccioná una impresora y una resina.");
            const id = uid();
            next = {
              ...next,
              calibrations: [
                ...next.calibrations,
                {
                  id,
                  printerId: selectedPrinter.id,
                  resinId: selectedResin.id,
                  name:
                    name.trim() ||
                    `${selectedPrinter.name} · ${selectedResin.name}`,
                  createdAt: new Date().toISOString(),
                  completedAt: null,
                  trials: [],
                  method,
                  context,
                },
              ],
            };
            if (!onSave(next, id))
              setError(
                "No pudimos guardar. Tus selecciones se conservan para reintentar.",
              );
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Revisá los datos ingresados.",
            );
          }
        }}
      >
        <section className="setup-section">
          <div className="setup-section-title">
            <span>
              <PrinterIcon size={18} />
            </span>
            <div>
              <h3>Tu impresora</h3>
              <p>
                {store.printers.length
                  ? "Usá un equipo guardado o agregá uno nuevo."
                  : "Seleccioná la marca y el modelo para empezar."}
              </p>
            </div>
          </div>
          {store.printers.length > 0 && (
            <Field label="Impresora">
              <select
                value={printerId}
                onChange={(e) => setPrinterId(e.target.value)}
              >
                {store.printers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                <option value={ADD}>Agregar otra impresora…</option>
              </select>
            </Field>
          )}
          {printerId === ADD && (
            <PrinterFields
              store={store}
              draft={printer}
              onChange={setPrinter}
            />
          )}
        </section>
        <section className="setup-section">
          <div className="setup-section-title">
            <span>
              <Droplets size={18} />
            </span>
            <div>
              <h3>Tu resina</h3>
              <p>
                {store.resins.length
                  ? "Elegí un material guardado o agregá otro."
                  : "Buscá tu resina en los desplegables o agregá una propia."}
              </p>
            </div>
          </div>
          {store.resins.length > 0 && (
            <Field label="Resina guardada">
              <select
                value={resinId}
                onChange={(e) => setResinId(e.target.value)}
              >
                {store.resins.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.manufacturer} · {r.name} · {r.color}
                  </option>
                ))}
                <option value={ADD}>Agregar otra resina…</option>
              </select>
            </Field>
          )}
          {resinId === ADD && <ResinFields draft={resin} onChange={setResin} />}
        </section>
        <details className="setup-optional">
          <summary>Nombre de esta calibración · opcional</summary>
          <Field label="Nombre de la calibración">
            <input
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Usaremos tu impresora y resina"
            />
          </Field>
        </details>
        <details className="setup-optional">
          <summary>Ajustes del método · opcional</summary>
          <MethodFields method={method} onChange={setMethod} />
        </details>
        <details className="setup-optional">
          <summary>Procedimiento y trazabilidad · opcional</summary>
          <ContextFields context={context} onChange={setContext} />
        </details>
        {printerLabel && resinLabel && (
          <div className="setup-review" aria-label="Resumen de la selección">
            <span>
              <PrinterIcon size={16} />
              <b>{printerLabel}</b>
            </span>
            <span>
              <Droplets size={16} />
              {resinLabel}
            </span>
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="setup-footer">
          <p>Todo se guarda junto al comenzar. Podés reutilizarlo después.</p>
          <button type="submit" className="btn primary">
            Comenzar calibración
            <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
