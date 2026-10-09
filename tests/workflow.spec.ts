import { test, expect, type Page } from "@playwright/test";
import { startCalibration } from "./helpers";
async function register(page: Page) {
  await page.goto("/");
  await startCalibration(page);
}
async function trial(
  page: Page,
  x: string,
  y: string,
  fit = "correct",
  supports = "stable",
) {
  await page.getByLabel("Dimensión X medida · mm").fill(x);
  await page.getByLabel("Dimensión Y medida · mm").fill(y);
  await page.getByLabel("Encastre del pin").selectOption(fit);
  await page.getByLabel("Estado de los soportes").selectOption(supports);
  await page.getByRole("button", { name: "Guardar y analizar" }).click();
}
test("registro, análisis, siguiente ensayo, validación, persistencia e historial", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await register(page);
  await trial(page, "12,120", "10,080", "tight");
  await expect(
    page.getByRole("button", { name: "Finalizar calibración" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", {
      name: "Probá una reducción pequeña de exposición",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Preparar próximo ensayo" }).click();
  await expect(page.getByLabel("Dimensión X medida · mm")).toHaveValue("");
  await expect(page.getByLabel("Encastre del pin")).toHaveValue("");
  await expect(page.getByLabel("Exposición normal · s")).toHaveValue("2.4");
  await trial(page, "12.050", "9.950");
  await expect(
    page.getByRole("button", { name: "Finalizar calibración" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Finalizar calibración" }).click();
  await expect(
    page.getByText("Calibración finalizada con el último ensayo aprobado."),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "2 ensayos registrados" }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Precisión del taller", exact: false })
    .first()
    .click();
  await expect(
    page.getByText("Calibración finalizada con el último ensayo aprobado."),
  ).toBeVisible();
  await page.getByRole("button", { name: "#1", exact: false }).click();
  await expect(
    page.getByRole("heading", {
      name: "Probá una reducción pequeña de exposición",
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/calibration-results.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("catálogo PioCreat / Aidis y nuevo modelo pendiente", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Catálogo", { exact: true }).selectOption("printers");
  await page
    .getByRole("button", { name: "Registrar impresora", exact: true })
    .click();
  await page
    .getByLabel("Marca de impresora", { exact: true })
    .selectOption("PioCreat / Aidis");
  await page.getByLabel("Modelo", { exact: true }).selectOption("__custom__");
  await page.getByLabel("Nuevo modelo").fill("Modelo del laboratorio");
  await page
    .getByText("Nombre personalizado del equipo · opcional", { exact: true })
    .click();
  await page.getByLabel("Nombre de tu impresora").fill("Aidis taller");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Registrar impresora", exact: true })
    .click();
  await expect(
    page.getByText("Modelo pendiente", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByLabel("Catálogo", { exact: true }).selectOption("printers");
  await expect(page.getByText("Aidis taller", { exact: true })).toBeVisible();
});
test("mobile navigation and layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Tu laboratorio, en orden." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/calibration-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Abrir navegación" }).click();
  await page
    .getByRole("button", { name: "Guía de calibración", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Menos prueba y error. Más precisión." }),
  ).toBeVisible();
});
test("desktop dashboard", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({
    path: "/tmp/calibration-dashboard.png",
    fullPage: true,
  });
});
test("soportes fallidos tras reducir exposición: recuperar último valor estable", async ({
  page,
}) => {
  await register(page);
  await trial(page, "12.100", "10.100", "tight");
  await page.getByRole("button", { name: "Preparar próximo ensayo" }).click();
  await trial(page, "12.040", "10.040", "correct", "failed");
  await expect(
    page.getByRole("heading", { name: "Primero, recuperá los soportes" }),
  ).toBeVisible();
  await expect(
    page.getByText("Los soportes fallaron al reducir la exposición.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Finalizar calibración" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Preparar próximo ensayo" }).click();
  await expect(page.getByLabel("Exposición normal · s")).toHaveValue("2.5");
});
test("respaldo válido se restaura con confirmación y los inválidos se rechazan", async ({
  page,
}) => {
  await register(page);
  await trial(page, "12", "10");
  const raw = await page.evaluate(() =>
    localStorage.getItem("calibration-hub:v1")!,
  );
  await page
    .getByRole("button", { name: "Todas las calibraciones", exact: true })
    .click();
  await page.getByLabel("Importar respaldo JSON").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":2}'),
  });
  await expect(page.getByRole("status")).toContainText(
    "Formato de respaldo no compatible",
  );
  await expect(
    page
      .getByRole("button", { name: "Precisión del taller", exact: false })
      .first(),
  ).toBeVisible();
  await page.getByLabel("Importar respaldo JSON").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(raw),
  });
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirmar", exact: true })
    .click();
  await page.reload();
  await page
    .getByRole("button", { name: "Precisión del taller", exact: false })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "El ensayo cumple todos los criterios" }),
  ).toBeVisible();
});
test("datos corruptos no se sobrescriben al abrir la aplicación", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem("calibration-hub:v1", "broken-data"),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText(
    "No pudimos leer los datos locales",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("calibration-hub:v1")),
  ).toBe("broken-data");
});
test("crear equipo, resina y calibración en un mismo formulario sin registros parciales", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Nueva calibración", exact: true })
    .click();
  await page.getByLabel("Marca de impresora").selectOption("Elegoo");
  await page
    .getByLabel("Modelo", { exact: true })
    .selectOption({ label: "Saturn 4 Ultra" });
  await page.getByLabel("Fabricante", { exact: true }).selectOption("Elegoo");
  await page
    .getByLabel("Resina", { exact: true })
    .selectOption("ABS-Like Resin 2.0");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cerrar", exact: true })
    .click();
  expect(
    await page.evaluate(() => localStorage.getItem("calibration-hub:v1")),
  ).toBeNull();
  await page
    .getByRole("button", { name: "Nueva calibración", exact: true })
    .click();
  await page.getByLabel("Marca de impresora").selectOption("Elegoo");
  await page
    .getByLabel("Modelo", { exact: true })
    .selectOption({ label: "Saturn 4 Ultra" });
  await page.getByLabel("Fabricante", { exact: true }).selectOption("Elegoo");
  await page
    .getByLabel("Resina", { exact: true })
    .selectOption("ABS-Like Resin 2.0");
  await page
    .getByRole("button", { name: "Comenzar calibración", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Una nueva medición" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Encastre del pin", { exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByText("Diámetro nominal del pin", { exact: true }),
  ).toHaveCount(0);
  const store = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("calibration-hub:v1")!),
  );
  expect(store.printers).toHaveLength(1);
  expect(store.resins).toHaveLength(1);
  expect(store.calibrations).toHaveLength(1);
  await page.screenshot({
    path: "/tmp/calibration-simple-trial.png",
    fullPage: true,
  });
});
test("reutiliza equipo y resina guardados sin exigir nombres o registros nuevos", async ({
  page,
}) => {
  await register(page);
  await page
    .getByRole("button", { name: "Todas las calibraciones", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Nueva calibración", exact: true })
    .click();
  await expect(page.getByLabel("Impresora", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel("Resina guardada", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Marca de impresora")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Comenzar calibración", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Una nueva medición" }),
  ).toBeVisible();
  const store = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("calibration-hub:v1")!),
  );
  expect(store.printers).toHaveLength(1);
  expect(store.resins).toHaveLength(1);
  expect(store.calibrations).toHaveLength(2);
});
test("formulario de inicio cabe en móvil y permite elegir un material personalizado", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Nueva calibración", exact: true })
    .click();
  await page.getByLabel("Marca de impresora").selectOption("Anycubic");
  await page
    .getByLabel("Modelo", { exact: true })
    .selectOption({ label: "Photon Mono 2" });
  await page
    .getByLabel("Fabricante", { exact: true })
    .selectOption("__custom__");
  await page.getByLabel("Nombre del fabricante").fill("Fabricante propio");
  await page.getByLabel("Resina", { exact: true }).selectOption("__custom__");
  await page.getByLabel("Nombre de la resina").fill("Resina del taller");
  await page.screenshot({
    path: "/tmp/calibration-setup-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Comenzar calibración", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Una nueva medición" }),
  ).toBeVisible();
});

test("biblioteca conserva dos exposiciones para la misma combinación y reutiliza sin copiar resultados", async ({
  page,
}) => {
  await register(page);
  await trial(page, "12", "10");
  await page.getByRole("button", { name: "Finalizar calibración" }).click();
  await page
    .getByRole("button", { name: "Todas las calibraciones", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Nueva calibración", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Comenzar calibración", exact: true })
    .click();
  await page.getByLabel("Exposición normal · s").fill("2.8");
  await trial(page, "12", "10");
  await page.getByRole("button", { name: "Finalizar calibración" }).click();
  await page
    .getByRole("button", { name: "Recetas guardadas", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Recetas de tu taller" }),
  ).toBeVisible();
  await expect(page.locator(".recipe-card")).toHaveCount(2);
  await expect(page.locator(".recipe-numbers")).toContainText([
    "2,500 s",
    "2,800 s",
  ]);
  await expect(
    page.getByText("Una impresión aprobada. Sin revisión independiente.", {
      exact: true,
    }),
  ).toHaveCount(2);
  await page
    .getByRole("button", { name: "Usar como punto de partida", exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Exposición normal · s")).toHaveValue("2.5");
  await expect(page.getByLabel("Dimensión X medida · mm")).toHaveValue("");
  await expect(page.getByLabel("Encastre del pin")).toHaveValue("");
  const store = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("calibration-hub:v1")!),
  );
  expect(store.printers).toHaveLength(1);
  expect(store.resins).toHaveLength(1);
  expect(store.calibrations).toHaveLength(3);
  expect(store.calibrations[2].trials).toEqual([]);
  expect(store.calibrations[2].completedAt).toBeNull();
  expect(store.calibrations[2].startingPoint.trialId).toBe(
    store.calibrations[0].trials[0].id,
  );
});
test("el procedimiento se conserva por ensayo y un cambio no reescribe el historial", async ({
  page,
}) => {
  await register(page);
  await page
    .getByText("Procedimiento del ensayo · opcional", { exact: true })
    .click();
  await page.getByLabel("Momento de la medición").selectOption("washed");
  await page.getByLabel("Instrumento de medición").selectOption("caliper");
  await page.getByLabel("Versión de CHITUBOX").fill("Basic 2.3");
  await trial(page, "12.1", "10.1");
  await page.getByRole("button", { name: "Preparar próximo ensayo" }).click();
  await page
    .getByText("Procedimiento del ensayo · opcional", { exact: true })
    .click();
  await page.getByLabel("Momento de la medición").selectOption("post-cure");
  await trial(page, "12", "10");
  const store = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("calibration-hub:v1")!),
  );
  expect(store.calibrations[0].trials[0].context.measurementStage).toBe(
    "washed",
  );
  expect(store.calibrations[0].trials[1].context.measurementStage).toBe(
    "post-cure",
  );
});
test("un ensayo dimensional prepara la escala propuesta y mantiene exposición y compensaciones", async ({
  page,
}) => {
  await register(page);
  await trial(page, "12.120", "10.100");
  await expect(
    page.getByRole("heading", {
      name: "Conservá la exposición y ajustá el escalado",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Preparar próximo ensayo" }).click();
  await expect(page.getByLabel("Escala X aplicada · %")).toHaveValue("99.01");
  await expect(page.getByLabel("Escala Y aplicada · %")).toHaveValue("99.01");
  await expect(page.getByLabel("Exposición normal · s")).toHaveValue("2.5");
  await expect(page.getByLabel("A · compensación interna · mm")).toHaveValue(
    "0",
  );
  await expect(page.getByLabel("B · compensación externa · mm")).toHaveValue(
    "0",
  );
});
test("cambiar el paso para el siguiente ensayo conserva el método del ensayo histórico", async ({
  page,
}) => {
  await register(page);
  await trial(page, "12.1", "10.1", "tight");
  await page
    .getByText("Ajustes del método · pasos y convención de CHITUBOX", {
      exact: true,
    })
    .click();
  await page.getByLabel("Paso de exposición · s").fill("0.2");
  await page
    .getByRole("button", { name: "Guardar método", exact: true })
    .click();
  const store = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("calibration-hub:v1")!),
  );
  expect(store.calibrations[0].trials[0].method.exposureStep).toBe(0.1);
  expect(store.calibrations[0].trials[0].engineVersion).toBe("rounds-v1");
  expect(store.calibrations[0].method.exposureStep).toBe(0.2);
  await page.getByRole("button", { name: "Preparar próximo ensayo" }).click();
  await expect(page.getByLabel("Exposición normal · s")).toHaveValue("2.3");
});

test("el inicio ofrece retomar la calibración pendiente después de recargar", async ({
  page,
}) => {
  await register(page);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Continuar calibración", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continuar calibración", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Una nueva medición" }),
  ).toBeVisible();
  await expect(page.getByLabel("Exposición normal · s")).toHaveValue("");
  const data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("calibration-hub:v1")!),
  );
  expect(data.calibrations).toHaveLength(1);
});
test("señala lo que falta y pone finalizar como acción principal cuando el último ensayo aprueba", async ({
  page,
}) => {
  await register(page);
  await expect(
    page.getByRole("progressbar", {
      name: "Datos básicos del ensayo completados",
    }),
  ).toHaveAttribute("value", "2");
  await trial(page, "12.1", "10", "tight");
  await expect(
    page.getByText(
      "Para finalizar todavía falta: X en tolerancia, encastre correcto.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Preparar próximo ensayo" }),
  ).toHaveClass(/primary/);
  await expect(
    page.getByRole("button", { name: "Finalizar calibración" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Preparar próximo ensayo" }).click();
  await page.getByLabel("Dimensión X medida · mm").fill("12");
  await page.getByLabel("Dimensión Y medida · mm").fill("10");
  await page.getByLabel("Encastre del pin").selectOption("correct");
  await page.getByLabel("Estado de los soportes").selectOption("stable");
  await expect(
    page.getByRole("progressbar", {
      name: "Datos básicos del ensayo completados",
    }),
  ).toHaveAttribute("value", "6");
  await page.getByRole("button", { name: "Guardar y analizar" }).click();
  await expect(
    page.getByRole("button", { name: "Finalizar calibración" }),
  ).toHaveClass(/primary/);
  await expect(
    page.getByRole("heading", { name: "Ensayo #2", exact: false }),
  ).toBeInViewport();
  await page.getByRole("button", { name: "#1", exact: false }).click();
  await expect(
    page.getByText("Estás consultando el ensayo #1", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Finalizar calibración" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Volver al último ensayo" }).click();
  await expect(
    page.getByRole("button", { name: "Finalizar calibración" }),
  ).toBeEnabled();
});
test("el formulario móvil permite medir y analizar con controles legibles y sin desbordar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await register(page);
  await expect(
    page.getByRole("heading", { name: "Datos de impresión" }),
  ).toBeVisible();
  await page.getByLabel("Dimensión X medida · mm").fill("12,030");
  await page.getByLabel("Dimensión Y medida · mm").fill("9,980");
  await page.getByLabel("Encastre del pin").selectOption("correct");
  await page.getByLabel("Estado de los soportes").selectOption("stable");
  await page.screenshot({
    path: "/tmp/calibration-guided-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Guardar y analizar" }).click();
  await expect(
    page.getByRole("button", { name: "Finalizar calibración" }),
  ).toBeEnabled();
  await page.screenshot({
    path: "/tmp/calibration-guided-result-mobile.png",
    fullPage: true,
  });
});

test("repetir un ensayo aprobado propone verificar y no copia resultados anteriores", async ({
  page,
}) => {
  await register(page);
  await trial(page, "12", "10");
  await page
    .getByRole("button", { name: "Repetir para comprobar", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Una nueva medición" }),
  ).toBeInViewport();
  await expect(page.getByLabel("Dimensión X medida · mm")).toHaveValue("");
  await expect(page.getByLabel("Encastre del pin")).toHaveValue("");
  await expect(page.getByLabel("Exposición normal · s")).toHaveValue("2.5");
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("calibration-hub:v1")!),
  );
  expect(s.calibrations[0].trials).toHaveLength(1);
  expect(s.calibrations[0].completedAt).toBeNull();
});
