"use client";

import { Button as AriaButton, type ButtonProps } from "react-aria-components";

/**
 * Botón de la aplicación.
 *
 * Se apoya en React Aria: es un `<button>` real, recibe foco, responde a Enter
 * y Espacio y expone `aria-disabled` y `aria-pressed` cuando corresponde. El
 * patrón `<div onClick>` que aparecía ~300 veces en el código heredado no tiene
 * equivalente aquí — no hay forma de escribirlo con este componente.
 */

type Variante = "primaria" | "secundaria" | "peligro";
type Tamano = "md" | "lg";

interface Props extends ButtonProps {
  variante?: Variante;
  tamano?: Tamano;
}

const variantes: Record<Variante, string> = {
  // Blanco sobre --color-brand: 4.88:1, cumple AA para texto normal.
  primaria:
    "bg-brand text-white hover:bg-brand-deep data-[pressed]:bg-brand-deep",
  secundaria:
    "bg-surface text-ink border border-border hover:bg-surface-sunken",
  // Blanco sobre --color-danger-text: 6.28:1.
  peligro: "bg-danger-text text-white hover:brightness-110",
};

const tamanos: Record<Tamano, string> = {
  md: "px-5 py-3 text-base",
  lg: "px-7 py-4 text-lg",
};

export function Button({
  variante = "primaria",
  tamano = "md",
  className,
  ...props
}: Props) {
  return (
    <AriaButton
      {...props}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-sm font-semibold",
        "transition-colors duration-200 ease-out",
        // React Aria expone el estado de deshabilitado como atributo de datos,
        // lo que evita depender de `pointer-events: none` (que además rompe
        // los tooltips explicativos).
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60",
        variantes[variante],
        tamanos[tamano],
        className ?? "",
      ].join(" ")}
    />
  );
}
