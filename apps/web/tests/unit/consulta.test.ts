import { describe, expect, it } from "vitest";

import {
  aplicarCriterios,
  construirConsulta,
  hayFiltros,
  leerCriterios,
  normalizarTexto,
  POR_PAGINA,
} from "@/lib/productos/consulta";
import type { ProductoPublico } from "@/lib/productos/tipos";

function producto(parcial: Partial<ProductoPublico> & { id: string }): ProductoPublico {
  return {
    coleccion: "productos",
    titulo: "Producto",
    descripcion: "",
    precio: 1000,
    precioAnterior: null,
    categoria: "otros",
    subcategoria: null,
    condicion: null,
    disponibilidad: "disponible",
    ubicacion: "Malabo",
    imagenes: [],
    vendedor: { id: null, nombre: "Vendedor particular", foto: null, telefono: null },
    publicadoEn: "2026-01-01T00:00:00.000Z",
    visitas: 0,
    ...parcial,
  };
}

describe("leerCriterios", () => {
  it("toma valores por defecto sensatos sin parámetros", () => {
    const c = leerCriterios({});
    expect(c).toEqual({
      q: "",
      categoria: null,
      precioMin: null,
      precioMax: null,
      orden: "recientes",
      pagina: 1,
    });
  });

  it("descarta una categoría que no existe en lugar de no devolver nada", () => {
    // La URL es editable a mano y se comparte: un valor inventado no debe
    // producir un listado vacío sin explicación.
    expect(leerCriterios({ categoria: "criptomonedas" }).categoria).toBeNull();
    expect(leerCriterios({ categoria: "vehiculos" }).categoria).toBe("vehiculos");
  });

  it("descarta un orden desconocido", () => {
    expect(leerCriterios({ orden: "aleatorio" }).orden).toBe("recientes");
    expect(leerCriterios({ orden: "precio-asc" }).orden).toBe("precio-asc");
  });

  it("intercambia un rango de precio invertido", () => {
    // Es casi siempre un dedazo; devolver cero resultados no ayuda a nadie.
    const c = leerCriterios({ precioMin: "90000", precioMax: "10000" });
    expect(c.precioMin).toBe(10000);
    expect(c.precioMax).toBe(90000);
  });

  it("acepta precios escritos con separadores", () => {
    expect(leerCriterios({ precioMin: "95.000" }).precioMin).toBe(95000);
  });

  it("normaliza páginas inválidas a la primera", () => {
    for (const pagina of ["0", "-3", "abc", ""]) {
      expect(leerCriterios({ pagina }).pagina).toBe(1);
    }
  });

  it("toma el primer valor si un parámetro llega repetido", () => {
    expect(leerCriterios({ q: ["nevera", "coche"] }).q).toBe("nevera");
  });

  it("acota la longitud del término de búsqueda", () => {
    expect(leerCriterios({ q: "a".repeat(500) }).q).toHaveLength(120);
  });
});

describe("construirConsulta", () => {
  it("omite los valores por defecto para no ensuciar la URL", () => {
    expect(construirConsulta(leerCriterios({}))).toBe("");
  });

  it("conserva los demás criterios al cambiar de página", () => {
    const c = leerCriterios({ q: "nevera", categoria: "hogar" });
    expect(construirConsulta(c, { pagina: 3 })).toBe(
      "?q=nevera&categoria=hogar&pagina=3",
    );
  });
});

describe("normalizarTexto", () => {
  it("quita mayúsculas y diacríticos", () => {
    // En un catálogo escrito por vendedores, la mitad de los títulos no lleva
    // tilde: «telefono» tiene que encontrar «Teléfono».
    expect(normalizarTexto("Teléfono Móvil")).toBe("telefono movil");
    expect(normalizarTexto("NIÑO")).toBe("nino");
  });
});

describe("aplicarCriterios · búsqueda", () => {
  const catalogo = [
    producto({ id: "1", titulo: "Teléfono Samsung A15", ubicacion: "Malabo" }),
    producto({ id: "2", titulo: "Teléfono Samsung S22", ubicacion: "Bata" }),
    producto({ id: "3", titulo: "Nevera Whirlpool", descripcion: "Casi nueva" }),
  ];

  it("encuentra sin tildes", () => {
    const r = aplicarCriterios(catalogo, leerCriterios({ q: "telefono" }));
    expect(r.total).toBe(2);
  });

  it("exige todos los términos, no cualquiera de ellos", () => {
    // Buscar «samsung malabo» no debe traer los Samsung de Bata.
    const r = aplicarCriterios(catalogo, leerCriterios({ q: "samsung malabo" }));
    expect(r.total).toBe(1);
    expect(r.productos[0]?.id).toBe("1");
  });

  it("busca también en la descripción", () => {
    const r = aplicarCriterios(catalogo, leerCriterios({ q: "casi nueva" }));
    expect(r.productos[0]?.id).toBe("3");
  });

  it("una búsqueda vacía no filtra nada", () => {
    expect(aplicarCriterios(catalogo, leerCriterios({ q: "   " })).total).toBe(3);
  });
});

describe("aplicarCriterios · filtros", () => {
  const catalogo = [
    producto({ id: "1", precio: 5000, categoria: "hogar" }),
    producto({ id: "2", precio: 50000, categoria: "tecnologia" }),
    producto({ id: "3", precio: 500000, categoria: "tecnologia" }),
  ];

  it("filtra por categoría", () => {
    const r = aplicarCriterios(catalogo, leerCriterios({ categoria: "tecnologia" }));
    expect(r.total).toBe(2);
  });

  it("aplica el rango de precio con los extremos incluidos", () => {
    const r = aplicarCriterios(
      catalogo,
      leerCriterios({ precioMin: "5000", precioMax: "50000" }),
    );
    expect(r.total).toBe(2);
  });

  it("oculta lo vendido y lo retirado del listado", () => {
    // La ficha sigue existiendo: los enlaces ya compartidos no se rompen.
    const conVendidos = [
      producto({ id: "a" }),
      producto({ id: "b", disponibilidad: "vendido" }),
      producto({ id: "c", disponibilidad: "retirado" }),
      producto({ id: "d", disponibilidad: "reservado" }),
    ];
    const r = aplicarCriterios(conVendidos, leerCriterios({}));
    expect(r.productos.map((p) => p.id)).toEqual(["a", "d"]);
  });
});

describe("aplicarCriterios · orden", () => {
  const catalogo = [
    producto({ id: "medio", precio: 500, publicadoEn: "2026-02-01T00:00:00.000Z" }),
    producto({ id: "caro", precio: 900, publicadoEn: "2026-03-01T00:00:00.000Z" }),
    producto({ id: "barato", precio: 100, publicadoEn: "2026-01-01T00:00:00.000Z" }),
  ];

  it("ordena por precio ascendente", () => {
    const r = aplicarCriterios(catalogo, leerCriterios({ orden: "precio-asc" }));
    expect(r.productos.map((p) => p.id)).toEqual(["barato", "medio", "caro"]);
  });

  it("ordena por precio descendente", () => {
    const r = aplicarCriterios(catalogo, leerCriterios({ orden: "precio-desc" }));
    expect(r.productos.map((p) => p.id)).toEqual(["caro", "medio", "barato"]);
  });

  it("por defecto, lo más reciente primero", () => {
    const r = aplicarCriterios(catalogo, leerCriterios({}));
    expect(r.productos.map((p) => p.id)).toEqual(["caro", "medio", "barato"]);
  });

  it("los productos sin fecha van al final, no al principio", () => {
    const conNulo = [...catalogo, producto({ id: "sin-fecha", publicadoEn: null })];
    const r = aplicarCriterios(conNulo, leerCriterios({}));
    expect(r.productos.at(-1)?.id).toBe("sin-fecha");
  });
});

describe("aplicarCriterios · paginación", () => {
  const catalogo = Array.from({ length: POR_PAGINA * 2 + 5 }, (_, i) =>
    producto({ id: `p${i}`, precio: i + 1 }),
  );

  it("devuelve como mucho una página", () => {
    const r = aplicarCriterios(catalogo, leerCriterios({}));
    expect(r.productos).toHaveLength(POR_PAGINA);
    expect(r.total).toBe(catalogo.length);
    expect(r.paginas).toBe(3);
  });

  it("la última página trae el resto", () => {
    const r = aplicarCriterios(catalogo, leerCriterios({ pagina: "3" }));
    expect(r.productos).toHaveLength(5);
  });

  it("una página fuera de rango se ajusta a la última", () => {
    // Pasa al aplicar un filtro estando en la página 5.
    const r = aplicarCriterios(catalogo, leerCriterios({ pagina: "99" }));
    expect(r.pagina).toBe(3);
    expect(r.productos).toHaveLength(5);
  });

  it("un catálogo vacío da una página, no cero", () => {
    const r = aplicarCriterios([], leerCriterios({}));
    expect(r.paginas).toBe(1);
    expect(r.total).toBe(0);
  });

  it("no modifica la lista que recibe", () => {
    const original = [...catalogo];
    aplicarCriterios(catalogo, leerCriterios({ orden: "precio-desc" }));
    expect(catalogo).toEqual(original);
  });
});

describe("hayFiltros", () => {
  it("distingue el catálogo sin filtrar de una búsqueda", () => {
    expect(hayFiltros(leerCriterios({}))).toBe(false);
    expect(hayFiltros(leerCriterios({ orden: "precio-asc", pagina: "2" }))).toBe(false);
    expect(hayFiltros(leerCriterios({ q: "nevera" }))).toBe(true);
    expect(hayFiltros(leerCriterios({ categoria: "hogar" }))).toBe(true);
  });
});

describe("leerCriterios · valores negativos", () => {
  it("un precio negativo invalida el filtro en vez de perder el signo", () => {
    // Antes se limpiaban los separadores quitando todo lo que no fuera dígito,
    // así que `-5000` se convertía en un filtro de 5000.
    expect(leerCriterios({ precioMin: "-5000" }).precioMin).toBeNull();
    expect(leerCriterios({ precioMax: "-1" }).precioMax).toBeNull();
  });

  it("sigue aceptando separadores de miles", () => {
    expect(leerCriterios({ precioMax: "1.500.000" }).precioMax).toBe(1500000);
  });
});
