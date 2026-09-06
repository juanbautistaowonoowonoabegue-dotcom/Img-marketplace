import Image from "next/image";
import Link from "next/link";

import { etiquetaCategoria } from "@/lib/productos/categorias";
import { porcentajeDescuento, precioFCFA } from "@/lib/formato";
import type { ProductoPublico } from "@/lib/productos/tipos";

/**
 * Tarjeta de producto del listado.
 *
 * Un solo enlace por tarjeta, cuyo nombre accesible es el título del producto.
 * La superficie completa se hace pulsable con una capa `::after`, no envolviendo
 * la tarjeta entera en un `<a>`: eso produciría un nombre accesible de tres
 * líneas —título, precio, ubicación, categoría— que el lector de pantalla lee
 * entero en cada elemento de la lista de resultados.
 *
 * El precio queda fuera de ese nombre a propósito. Se anuncia al recorrer el
 * contenido, no al tabular entre enlaces.
 */
export function TarjetaProducto({ producto }: { producto: ProductoPublico }) {
  const portada = producto.imagenes[0];
  const descuento = porcentajeDescuento(producto.precio, producto.precioAnterior);

  return (
    <li className="relative flex flex-col overflow-hidden rounded-md border border-border bg-surface">
      <div className="relative aspect-4/3 bg-surface-sunken">
        {portada ? (
          <Image
            src={portada}
            // Vacío y no el título: el título ya lo dice el enlace justo debajo,
            // y repetirlo obliga a oír dos veces lo mismo (WCAG 2.2 · 1.1.1).
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-ink-soft">
            Sin fotografía
          </p>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="text-base font-semibold">
          <Link
            href={`/producto/${producto.id}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {producto.titulo}
          </Link>
        </h3>

        <p className="flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-extrabold text-brand-deep">
            {precioFCFA(producto.precio)}
          </span>
          {producto.precioAnterior !== null && descuento !== null ? (
            <s className="text-sm text-ink-soft">
              <span className="sr-only">Precio anterior: </span>
              {precioFCFA(producto.precioAnterior)}
            </s>
          ) : null}
        </p>

        <p className="mt-auto text-sm text-ink-soft">
          {etiquetaCategoria(producto.categoria)} · {producto.ubicacion}
        </p>
      </div>
    </li>
  );
}
