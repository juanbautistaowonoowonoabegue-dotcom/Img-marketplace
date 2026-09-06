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

/**
 * Tope de documentos que se traen de cada colección para el listado.
 *
 * El catálogo se filtra y ordena en memoria (ver `consulta.ts`), así que esto
 * es lo que acota el coste. Con `revalidate` en la página, son dos lecturas de
 * hasta 500 documentos cada cinco minutos, no por visita.
 */
const TOPE_LISTADO = 500;

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

export interface Catalogo {
  productos: ProductoPublico[];
  /** True si alguna de las dos consultas falló. La página lo comunica. */
  degradado: boolean;
}

/**
 * Ventana reciente de cada colección, normalizada y unida.
 *
 * Cada colección se ordena por su propio campo de fecha, que no es el mismo:
 * `productos` usa `createdAt` y `Producto` usa `fechaPublicacion`. Son las
 * mismas consultas que hace el sitio actual, así que no hacen falta índices
 * nuevos.
 *
 * Un documento sin ese campo de fecha queda fuera del listado — es como se
 * comporta `orderBy` en Firestore, y es también lo que ocurre hoy. Sigue
 * siendo accesible por su ficha.
 *
 * Si una consulta falla, se devuelve lo que haya con `degradado: true` en vez
 * de propagar el error: una página de catálogo a medias es mejor que un 500 en
 * una ruta indexada.
 */
export async function listarProductos(): Promise<Catalogo> {
  // `firestoreAdmin()` se resuelve dentro de cada consulta y no fuera: si no
  // hay credenciales, `applicationDefault()` lanza de forma síncrona, y aquí
  // esa excepción se convierte en una promesa rechazada que `allSettled`
  // recoge. Es lo que permite que la ruta se pueda ejecutar en integración
  // continua sin acceso al proyecto.
  const consultas: Record<Coleccion, () => Promise<ProductoPublico[]>> = {
    productos: async () => {
      const db = firestoreAdmin();
      const instantanea = await db
        .collection("productos")
        .where("status", "==", "activo")
        .orderBy("createdAt", "desc")
        .limit(TOPE_LISTADO)
        .get();
      return instantanea.docs.map((d) => normalizarProducto(d.id, "productos", d.data()));
    },
    Producto: async () => {
      const db = firestoreAdmin();
      // Sin `where` sobre `estado`: así basta el índice de campo único que
      // Firestore crea solo. El estado se resuelve al normalizar.
      const instantanea = await db
        .collection("Producto")
        .orderBy("fechaPublicacion", "desc")
        .limit(TOPE_LISTADO)
        .get();
      return instantanea.docs.map((d) => normalizarProducto(d.id, "Producto", d.data()));
    },
  };

  const resultados = await Promise.allSettled(
    COLECCIONES.map((coleccion) => consultas[coleccion]()),
  );

  const productos: ProductoPublico[] = [];
  let degradado = false;

  for (const [indice, resultado] of resultados.entries()) {
    if (resultado.status === "fulfilled") {
      productos.push(...resultado.value);
    } else {
      degradado = true;
      console.error(
        `[catalogo] falló la consulta de ${COLECCIONES[indice]}`,
        resultado.reason,
      );
    }
  }

  // Un mismo identificador podría existir en ambas colecciones. Gana el de
  // `productos`, que es la actual.
  const porId = new Map<string, ProductoPublico>();
  for (const producto of productos) {
    if (!porId.has(producto.id) || producto.coleccion === "productos") {
      porId.set(producto.id, producto);
    }
  }

  return { productos: [...porId.values()], degradado };
}
