import "server-only";

import { firestoreAdmin } from "@/lib/firebase/admin";

import { normalizarProducto } from "./normalizar";
import type { Coleccion, ProductoPublico } from "./tipos";

/**
 * Acceso de servidor al catálogo.
 *
 * Se lee con el SDK de administración, no con el de cliente: el HTML se genera
 * en el servidor, que es lo que hace indexable la ficha. El catálogo es público
 * —las reglas ya permiten `read` en ambas colecciones—, así que aquí no se
 * expone nada que no fuera visible de todos modos.
 */

/** `productos` es la colección actual; `Producto` el duplicado heredado. */
const COLECCIONES: readonly Coleccion[] = ["productos", "Producto"];

export async function obtenerProducto(id: string): Promise<ProductoPublico | null> {
  // Un identificador de Firestore no puede llevar barras ni estar vacío.
  // Filtrarlo aquí evita una excepción del SDK en cada petición con basura.
  if (!id || id.includes("/") || id.length > 1500) return null;

  const db = firestoreAdmin();

  // Las dos lecturas van en paralelo: secuencialmente, todo producto heredado
  // pagaría dos viajes de ida y vuelta.
  const instantaneas = await Promise.all(
    COLECCIONES.map((coleccion) => db.collection(coleccion).doc(id).get()),
  );

  for (const [indice, instantanea] of instantaneas.entries()) {
    if (!instantanea.exists) continue;
    const coleccion = COLECCIONES[indice];
    if (coleccion === undefined) continue;
    return normalizarProducto(instantanea.id, coleccion, instantanea.data() ?? {});
  }

  return null;
}
