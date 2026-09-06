import Link from "next/link";

import { construirConsulta, type Criterios } from "@/lib/productos/consulta";

/**
 * Paginación del catálogo.
 *
 * Enlaces, no botones: cada página es una dirección propia, así que se puede
 * abrir en otra pestaña, compartir e indexar. Un botón que cambia la vista sin
 * cambiar la URL rompe las tres cosas.
 *
 * La página actual lleva `aria-current="page"` y no es un enlace: no tiene
 * sentido navegar a donde ya se está.
 */
export function Paginacion({
  criterios,
  pagina,
  paginas,
}: {
  criterios: Criterios;
  pagina: number;
  paginas: number;
}) {
  if (paginas <= 1) return null;

  // Ventana corta alrededor de la actual. Con cien páginas, listarlas todas
  // convierte la navegación por teclado en un recorrido de cien tabulaciones.
  const desde = Math.max(1, pagina - 2);
  const hasta = Math.min(paginas, pagina + 2);
  const numeros = Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i);

  const enlace = (destino: number) => `/productos${construirConsulta(criterios, { pagina: destino })}`;

  return (
    <nav aria-label="Paginación de resultados" className="mt-8">
      <ol className="flex list-none flex-wrap items-center justify-center gap-2 p-0">
        {pagina > 1 ? (
          <li>
            <Link
              href={enlace(pagina - 1)}
              rel="prev"
              className="inline-flex items-center rounded-xs border border-border px-4 py-2"
            >
              Anterior
            </Link>
          </li>
        ) : null}

        {desde > 1 ? (
          <li aria-hidden="true" className="px-1 text-ink-soft">
            …
          </li>
        ) : null}

        {numeros.map((numero) => (
          <li key={numero}>
            {numero === pagina ? (
              <span
                aria-current="page"
                className="inline-flex min-w-11 items-center justify-center rounded-xs bg-brand px-4 py-2 font-semibold text-white"
              >
                <span className="sr-only">Página </span>
                {numero}
              </span>
            ) : (
              <Link
                href={enlace(numero)}
                className="inline-flex min-w-11 items-center justify-center rounded-xs border border-border px-4 py-2"
              >
                <span className="sr-only">Página </span>
                {numero}
              </Link>
            )}
          </li>
        ))}

        {hasta < paginas ? (
          <li aria-hidden="true" className="px-1 text-ink-soft">
            …
          </li>
        ) : null}

        {pagina < paginas ? (
          <li>
            <Link
              href={enlace(pagina + 1)}
              rel="next"
              className="inline-flex items-center rounded-xs border border-border px-4 py-2"
            >
              Siguiente
            </Link>
          </li>
        ) : null}
      </ol>
    </nav>
  );
}
