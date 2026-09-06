import type {
  Coleccion,
  Disponibilidad,
  ProductoPublico,
  Vendedor,
} from "./tipos";

/**
 * Capa anticorrupción entre los datos heredados y la aplicación nueva.
 *
 * El mismo producto puede vivir en `productos` o en `Producto`, con nombres de
 * campo distintos según quién lo escribiera y cuándo. `detalledelproducto.html`
 * ya hacía esta conversión, pero repartida en veinte expresiones `a || b || c`
 * dentro de la función de render: imposible de probar y copiada a mano en cada
 * página que muestra un producto.
 *
 * Aquí está en un solo sitio, es una función pura y tiene pruebas. Cuando los
 * datos se unifiquen, este fichero se borra y nada más cambia.
 *
 * El caso que justifica separar por colección: `estado` significa cosas
 * distintas en cada una.
 *   - En `productos` es la condición del artículo (nuevo, usado) y el estado
 *     del anuncio va en `status`.
 *   - En `Producto` es el estado de moderación ('aceptado'), que es lo que
 *     consultan los listados heredados.
 */

// ── Accesores seguros sobre datos de origen desconocido ──────────────────────

type Datos = Record<string, unknown>;

function texto(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : null;
}

/** Primer campo con texto útil, en orden de preferencia. */
function primerTexto(datos: Datos, claves: readonly string[]): string | null {
  for (const clave of claves) {
    const valor = texto(datos[clave]);
    if (valor !== null) return valor;
  }
  return null;
}

/**
 * Los precios llegan como número o como cadena ("95000", "95.000 FCFA").
 * Se descarta todo lo que no sea dígito antes de convertir.
 */
function entero(valor: unknown): number | null {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? Math.trunc(valor) : null;
  }
  if (typeof valor === "string") {
    const digitos = valor.replace(/[^\d]/g, "");
    if (digitos.length === 0) return null;
    const numero = Number.parseInt(digitos, 10);
    return Number.isFinite(numero) ? numero : null;
  }
  return null;
}

function primerEntero(datos: Datos, claves: readonly string[]): number | null {
  for (const clave of claves) {
    const valor = entero(datos[clave]);
    if (valor !== null) return valor;
  }
  return null;
}

/** Objeto con método `toDate`, como los Timestamp de Firestore. */
function tieneToDate(valor: unknown): valor is { toDate: () => Date } {
  return (
    typeof valor === "object" &&
    valor !== null &&
    "toDate" in valor &&
    typeof (valor as { toDate: unknown }).toDate === "function"
  );
}

function fechaISO(valor: unknown): string | null {
  let fecha: Date | null = null;

  if (tieneToDate(valor)) fecha = valor.toDate();
  else if (valor instanceof Date) fecha = valor;
  else if (typeof valor === "number") fecha = new Date(valor);
  else if (typeof valor === "string") fecha = new Date(valor);

  if (fecha === null || Number.isNaN(fecha.getTime())) return null;
  return fecha.toISOString();
}

function primeraFecha(datos: Datos, claves: readonly string[]): string | null {
  for (const clave of claves) {
    const valor = fechaISO(datos[clave]);
    if (valor !== null) return valor;
  }
  return null;
}

// ── Campos compuestos ────────────────────────────────────────────────────────

const CLAVES_IMAGEN_LISTA = ["imagenes", "imagenesGitHub", "fotos"] as const;
const CLAVES_IMAGEN_UNICA = ["imagen", "url_imagen", "foto"] as const;

/**
 * Devuelve URL http(s) únicas y en orden. Se filtran cadenas vacías y rutas
 * relativas: la página las usa en `next/image`, que exige URL absolutas para
 * los orígenes remotos declarados.
 */
function imagenes(datos: Datos): string[] {
  const encontradas: string[] = [];

  for (const clave of CLAVES_IMAGEN_LISTA) {
    const valor = datos[clave];
    if (!Array.isArray(valor)) continue;
    for (const elemento of valor) {
      const url = texto(elemento);
      if (url !== null) encontradas.push(url);
    }
  }

  for (const clave of CLAVES_IMAGEN_UNICA) {
    const url = texto(datos[clave]);
    if (url !== null) encontradas.push(url);
  }

  return [...new Set(encontradas.filter((url) => /^https?:\/\//i.test(url)))];
}

const ESTADOS_DE_ANUNCIO = new Set([
  "activo",
  "aceptado",
  "publicado",
  "pendiente",
  "rechazado",
  "pausado",
  "vendido",
  "reservado",
  "retirado",
  "borrador",
]);

/**
 * `vendido: true` manda sobre cualquier otro campo: es el único booleano
 * explícito y lo escriben ambas colecciones.
 */
function disponibilidad(datos: Datos, coleccion: Coleccion): Disponibilidad {
  if (datos.vendido === true) return "vendido";

  const claves =
    coleccion === "productos"
      ? (["status", "estado_anuncio"] as const)
      : (["estado", "status", "estado_anuncio"] as const);

  const bruto = primerTexto(datos, claves)?.toLowerCase() ?? null;

  switch (bruto) {
    case "vendido":
      return "vendido";
    case "reservado":
      return "reservado";
    case "pausado":
    case "rechazado":
    case "retirado":
    case "borrador":
      return "retirado";
    default:
      // 'activo', 'aceptado', 'publicado' o ausente: se muestra.
      return "disponible";
  }
}

/**
 * Condición física. En `Producto`, `estado` es el estado de moderación, así que
 * solo se acepta como condición si no es uno de esos valores reservados.
 */
function condicion(datos: Datos, coleccion: Coleccion): string | null {
  const claves =
    coleccion === "productos"
      ? (["estado", "condicion"] as const)
      : (["condicion"] as const);

  const bruto = primerTexto(datos, claves);
  if (bruto === null) return null;
  if (ESTADOS_DE_ANUNCIO.has(bruto.toLowerCase())) return null;
  return bruto;
}

function vendedor(datos: Datos): Vendedor {
  return {
    id: primerTexto(datos, ["vendedorId", "uid", "userId"]),
    nombre:
      primerTexto(datos, ["vendedorNombre", "nombreVendedor", "vendedor"]) ??
      "Vendedor particular",
    foto: primerTexto(datos, ["vendedorFoto", "photoURL"]),
    telefono: primerTexto(datos, ["telefono", "whatsapp"]),
  };
}

// ── Punto de entrada ─────────────────────────────────────────────────────────

export function normalizarProducto(
  id: string,
  coleccion: Coleccion,
  datos: Datos,
): ProductoPublico {
  const precio = primerEntero(datos, ["precio", "price"]) ?? 0;
  const precioAnteriorBruto = primerEntero(datos, ["precioAntiguo", "precioAnterior"]);

  return {
    id,
    coleccion,
    titulo: primerTexto(datos, ["titulo", "Título", "title"]) ?? "Producto sin título",
    descripcion: primerTexto(datos, ["descripcion", "description"]) ?? "",
    precio,
    // Un precio tachado que no es mayor que el actual no es una rebaja: se descarta
    // en lugar de mostrar un descuento falso o negativo.
    precioAnterior:
      precioAnteriorBruto !== null && precioAnteriorBruto > precio
        ? precioAnteriorBruto
        : null,
    categoria: primerTexto(datos, ["categoria", "category"]) ?? "otros",
    subcategoria: primerTexto(datos, ["subcategoria"]),
    condicion: condicion(datos, coleccion),
    disponibilidad: disponibilidad(datos, coleccion),
    ubicacion: primerTexto(datos, ["ubicacion", "ciudad"]) ?? "Guinea Ecuatorial",
    imagenes: imagenes(datos),
    vendedor: vendedor(datos),
    publicadoEn: primeraFecha(datos, [
      "fechaPublicacion",
      "createdAt",
      "creadoEn",
      "fecha",
    ]),
    // El escritor de `productos` crea `vistas`, pero quien lo incrementa escribe
    // `visitas`. Se suman los dos porque ninguno tiene el total por separado.
    visitas: (primerEntero(datos, ["visitas"]) ?? 0) + (primerEntero(datos, ["vistas"]) ?? 0),
  };
}
