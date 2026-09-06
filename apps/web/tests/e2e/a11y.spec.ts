import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Puerta de accesibilidad en integración continua.
 *
 * Una violación de nivel serious o critical rompe el build. Es lo que convierte
 * la accesibilidad en una propiedad del proyecto y no en una revisión que se
 * hace cuando hay tiempo.
 *
 * axe detecta en torno a un tercio de los problemas reales: cubre contraste,
 * nombres accesibles, roles y estructura, pero no dice si el orden de
 * tabulación tiene sentido ni si un texto alternativo es útil. Los recorridos
 * de teclado de más abajo cubren parte de esa diferencia; el resto sigue
 * necesitando revisión manual con lector de pantalla.
 */

const RUTAS = ["/"];

for (const ruta of RUTAS) {
  test(`sin violaciones de axe en ${ruta}`, async ({ page }) => {
    await page.goto(ruta);

    const resultado = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const graves = resultado.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(
      graves,
      graves.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodos)`).join("\n"),
    ).toEqual([]);
  });
}

test("el enlace de salto es el primer elemento enfocable y lleva al contenido", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");

  const enfocado = page.locator(":focus");
  await expect(enfocado).toHaveText(/Saltar al contenido principal/);

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#contenido$/);
});

test("cada ruta tiene exactamente un h1 y un landmark principal", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("main")).toHaveCount(1);
});

test("el formulario se opera con teclado y anuncia el error", async ({ page }) => {
  await page.goto("/");

  // Envío vacío: debe fallar la validación y anunciarlo.
  await page.getByRole("button", { name: "Validar producto" }).click();

  await expect(page.getByTestId("region-assertive")).toContainText(/errores/);

  // El foco debe estar en el primer campo con error, no perdido en el body.
  await expect(page.getByRole("textbox", { name: /Título del producto/ })).toBeFocused();
});

test("el anillo de foco es visible en los controles", async ({ page }) => {
  await page.goto("/");
  const boton = page.getByRole("button", { name: "Validar producto" });
  await boton.focus();

  const contorno = await boton.evaluate((el) => {
    const estilo = getComputedStyle(el);
    return { ancho: estilo.outlineWidth, estilo: estilo.outlineStyle };
  });

  expect(contorno.estilo).not.toBe("none");
  expect(parseFloat(contorno.ancho)).toBeGreaterThanOrEqual(2);
});
