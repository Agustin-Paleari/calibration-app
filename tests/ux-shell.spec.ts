import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { sampleStore, sampleTrial } from "./data/fixtures";
import { startCalibration } from "./helpers";

async function twoIndependentRecipes(page: Page) {
  const store = sampleStore("ux-test-source");
  store.printers.push({
    ...store.printers[0],
    id: "printer-b",
    name: "Otro equipo del mismo modelo",
  });
  store.calibrations.push({
    ...store.calibrations[0],
    id: "calibration-b",
    printerId: "printer-b",
    name: "Segundo resultado",
    trials: [sampleTrial({ id: "trial-b", exposure: 2.8 })],
  });
  await page.goto("/");
  await page.evaluate(
    (data) => localStorage.setItem("calibration-hub:v1", JSON.stringify(data)),
    store,
  );
  await page.reload();
  return store;
}

test("buscar por producto conserva todas las recetas de equipos distintos y no escribe datos", async ({
  page,
}) => {
  const store = await twoIndependentRecipes(page);
  const original = await page.evaluate(() =>
    localStorage.getItem("calibration-hub:v1"),
  );
  const search = page.getByRole("region", { name: "Buscar parámetros" });
  await expect(
    search.getByLabel("Modelo impresora", { exact: true }),
  ).toBeDisabled();
  await expect(
    search.getByLabel("Tipo de resina", { exact: true }),
  ).toBeDisabled();
  await search
    .getByLabel("Marca impresora", { exact: true })
    .selectOption(store.models[0].brand);
  await search
    .getByLabel("Modelo impresora", { exact: true })
    .selectOption(store.models[0].id);
  await search
    .getByLabel("Marca resina", { exact: true })
    .selectOption(store.resins[0].manufacturer);
  await search
    .getByLabel("Tipo de resina", { exact: true })
    .selectOption(store.resins[0].name);
  await search.getByRole("button", { name: "Ver resultados" }).click();
  await expect(
    page.getByRole("heading", { name: "Parámetros guardados" }),
  ).toBeVisible();
  await expect(page.locator(".recipe-card")).toHaveCount(2);
  await expect(page.locator(".recipe-numbers")).toContainText([
    "2,500 s",
    "2,800 s",
  ]);
  await expect(
    page.getByRole("region", { name: "Búsqueda aplicada" }),
  ).toContainText(store.resins[0].name);
  expect(
    await page.evaluate(() => localStorage.getItem("calibration-hub:v1")),
  ).toBe(original);

  await page.getByRole("button", { name: "Calibrar", exact: true }).click();
  await search
    .getByLabel("Marca impresora", { exact: true })
    .selectOption("Elegoo");
  await search.getByRole("button", { name: "Ver resultados" }).click();
  await expect(
    page.getByRole("heading", { name: "Sin recetas para estos filtros" }),
  ).toBeVisible();
  await expect(page.locator(".recipe-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Limpiar filtros" }).click();
  await expect(page.locator(".recipe-card")).toHaveCount(2);
  expect(
    await page.evaluate(() => localStorage.getItem("calibration-hub:v1")),
  ).toBe(original);
});

test("cambiar una marca limpia el selector dependiente y la búsqueda vacía ofrece comenzar", async ({
  page,
}) => {
  await page.goto("/");
  const search = page.getByRole("region", { name: "Buscar parámetros" });
  await search
    .getByLabel("Marca impresora", { exact: true })
    .selectOption("Phrozen");
  await search
    .getByLabel("Modelo impresora", { exact: true })
    .selectOption({ label: "Sonic Mini 8K S" });
  await search
    .getByLabel("Marca impresora", { exact: true })
    .selectOption("Elegoo");
  await expect(
    search.getByLabel("Modelo impresora", { exact: true }),
  ).toHaveValue("");
  await search
    .getByLabel("Marca resina", { exact: true })
    .selectOption("Phrozen");
  await search
    .getByLabel("Tipo de resina", { exact: true })
    .selectOption("Aqua Gray 8K");
  await search
    .getByLabel("Marca resina", { exact: true })
    .selectOption("Elegoo");
  await expect(
    search.getByLabel("Tipo de resina", { exact: true }),
  ).toHaveValue("");
  await search.getByRole("button", { name: "Ver resultados" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Tu primera receta sale de una calibración",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Nueva calibración", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Nueva calibración" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  expect(
    await page.evaluate(() => localStorage.getItem("calibration-hub:v1")),
  ).toBeNull();
});

test("el progreso distingue preparar, medir y resultado, también tras un nuevo ensayo", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Nueva calibración", exact: true })
    .click();
  const preparing = page
    .getByRole("dialog")
    .getByRole("list", { name: "Recorrido de calibración" });
  await expect(preparing.getByRole("listitem")).toHaveCount(4);
  await expect(preparing.locator('[aria-current="step"]')).toHaveText(
    /Preparar/,
  );
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await startCalibration(page);
  const steps = page.getByRole("list", { name: "Recorrido de calibración" });
  await expect(steps.locator('[aria-current="step"]')).toHaveText(/Medir/);
  await page.getByLabel("Dimensión X medida · mm").fill("12.1");
  await page.getByLabel("Dimensión Y medida · mm").fill("10");
  await page.getByLabel("Encastre del pin").selectOption("tight");
  await page.getByLabel("Estado de los soportes").selectOption("stable");
  await page.getByRole("button", { name: "Guardar y analizar" }).click();
  await expect(steps.locator('[aria-current="step"]')).toHaveText(/Resultado/);
  await page.getByRole("button", { name: "Preparar próximo ensayo" }).click();
  await expect(steps.locator('[aria-current="step"]')).toHaveText(/Medir/);
  await expect(page.getByLabel("Dimensión X medida · mm")).toHaveValue("");
});

test("guía móvil ofrece siete pasos, referencia vigente y acceso al formulario", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Guía", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Guía", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page
      .getByRole("list", { name: "Siete pasos de calibración" })
      .getByRole("listitem"),
  ).toHaveCount(7);
  await expect(
    page.getByRole("complementary", { name: "Referencia para medir" }),
  ).toContainText("±0,050 mm");
  await page.getByText("¿Cuándo puedo finalizar?", { exact: true }).click();
  await expect(page.locator(".guide-faq details[open]")).toContainText(
    "±0,050 mm",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Nueva calibración", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    path: "/tmp/calibration-handoff-modal-viewport.png",
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Nueva calibración", exact: true }),
  ).toBeFocused();
});

test("herramientas de taller preservan catálogo y respaldo en móvil y se cierran con Escape", async ({
  page,
}) => {
  await twoIndependentRecipes(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.locator(".workshop-menu");
  await menu.locator("summary").click();
  await expect(page.getByLabel("Catálogo", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("open");
  await expect(menu.locator("summary")).toBeFocused();
  await menu.locator("summary").click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar respaldo" }).click();
  const download = await downloadPromise;
  const backup = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(backup.calibrations).toHaveLength(2);
  expect(
    backup.calibrations.map(
      (c: { trials: { exposure: number }[] }) => c.trials[0].exposure,
    ),
  ).toEqual([2.5, 2.8]);
  await menu.locator("summary").click();
  await page.getByLabel("Catálogo", { exact: true }).selectOption("printers");
  await expect(menu).not.toHaveAttribute("open");
  await expect(
    page.getByRole("heading", { name: "Impresoras", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
