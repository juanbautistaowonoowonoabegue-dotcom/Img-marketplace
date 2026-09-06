import { esCategoria } from "./categorias";
import type { ProductoPublico } from "./tipos";

/**
 * Criterios de búsqueda, filtrado, orden y paginación.
 *
 * Todo lo de este fichero son funciones puras sobre una lista ya normalizada:
 * no habla con Firestore. Eso lo hace probable sin emulador y permite razonar
 * sobre el comportamiento de la búsqueda por separado del acceso a datos.
 *
 * Por qué se filtra en memoria y no en la consulta: Firestore no tiene
 * búsqueda de texto. El sitio heredado tampoco la tiene para productos —
 * `nombreBusca` solo existe en usuarios y comunidades—, así que no se está
 * perdiendo nada. Lo que se gana es coincidencia por varios términos y sin
 * acentos, en vez de un prefijo exacto. El techo de este enfoque está
 * documentado en `docs/FASE-3-LISTADO.md`.
 */

export const POR_PAGINA = 24;

export const ORDENES = ["recientes", "precio-asc", "precio-desc"] as const;
export type Orden = (typeof ORDENES)[number];

export const ETIQUETAS_ORDEN: Record<Orden, string> = {
  recientes: "Más recientes",
  "precio-asc": "Precio: de menor a mayor",
  "precio-desc": "Precio: de mayor a menor",
};

export interface Criterios {
  q: string;
  categoria: string | null;
  precioMin: number | null;
  precioMax: number | null;
  orden: Orden;
  pagina: number;
}

export interface Resultado {
  productos: ProductoPublico[];
  total: number;
  pagina: number;
  paginas: number;
}

// ── Lectura de los parámetros de la URL ──────────────────────────────────────

/** `searchParams` puede traer un valor repetido; se toma el primero. */
function unico(valor: string | string[] | undefined): string {
  if (Array.isArray(valor)) return valor[0] ?? "";
  return valor ?? "";
}

/**
 * Se limpian los separadores de miles —«95.000» es como se escribe aquí— pero
 * un signo menos invalida el valor en lugar de desaparecer: quitarlo convertía
 * `?pagina=-3` en la página 3 y `?precioMin=-5000` en un filtro de 5000.
 */
function enteroPositivo(valor: string): number | null {
  if (valor.includes("-")) return null;
  const digitos = valor.replace(/[^\d]/g, "");
  if (digitos.length === 0) return null;
  const numero = Number.parseInt(digitos, 10);
  return Number.isFinite(numero) ? numero : null;
}

function esOrden(valor: string): valor is Orden {
  return (ORDENES as readonly string[]).includes(valor);
}

/**
 * Todo lo que llega por la URL es entrada de usuario. Un parámetro inválido
 * cae al valor por defecto en lugar de romper la página: estas URL se
 * comparten, se indexan y se editan a mano.
 */
export function leerCriterios(
  params: Record<string, string | string[] | undefined>,
): Criterios {
  const categoria = unico(params.categoria).trim();
  const orden = unico(params.orden).trim();
  const pagina = enteroPositivo(unico(params.pagina));

  const precioMin = enteroPositivo(unico(params.precioMin));
  const precioMax = enteroPositivo(unico(params.precioMax));

  // Un rango invertido es casi siempre un dedazo. Se intercambia en lugar de
  // devolver cero resultados sin explicación.
  const rangoInvertido =
    precioMin !== null && precioMax !== null && precioMin > precioMax;

  return {
    q: unico(params.q).trim().slice(0, 120),
    categoria: esCategoria(categoria) ? categoria : null,
    precioMin: rangoInvertido ? precioMax : precioMin,
    precioMax: rangoInvertido ? precioMin : precioMax,
    orden: esOrden(orden) ? orden : "recientes",
    pagina: pagina !== null && pagina > 0 ? pagina : 1,
  };
}

/** Reconstruye la cadena de consulta conservando lo que no cambia. */
export function construirConsulta(
  criterios: Criterios,
  cambios: Partial<Criterios> = {},
): string {
  const combinados = { ...criterios, ...cambios };
  const params = new URLSearchParams();

  if (combinados.q) params.set("q", combinados.q);
  if (combinados.categoria) params.set("categoria", combinados.categoria);
  if (combinados.precioMin !== null) params.set("precioMin", String(combinados.precioMin));
  if (combinados.precioMax !== null) params.set("precioMax", String(combinados.precioMax));
  if (combinados.orden !== "recientes") params.set("orden", combinados.orden);
  if (combinados.pagina > 1) params.set("pagina", String(combinados.pagina));

  const cadena = params.toString();
  return cadena ? `?${cadena}` : "";
}

// ── Búsqueda de texto ────────────────────────────────────────────────────────

/**
 * Minúsculas y sin diacríticos, para que «telefono» encuentre «Teléfono».
 * En un catálogo escrito a mano por vendedores, la mitad de los títulos no
 * llevan tilde.
 */
export function normalizarTexto(valor: string): string {
  return valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function textoBuscable(producto: ProductoPublico): string {
  return normalizarTexto(
    [
      producto.titulo,
      producto.descripcion,
      producto.categoria,
      producto.subcategoria ?? "",
      producto.ubicacion,
    ].join(" "),
  );
}

/** Todos los términos deben aparecer. Buscar «samsung malabo» no debe traer todos los Samsung. */
function coincide(producto: ProductoPublico, consulta: string): boolean {
  const terminos = normalizarTexto(consulta).split(/\s+/).filter(Boolean);
  if (terminos.length === 0) return true;

  const texto = textoBuscable(producto);
  return terminos.every((termino) => texto.includes(termino));
}

// ── Aplicación de los criterios ──────────────────────────────────────────────

function comparar(orden: Orden) {
  return (a: ProductoPublico, b: ProductoPublico): number => {
    switch (orden) {
      case "precio-asc":
        return a.precio - b.precio;
      case "precio-desc":
        return b.precio - a.precio;
      default: {
        // Sin fecha, al final: es preferible a colarlos arriba por ser `null`.
        const fechaA = a.publicadoEn ?? "";
        const fechaB = b.publicadoEn ?? "";
        return fechaB.localeCompare(fechaA);
      }
    }
  };
}

export function aplicarCriterios(
  productos: readonly ProductoPublico[],
  criterios: Criterios,
): Resultado {
  const filtrados = productos.filter((producto) => {
    // Lo vendido y lo retirado no aparece en el listado. La ficha sigue
    // existiendo: los enlaces compartidos no se rompen.
    if (producto.disponibilidad === "vendido" || producto.disponibilidad === "retirado") {
      return false;
    }
    if (criterios.categoria !== null && producto.categoria !== criterios.categoria) {
      return false;
    }
    if (criterios.precioMin !== null && producto.precio < criterios.precioMin) return false;
    if (criterios.precioMax !== null && producto.precio > criterios.precioMax) return false;
    return coincide(producto, criterios.q);
  });

  const ordenados = [...filtrados].sort(comparar(criterios.orden));

  const total = ordenados.length;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  // Una página fuera de rango se ajusta a la última en lugar de mostrar el
  // vacío: pasa al filtrar estando en la página 5.
  const pagina = Math.min(criterios.pagina, paginas);
  const desde = (pagina - 1) * POR_PAGINA;

  return {
    productos: ordenados.slice(desde, desde + POR_PAGINA),
    total,
    pagina,
    paginas,
  };
}

/** Descripción de los filtros activos, para anunciarla y para el título. */
export function hayFiltros(criterios: Criterios): boolean {
  return (
    criterios.q !== "" ||
    criterios.categoria !== null ||
    criterios.precioMin !== null ||
    criterios.precioMax !== null
  );
}
