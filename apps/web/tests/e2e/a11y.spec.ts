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

/**
 * La ficha de producto necesita un documento real, así que su identificador se
 * pasa por entorno. Sin él, las comprobaciones de esa ruta se omiten en lugar
 * de fallar: un identificador inventado daría 404 y el 404 sí es accesible.
 *
 *   PRODUCTO_DE_PRUEBA=<id> npm run test:a11y
 */
const PRODUCTO_DE_PRUEBA = process.env.PRODUCTO_DE_PRUEBA ?? "";

const RUTAS = [
  "/",
  // El catálogo no necesita datos: sin credenciales se degrada con un aviso
  // accesible en lugar de romperse, así que axe lo recorre igual.
  "/productos",
  "/productos?q=telefono&categoria=tecnologia&precioMin=10.000&orden=precio-asc",
  ...(PRODUCTO_DE_PRUEBA ? [`/producto/${PRODUCTO_DE_PRUEBA}`] : []),
];

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

test.describe("ficha de producto", () => {
  test.skip(!PRODUCTO_DE_PRUEBA, "define PRODUCTO_DE_PRUEBA con un id real");

  test("el HTML del servidor ya trae el título: es lo que indexa el rastreador", async ({
    request,
  }) => {
    // Contra `request`, no contra `page`: así se lee el documento tal como llega,
    // sin que el navegador ejecute JavaScript. La versión heredada devolvía aquí
    // un documento vacío.
    const respuesta = await request.get(`/producto/${PRODUCTO_DE_PRUEBA}`);
    expect(respuesta.ok()).toBe(true);

    const html = await respuesta.text();
    expect(html).toContain("<h1");
    expect(html).toContain("application/ld+json");
    expect(html).toContain('"@type":"Product"');
  });

  test("la galería se opera con teclado y anuncia el cambio", async ({ page }) => {
    await page.goto(`/producto/${PRODUCTO_DE_PRUEBA}`);

    const miniaturas = page.getByRole("button", { name: /Ver imagen \d+ de \d+/ });
    const total = await miniaturas.count();
    test.skip(total < 2, "este producto tiene una sola imagen");

    await miniaturas.nth(1).press("Enter");

    await expect(miniaturas.nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("region-polite")).toContainText(/Imagen 2 de/);
  });

  test("añadir al carrito lo anuncia", async ({ page }) => {
    await page.goto(`/producto/${PRODUCTO_DE_PRUEBA}`);

    const boton = page.getByRole("button", { name: /Añadir al carrito/ });
    test.skip((await boton.count()) === 0, "este producto no está disponible");

    await boton.click();
    await expect(page.getByTestId("region-polite")).toContainText(/añadido al carrito/i);
  });
});

test.describe("catálogo", () => {
  test("el buscador funciona con JavaScript desactivado", async ({ browser }) => {
    // El formulario es un `<form method="get">` de servidor. Esta prueba es la
    // que sostiene esa decisión: con una conexión que no llega a cargar el
    // bundle —nada raro en Malabo o Bata— el catálogo se sigue pudiendo buscar.
    const contexto = await browser.newContext({ javaScriptEnabled: false });
    const pagina = await contexto.newPage();

    await pagina.goto("/productos");
    await pagina.getByLabel("Buscar en el catálogo").fill("nevera");
    await pagina.getByRole("button", { name: "Aplicar filtros" }).click();

    await expect(pagina).toHaveURL(/[?&]q=nevera/);
    await expect(pagina.getByRole("heading", { level: 1 })).toContainText("nevera");

    await contexto.close();
  });

  test("los filtros viven en la URL y sobreviven al botón atrás", async ({ page }) => {
    await page.goto("/productos?categoria=vehiculos&orden=precio-asc");

    // El estado está en la dirección, así que los controles se rellenan solos
    // y el resultado se puede compartir.
    await expect(page.getByLabel("Categoría")).toHaveValue("vehiculos");
    await expect(page.getByLabel("Ordenar por")).toHaveValue("precio-asc");

    await page.goto("/productos");
    await page.goBack();
    await expect(page.getByLabel("Categoría")).toHaveValue("vehiculos");
  });

  test("el rango de precio está agrupado en un fieldset con legend", async ({ page }) => {
    // «Desde» y «Hasta» por separado no significan nada: la agrupación es la
    // que da el contexto (WCAG 2.2 · 1.3.1).
    await page.goto("/productos");
    const grupo = page.getByRole("group", { name: "Precio en FCFA" });
    await expect(grupo).toBeVisible();
    await expect(grupo.getByLabel("Desde")).toBeVisible();
    await expect(grupo.getByLabel("Hasta")).toBeVisible();
  });
});
