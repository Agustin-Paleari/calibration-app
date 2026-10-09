import { describe, expect, it } from "vitest";
import {
  analyze,
  dimension,
  externalCompensation,
  internalCompensation,
  validateTrial,
} from "./calibration";
import { recommendRound } from "./recommendations";
import type { Trial } from "./types";
const recommend = (t: Trial, previous?: Trial) =>
  recommendRound(previous ? [previous, t] : [t]);
const trial: Trial = {
  id: "trial",
  date: "2026-10-08",
  exposure: 2.5,
  layer: 0.05,
  x: 12,
  y: 10,
  pin: "correct",
  supports: "stable",
  notes: "",
  scaleX: 100,
  scaleY: 100,
  compensationA: 0,
  compensationB: 0,
};
describe("Precisión dimensional", () => {
  it("incluye ambos extremos exactos de la tolerancia", () => {
    expect(dimension(12.05, 12).pass).toBe(true);
    expect(dimension(11.95, 12).pass).toBe(true);
    expect(dimension(10.05, 10).pass).toBe(true);
    expect(dimension(9.95, 10).pass).toBe(true);
  });
  it("no aprueba valores fuera de tolerancia aunque redondeen a 0,050", () => {
    expect(dimension(12.0501, 12).pass).toBe(false);
    expect(dimension(11.9499, 12).pass).toBe(false);
  });
  it("separa mm, porcentaje y escala", () => {
    const d = dimension(12.12, 12);
    expect(d.deviation).toBeCloseTo(0.12);
    expect(d.percent).toBeCloseTo(1);
    expect(d.scale).toBeCloseTo(99.00990099);
  });
  it("rechaza dimensiones cero, negativas y no finitas", () => {
    for (const n of [0, -1, NaN, Infinity])
      expect(() => dimension(n, 12)).toThrow();
  });
  it("calcula desplazamiento externo por pared", () => {
    expect(
      externalCompensation({ ...trial, x: 12.1, y: 10.1 }).xPerWall,
    ).toBeCloseTo(-0.05);
    expect(externalCompensation({ ...trial, x: 12.1, y: 9.9 }).uniform).toBe(
      false,
    );
  });
  it("calcula corrección de alojamiento sin inferirla del encastre", () => {
    expect(internalCompensation(7, 7.1)).toBeCloseTo(0.05);
    expect(internalCompensation(5.2, 5.1)).toBeCloseTo(-0.05);
  });
});
describe("Validación y recomendaciones", () => {
  it("exige dimensiones, encastre correcto y soportes para aprobar", () => {
    expect(analyze(trial).passed).toBe(true);
    for (const patch of [
      { x: 12.06 },
      { y: 10.06 },
      { pin: "tight" as const },
      { pin: "loose" as const },
      { supports: "failed" as const },
    ])
      expect(analyze({ ...trial, ...patch }).passed).toBe(false);
  });
  it("sugiere aumentar exposición por pines sueltos", () => {
    expect(recommend({ ...trial, pin: "loose" }).nextExposure).toBe(2.6);
  });
  it("sugiere bajar exposición por pines ajustados con soportes estables", () => {
    expect(recommend({ ...trial, pin: "tight" }).nextExposure).toBe(2.4);
  });
  it("prioriza soportes fallidos y advierte de una reducción previa", () => {
    const r = recommend(
      { ...trial, exposure: 2, pin: "tight", supports: "failed" },
      trial,
    );
    expect(r.nextExposure).toBe(2.5);
    expect(r.detail).toContain("fallaron al reducir");
  });
  it("no sigue bajando exposición si no hay ensayo anterior estable", () => {
    expect(
      recommend({ ...trial, supports: "failed", pin: "tight" }).nextExposure,
    ).toBe(2.5);
  });
  it("mantiene exposición ante señales de encastre opuestas", () => {
    expect(
      recommend({ ...trial, pin: undefined, pin7: "tight", pin5: "loose" })
        .nextExposure,
    ).toBe(2.5);
  });
  it("mantiene exposición con encastre estable y error dimensional", () => {
    expect(recommend({ ...trial, x: 12.2 }).nextExposure).toBe(2.5);
    expect(recommend({ ...trial, x: 12.2 }).title).toContain("ajustá");
  });
  it("rechaza datos incompletos y acepta un ensayo válido", () => {
    expect(validateTrial(trial)).toBeNull();
    for (const patch of [
      { exposure: NaN },
      { layer: 2 },
      { x: 0 },
      { scaleX: 0 },
      { compensationA: Infinity },
      { date: "" },
      { pin: "" as Trial["pin"] },
    ])
      expect(validateTrial({ ...trial, ...patch })).not.toBeNull();
  });
});
it("rechaza fechas inexistentes", () => {
  expect(validateTrial({ ...trial, date: "2026-02-30" })).toContain(
    "fecha válida",
  );
});
it("el ensayo nuevo necesita solo X, Y y un encastre, sin diámetros", () => {
  expect(validateTrial(trial)).toBeNull();
  expect(analyze(trial).passed).toBe(true);
  expect(analyze({ ...trial, pin: "tight" }).passed).toBe(false);
  expect(analyze({ ...trial, pin: "loose" }).passed).toBe(false);
});
it("conserva el análisis de registros anteriores sin inventar un encastre único", () => {
  const legacy = {
    ...trial,
    pin: undefined,
    pin7: "correct" as const,
    pin5: "tight" as const,
  };
  expect(validateTrial(legacy)).toBeNull();
  expect(analyze(legacy).fit).toBe(false);
});
