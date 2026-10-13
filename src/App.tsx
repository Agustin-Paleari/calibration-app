import { useCallback, useRef, useState } from "react";
import {
  Plus,
  ArrowUpRight,
  X,
  CircleCheck,
  Trash2,
  Search,
  TriangleAlert,
} from "lucide-react";
import type { Store } from "./domain/types";
import { localRepository, parseStore } from "./data/storage";
import { emptyStore } from "./data/catalog";
import { analyze, fmt, REFERENCE } from "./domain/calibration";
import { Badge, Empty, Field, Modal } from "./components/ui";
import { Catalog, PrinterForm, ResinForm } from "./components/Catalog";
import { RecipeLibrary } from "./components/RecipeLibrary";
import { reuseRecipe } from "./domain/recipes";
import { NewCalibration } from "./components/NewCalibration";
import { CalibrationDetail } from "./components/CalibrationDetail";
import { AppHeader } from "./components/AppHeader";
import type { Page } from "./components/AppHeader";
import { Home } from "./components/Home";
import { Guide } from "./components/Guide";
import type { ParameterFilters } from "./components/ParameterSearch";
type Dialog = "printer" | "resin" | "calibration" | null;
function load() {
  try {
    return { store: localRepository.load(), error: "" };
  } catch {
    return {
      store: emptyStore(),
      error:
        "No pudimos leer los datos locales. No se sobrescribirán. Descargá una copia antes de restaurar un respaldo válido.",
    };
  }
}
function CalibrationList({
  store,
  onOpen,
  onDelete,
  compact = false,
}: {
  store: Store;
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}) {
  const [filter, setFilter] = useState("all"),
    [query, setQuery] = useState("");
  const calibrations = [...store.calibrations]
    .reverse()
    .filter(
      (c) =>
        (filter === "all" ||
          (filter === "complete" ? !!c.completedAt : !c.completedAt)) &&
        `${c.name} ${store.printers.find((p) => p.id === c.printerId)?.name} ${store.resins.find((r) => r.id === c.resinId)?.name}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
  return (
    <>
      {!compact && (
        <div className="list-toolbar">
          <Field label="Estado de calibración">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Todas las calibraciones</option>
              <option value="progress">En progreso</option>
              <option value="complete">Calibradas</option>
            </select>
          </Field>
          <div className="search">
            <Search size={17} />
            <input
              aria-label="Buscar calibraciones"
              placeholder="Buscar calibraciones…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      )}
      {!calibrations.length ? (
        <Empty
          title={
            store.calibrations.length
              ? "Sin coincidencias"
              : "Tu primer ensayo es el punto de partida"
          }
          detail={
            store.calibrations.length
              ? "Probá otro filtro o nombre."
              : "Acá vas a ver tus calibraciones, sus avances y cada ajuste realizado."
          }
        />
      ) : (
        <div className="table-scroll">
          <table className="calibration-table">
            <thead>
              <tr>
                <th>Calibración / equipo</th>
                <th>Resina</th>
                <th>Ensayos</th>
                <th>Última exposición</th>
                <th>Estado</th>
                <th>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {(compact ? calibrations.slice(0, 4) : calibrations).map((c) => {
                const p = store.printers.find((p) => p.id === c.printerId),
                  r = store.resins.find((r) => r.id === c.resinId),
                  last = c.trials.at(-1);
                return (
                  <tr key={c.id}>
                    <td>
                      <button
                        className="table-link"
                        onClick={() => onOpen(c.id)}
                      >
                        {c.name}
                        <small>{p?.name}</small>
                      </button>
                    </td>
                    <td>
                      {r?.name}
                      <small>
                        {r?.manufacturer} · {r?.color}
                      </small>
                    </td>
                    <td>
                      <span className="trial-count">
                        {String(c.trials.length).padStart(2, "0")}
                      </span>
                    </td>
                    <td>{last ? `${fmt(last.exposure)} s` : "Sin ensayo"}</td>
                    <td>
                      <Badge tone={c.completedAt ? "good" : "warning"}>
                        {c.completedAt
                          ? "Calibrada"
                          : last
                            ? "En progreso"
                            : "Pendiente"}
                      </Badge>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-btn"
                          aria-label={`Abrir ${c.name}`}
                          onClick={() => onOpen(c.id)}
                        >
                          <ArrowUpRight size={18} />
                        </button>
                        {onDelete && (
                          <button
                            className="icon-btn"
                            aria-label={`Eliminar ${c.name}`}
                            onClick={() => onDelete(c.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
export default function App() {
  const [initial] = useState(load);
  const [store, setStore] = useState(initial.store);
  const [storageError, setStorageError] = useState(initial.error);
  const [page, setPage] = useState<Page>("dashboard");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [parameterFilters, setParameterFilters] =
    useState<ParameterFilters | null>(null);
  const [toast, setToast] = useState("");
  const [confirmation, setConfirmation] = useState<{
    title: string;
    detail: string;
    action: () => void;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const dialogTrigger = useRef<HTMLElement | null>(null);
  const notify = (message: string) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 6000);
  };
  const persist = (next: Store) => {
    if (initial.error && storageError) {
      notify("Restaurá un respaldo válido antes de guardar nuevos datos.");
      return false;
    }
    try {
      localRepository.save(next);
      setStore(next);
      setStorageError("");
      return true;
    } catch {
      setStorageError(
        "No se pudieron guardar los cambios. El almacenamiento puede estar lleno o bloqueado. Exportá tus datos y revisá los permisos del navegador.",
      );
      return false;
    }
  };
  const closeDialog = useCallback(() => {
    setDialog(null);
    requestAnimationFrame(() => {
      if (dialogTrigger.current?.isConnected) dialogTrigger.current.focus();
    });
  }, []);
  const closeConfirmation = useCallback(() => setConfirmation(null), []);
  const go = (p: Page) => {
    setPage(p);
    setParameterFilters(null);
    setActiveId(null);

    window.scrollTo({ top: 0 });
  };
  const open = (id: string) => {
    setActiveId(id);
    setPage("calibrations");
    window.scrollTo({ top: 0 });
  };
  const openDialog = (next: Dialog) => {
    dialogTrigger.current = document.activeElement as HTMLElement;
    setDialog(next);
  };
  const start = () => openDialog("calibration");
  const exportData = () => {
    const raw =
      initial.error && storageError
        ? localStorage.getItem("calibration-hub:v1")
        : JSON.stringify(store, null, 2);
    const url = URL.createObjectURL(
      new Blob([raw ?? ""], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `calibration-hub-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Respaldo descargado. Guardalo en un lugar seguro.");
  };
  const importData = async (file: File) => {
    try {
      if (file.size > 5_000_000)
        throw new Error("El respaldo supera el límite de 5 MB.");
      const next = parseStore(await file.text());
      setConfirmation({
        title: "¿Restaurar este respaldo?",
        detail: `Reemplazará los datos actuales por ${next.printers.length} impresoras, ${next.resins.length} resinas y ${next.calibrations.length} calibraciones. Exportá los datos actuales antes de continuar.`,
        action: () => {
          try {
            localRepository.save(next);
            setStore(next);
            setStorageError("");
            setActiveId(null);
            notify("Respaldo restaurado correctamente.");
            setConfirmation(null);
          } catch {
            notify("No se pudo guardar el respaldo en este navegador.");
          }
        },
      });
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "El archivo no es un respaldo válido.",
      );
    }
  };
  const active = store.calibrations.find((c) => c.id === activeId);
  const deleteCalibration = (id: string) =>
    setConfirmation({
      title: "¿Eliminar esta calibración?",
      detail:
        "Se eliminarán todos sus ensayos. Esta acción no se puede deshacer; podés exportar un respaldo antes.",
      action: () => {
        if (
          persist({
            ...store,
            calibrations: store.calibrations.filter((c) => c.id !== id),
          })
        ) {
          setConfirmation(null);
          notify("Calibración eliminada.");
        }
      },
    });
  return (
    <div className="app-shell">
      <div inert={!!dialog || !!confirmation}>
        <a className="skip-link" href="#contenido">
          Saltar al contenido
        </a>
        <AppHeader
          page={page}
          activeCalibration={!!active}
          onNavigate={go}
          onExport={exportData}
          onImport={() => fileInput.current?.click()}
          storageError={!!storageError}
        />
      </div>
      <div className="main-wrap" inert={!!dialog || !!confirmation}>
        <main id="contenido" tabIndex={-1}>
          {storageError && (
            <div className="notice warning" role="alert">
              <TriangleAlert size={20} />
              <div>{storageError}</div>
              <button className="btn secondary" onClick={exportData}>
                Exportar copia
              </button>
            </div>
          )}
          {active ? (
            <CalibrationDetail
              key={active.id}
              calibration={active}
              store={store}
              onBack={() => setActiveId(null)}
              notify={notify}
              onUpdate={(c) => {
                if (
                  c.completedAt &&
                  (!c.trials.length || !analyze(c.trials.at(-1)!).passed)
                )
                  return false;
                return persist({
                  ...store,
                  calibrations: store.calibrations.map((old) =>
                    old.id === c.id ? c : old,
                  ),
                });
              }}
            />
          ) : page === "dashboard" ? (
            <Home
              store={store}
              onStart={start}
              onConsult={(filters) => {
                go("recipes");
                setParameterFilters(filters ?? null);
              }}
              onOpen={open}
              onHistory={() => go("calibrations")}
              onGuide={() => go("guide")}
            />
          ) : page === "printers" || page === "resins" ? (
            <Catalog
              key={page}
              kind={page}
              store={store}
              onAdd={() =>
                openDialog(page === "printers" ? "printer" : "resin")
              }
              onDelete={(kind, id) =>
                setConfirmation({
                  title: `¿Eliminar ${kind === "printers" ? "esta impresora" : "esta resina"}?`,
                  detail: "No hay calibraciones vinculadas a este registro.",
                  action: () => {
                    if (
                      store.calibrations.some((c) =>
                        kind === "printers"
                          ? c.printerId === id
                          : c.resinId === id,
                      )
                    ) {
                      notify("Este registro tiene calibraciones vinculadas.");
                      return;
                    }
                    if (
                      persist({
                        ...store,
                        [kind]: store[kind].filter((x) => x.id !== id),
                      })
                    ) {
                      setConfirmation(null);
                      notify("Registro eliminado.");
                    }
                  },
                })
              }
            />
          ) : page === "recipes" ? (
            <RecipeLibrary
              store={store}
              onOpen={open}
              onStart={start}
              parameterFilters={parameterFilters}
              onClearSearch={() => setParameterFilters(null)}
              onReuse={(id) => {
                try {
                  const next = reuseRecipe(store, id);
                  if (persist(next.store)) {
                    open(next.calibration.id);
                    notify(
                      "Receta preparada. Registrá un nuevo ensayo para verificarla.",
                    );
                  }
                } catch (error) {
                  notify(
                    error instanceof Error
                      ? error.message
                      : "No se pudo reutilizar la receta.",
                  );
                }
              }}
            />
          ) : page === "guide" ? (
            <Guide onStart={start} />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    UN PROCESO, MUCHOS APRENDIZAJES
                  </span>
                  <h1>Calibraciones</h1>
                  <p>
                    Consultá ensayos, compará ajustes y retomá donde lo dejaste.
                  </p>
                </div>
                <button className="btn primary" onClick={start}>
                  <Plus size={18} />
                  Nueva calibración
                </button>
              </div>
              <div className="panel all-calibrations">
                <CalibrationList
                  store={store}
                  onOpen={open}
                  onDelete={deleteCalibration}
                />
              </div>
            </>
          )}
          <footer className="main-footer">
            <span>
              Calibration Hub · v1.3 <span className="dot-separator">·</span>{" "}
              Datos guardados en este navegador
            </span>
            <span>
              CHITUBOX<span className="dot-separator">·</span>±
              {fmt(REFERENCE.tolerance)} mm
            </span>
          </footer>
        </main>
      </div>
      <input
        ref={fileInput}
        className="sr-only"
        type="file"
        accept="application/json,.json"
        aria-label="Importar respaldo JSON"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void importData(file);
          e.target.value = "";
        }}
      />
      {dialog === "printer" && (
        <PrinterForm
          store={store}
          onClose={closeDialog}
          onSave={(s) => {
            if (persist(s)) {
              setDialog(null);
              notify("Impresora registrada.");
              return true;
            }
            return false;
          }}
        />
      )}{" "}
      {dialog === "resin" && (
        <ResinForm
          store={store}
          onClose={closeDialog}
          onSave={(s) => {
            if (persist(s)) {
              setDialog(null);
              notify("Resina registrada.");
              return true;
            }
            return false;
          }}
        />
      )}{" "}
      {dialog === "calibration" && (
        <NewCalibration
          store={store}
          onClose={closeDialog}
          onSave={(next, id) => {
            if (persist(next)) {
              setDialog(null);
              open(id);
              return true;
            }
            return false;
          }}
        />
      )}{" "}
      {confirmation && (
        <Modal title={confirmation.title} onClose={closeConfirmation}>
          <p className="muted">{confirmation.detail}</p>
          <div className="form-actions">
            <button className="btn secondary" onClick={closeConfirmation}>
              Cancelar
            </button>
            <button className="btn primary" onClick={confirmation.action}>
              Confirmar
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <CircleCheck size={18} />
          {toast}
          <button
            className="icon-btn"
            aria-label="Cerrar aviso"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
