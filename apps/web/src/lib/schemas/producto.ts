import { z } from "zod";

/**
 * Definición única de "producto válido".
 *
 * La misma comprobación sirve al formulario, a la Server Action y a cualquier
 * función que escriba en Firestore. En el proyecto anterior no existía tal
 * definición: por eso conviven `productos` y `Producto`, y por eso los pedidos
 * se creaban con campos que las consultas luego no encontraban.
 */

export const CATEGORIAS = [
  "telefonos",
  "ordenadores",
  "moda",
  "hogar",
  "vehiculos",
  "servicios",
  "otros",
] as const;

export const ESTADOS_PRODUCTO = ["borrador", "activo", "pausado", "vendido"] as const;

/** Precios en francos CFA: enteros, sin decimales. */
const precioFCFA = z
  .number({ message: "Indica un precio" })
  .int("El precio no admite decimales")
  .positive("El precio debe ser mayor que cero")
  .max(1_000_000_000, "El precio excede el máximo admitido");

export const esquemaProducto = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, "El título necesita al menos 3 caracteres")
    .max(120, "El título no puede pasar de 120 caracteres"),
  descripcion: z
    .string()
    .trim()
    .max(2000, "La descripción no puede pasar de 2000 caracteres")
    .default(""),
  precio: precioFCFA,
  categoria: z.enum(CATEGORIAS, { message: "Elige una categoría" }),
  estado: z.enum(ESTADOS_PRODUCTO).default("borrador"),
  imagenes: z
    .array(z.url("Cada imagen debe ser una URL válida"))
    .max(8, "Máximo 8 imágenes por producto")
    .default([]),
  /**
   * Propietario del anuncio. Las reglas de Firestore comprueban que coincide
   * con `request.auth.uid`, así que el servidor lo asigna y el formulario no
   * lo envía nunca.
   */
  vendedorId: z.string().min(1),
});

export type Producto = z.infer<typeof esquemaProducto>;

/** Lo que el formulario envía: sin el propietario, que pone el servidor. */
export const esquemaProductoFormulario = esquemaProducto.omit({ vendedorId: true });
export type ProductoFormulario = z.infer<typeof esquemaProductoFormulario>;
