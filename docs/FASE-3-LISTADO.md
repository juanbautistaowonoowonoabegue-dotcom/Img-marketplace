# Fase 3 — Segunda ruta: listado y buscador

`/productos` en `apps/web`. Reutiliza tal cual la normalización escrita para la ficha: el listado tiene el mismo problema de datos —dos colecciones, campos con nombres distintos— y ya estaba resuelto en un sitio.

---

## Qué se ha construido

| Pieza | Fichero |
|---|---|
| Criterios, búsqueda, orden y paginación (funciones puras) | `src/lib/productos/consulta.ts` |
| Las 28 categorías reales | `src/lib/productos/categorias.ts` |
| Consulta del catálogo a las dos colecciones | `listarProductos` en `src/lib/productos/repositorio.ts` |
| Ruta | `src/app/productos/page.tsx` |
| Buscador y filtros | `src/components/producto/filtros.tsx` |
| Tarjeta de resultado | `src/components/producto/tarjeta.tsx` |
| Paginación | `src/components/ui/paginacion.tsx` |
| 32 pruebas de la lógica de consulta | `tests/unit/consulta.test.ts` |

## El buscador funciona sin JavaScript

Es un `<form method="get">` de servidor. No es nostalgia: el estado vive en la URL, así que los resultados se comparten, el botón «atrás» funciona, las páginas de categoría se indexan, y el catálogo se puede buscar con una conexión que no llega a cargar el bundle — que en Malabo o Bata no es un caso raro.

Hay una prueba end-to-end que lo verifica con `javaScriptEnabled: false`. Es la que sostiene la decisión: sin ella, la afirmación es una intención.

## Búsqueda: qué hace y dónde está el techo

Firestore no tiene búsqueda de texto. El sitio heredado tampoco la tiene para productos —`nombreBusca` solo existe en usuarios y comunidades—, así que no se pierde nada respecto de hoy.

Lo que se hace: traer una ventana reciente de cada colección y filtrar en memoria. Lo que se gana sobre un prefijo de Firestore es coincidencia por varios términos y sin acentos. «telefono samsung» encuentra «Teléfono Samsung A15», y «samsung malabo» **no** trae los Samsung de Bata.

Lo que cuesta, dicho sin adornos:

**La ventana es de 500 documentos por colección.** El catálogo se filtra sobre esos 1000 como máximo. Con `revalidate = 300`, son dos lecturas cada cinco minutos y no por visita, así que el coste en Firestore es despreciable. Pero **si el catálogo supera los 500 productos por colección, los más antiguos dejan de aparecer en el listado**. Siguen siendo accesibles por su ficha y por enlace directo.

El disparador para cambiar de enfoque es ese número. Cuando se acerque, las opciones por orden de esfuerzo son: subir el tope (funciona hasta unos pocos miles), mover el filtro de categoría a la consulta de Firestore con su índice compuesto, o meter un servicio de búsqueda —Typesense o Algolia— alimentado desde una función. Lo tercero solo cuando lo primero deje de bastar.

**Un producto sin fecha de publicación no aparece en el listado.** `orderBy` en Firestore excluye los documentos que no tienen el campo, y `productos` ordena por `createdAt` mientras `Producto` ordena por `fechaPublicacion`. Son exactamente las consultas que hace el sitio actual, así que el comportamiento es el mismo que hoy — pero conviene saberlo.

## Si Firestore no responde

`listarProductos` usa `Promise.allSettled` y devuelve lo que haya con `degradado: true`. La página muestra un aviso con `role="alert"` en lugar de un 500: una ruta indexada que devuelve error de servidor pierde posiciones, y media página de catálogo es más útil que ninguna.

Efecto secundario aprovechado: la ruta se puede ejecutar en integración continua sin credenciales del proyecto, así que axe la recorre en cada push. Por eso `firestoreAdmin()` se llama dentro de cada consulta y no fuera — sin credenciales, `applicationDefault()` lanza de forma síncrona, y ahí dentro esa excepción se convierte en una promesa rechazada que `allSettled` recoge.

## Accesibilidad

- Cada control tiene su `<label>`. El rango de precio va en `<fieldset>` con `<legend>`, porque «Desde» y «Hasta» por separado no significan nada (1.3.1). La auditoría contó **cero** `fieldset` en las 33 páginas heredadas.
- El formulario va dentro de `<search>`, el landmark propio de la búsqueda.
- **El recuento de resultados no está en una región `aria-live`, a propósito.** El formulario navega de verdad, así que el lector de pantalla anuncia la página nueva por su título, que ya lleva el término buscado. Una región en vivo presente desde la carga no se anuncia: sería peso muerto que da falsa sensación de estar cubierto.
- Una tarjeta, un enlace, cuyo nombre accesible es solo el título. La superficie completa se hace pulsable con una capa `::after`, no envolviendo la tarjeta en un `<a>`: eso daría un nombre accesible de tres líneas que se lee entero en cada resultado.
- La imagen de la tarjeta lleva `alt=""`. El título va justo debajo y ya es el enlace; repetirlo obliga a oír dos veces lo mismo.
- La paginación son enlaces, no botones: cada página es una dirección propia. La actual lleva `aria-current="page"` y no es enlace. La ventana es de cinco números, porque con cien páginas listarlas todas convierte el recorrido por teclado en cien tabulaciones.
- Los campos de precio usan `inputMode="numeric"` y no `type="number"`: el numérico nativo cambia de valor con la rueda del ratón y se lee mal en varios lectores.
- Un parámetro inválido en la URL cae al valor por defecto en vez de romper la página. Estas direcciones se comparten y se editan a mano.

## SEO

Las páginas de categoría se indexan; las búsquedas y los rangos de precio llevan `noindex, follow`. Una faceta abierta genera infinitas URL sin valor propio en el índice, y el enlace se sigue conservando.

## Verificación

| Comprobación | Resultado |
|---|---|
| `npm run typecheck` | limpio |
| `npm run lint` | limpio |
| `npm test` | 66 de 66 |
| `npm run build` | correcto — `/productos` sale como ruta dinámica con render en servidor |
| `npm run test:a11y` | 20 pasadas, 6 omitidas (las de la ficha, que necesitan un id real) |

axe recorre `/productos` sin filtros y con filtros aplicados, en escritorio y en móvil, sin violaciones de nivel *serious* ni *critical*.

Un fallo real que encontró una prueba mientras se escribía: al limpiar los separadores de miles se quitaba también el signo menos, así que `?pagina=-3` daba la página 3 y `?precioMin=-5000` un filtro de 5000. Ahora un valor negativo invalida el parámetro.

## Corrección arrastrada de la fase 2

La lista de categorías de `src/lib/schemas/producto.ts` estaba inventada —`telefonos`, `ordenadores`, `servicios`— y no correspondía con ningún dato de la base. Las reales son 28 y salen del selector de publicación de `public/index-vendedor.html`. El esquema ahora las toma de `categorias.ts`, que es la única definición.

## Activación

La misma que la ficha, y con la misma dependencia: hace falta el backend de App Hosting. En `firebase.json`, junto al rewrite de `/producto/**`:

```json
{ "source": "/productos", "run": { "serviceId": "<id-del-backend>", "region": "europe-west1" } }
```

Ojo al orden: `/productos` debe ir **antes** que `/producto/**` si alguna vez se usa un comodín que solape.

Una vez viva, tiene sentido enlazarla desde la portada heredada y desde el menú, y valorar si sustituye a `index-comprador.html` como catálogo principal.

## Siguiente

Carrito y pago. Es la ruta con más lógica y la única del embudo que mueve dinero, así que conviene abordarla con las reglas de Firestore ya desplegadas —punto 3 de `docs/DESPLIEGUE-FASE-1.md`— y no antes.
