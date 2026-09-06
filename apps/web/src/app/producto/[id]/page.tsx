import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BotonAnadirCarrito } from "@/components/producto/boton-carrito";
import { GaleriaProducto } from "@/components/producto/galeria";
import { fechaLegible, porcentajeDescuento, precioFCFA } from "@/lib/formato";
import { obtenerProducto } from "@/lib/productos/repositorio";
import type { ProductoPublico } from "@/lib/productos/tipos";

/**
 * Ficha de producto — primera ruta migrada.
 *
 * Es la primera por una razón concreta: es donde entra el tráfico orgánico de
 * un marketplace. La versión heredada (`detalledelproducto.html?id=…`) monta la
 * página entera en el navegador, así que el rastreador recibe un documento
 * vacío. Aquí el HTML sale del servidor con sus metadatos y sus datos
 * estructurados.
 */

interface Props {
  params: Promise<{ id: string }>;
}

/** Se regenera cada cinco minutos: el precio y la disponibilidad cambian, el resto no. */
export const revalidate = 300;

const DISPONIBILIDAD_SCHEMA = {
  disponible: "https://schema.org/InStock",
  reservado: "https://schema.org/PreOrder",
  vendido: "https://schema.org/SoldOut",
  retirado: "https://schema.org/Discontinued",
} as const;

const ETIQUETA_DISPONIBILIDAD = {
  disponible: "Disponible",
  reservado: "Reservado",
  vendido: "Vendido",
  retirado: "No disponible",
} as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const producto = await obtenerProducto(id);

  if (producto === null) {
    return { title: "Producto no encontrado" };
  }

  const descripcion =
    producto.descripcion.slice(0, 155) ||
    `${producto.titulo} por ${precioFCFA(producto.precio)} en ${producto.ubicacion}.`;

  return {
    title: producto.titulo,
    description: descripcion,
    alternates: { canonical: `/producto/${producto.id}` },
    openGraph: {
      title: producto.titulo,
      description: descripcion,
      type: "website",
      locale: "es_GQ",
      images: producto.imagenes.slice(0, 1).map((url) => ({ url })),
    },
    // Un producto vendido o retirado no debe seguir compitiendo en resultados.
    robots:
      producto.disponibilidad === "disponible"
        ? undefined
        : { index: false, follow: true },
  };
}

/**
 * Datos estructurados. Es lo que permite que la ficha aparezca en los
 * resultados enriquecidos con precio y disponibilidad, y no existía en la
 * versión heredada.
 */
function datosEstructurados(producto: ProductoPublico) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.titulo,
    description: producto.descripcion || undefined,
    image: producto.imagenes.length > 0 ? producto.imagenes : undefined,
    category: producto.categoria,
    itemCondition:
      producto.condicion?.toLowerCase() === "nuevo"
        ? "https://schema.org/NewCondition"
        : "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      price: producto.precio,
      priceCurrency: "XAF",
      availability: DISPONIBILIDAD_SCHEMA[producto.disponibilidad],
      seller: { "@type": "Person", name: producto.vendedor.nombre },
    },
  };
}

export default async function PaginaProducto({ params }: Props) {
  const { id } = await params;
  const producto = await obtenerProducto(id);

  if (producto === null) notFound();

  const descuento = porcentajeDescuento(producto.precio, producto.precioAnterior);

  return (
    <>
      <script
        type="application/ld+json"
        // El contenido lo genera el servidor a partir de datos ya normalizados,
        // no de entrada del usuario sin tratar.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados(producto)) }}
      />

      <nav aria-label="Migas de pan" className="mb-6 text-sm text-ink-soft">
        <ol className="flex list-none flex-wrap items-center gap-2 p-0">
          <li>
            <Link href="/">Inicio</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="capitalize">{producto.categoria}</li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {producto.titulo}
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <GaleriaProducto imagenes={producto.imagenes} titulo={producto.titulo} />

        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-3xl font-extrabold">{producto.titulo}</h1>

            {/* La disponibilidad se comunica con texto, no solo con color
                (WCAG 2.2 · 1.4.1). */}
            <p className="mt-2 inline-flex items-center rounded-xs bg-surface-sunken px-3 py-1 text-sm font-semibold">
              {ETIQUETA_DISPONIBILIDAD[producto.disponibilidad]}
            </p>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <p className="text-3xl font-extrabold text-brand-deep">
              {precioFCFA(producto.precio)}
            </p>
            {producto.precioAnterior !== null && descuento !== null ? (
              <>
                <s className="text-ink-soft">
                  <span className="sr-only">Precio anterior: </span>
                  {precioFCFA(producto.precioAnterior)}
                </s>
                <span className="font-semibold text-success-text">
                  {descuento}&nbsp;% de descuento
                </span>
              </>
            ) : null}
          </div>

          <BotonAnadirCarrito producto={producto} />

          {producto.descripcion ? (
            <section aria-labelledby="titulo-descripcion">
              <h2 id="titulo-descripcion" className="text-lg font-bold">
                Descripción
              </h2>
              <p className="mt-2 whitespace-pre-line text-ink-soft">
                {producto.descripcion}
              </p>
            </section>
          ) : null}

          <section aria-labelledby="titulo-detalles">
            <h2 id="titulo-detalles" className="text-lg font-bold">
              Detalles
            </h2>

            {/* Lista de descripción: asocia cada dato con su etiqueta en el
                árbol de accesibilidad, cosa que una rejilla de divisiones no
                hace (WCAG 2.2 · 1.3.1). */}
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="font-semibold">Categoría</dt>
              <dd className="capitalize text-ink-soft">
                {producto.categoria}
                {producto.subcategoria ? ` · ${producto.subcategoria}` : ""}
              </dd>

              {producto.condicion ? (
                <>
                  <dt className="font-semibold">Estado</dt>
                  <dd className="text-ink-soft">{producto.condicion}</dd>
                </>
              ) : null}

              <dt className="font-semibold">Ubicación</dt>
              <dd className="text-ink-soft">{producto.ubicacion}</dd>

              <dt className="font-semibold">Vendedor</dt>
              <dd className="text-ink-soft">{producto.vendedor.nombre}</dd>

              {producto.publicadoEn ? (
                <>
                  <dt className="font-semibold">Publicado</dt>
                  <dd className="text-ink-soft">
                    <time dateTime={producto.publicadoEn}>
                      {fechaLegible(producto.publicadoEn)}
                    </time>
                  </dd>
                </>
              ) : null}
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
