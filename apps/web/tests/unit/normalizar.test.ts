import { describe, expect, it } from "vitest";

import { normalizarProducto } from "@/lib/productos/normalizar";

/**
 * Cada caso de aquí corresponde a una variante real encontrada en el código
 * heredado. La lista de campos alternativos salió de la función de render de
 * `detalledelproducto.html` y del objeto que `index-vendedor.html` escribe.
 */

describe("normalizarProducto · colección `productos` (actual)", () => {
  const documento = {
    titulo: "Teléfono Samsung A15",
    descripcion: "Con cargador y funda.",
    precio: 95000,
    categoria: "telefonos",
    subcategoria: "android",
    estado: "usado",
    status: "activo",
    vendido: false,
    telefono: "+240 222 000 000",
    ubicacion: "Malabo",
    imagen: "https://ejemplo.test/1.webp",
    imagenes: ["https://ejemplo.test/1.webp", "https://ejemplo.test/2.webp"],
    vendedorId: "uid-1",
    vendedorNombre: "Ana",
    vendedorFoto: "https://ejemplo.test/ana.webp",
    vistas: 12,
  };

  it("normaliza el documento completo", () => {
    const p = normalizarProducto("abc", "productos", documento);

    expect(p.titulo).toBe("Teléfono Samsung A15");
    expect(p.precio).toBe(95000);
    expect(p.disponibilidad).toBe("disponible");
    expect(p.ubicacion).toBe("Malabo");
    expect(p.vendedor.nombre).toBe("Ana");
    expect(p.vendedor.telefono).toBe("+240 222 000 000");
  });

  it("aquí `estado` es la condición del artículo, no el estado del anuncio", () => {
    const p = normalizarProducto("abc", "productos", documento);
    expect(p.condicion).toBe("usado");
    expect(p.disponibilidad).toBe("disponible"); // viene de `status`
  });

  it("no duplica la imagen que aparece en `imagen` y en `imagenes`", () => {
    const p = normalizarProducto("abc", "productos", documento);
    expect(p.imagenes).toEqual([
      "https://ejemplo.test/1.webp",
      "https://ejemplo.test/2.webp",
    ]);
  });
});

describe("normalizarProducto · colección `Producto` (heredada)", () => {
  it("aquí `estado` es el estado de moderación y no debe leerse como condición", () => {
    const p = normalizarProducto("xyz", "Producto", {
      Título: "Bicicleta de montaña",
      precio: "150000",
      estado: "aceptado",
      fechaPublicacion: new Date("2026-03-01T10:00:00Z"),
      visitas: 40,
    });

    expect(p.titulo).toBe("Bicicleta de montaña");
    expect(p.condicion).toBeNull();
    expect(p.disponibilidad).toBe("disponible");
  });

  it("lee el título del campo con mayúscula y acento", () => {
    const p = normalizarProducto("xyz", "Producto", { Título: "Nevera" });
    expect(p.titulo).toBe("Nevera");
  });
});

describe("normalizarProducto · disponibilidad", () => {
  it("`vendido: true` manda sobre cualquier otro campo", () => {
    const p = normalizarProducto("x", "productos", { vendido: true, status: "activo" });
    expect(p.disponibilidad).toBe("vendido");
  });

  it("trata pausado, rechazado y borrador como retirado", () => {
    for (const status of ["pausado", "rechazado", "borrador", "retirado"]) {
      expect(normalizarProducto("x", "productos", { status }).disponibilidad).toBe("retirado");
    }
  });

  it("un documento sin ningún campo de estado se considera disponible", () => {
    expect(normalizarProducto("x", "productos", {}).disponibilidad).toBe("disponible");
  });
});

describe("normalizarProducto · precios", () => {
  it("acepta el precio como cadena con separadores", () => {
    expect(normalizarProducto("x", "productos", { precio: "95.000 FCFA" }).precio).toBe(95000);
  });

  it("descarta un precio anterior que no sea mayor que el actual", () => {
    // Mostrarlo produciría un descuento del 0 % o negativo.
    const p = normalizarProducto("x", "productos", { precio: 100, precioAntiguo: 100 });
    expect(p.precioAnterior).toBeNull();
  });

  it("conserva el precio anterior cuando la rebaja es real", () => {
    const p = normalizarProducto("x", "productos", { precio: 80, precioAntiguo: 100 });
    expect(p.precioAnterior).toBe(100);
  });

  it("un precio ausente o ilegible queda en cero, no en NaN", () => {
    expect(normalizarProducto("x", "productos", {}).precio).toBe(0);
    expect(normalizarProducto("x", "productos", { precio: "gratis" }).precio).toBe(0);
  });
});

describe("normalizarProducto · imágenes", () => {
  it("descarta rutas relativas y cadenas vacías", () => {
    // `next/image` exige URL absolutas para los orígenes remotos declarados.
    const p = normalizarProducto("x", "productos", {
      imagenes: ["/local/foto.jpg", "", "  ", "https://ejemplo.test/ok.webp"],
    });
    expect(p.imagenes).toEqual(["https://ejemplo.test/ok.webp"]);
  });

  it("recoge también el campo heredado `imagenesGitHub`", () => {
    const p = normalizarProducto("x", "Producto", {
      imagenesGitHub: ["https://ejemplo.test/gh.webp"],
    });
    expect(p.imagenes).toEqual(["https://ejemplo.test/gh.webp"]);
  });

  it("devuelve una lista vacía si no hay ninguna imagen usable", () => {
    expect(normalizarProducto("x", "productos", {}).imagenes).toEqual([]);
  });
});

describe("normalizarProducto · fechas", () => {
  it("acepta un Timestamp de Firestore", () => {
    const timestamp = { toDate: () => new Date("2026-01-15T08:00:00Z") };
    const p = normalizarProducto("x", "productos", { createdAt: timestamp });
    expect(p.publicadoEn).toBe("2026-01-15T08:00:00.000Z");
  });

  it("ignora una fecha inválida en lugar de propagar un Invalid Date", () => {
    expect(normalizarProducto("x", "productos", { createdAt: "ayer" }).publicadoEn).toBeNull();
  });

  it("prefiere fechaPublicacion sobre createdAt", () => {
    const p = normalizarProducto("x", "Producto", {
      fechaPublicacion: new Date("2026-01-01T00:00:00Z"),
      createdAt: new Date("2026-06-01T00:00:00Z"),
    });
    expect(p.publicadoEn).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("normalizarProducto · contador de visitas", () => {
  it("suma `visitas` y `vistas`", () => {
    // El publicador crea `vistas: 0` y quien lo incrementa escribe `visitas`,
    // así que ninguno de los dos tiene el total por separado.
    const p = normalizarProducto("x", "productos", { vistas: 5, visitas: 20 });
    expect(p.visitas).toBe(25);
  });
});

describe("normalizarProducto · valores por defecto", () => {
  it("un documento vacío produce un producto renderizable", () => {
    // La ficha nunca debe romperse por un documento incompleto: la alternativa
    // es un error 500 en una página indexada.
    const p = normalizarProducto("x", "productos", {});

    expect(p.titulo).toBe("Producto sin título");
    expect(p.descripcion).toBe("");
    expect(p.categoria).toBe("otros");
    expect(p.ubicacion).toBe("Guinea Ecuatorial");
    expect(p.vendedor.nombre).toBe("Vendedor particular");
    expect(p.vendedor.id).toBeNull();
  });

  it("ignora campos presentes pero vacíos", () => {
    const p = normalizarProducto("x", "productos", { titulo: "   ", ubicacion: "" });
    expect(p.titulo).toBe("Producto sin título");
    expect(p.ubicacion).toBe("Guinea Ecuatorial");
  });
});
