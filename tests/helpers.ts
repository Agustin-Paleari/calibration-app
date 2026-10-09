import { expect, type Page } from "@playwright/test";
export async function startCalibration(
  page: Page,
  name = "Precisión del taller",
) {
  await page
    .getByRole("button", { name: "Nueva calibración", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Marca de impresora").selectOption("Phrozen");
  await dialog
    .getByLabel("Modelo", { exact: true })
    .selectOption({ label: "Sonic Mini 8K S" });
  await dialog
    .getByText("Nombre personalizado del equipo · opcional", { exact: true })
    .click();
  await dialog.getByLabel("Nombre de tu impresora").fill("Equipo del taller");
  await dialog
    .getByLabel("Fabricante", { exact: true })
    .selectOption("Phrozen");
  await dialog
    .getByLabel("Resina", { exact: true })
    .selectOption("Aqua Gray 8K");
  await dialog
    .getByText("Nombre de esta calibración · opcional", { exact: true })
    .click();
  await dialog.getByLabel("Nombre de la calibración").fill(name);
  await dialog
    .getByRole("button", { name: "Comenzar calibración", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Una nueva medición" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByLabel("Exposición normal · s")).toHaveValue("");
  await page.getByLabel("Exposición normal · s").fill("2.5");
}
