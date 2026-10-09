import { expect, it } from "vitest";
import { sampleTrial } from "../../tests/data/fixtures";
import { DEFAULT_METHOD, q3, recommendRound } from "./recommendations";
import { defaultContext } from "./protocol";
it("prepara cambios redondeados a tres decimales sin cambiar parámetros ajenos al mecanismo", () => {
  const t = sampleTrial({ x: 12.12, y: 10.1, scaleX: 102, scaleY: 101 });
  const r = recommendRound([t]);
  expect(r.code).toBe("SCALE_BOTH");
  expect(r.plan).toMatchObject({
    exposure: 2.5,
    compensationA: 0,
    compensationB: 0,
    scaleX: 100.99,
    scaleY: 100,
  });
  expect(r.changes.map((c) => c.unit)).toEqual(["%", "%"]);
  expect(q3(-0.0125)).toBe(-0.013);
});
it("conserva la exposición funcional en etapas dimensionales aunque el pin cambie", () => {
  const first = sampleTrial({ x: 12.1, y: 10.1 });
  const next = sampleTrial({ id: "next", pin: "tight" });
  const r = recommendRound([first, next]);
  expect(r.code).toBe("INTERNAL_REVIEW");
  expect(r.plan.exposure).toBe(first.exposure);
  expect(r.changes).toEqual([]);
});
it("solo propone A cuando la convención fue confirmada; no infiere un diámetro", () => {
  const first = sampleTrial(),
    next = sampleTrial({ pin: "tight" });
  const r = recommendRound([first, next], {
    ...DEFAULT_METHOD,
    chituboxOffsetsConfirmed: true,
  });
  expect(r.code).toBe("INTERNAL_OPEN");
  expect(r.plan.compensationA).toBe(-0.025);
  expect(r.plan.exposure).toBe(2.5);
  expect(r.changes).toHaveLength(1);
});
it("usa B por pared en un error absoluto uniforme y solo con convención confirmada", () => {
  const t = sampleTrial({ x: 12.25, y: 10.25, compensationB: 0.1 });
  const r = recommendRound([t], {
    ...DEFAULT_METHOD,
    chituboxOffsetsConfirmed: true,
  });
  expect(r.code).toBe("EXTERNAL_B");
  expect(r.plan.compensationB).toBe(-0.025);
  expect(r.plan.scaleX).toBe(100);
  expect(r.plan.scaleY).toBe(100);
  expect(recommendRound([t]).code).toBe("SCALE_AXIS");
});
it("busca el último ensayo estable compatible y no solo el inmediatamente anterior", () => {
  const before = sampleTrial({ exposure: 2.6, pin: "tight" }),
    failed = sampleTrial({ exposure: 2.5, supports: "partial" }),
    again = sampleTrial({ exposure: 2.4, supports: "failed" });
  expect(recommendRound([before, failed, again]).plan.exposure).toBe(2.6);
});
it("no compara exposiciones funcionales entre distintas capas, poscurados o protocolos", () => {
  const first = sampleTrial();
  for (const patch of [
    { layer: 0.03 },
    {
      context: { ...defaultContext(), measurementStage: "post-cure" as const },
    },
    { pin: undefined, pin7: "tight" as const, pin5: "tight" as const },
  ]) {
    const r = recommendRound([
      first,
      sampleTrial({
        ...patch,
        pin: patch.pin === undefined && "pin7" in patch ? undefined : "tight",
      }),
    ]);
    expect(r.lockedExposure).toBeNull();
    expect(r.code).toBe("LOWER_EXPOSURE");
  }
});
it("mantiene las medidas originales y el historial al elaborar una sugerencia", () => {
  const t = sampleTrial({ x: 12.3, pin: "tight" }),
    before = JSON.stringify(t);
  recommendRound([t]);
  expect(JSON.stringify(t)).toBe(before);
});
it("los soportes parcialmente separados impiden pasar a correcciones dimensionales", () => {
  const r = recommendRound([sampleTrial({ supports: "partial", x: 12.1 })]);
  expect(r.code).toBe("SUPPORT_REVIEW");
  expect(r.changes).toEqual([]);
});
