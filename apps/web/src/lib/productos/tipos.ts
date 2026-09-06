/**
 * Forma normalizada de un producto.
 *
 * Es el contrato que consume la aplicación nueva. Los documentos de Firestore
 * NO tienen esta forma: llegan de dos colecciones distintas con nombres de
 * campo distintos, y la conversión ocurre en `normalizar.ts`.
 */

export type Coleccion = "productos" | "Producto";

export type Disponibilidad = "disponible" | "reservado" | "vendido" | "retirado";

export interface Vendedor {
  id: string | null;
  nombre: string;
  foto: string | null;
  telefono: string | null;
}

export interface ProductoPublico {
  id: string;
  /** Colección de origen. Necesaria para escribir de vuelta en el documento correcto. */
  coleccion: Coleccion;
  titulo: string;
  descripcion: string;
  /** Francos CFA, entero. */
  precio: number;
  /** Precio tachado, solo si es mayor que el actual. */
  precioAnterior: number | null;
  categoria: string;
  subcategoria: string | null;
  /** Estado físico del artículo: nuevo, usado… No confundir con `disponibilidad`. */
  condicion: string | null;
  disponibilidad: Disponibilidad;
  ubicacion: string;
  imagenes: string[];
  vendedor: Vendedor;
  /** ISO 8601, o null si el documento no trae fecha utilizable. */
  publicadoEn: string | null;
  visitas: number;
}
