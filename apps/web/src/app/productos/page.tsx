import type { Metadata } from "next";

import { FiltrosCatalogo } from "@/components/producto/filtros";
import { TarjetaProducto } from "@/components/producto/tarjeta";
import { Paginacion } from "@/components/ui/paginacion";
import { etiquetaCategoria } from "@/lib/productos/categorias";
import { aplicarCriterios, hayFiltros, leerCriterios } from "@/lib/productos/consulta";
import { listarProductos } from "@/lib/productos/repositorio";

/**
 * Listado y buscador del catálogo — segunda ruta migrada.
 *
 * Reutiliza tal cual la normalización que se escribió para la ficha: el
 * listado tiene el mismo problema de datos —dos colecciones, campos con
 * nombres distintos— y ya está resuelto en un sitio.
 */

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const revalidate = 300;

function tituloDe(criterios: ReturnType<typeof leerCriterios>): string {
  if (criterios.q) return `Resultados para «${criterios.q}»`;
  if (criterios.categoria) return etiquetaCategoria(criterios.categoria);
  return "Catálogo";
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const criterios = leerCriterios(await searchParams);

  return {
    title: tituloDe(criterios),
    description:
      "Compra y vende en Guinea Ecuatorial: tecnología, moda, hogar, vehículos y servicios.",
    // Una búsqueda o un rango de precio genera infinitas URL sin valor propio
    // en el índice. La categoría sí es una página con entidad, y se indexa.
    robots:
      criterios.q || criterios.precioMin !== null || criterios.precioMax !== null
        ? { index: false, follow: true }
        : undefined,
  };
}

export default async function PaginaCatalogo({ searchParams }: Props) {
  const criterios = leerCriterios(await searchParams);
  const { productos, degradado } = await listarProductos();
  const resultado = aplicarCriterios(productos, criterios);

  const titulo = tituloDe(criterios);
  const recuento =
    resultado.total === 1 ? "1 producto" : `${resultado.total} productos`;

  return (
    <>
      <h1 className="text-3xl font-extrabold">{titulo}</h1>

      {/*
        El recuento va en un párrafo normal y no en una región `aria-live`.
        El formulario navega de verdad —`method="get"`—, así que el lector de
        pantalla anuncia la página nueva por su título, que ya lleva el término
        buscado. Una región en vivo presente desde la carga no se anuncia: sería
        peso muerto que da falsa sensación de estar cubierto.
      */}
      <p className="mt-2 text-ink-soft">
        {hayFiltros(criterios)
          ? `${recuento} coinciden con los filtros.`
          : `${recuento} en el catálogo.`}
      </p>

      {degradado ? (
        <p
          role="alert"
          className="mt-4 rounded-sm border border-danger-text bg-danger-tint px-4 py-3 font-semibold text-danger-text"
        >
          No hemos podido cargar todo el catálogo. Lo que se muestra puede estar
          incompleto; vuelve a intentarlo en unos minutos.
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[18rem_1fr]">
        <FiltrosCatalogo criterios={criterios} />

        <section aria-labelledby="titulo-resultados">
          <h2 id="titulo-resultados" className="sr-only">
            Resultados
          </h2>

          {resultado.productos.length === 0 ? (
            <p className="rounded-md border border-border bg-surface-sunken px-4 py-8 text-center text-ink-soft">
              {hayFiltros(criterios)
                ? "Ningún producto coincide con esos filtros. Prueba con menos términos o amplía el rango de precio."
                : "Todavía no hay productos publicados."}
            </p>
          ) : (
            <ul className="grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 xl:grid-cols-3">
              {resultado.productos.map((producto) => (
                <TarjetaProducto key={producto.id} producto={producto} />
              ))}
            </ul>
          )}

          <Paginacion
            criterios={criterios}
            pagina={resultado.pagina}
            paginas={resultado.paginas}
          />
        </section>
      </div>
    </>
  );
}
