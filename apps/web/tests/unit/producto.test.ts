import { describe, expect, it } from "vitest";

import { esquemaProducto, esquemaProductoFormulario } from "@/lib/schemas/producto";

const base = {
  titulo: "Teléfono Samsung A15",
  descripcion: "En buen estado, con cargador.",
  precio: 95000,
  categoria: "telefonos",
  estado: "activo",
  imagenes: ["https://firebasestorage.googleapis.com/foto.webp"],
  vendedorId: "uid-vendedor",
};

describe("esquemaProducto", () => {
  it("acepta un producto completo", () => {
    const resultado = esquemaProducto.safeParse(base);
    expect(resultado.success).toBe(true);
  });

  it("aplica los valores por defecto de estado, descripción e imágenes", () => {
    const resultado = esquemaProducto.parse({
      titulo: base.titulo,
      precio: base.precio,
      categoria: base.categoria,
      vendedorId: base.vendedorId,
    });

    expect(resultado.estado).toBe("borrador");
    expect(resultado.descripcion).toBe("");
    expect(resultado.imagenes).toEqual([]);
  });

  it("rechaza precios con decimales: los FCFA no los tienen", () => {
    const resultado = esquemaProducto.safeParse({ ...base, precio: 95000.5 });
    expect(resultado.success).toBe(false);
  });

  it("rechaza precios negativos o cero", () => {
    expect(esquemaProducto.safeParse({ ...base, precio: 0 }).success).toBe(false);
    expect(esquemaProducto.safeParse({ ...base, precio: -100 }).success).toBe(false);
  });

  it("rechaza una categoría fuera de la lista", () => {
    const resultado = esquemaProducto.safeParse({ ...base, categoria: "criptomonedas" });
    expect(resultado.success).toBe(false);
  });

  it("limita el número de imágenes a ocho", () => {
    const nueve = Array.from(
      { length: 9 },
      (_, i) => `https://firebasestorage.googleapis.com/${i}.webp`,
    );
    expect(esquemaProducto.safeParse({ ...base, imagenes: nueve }).success).toBe(false);
  });

  it("recorta los espacios del título", () => {
    const resultado = esquemaProducto.parse({ ...base, titulo: "  Bicicleta  " });
    expect(resultado.titulo).toBe("Bicicleta");
  });

  it("devuelve mensajes en español, listos para mostrarse en el campo", () => {
    const resultado = esquemaProducto.safeParse({ ...base, titulo: "ab" });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toMatch(/al menos 3 caracteres/);
    }
  });
});

describe("esquemaProductoFormulario", () => {
  it("no admite vendedorId: lo asigna el servidor", () => {
    // Las reglas de Firestore comprueban que vendedorId == request.auth.uid,
    // así que un formulario que lo enviase sería, en el mejor caso, ignorado.
    expect("vendedorId" in esquemaProductoFormulario.shape).toBe(false);
  });
});
