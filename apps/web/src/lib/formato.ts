/**
 * Formato de precios y fechas.
 *
 * El franco CFA no usa decimales. `Intl` con `currency: "XAF"` renderiza el
 * código ISO ("95.000 XAF"), y en Guinea Ecuatorial la moneda se escribe FCFA,
 * así que se formatea el número y se añade el sufijo.
 */

const numero = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

export function precioFCFA(valor: number): string {
  return `${numero.format(valor)} FCFA`;
}

const fechaLarga = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function fechaLegible(iso: string): string {
  return fechaLarga.format(new Date(iso));
}

/** Descuento en porcentaje entero, o null si no hay rebaja real. */
export function porcentajeDescuento(precio: number, anterior: number | null): number | null {
  if (anterior === null || anterior <= precio || anterior <= 0) return null;
  return Math.round((1 - precio / anterior) * 100);
}
