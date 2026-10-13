import { useEffect, useRef } from "react";
import {
  BookOpen,
  ChevronDown,
  Download,
  FlaskConical,
  HardDrive,
  History,
  Search,
  Upload,
} from "lucide-react";
import { Field, Logo } from "./ui";

export type Page =
  "dashboard" | "calibrations" | "recipes" | "printers" | "resins" | "guide";

export function AppHeader({
  page,
  activeCalibration,
  onNavigate,
  onExport,
  onImport,
  storageError,
}: {
  page: Page;
  activeCalibration: boolean;
  onNavigate: (page: Page) => void;
  onExport: () => void;
  onImport: () => void;
  storageError: boolean;
}) {
  const toolsRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const closeOutside = (e: PointerEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node))
        toolsRef.current.open = false;
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && toolsRef.current?.open) {
        toolsRef.current.open = false;
        toolsRef.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const navigate = (next: Page) => {
    if (toolsRef.current) toolsRef.current.open = false;
    onNavigate(next);
  };
  return (
    <header className="app-header">
      <div className="header-inner">
        <button
          className="brand-button"
          aria-label="Calibration Hub, inicio"
          onClick={() => navigate("dashboard")}
        >
          <Logo />
        </button>
        <nav className="primary-navigation" aria-label="Navegación principal">
          {[
            {
              id: "dashboard" as const,
              name: "Calibrar",
              icon: FlaskConical,
              active: page === "dashboard" || activeCalibration,
            },
            {
              id: "recipes" as const,
              name: "Parámetros",
              icon: Search,
              active: page === "recipes",
            },
            {
              id: "guide" as const,
              name: "Guía",
              icon: BookOpen,
              active: page === "guide",
            },
          ].map(({ id, name, icon: Icon, active }) => (
            <button
              key={id}
              className={`header-nav-item ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              <span>{name}</span>
            </button>
          ))}
        </nav>
        <div className="header-tools">
          <button
            className={`header-history ${page === "calibrations" && !activeCalibration ? "active" : ""}`}
            aria-label="Historial"
            aria-current={
              page === "calibrations" && !activeCalibration ? "page" : undefined
            }
            onClick={() => navigate("calibrations")}
          >
            <History size={18} />
            <span>Historial</span>
          </button>
          <details className="workshop-menu" ref={toolsRef}>
            <summary>
              Mi taller <ChevronDown size={16} />
            </summary>
            <div className="workshop-panel">
              <Field label="Catálogo">
                <select
                  value={page === "printers" || page === "resins" ? page : ""}
                  onChange={(e) => {
                    if (e.target.value) navigate(e.target.value as Page);
                  }}
                >
                  <option value="">Equipo y materiales</option>
                  <option value="printers">Impresoras</option>
                  <option value="resins">Resinas</option>
                </select>
              </Field>
              <div className="workshop-storage">
                <HardDrive size={18} />
                <div>
                  <b>
                    {storageError
                      ? "Revisá el almacenamiento"
                      : "Tus datos, en este navegador"}
                  </b>
                  <p>Guardá una copia para conservarlos o trasladarlos.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (toolsRef.current) toolsRef.current.open = false;
                  onExport();
                }}
              >
                <Download size={16} />
                Exportar respaldo
              </button>
              <button
                onClick={() => {
                  if (toolsRef.current) toolsRef.current.open = false;
                  onImport();
                }}
              >
                <Upload size={16} />
                Restaurar respaldo
              </button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
