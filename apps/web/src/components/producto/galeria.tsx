"use client";

import Image from "next/image";
import { useId, useState } from "react";

import { useAnnounce } from "@/components/a11y/announcer";

/**
 * Galería de imágenes del producto.
 *
 * Las miniaturas son botones reales con `aria-pressed`, no divisiones con
 * `onclick`: reciben foco, responden a Enter y Espacio y se anuncian como
 * controles con estado. El cambio de imagen se publica en la región en vivo
 * porque, si no, para quien no ve la pantalla el botón no hace nada.
 *
 * El `alt` de la imagen grande describe qué se está viendo dentro del
 * conjunto. Repetir el título del producto en las cinco imágenes no aporta
 * nada a quien usa lector de pantalla (WCAG 2.2 · 1.1.1).
 */
export function GaleriaProducto({
  imagenes,
  titulo,
}: {
  imagenes: string[];
  titulo: string;
}) {
  const anunciar = useAnnounce();
  const [activa, setActiva] = useState(0);
  const idVista = useId();

  if (imagenes.length === 0) {
    return (
      <div
        className="flex aspect-4/3 items-center justify-center rounded-md bg-surface-sunken text-ink-soft"
        role="img"
        aria-label={`${titulo}: sin fotografías disponibles`}
      >
        Sin fotografías
      </div>
    );
  }

  const total = imagenes.length;
  const actual = imagenes[activa] ?? imagenes[0]!;

  function seleccionar(indice: number) {
    setActiva(indice);
    anunciar(`Imagen ${indice + 1} de ${total}`);
  }

  return (
    <div className="flex flex-col gap-3">
      <div id={idVista} className="relative aspect-4/3 overflow-hidden rounded-md bg-surface-sunken">
        <Image
          src={actual}
          alt={
            total === 1
              ? titulo
              : `${titulo}. Imagen ${activa + 1} de ${total}`
          }
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain"
          // La primera imagen es casi siempre el elemento con mayor
          // renderizado de la ficha: cargarla con prioridad mejora el LCP.
          priority
        />
      </div>

      {total > 1 ? (
        <ul aria-label="Imágenes del producto" className="flex list-none flex-wrap gap-2 p-0">
          {imagenes.map((url, indice) => (
            <li key={url}>
              <button
                type="button"
                onClick={() => seleccionar(indice)}
                aria-pressed={indice === activa}
                aria-controls={idVista}
                className={[
                  "relative size-16 overflow-hidden rounded-xs border-2 bg-surface-sunken",
                  indice === activa ? "border-brand" : "border-border",
                ].join(" ")}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
                <span className="sr-only">{`Ver imagen ${indice + 1} de ${total}`}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
