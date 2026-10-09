import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { startCalibration } from "./helpers";
test("paquete autónomo funciona sin descargar recursos externos", async ({
  page,
}) => {
  const external: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => {
    if (/^https?:/.test(request.url()) && request.resourceType() !== "document")
      external.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://**", (route) => route.abort());
  await page.route("**/standalone.html", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: readFileSync("docs/Calibration-Hub.html", "utf8"),
    }),
  );
  await page.goto("/standalone.html");
  await startCalibration(page, "Ensayo sin servidor");
  await page.getByLabel("Dimensión X medida · mm").fill("12");
  await page.getByLabel("Dimensión Y medida · mm").fill("10");
  await page.getByLabel("Encastre del pin").selectOption("correct");
  await page.getByLabel("Estado de los soportes").selectOption("stable");
  await page.getByRole("button", { name: "Guardar y analizar" }).click();
  await page.getByRole("button", { name: "Finalizar calibración" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Ensayo sin servidor", exact: false })
    .first()
    .click();
  await expect(
    page.getByText("Calibración finalizada con el último ensayo aprobado."),
  ).toBeVisible();
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
