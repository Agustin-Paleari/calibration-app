import { useCallback, useRef, useState } from "react";
import {
  LayoutDashboard,
  Printer,
  Droplets,
  FlaskConical,
  BookOpen,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Check,
  Download,
  Upload,
  Menu,
  X,
  CircleCheck,
  Clock3,
  ShieldCheck,
  Trash2,
  ChevronRight,
  Search,
  HardDrive,
  TriangleAlert,
} from "lucide-react";
import type { Calibration, Store } from "./domain/types";
import { localRepository, parseStore } from "./data/storage";
import { emptyStore, uid } from "./data/catalog";
import { analyze, fmt, REFERENCE } from "./domain/calibration";
import { Badge, Empty, Field, Logo, Modal, Piece } from "./components/ui";
import { Catalog, PrinterForm, ResinForm } from "./components/Catalog";
import { CalibrationDetail } from "./components/CalibrationDetail";
type Page = "dashboard" | "calibrations" | "printers" | "resins" | "guide";
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
const nav = [
  { id: "dashboard", name: "Vista general", icon: LayoutDashboard },
  { id: "calibrations", name: "Calibraciones", icon: FlaskConical },
  { id: "printers", name: "Impresoras", icon: Printer },
  { id: "resins", name: "Resinas", icon: Droplets },
  { id: "guide", name: "Guía de calibración", icon: BookOpen },
] as const;
function NewCalibration({
  store,
  onSave,
  onClose,
}: {
  store: Store;
  onSave: (c: Calibration) => void;
  onClose: () => void;
}) {
  const [printerId, setPrinter] = useState(store.printers[0]?.id ?? ""),
    [resinId, setResin] = useState(store.resins[0]?.id ?? ""),
    [name, setName] = useState("");
  return (
    <Modal
      title="Busquemos la precisión."
      subtitle="Una calibración reúne todos los ensayos de un equipo y una resina."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!printerId || !resinId || !name.trim()) return;
          onSave({
            id: uid(),
            printerId,
            resinId,
            name: name.trim(),
            createdAt: new Date().toISOString(),
            completedAt: null,
            trials: [],
          });
        }}
      >
        <Field label="Nombre de la calibración">
          <input
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Ajuste dimensional · Aqua Gray"
          />
        </Field>
        <Field label="Impresora">
          <select
            required
            value={printerId}
            onChange={(e) => setPrinter(e.target.value)}
          >
            <option value="">Seleccioná tu equipo</option>
            {store.printers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {store.models.find((m) => m.id === p.modelId)?.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Resina">
          <select
            required
            value={resinId}
            onChange={(e) => setResin(e.target.value)}
          >
            <option value="">Seleccioná la resina</option>
            {store.resins.map((r) => (
              <option key={r.id} value={r.id}>
                {r.manufacturer} · {r.name} ({r.color})
              </option>
            ))}
          </select>
        </Field>
        {(!store.printers.length || !store.resins.length) && (
          <div className="notice warning">
            Registrá al menos una impresora y una resina en sus catálogos antes
            de comenzar.
          </div>
        )}
        <div className="form-note">
          <ShieldCheck size={16} />
          Tolerancia de referencia: ±0,050 mm · CHITUBOX
        </div>
        <button
          className="btn primary full"
          disabled={!store.printers.length || !store.resins.length}
        >
          Comenzar calibración
          <ArrowRight size={17} />
        </button>
      </form>
    </Modal>
  );
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
          <div className="segmented" aria-label="Estado de calibración">
            {[
              ["all", "Todas"],
              ["progress", "En progreso"],
              ["complete", "Calibrated"],
            ].map(([id, label]) => (
              <button
                key={id}
                aria-pressed={filter === id}
                className={filter === id ? "active" : ""}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
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
                          ? "Calibrated"
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
function Guide() {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">EL MÉTODO</span>
          <h1>
            Menos prueba y error.
            <br />
            Más precisión.
          </h1>
          <p>Un proceso sencillo, repetible y fácil de interpretar.</p>
        </div>
      </div>
      <div className="guide-grid">
        <div className="panel guide-reference">
          <span className="eyebrow">LA PIEZA DE REFERENCIA</span>
          <Piece large />
          <div className="reference-specs">
            {[
              ["Dimensión X", "12,000 mm"],
              ["Dimensión Y", "10,000 mm"],
              ["Pines", "7,000 / 5,000 mm"],
              ["Alojamientos", "7,100 / 5,100 mm"],
              ["Tolerancia", "±0,050 mm"],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <b>{value}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="panel guide-steps">
          {[
            [
              "Prepará tu equipo",
              "Seleccioná una impresora y resina. Usá la pieza de referencia y registrá exposición y altura de capa.",
            ],
            [
              "Medí con cuidado",
              "Aplicá siempre el mismo procedimiento de lavado y curado. Medí X e Y, probá ambos pines y revisá los soportes.",
            ],
            [
              "Resolvé el encastre",
              "Las sugerencias de exposición son exploratorias. Los soportes tienen prioridad: no reduzcas más si fallan.",
            ],
            [
              "Ajustá las dimensiones",
              "Con exposición estable, evaluá escalado por eje o compensaciones. Cambiá un mecanismo a la vez y registrá los valores aplicados.",
            ],
            [
              "Confirmá el resultado",
              "Para finalizar, el último ensayo debe aprobar X e Y dentro de ±0,050 mm, ambos encastres y los soportes.",
            ],
          ].map(([title, detail], i) => (
            <article key={title}>
              <span>{`0${i + 1}`}</span>
              <div>
                <h3>{title}</h3>
                <p>{detail}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="notice">
        <BookOpen size={20} />
        <div>
          <b>Milímetros y porcentajes son unidades diferentes.</b>
          <p>
            Desviación = medido − nominal (mm). Diferencia relativa = desviación
            ÷ nominal × 100 (%). Escala sugerida = nominal ÷ medido × escala
            aplicada (%). A corrige contornos internos y B externos; confirmá
            las convenciones de tu versión de CHITUBOX.
          </p>
        </div>
      </div>
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
  const [mobile, setMobile] = useState(false);
  const [toast, setToast] = useState("");
  const [confirmation, setConfirmation] = useState<{
    title: string;
    detail: string;
    action: () => void;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
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
  const closeDialog = useCallback(() => setDialog(null), []);
  const closeConfirmation = useCallback(() => setConfirmation(null), []);
  const go = (p: Page) => {
    setPage(p);
    setActiveId(null);
    setMobile(false);
    window.scrollTo({ top: 0 });
  };
  const open = (id: string) => {
    setActiveId(id);
    setPage("calibrations");
    window.scrollTo({ top: 0 });
  };
  const start = () => {
    if (!store.printers.length) {
      notify("Primero registrá tu impresora.");
      setDialog("printer");
      return;
    }
    if (!store.resins.length) {
      notify("Agregá la resina que vas a utilizar.");
      setDialog("resin");
      return;
    }
    setDialog("calibration");
  };
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
  const completed = store.calibrations.filter((c) => c.completedAt).length;
  const pending = store.calibrations.filter((c) => !c.completedAt).length;
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
      <div className="mobile-header" inert={!!dialog || !!confirmation}>
        <button
          className="icon-btn"
          aria-label="Abrir navegación"
          onClick={() => setMobile(true)}
        >
          <Menu size={23} />
        </button>
        <Logo />
      </div>
      {mobile && (
        <div className="sidebar-overlay" onClick={() => setMobile(false)} />
      )}
      <aside
        inert={!!dialog || !!confirmation}
        className={`sidebar ${mobile ? "open" : ""}`}
      >
        <a
          className="logo"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("dashboard");
          }}
          aria-label="Calibration Hub, inicio"
        >
          <Logo />
        </a>
        <button
          className="mobile-close icon-btn"
          aria-label="Cerrar navegación"
          onClick={() => setMobile(false)}
        >
          <X size={20} />
        </button>
        <div className="workspace-label">
          <span className="workspace-dot" />
          MI LABORATORIO<span className="workspace-tag">LOCAL</span>
        </div>
        <nav>
          {nav.map(({ id, name, icon: Icon }) => (
            <button
              className={`nav-item ${page === id ? "active" : ""}`}
              key={id}
              onClick={() => go(id)}
            >
              <Icon size={19} />
              <span>{name}</span>
              {id === "calibrations" && store.calibrations.length > 0 && (
                <i>{store.calibrations.length}</i>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card">
            <HardDrive size={20} />
            <h4>Tu taller. Tus datos.</h4>
            <p>
              Guardados en este navegador.
              <br />
              Sin cuentas, sin suscripciones.
            </p>
            <button onClick={exportData}>
              <Download size={14} />
              Exportar respaldo
            </button>
            <button onClick={() => fileInput.current?.click()}>
              <Upload size={14} />
              Restaurar respaldo
            </button>
          </div>
          <div className="sidebar-footer">
            <span className="version-dot" />
            Calibration Hub<span>v1.0</span>
          </div>
        </div>
      </aside>
      <div className="main-wrap" inert={!!dialog || !!confirmation}>
        <header className="topbar">
          <div>
            Mi laboratorio
            <ChevronRight size={14} />
            <span>{nav.find((n) => n.id === page)?.name}</span>
            {active && (
              <>
                <ChevronRight size={14} />
                <span className="breadcrumb-name">{active.name}</span>
              </>
            )}
          </div>
          <span className="local-status">
            <span />
            {storageError
              ? "Almacenamiento requiere atención"
              : "Almacenamiento local"}
          </span>
        </header>
        <main>
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
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">PRECISIÓN EN CADA CAPA</span>
                  <h1>
                    Tu laboratorio, en orden<span className="title-dot">.</span>
                  </h1>
                  <p>
                    Medí, ajustá y encontrá el punto exacto de cada impresión.
                  </p>
                </div>
                <button className="btn primary" onClick={start}>
                  <Plus size={18} />
                  Nueva calibración
                </button>
              </div>
              <section className="hero">
                <div className="hero-copy">
                  <span className="hero-label">
                    <span />
                    DE LA MEDICIÓN A LA PRECISIÓN
                  </span>
                  <h2>
                    Pequeños ajustes.
                    <br />
                    Grandes resultados.
                  </h2>
                  <p>
                    Un método claro para calibrar tu impresora de resina. Cada
                    ensayo te acerca a una pieza que encaja.
                  </p>
                  <button className="btn hero-button" onClick={start}>
                    Comenzar una calibración
                    <ArrowUpRight size={18} />
                  </button>
                  <div className="hero-meta">
                    <span>
                      <RulerIcon />
                      ±0,050 mm
                    </span>
                    <span>
                      <ShieldCheck size={14} />
                      Validación por ensayo
                    </span>
                  </div>
                </div>
                <div className="hero-art">
                  <div className="art-grid" />
                  <span className="art-caption">SPECIMEN / 001</span>
                  <Piece />
                  <div className="art-footer">
                    <span>PIEZA DE REFERENCIA</span>
                    <span>X 12 × Y 10 mm</span>
                  </div>
                </div>
              </section>
              <div className="stats-grid">
                {[
                  {
                    label: "Impresoras",
                    value: store.printers.length,
                    icon: Printer,
                    page: "printers",
                    note: "Equipos en tu laboratorio",
                  },
                  {
                    label: "Resinas",
                    value: store.resins.length,
                    icon: Droplets,
                    page: "resins",
                    note: "Materiales registrados",
                  },
                  {
                    label: "Calibraciones",
                    value: store.calibrations.length,
                    icon: FlaskConical,
                    page: "calibrations",
                    note: `${pending} en progreso`,
                  },
                  {
                    label: "Calibrated",
                    value: completed,
                    icon: CircleCheck,
                    page: "calibrations",
                    note: "Todos los criterios aprobados",
                  },
                ].map((s) => (
                  <button
                    className="stat-card"
                    key={s.label}
                    onClick={() => go(s.page as Page)}
                  >
                    <div>
                      <span>{s.label}</span>
                      <s.icon size={19} />
                    </div>
                    <strong>{String(s.value).padStart(2, "0")}</strong>
                    <small>
                      {s.note}
                      <ArrowUpRight size={14} />
                    </small>
                  </button>
                ))}
              </div>
              <section className="panel recent-panel">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">CADA ENSAYO CUENTA</span>
                    <h3>Calibraciones recientes</h3>
                  </div>
                  <button
                    className="text-btn"
                    onClick={() => go("calibrations")}
                  >
                    Ver todas
                    <ArrowRight size={15} />
                  </button>
                </div>
                <CalibrationList store={store} onOpen={open} compact />
              </section>
              <div className="dashboard-bottom">
                <section className="panel checklist-panel">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">TODO LISTO PARA IMPRIMIR</span>
                      <h3>
                        {pending
                          ? "Tus próximos pasos"
                          : "Prepará tu primer ensayo"}
                      </h3>
                    </div>
                    <Clock3 size={20} />
                  </div>
                  {pending ? (
                    <>
                      <p className="muted">
                        Tenés {pending} calibraciones con ensayos pendientes de
                        completar o validar.
                      </p>
                      {store.calibrations
                        .filter((c) => !c.completedAt)
                        .slice(0, 3)
                        .map((c) => (
                          <button
                            className="checklist-item"
                            key={c.id}
                            onClick={() => open(c.id)}
                          >
                            <span className="checklist-circle">
                              <FlaskConical size={14} />
                            </span>
                            <span>
                              {c.name}
                              <small>
                                {c.trials.length} ensayos ·{" "}
                                {c.trials.length
                                  ? "continuar ajustes"
                                  : "registrar primer ensayo"}
                              </small>
                            </span>
                            <ArrowUpRight size={17} />
                          </button>
                        ))}
                    </>
                  ) : (
                    <>
                      {[
                        {
                          ready: store.printers.length > 0,
                          label: "Registrá tu impresora",
                          detail: "Tu marca, modelo y equipo",
                          action: () => setDialog("printer"),
                        },
                        {
                          ready: store.resins.length > 0,
                          label: "Elegí tu resina",
                          detail: "El material con el que vas a trabajar",
                          action: () => setDialog("resin"),
                        },
                        {
                          ready: store.calibrations.length > 0,
                          label: "Comenzá una calibración",
                          detail: "Un ensayo. Un punto de partida.",
                          action: start,
                        },
                      ].map((item, i) => (
                        <button
                          className="checklist-item"
                          onClick={item.action}
                          key={item.label}
                        >
                          <span
                            className={`checklist-circle ${item.ready ? "done" : ""}`}
                          >
                            {item.ready ? <Check size={15} /> : i + 1}
                          </span>
                          <span>
                            {item.label}
                            <small>{item.detail}</small>
                          </span>
                          <ArrowUpRight size={17} />
                        </button>
                      ))}
                    </>
                  )}
                </section>
                <button className="method-card" onClick={() => go("guide")}>
                  <BookOpen size={25} strokeWidth={1.5} />
                  <span className="eyebrow">CONOCÉ EL MÉTODO</span>
                  <h3>
                    La precisión tiene
                    <br />
                    un proceso.
                  </h3>
                  <p>
                    De los pines al escalado: entendé qué ajustar y por qué.
                  </p>
                  <span className="method-link">
                    Explorar la guía
                    <ArrowUpRight size={17} />
                  </span>
                </button>
              </div>
            </>
          ) : page === "printers" || page === "resins" ? (
            <Catalog
              key={page}
              kind={page}
              store={store}
              onAdd={() => setDialog(page === "printers" ? "printer" : "resin")}
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
          ) : page === "guide" ? (
            <Guide />
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
            <span>Hecho para encontrar el punto exacto.</span>
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
            }
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
            }
          }}
        />
      )}{" "}
      {dialog === "calibration" && (
        <NewCalibration
          store={store}
          onClose={closeDialog}
          onSave={(c) => {
            if (
              persist({ ...store, calibrations: [...store.calibrations, c] })
            ) {
              setDialog(null);
              open(c.id);
            }
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
function RulerIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <rect x="2" y="5" width="16" height="10" rx="1" />
      <path d="M6 5v4m4-4v6m4-6v4" />
    </svg>
  );
}
