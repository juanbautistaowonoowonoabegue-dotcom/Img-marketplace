# Fase 3 — Primera ruta migrada: ficha de producto

`/producto/[id]` en `apps/web`, sustituto de `public/detalledelproducto.html?id=…`.

Es la primera ruta por una razón concreta: es donde entra el tráfico orgánico de un marketplace. La versión heredada monta la página entera en el navegador, así que el rastreador recibe un documento vacío. La nueva devuelve HTML del servidor con metadatos y datos estructurados.

---

## Qué se ha construido

| Pieza | Fichero |
|---|---|
| Capa anticorrupción sobre los datos heredados | `src/lib/productos/normalizar.ts` |
| Acceso de servidor a las dos colecciones | `src/lib/productos/repositorio.ts` |
| Ruta con metadatos y JSON-LD | `src/app/producto/[id]/page.tsx` |
| Galería accesible | `src/components/producto/galeria.tsx` |
| Añadir al carrito, interoperando con el carrito heredado | `src/components/producto/boton-carrito.tsx` |
| 21 pruebas de la normalización | `tests/unit/normalizar.test.ts` |

## La capa anticorrupción

El mismo producto puede vivir en `productos` o en `Producto`, con nombres de campo distintos según quién lo escribiera. `detalledelproducto.html` ya hacía esta conversión, pero repartida en veinte expresiones `a || b || c` dentro de la función de render: imposible de probar y copiada a mano en cada página que muestra un producto.

Ahora está en una función pura, en un sitio, con pruebas. Cuando los datos se unifiquen, el fichero se borra y nada más cambia.

Dos hallazgos que salieron al escribirla, y que son bugs reales del sistema actual:

**`estado` significa cosas distintas en cada colección.** En `productos` es la condición del artículo (nuevo, usado) y el estado del anuncio va en `status`. En `Producto` es el estado de moderación (`'aceptado'`), que es lo que consultan los listados heredados. Leerlo sin distinguir la colección produce fichas que anuncian «Estado: aceptado» como si fuera la condición del artículo.

**El contador de visitas está partido en dos campos.** `index-vendedor.html` crea el producto con `vistas: 0`, pero `detalledelproducto.html` lee e incrementa `visitas`. Ninguno de los dos tiene el total. La normalización los suma, que es lo mejor que se puede hacer sin migrar los datos. El arreglo de fondo es elegir un campo y hacer un backfill.

## Accesibilidad de la ruta

- Un `<h1>` con el título, migas de pan en `<nav aria-label>` con `aria-current="page"`.
- Las miniaturas de la galería son botones con `aria-pressed` y `aria-controls`, no divisiones con `onclick`. El cambio de imagen se publica en la región en vivo: si no, para quien no ve la pantalla el botón no hace nada.
- El `alt` de la imagen grande dice qué se está viendo dentro del conjunto («Imagen 2 de 5»). Repetir el título del producto cinco veces no aporta nada.
- La disponibilidad se comunica con texto además de con color (1.4.1).
- Los detalles van en `<dl>`, que asocia cada dato con su etiqueta en el árbol de accesibilidad. Una rejilla de divisiones no lo hace.
- El precio anterior lleva `<s>` con un `sr-only` que lo nombra: tachado a secas no se anuncia.

## SEO

- `generateMetadata` con título, descripción, canónica y Open Graph por producto.
- JSON-LD `Product` con precio, moneda `XAF` y disponibilidad. Es lo que permite resultados enriquecidos, y no existía.
- Un producto vendido o retirado se marca `noindex, follow`: deja de competir en resultados sin perder el enlace.
- `revalidate = 300`.

## Estado de verificación

Ejecutado en local sobre un árbol limpio instalado con `npm ci`:

| Comprobación | Resultado |
|---|---|
| `npm run typecheck` | limpio, modo estricto, todo el proyecto |
| `npm run lint` | limpio |
| `npm test` | 36 de 36 |
| `npm run build` | correcto — `/producto/[id]` sale como ruta dinámica con render en servidor |
| `npm run test:a11y` | **no ejecutado** — la descarga de navegadores de Playwright no llegó a completarse en esta máquina |

La única puerta que falta es axe. Se ejecuta con:

```bash
npx playwright install --with-deps chromium
PRODUCTO_DE_PRUEBA=<id-real> npm run test:a11y
```

Sin `PRODUCTO_DE_PRUEBA` las comprobaciones de la ficha se omiten en lugar de fallar: un identificador inventado daría 404, y el 404 sí es accesible.

### Correcciones que salieron de ejecutar la suite por primera vez

Todas aplicadas. Van aquí porque son las que se encuentra cualquiera que arranque este proyecto:

- Next 16 retiró la clave `eslint` de `NextConfig`; el linter va como paso propio.
- `eslint-config-next` 16 exporta configuración plana nativa. El puente `FlatCompat` fallaba con un error de estructura circular; al quitarlo hubo que tomar de `jsx-a11y` solo las reglas —Next ya registra el plugin— y limitar las de `@typescript-eslint` a ficheros TypeScript, que es donde Next lo registra.
- `turbopack.root` fijado: el `package-lock.json` de la raíz, el de Capacitor, hacía que Next infiriera mal el workspace.
- `next/image` acepta `raw.githubusercontent.com` bajo el usuario del repositorio: es donde están las fotos de los productos publicados antes de la migración. Sin esa entrada esos productos se verían sin imagen.
- El linter del compilador de React rechazó el `useEffect` + `setState` con que se leía el carrito. Ahora se lee con `useSyncExternalStore`, que es la vía prevista para un almacén externo al árbol y resuelve además la hidratación sin bandera auxiliar.

Nota sobre el entorno: la primera instalación dejó paquetes a medio extraer —el binario de SWC pesaba 1,1 MB en vez de 106 MB, y a `react-stately` le faltaban los `.mjs` con sus `.map` presentes—. Si el build falla con «module not found» en subrutas de un paquete, es eso: `rm -rf node_modules && npm ci`.

---

## Activación: lo que falta para que la ruta sea visible

**Esta ruta todavía no sirve tráfico.** No he tocado `firebase.json` a propósito: el destino del rewrite es el backend de App Hosting, que aún no existe, y poner un identificador inventado rompería `firebase deploy`.

### 1. Crear el backend de App Hosting

```bash
firebase apphosting:backends:create --project compraya-d0760
```

Apuntarlo a `apps/web` como raíz. Configurar ahí las variables `NEXT_PUBLIC_FIREBASE_*` de `.env.example`.

### 2. Enrutar la ruta desde Hosting

Con el `serviceId` que devuelva el paso anterior, añadir en `firebase.json`, **antes** del resto de rewrites:

```json
{
  "source": "/producto/**",
  "run": { "serviceId": "<id-del-backend>", "region": "europe-west1" }
}
```

El orden importa: Hosting evalúa los rewrites de arriba abajo.

### 3. Comprobar antes de redirigir a nadie

En un canal de vista previa (`firebase hosting:channel:deploy fase-3`), con un identificador de producto real de cada colección:

- `/producto/<id-de-productos>` y `/producto/<id-de-Producto>` renderizan.
- El HTML de origen contiene el título y el precio, no un documento vacío.
- El JSON-LD valida en la prueba de resultados enriquecidos de Google.
- Un producto inexistente da 404 con la página propia.
- Un producto sin fotos, sin descripción o con precio en cadena no rompe la página.

### 4. Redirigir los enlaces internos

Seis ficheros enlazan a la ficha heredada: `public/js/api.js`, `public/js/api.min.js`, `public/js/notifications.js`, `public/sistemap.xml`, `public/sobrenosotros.html` y `public/telefonosyordenadores.html`. Cambiar `detalledelproducto.html?id=X` por `/producto/X`.

No lo he hecho ya porque hasta el paso 2 esos enlaces darían 404.

### 5. Retirar la página heredada

Con los enlaces migrados y la ruta estable, borrar `public/detalledelproducto.html` y dejar una redirección permanente en `firebase.json` para los enlaces que circulen por ahí fuera:

```json
{ "source": "/detalledelproducto.html", "destination": "/producto/:id", "type": 301 }
```

Hosting no traslada la cadena de consulta a un segmento de ruta, así que esta redirección necesita comprobarse: si no funciona, la alternativa es dejar la página heredada como una página mínima que lea el parámetro y redirija en cliente.

---

## Siguiente ruta

Listado y buscador. La ficha ya deja hecha la parte difícil —la normalización de los datos heredados—, así que el listado la reutiliza tal cual.
