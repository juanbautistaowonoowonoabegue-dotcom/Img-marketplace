# Arquitectura objetivo

Propuesta de stack para llevar Compra Ya de 33 páginas HTML estáticas a una plataforma escalable, con la accesibilidad y la seguridad garantizadas por construcción y no por revisión manual.

---

## 1. Recomendación

**Next.js 15 (App Router) + TypeScript, desplegado en Firebase App Hosting, manteniendo Firebase Auth / Firestore / Storage como backend.**

| Capa | Elección | Motivo |
|---|---|---|
| Framework | Next.js 15, App Router, React Server Components | SEO real en fichas de producto y servicio — indispensable en un marketplace. Los componentes de servidor mantienen el bundle de cliente pequeño, que es lo que importa en móvil y con ancho de banda limitado |
| Lenguaje | TypeScript en modo `strict` | Los desajustes `usuarios`/`users` y `Producto`/`productos` del código actual son exactamente lo que el compilador detiene |
| UI | React Aria Components + Tailwind CSS v4 | Foco, roles, `aria-*` y teclado ya resueltos y probados con lectores de pantalla. Es lo que evita repetir los ~300 `<div onclick>` |
| Datos servidor | Firebase Admin SDK en Route Handlers y Server Actions | Las claves y las operaciones privilegiadas nunca llegan al navegador |
| Datos cliente | TanStack Query sobre el SDK web de Firebase | Solo donde hace falta tiempo real: chat, notificaciones, presencia |
| Validación | Zod, esquema compartido cliente/servidor | Una sola definición de "producto válido" para el formulario, la Server Action y la Cloud Function |
| Autorización | Custom claims de Firebase Auth | El rol deja de ser un campo que el propio usuario puede editar (ver P0-3 de la auditoría) |
| Tests | Vitest (unidad) + Playwright + `@axe-core/playwright` (E2E y accesibilidad) | La accesibilidad pasa a ser una prueba que falla en CI, no una revisión de buena voluntad |
| Calidad | ESLint + `eslint-plugin-jsx-a11y`, Prettier, `tsc --noEmit` en CI | Bloquea la regresión antes del merge |
| Móvil | Capacitor, sobre el mismo despliegue | Se conserva la vía actual del APK |

**Por qué App Hosting y no Vercel:** el proyecto ya vive en Firebase (Auth, Firestore, Storage, Functions, Hosting). App Hosting ejecuta Next.js con SSR de forma nativa, comparte proyecto e IAM, e integra Cloud Secret Manager. Añadir un segundo proveedor añadiría latencia entre capas y una frontera de permisos más que auditar.

**Alternativa considerada y descartada: Vite + React SPA.** Es una migración más corta desde el sitio estático actual y encaja mejor con Capacitor. Se descarta porque un marketplace vive del tráfico orgánico hacia sus fichas, y una SPA pura entrega HTML vacío al rastreador. Si la prioridad se invirtiera hacia la app nativa, esta sería la elección correcta.

---

## 2. Accesibilidad por construcción

El objetivo es que los fallos de la §2 de la auditoría no puedan volver a aparecer:

- **Componentes con la semántica ya resuelta.** `Button`, `Dialog`, `ComboBox`, `Menu` y `Tabs` de React Aria gestionan foco, trampas de foco, `aria-expanded`, orden de tabulación y Escape. Un botón deja de poder escribirse como `<div onclick>`.
- **Foco visible como token del sistema.** Un único anillo `:focus-visible` en la capa base de Tailwind, sin `outline:none` en ninguna parte. Regla de ESLint que rechaza la propiedad.
- **Un `<Announcer>` global** con `aria-live="polite"` y `role="alert"`, montado en el layout raíz. Carrito, chat y toasts publican ahí; se anuncian una vez, en el orden correcto.
- **Layout con landmarks obligatorios**: `skip link`, `<header>`, `<nav>`, `<main id="contenido">`, `<footer>` en `app/layout.tsx`. Un `<h1>` por ruta, verificado en test.
- **Formularios tipados** con React Hook Form + Zod: la etiqueta, el `aria-describedby` del error y el `aria-invalid` se generan juntos; no hay forma de enviar un campo sin `<label>`.
- **Puerta en CI**: Playwright recorre las rutas críticas (alta, ficha, carrito, pago, chat) y ejecuta axe. Cualquier violación de nivel *serious* o *critical* rompe el build.
- **`next/image`** exige `alt`, y el linter lo bloquea si falta.

Meta declarada: **WCAG 2.2 nivel AA** en las rutas del embudo de compra.

---

## 3. Migración incremental (patrón *strangler*)

No hay reescritura de golpe. Firebase Hosting enruta por prefijo, así que el sitio actual y el nuevo conviven en el mismo dominio y se traslada una ruta cada vez.

**Fase 0 — Contención (esta rama, sin cambios funcionales)**
Retirar la clave de servicio, eliminar trazas de herramientas de IA, endurecer `.gitignore`, documentar. Ya aplicado.

**Fase 1 — Cerrar los P0 sobre el código actual**
Reglas de Firestore reescritas sin comodín cubriendo las 18 colecciones reales, `role` en custom claims, `1234.html` fuera de `public/`, `geminiGenerate` autenticado y con cuota, CSP. Sin migrar nada todavía: el sitio actual queda defendible.

**Fase 2 — Base del proyecto nuevo**
Next.js + TypeScript + Tailwind + React Aria en `apps/web`, con el layout accesible, el sistema de diseño extraído del CSS actual (los tokens ya existen, hoy duplicados 33 veces) y la CI de calidad y accesibilidad en verde desde el primer commit.

**Fase 3 — Rutas por valor de negocio**
En orden: ficha de producto y de servicio (SEO), listado y buscador, carrito y pago, perfiles, chat. Cada ruta migrada se activa con un rewrite en `firebase.json` y se retira su HTML antiguo en el mismo PR.

**Fase 4 — Panel de administración**
Aplicación separada bajo autorización de servidor, nunca un fichero estático. Reemplaza `1234.html`.

**Fase 5 — Cierre**
Eliminar `public/` heredado, el backend Java muerto, el script de ofuscación y los `.min.js`. Mover las imágenes de la raíz a Storage y cortar la dependencia de `raw.githubusercontent.com`. Purga del histórico de Git.

---

## 4. Decisiones que requieren tu confirmación

1. **App Hosting frente a Vercel** — la recomendación es App Hosting por continuidad con Firebase.
2. **React Aria frente a Radix Primitives** — ambos son sólidos; React Aria tiene mejor cobertura de lectores de pantalla y gestión de foco, Radix es más ligero y de API más simple.
3. **Destino del backend Java** — la propuesta es eliminarlo. Si hay intención de retomarlo, debe salir a su propio repositorio con su build.
4. **Estrategia de imágenes** — Storage + `next/image` frente a un CDN externo tipo Cloudinary. Storage basta para el volumen actual.
