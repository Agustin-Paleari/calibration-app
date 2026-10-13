import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import type { Calibration, Store } from "../domain/types";
import { RESIN_NAMES } from "../domain/setup";
import { Field } from "./ui";

export interface ParameterFilters {
  brand: string;
  modelId: string;
  manufacturer: string;
  resinName: string;
}
export function matchesParameters(
  calibration: Calibration,
  store: Store,
  filters: ParameterFilters | null,
) {
  if (!filters) return true;
  const printer = store.printers.find((p) => p.id === calibration.printerId);
  const model = store.models.find((m) => m.id === printer?.modelId);
  const resin = store.resins.find((r) => r.id === calibration.resinId);
  return (
    (!filters.brand || model?.brand === filters.brand) &&
    (!filters.modelId || model?.id === filters.modelId) &&
    (!filters.manufacturer || resin?.manufacturer === filters.manufacturer) &&
    (!filters.resinName || resin?.name === filters.resinName)
  );
}

export function ParameterSearch({
  store,
  onConsult,
}: {
  store: Store;
  onConsult: (filters: ParameterFilters) => void;
}) {
  const [filters, setFilters] = useState<ParameterFilters>({
    brand: "",
    modelId: "",
    manufacturer: "",
    resinName: "",
  });
  const brands = [...new Set(store.models.map((m) => m.brand))];
  const manufacturers = [
    ...new Set([
      ...Object.keys(RESIN_NAMES),
      ...store.resins.map((r) => r.manufacturer),
    ]),
  ].sort((a, b) => a.localeCompare(b));
  const resinNames = [
    ...new Set([
      ...(RESIN_NAMES[filters.manufacturer] ?? []),
      ...store.resins
        .filter((r) => r.manufacturer === filters.manufacturer)
        .map((r) => r.name),
    ]),
  ].sort((a, b) => a.localeCompare(b));
  return (
    <section className="panel parameter-search" aria-labelledby="search-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">UN PUNTO DE PARTIDA</span>
          <h2 id="search-title">Buscar parámetros</h2>
          <p>Elegí una combinación para consultar tus recetas guardadas.</p>
        </div>
        <span className="section-icon">
          <Search size={23} />
        </span>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onConsult(filters);
        }}
      >
        <div className="parameter-fields">
          <Field label="Marca impresora">
            <select
              value={filters.brand}
              onChange={(e) =>
                setFilters({ ...filters, brand: e.target.value, modelId: "" })
              }
            >
              <option value="">Todas las marcas</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Modelo impresora">
            <select
              disabled={!filters.brand}
              value={filters.modelId}
              onChange={(e) =>
                setFilters({ ...filters, modelId: e.target.value })
              }
            >
              <option value="">
                {filters.brand
                  ? "Todos los modelos"
                  : "Elegí primero una marca"}
              </option>
              {store.models
                .filter((m) => m.brand === filters.brand)
                .map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Marca resina">
            <select
              value={filters.manufacturer}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  manufacturer: e.target.value,
                  resinName: "",
                })
              }
            >
              <option value="">Todas las marcas</option>
              {manufacturers.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tipo de resina">
            <select
              disabled={!filters.manufacturer}
              value={filters.resinName}
              onChange={(e) =>
                setFilters({ ...filters, resinName: e.target.value })
              }
            >
              <option value="">
                {filters.manufacturer
                  ? "Todas las resinas"
                  : "Elegí primero una marca"}
              </option>
              {resinNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="parameter-search-footer">
          <p>
            Los resultados pertenecen a este navegador. Cada calibración se
            muestra por separado.
          </p>
          <button className="btn primary" type="submit">
            Ver resultados <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </section>
  );
}
