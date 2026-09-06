/**
 * Categorías del catálogo.
 *
 * Extraídas del selector de `public/index-vendedor.html`, que es lo que se
 * escribe realmente en los documentos. La lista que había en
 * `src/lib/schemas/producto.ts` no correspondía con los datos.
 */

export const CATEGORIAS = [
  ["tecnologia", "Tecnología"],
  ["electrodomesticos", "Electrodomésticos"],
  ["moda", "Moda y ropa"],
  ["vehiculos", "Vehículos"],
  ["alimentacion", "Alimentación"],
  ["belleza", "Belleza y cuidado"],
  ["deportes", "Deportes y ocio"],
  ["hogar", "Hogar y jardín"],
  ["juguetes", "Juguetes y bebés"],
  ["mascotas", "Mascotas"],
  ["libros", "Libros y arte"],
  ["herramientas", "Herramientas"],
  ["inmuebles", "Inmuebles en venta"],
  ["alquiler", "Alquiler"],
  ["terrenos", "Terrenos y parcelas"],
  ["servicios_tecnicos", "Servicios técnicos"],
  ["servicios_salud", "Salud y bienestar"],
  ["servicios_educacion", "Educación y formación"],
  ["servicios_transporte", "Transporte y mudanzas"],
  ["servicios_construccion", "Construcción"],
  ["servicios_limpieza", "Limpieza"],
  ["servicios_legales", "Servicios legales"],
  ["servicios_financieros", "Servicios financieros"],
  ["servicios_eventos", "Eventos y bodas"],
  ["servicios_marketing", "Marketing y publicidad"],
  ["empleo_oferta", "Oferta de empleo"],
  ["empleo_demanda", "Busco empleo"],
  ["otros", "Otros"],
] as const satisfies readonly (readonly [string, string])[];

export type ClaveCategoria = (typeof CATEGORIAS)[number][0];

const ETIQUETAS = new Map<string, string>(CATEGORIAS.map(([clave, etiqueta]) => [clave, etiqueta]));

export function esCategoria(valor: string): boolean {
  return ETIQUETAS.has(valor);
}

/**
 * Un producto puede tener una categoría que ya no está en la lista. Se muestra
 * tal cual en lugar de ocultarla: el dato existe y el usuario lo entiende.
 */
export function etiquetaCategoria(clave: string): string {
  return ETIQUETAS.get(clave) ?? clave;
}
