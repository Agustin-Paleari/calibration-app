import { test, expect, type Page } from "@playwright/test";
async function register(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Nueva calibración", exact: true })
    .click();
  await page
    .getByLabel("Modelo", { exact: true })
    .selectOption({ label: "Sonic Mini 8K S" });
  await page.getByLabel("Nombre de tu impresora").fill("Equipo del taller");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Registrar impresora", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Nueva calibración", exact: true })
    .click();
  await page.getByLabel("Fabricante").fill("Phrozen");
  await page.getByLabel("Nombre de la resina").fill("Aqua Gray 8K");
  await page
    .getByRole("button", { name: "Registrar resina", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Nueva calibración", exact: true })
    .click();
  await page
    .getByLabel("Nombre de la calibración")
    .fill("Precisión del taller");
  await page
    .getByRole("button", { name: "Comenzar calibración", exact: true })
    .click();
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
  await page.getByLabel("Encastre del pin 7 mm").selectOption(fit);
  await page.getByLabel("Encastre del pin 5 mm").selectOption("correct");
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
  await expect(page.getByLabel("Encastre del pin 7 mm")).toHaveValue("");
  await expect(page.getByLabel("Exposición normal · s")).toHaveValue("2.375");
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
  await page.getByRole("button", { name: "Impresoras", exact: true }).click();
  await page
    .getByRole("button", { name: "Registrar impresora", exact: true })
    .click();
  await page
    .getByLabel("Marca", { exact: true })
    .selectOption("PioCreat / Aidis");
  await page
    .getByRole("button", {
      name: "Mi modelo no está en el catálogo",
      exact: false,
    })
    .click();
  await page.getByLabel("Nuevo modelo").fill("Modelo del laboratorio");
  await page.getByLabel("Nombre de tu impresora").fill("Aidis taller");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Registrar impresora", exact: true })
    .click();
  await expect(
    page.getByText("Modelo pendiente", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Impresoras", exact: true }).click();
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
  await page
    .getByLabel("Importar respaldo JSON")
    .setInputFiles({
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
  await page
    .getByLabel("Importar respaldo JSON")
    .setInputFiles({
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
