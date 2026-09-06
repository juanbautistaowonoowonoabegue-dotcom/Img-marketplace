# apps/web — Base del proyecto nuevo

Fase 2 de `docs/ARQUITECTURA.md`. Next.js 16 (App Router) + TypeScript + Tailwind v4 + React Aria Components, con la accesibilidad garantizada por el compilador, el linter y la integración continua en lugar de por revisión manual.

Convive con el sitio actual: `public/` sigue sirviéndose tal cual hasta que cada ruta se migre. Este paquete tiene su propio `package.json` y su propio `node_modules`; no toca la instalación de la raíz.

## Estado: sin verificar

**Esta base no se ha llegado a instalar ni ejecutar.** El entorno donde se escribió no alcanzaba el registro de npm para instalar, así que no hay `package-lock.json` y no se han pasado `typecheck`, `lint`, las pruebas unitarias ni el build.

Las versiones del `package.json` son rangos, no anclajes verificados. El primer paso al retomar esto es generar el lockfile y pasar la suite:

```bash
cd apps/web
cp .env.example .env.local   # rellenar con los valores del proyecto Firebase
npm install
npm run verify               # tipos + linter + pruebas
npm run build
```

Es previsible que haya que ajustar alguna versión en ese primer paso. El `package-lock.json` que salga de ahí debe commitearse: la CI usa `npm ci` y sin él falla.

## Puesta en marcha

```bash
npm run dev
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run verify` | Tipos, linter y pruebas unitarias. Lo que corre en cada push |
| `npm run typecheck` | `tsc --noEmit` en modo estricto |
| `npm run lint` | ESLint con `jsx-a11y` en modo estricto |
| `npm test` | Vitest sobre esquemas y componentes |
| `npm run test:a11y` | Playwright + axe sobre el build de producción |
| `npm run build` | Build de producción |

Playwright necesita descargar los navegadores la primera vez:

```bash
npx playwright install --with-deps chromium
```

## Dónde vive cada garantía de accesibilidad

Los hallazgos de `docs/AUDITORIA.md` §2 no se corrigen aquí uno a uno: se vuelven imposibles de reintroducir.

| Hallazgo en el código heredado | Dónde queda resuelto |
|---|---|
| 57 `outline:none`, 0 `:focus-visible` | `src/app/globals.css` — anillo único en la capa base |
| ~300 `<div onclick>` | `src/components/ui/button.tsx` y la regla `jsx-a11y/no-static-element-interactions` |
| 159 campos, 22 `label for=` | `src/components/ui/text-field.tsx` — `etiqueta` es obligatoria en el tipo |
| 1 solo `aria-live` en 33 páginas | `src/components/a11y/announcer.tsx` — dos regiones montadas en el layout |
| 8 `<main>` para 33 páginas, 0 enlaces de salto | `src/app/layout.tsx` + `src/components/a11y/skip-link.tsx` |
| 132 `<img>`, la mitad sin `alt` | `next/image` exige `alt`; `jsx-a11y/alt-text` lo verifica |
| Tokens duplicados 33 veces | `src/styles/tokens.css` — definición única |

## Contraste

Los ratios están anotados en `src/styles/tokens.css`. Dos notas que el linter no puede comprobar:

- `--color-ink-faint` (#94A3B8) da **2.56:1** sobre blanco. No es apto para texto en ningún tamaño: solo separadores, iconografía decorativa y estados deshabilitados.
- `--color-success` y `--color-danger` tampoco alcanzan 4.5:1 como texto sobre fondo claro. Para texto existen `--color-success-text` y `--color-danger-text`.

axe detecta el contraste real en la página y romperá el build si alguno se usa mal.

## Lo que la puerta de CI **no** cubre

axe encuentra en torno a un tercio de los problemas reales. Los tests de `tests/e2e/a11y.spec.ts` añaden recorridos de teclado —enlace de salto, foco tras error de validación, anillo de foco visible— pero siguen sin cubrir:

- Si el orden de tabulación es lógico dentro de una página compleja.
- Si un texto alternativo describe algo útil o solo repite el nombre del fichero.
- Si un anuncio en vivo llega en el momento oportuno o interrumpe una lectura.
- Comportamiento real con NVDA, JAWS o VoiceOver.

Eso sigue necesitando revisión manual. La CI evita las regresiones mecánicas, no sustituye el criterio.

## Decisiones tomadas

**Next 16, no 15.** `docs/ARQUITECTURA.md` proponía la 15; la 16 es la estable actual y arrancar un proyecto nuevo en la anterior solo adelanta la deuda.

**TypeScript 5, no 7.** La 7 ya es la estable, pero el ecosistema de `typescript-eslint` y los tipos de Next todavía se apoyan en la 5. Es un cambio de una línea cuando toque.

**Paquete independiente, no workspace.** La raíz tiene su propio `package.json` para Capacitor y Firebase. Convertir el repositorio en un monorepo es una decisión aparte, y no hacía falta para arrancar.

**Fuentes autoalojadas.** `next/font` en lugar de `fonts.googleapis.com`: quita una conexión de terceros, evita el salto de maquetación y elimina dos orígenes de la CSP.

## Siguiente paso

Fase 3: primera ruta real. El orden por valor de negocio es ficha de producto y de servicio (es donde entra el tráfico orgánico), y cada ruta migrada se activa con un rewrite en `firebase.json` retirando su HTML antiguo en el mismo PR.
