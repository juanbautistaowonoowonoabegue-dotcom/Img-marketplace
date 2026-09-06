import Link from "next/link";

import { CATEGORIAS } from "@/lib/productos/categorias";
import { ETIQUETAS_ORDEN, ORDENES, hayFiltros, type Criterios } from "@/lib/productos/consulta";

/**
 * Buscador y filtros del catálogo.
 *
 * Es un `<form method="get">` de servidor, sin una línea de JavaScript. Eso no
 * es nostalgia: el estado vive en la URL, así que los resultados se comparten,
 * el botón «atrás» funciona, la página se puede indexar y el buscador sigue
 * operativo con una conexión que no llega a cargar el bundle — que en Malabo o
 * Bata no es un caso raro.
 *
 * Cada control tiene su `<label>`. El rango de precio va en `<fieldset>` con
 * `<legend>` porque «Desde» y «Hasta» por separado no significan nada: la
 * agrupación es la que da el contexto (WCAG 2.2 · 1.3.1). La auditoría contó
 * cero `fieldset` en las 33 páginas heredadas.
 */
export function FiltrosCatalogo({ criterios }: { criterios: Criterios }) {
  return (
    <search>
      <form
        method="get"
        action="/productos"
        className="flex flex-col gap-5 rounded-md border border-border bg-surface-sunken p-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="q" className="text-sm font-semibold">
            Buscar en el catálogo
          </label>
          <input
            type="search"
            id="q"
            name="q"
            defaultValue={criterios.q}
            placeholder="Por ejemplo: teléfono Samsung"
            className="rounded-xs border border-border bg-surface px-3 py-2.5"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="categoria" className="text-sm font-semibold">
            Categoría
          </label>
          <select
            id="categoria"
            name="categoria"
            defaultValue={criterios.categoria ?? ""}
            className="rounded-xs border border-border bg-surface px-3 py-2.5"
          >
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map(([clave, etiqueta]) => (
              <option key={clave} value={clave}>
                {etiqueta}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="flex flex-col gap-2 border-0 p-0">
          <legend className="mb-1 text-sm font-semibold">Precio en FCFA</legend>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="precioMin" className="text-sm">
                Desde
              </label>
              {/* `inputMode` y no `type="number"`: el numérico nativo cambia de
                  valor con la rueda del ratón y se lee mal en varios lectores. */}
              <input
                type="text"
                inputMode="numeric"
                id="precioMin"
                name="precioMin"
                defaultValue={criterios.precioMin ?? ""}
                className="rounded-xs border border-border bg-surface px-3 py-2.5"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="precioMax" className="text-sm">
                Hasta
              </label>
              <input
                type="text"
                inputMode="numeric"
                id="precioMax"
                name="precioMax"
                defaultValue={criterios.precioMax ?? ""}
                className="rounded-xs border border-border bg-surface px-3 py-2.5"
              />
            </div>
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="orden" className="text-sm font-semibold">
            Ordenar por
          </label>
          <select
            id="orden"
            name="orden"
            defaultValue={criterios.orden}
            className="rounded-xs border border-border bg-surface px-3 py-2.5"
          >
            {ORDENES.map((orden) => (
              <option key={orden} value={orden}>
                {ETIQUETAS_ORDEN[orden]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-sm bg-brand px-5 py-3 font-semibold text-white"
          >
            Aplicar filtros
          </button>

          {hayFiltros(criterios) ? (
            <Link href="/productos" className="inline-flex items-center px-2 font-semibold text-brand-deep">
              Quitar filtros
            </Link>
          ) : null}
        </div>
      </form>
    </search>
  );
}
