"use client";

import { useSyncExternalStore } from "react";

import { useAnnounce } from "@/components/a11y/announcer";
import { Button } from "@/components/ui/button";
import type { ProductoPublico } from "@/lib/productos/tipos";

/**
 * Añadir al carrito.
 *
 * Escribe en `localStorage` con la clave `cy_cart` y la misma forma de elemento
 * que usan `detalledelproducto.html` y `caritodecompras.html`. Es deliberado:
 * durante la migración conviven rutas nuevas y páginas heredadas, y el carrito
 * tiene que ser el mismo. Cuando el carrito se migre, este acoplamiento se
 * sustituye por el estado compartido de la aplicación nueva.
 *
 * El carrito se lee con `useSyncExternalStore` y no con un efecto: es un
 * almacén externo al árbol de React, y esta es la vía que resuelve la
 * hidratación —el servidor no puede saber qué hay en el navegador— sin
 * provocar renders en cascada.
 */

const CLAVE_CARRITO = "cy_cart";

/** Aviso de cambio dentro de la misma pestaña: `storage` solo llega a las demás. */
const EVENTO_CARRITO = "compraya:carrito";

interface ElementoCarrito {
  id: string;
  titulo: string;
  precio: number;
  imagen: string;
  qty: number;
  vendedor: string;
  vendedorId: string;
  telefono: string;
  ubicacion: string;
}

function leerCarrito(): ElementoCarrito[] {
  try {
    const bruto = window.localStorage.getItem(CLAVE_CARRITO);
    const analizado: unknown = bruto === null ? [] : JSON.parse(bruto);
    return Array.isArray(analizado) ? (analizado as ElementoCarrito[]) : [];
  } catch {
    // Modo privado, almacenamiento lleno o JSON corrupto de una versión
    // anterior: se trata como carrito vacío en lugar de romper la ficha.
    return [];
  }
}

function suscribir(alCambiar: () => void): () => void {
  window.addEventListener("storage", alCambiar);
  window.addEventListener(EVENTO_CARRITO, alCambiar);
  return () => {
    window.removeEventListener("storage", alCambiar);
    window.removeEventListener(EVENTO_CARRITO, alCambiar);
  };
}

export function BotonAnadirCarrito({ producto }: { producto: ProductoPublico }) {
  const anunciar = useAnnounce();

  const enCarrito = useSyncExternalStore(
    suscribir,
    // Devuelve un booleano, no un objeto nuevo: un valor inestable aquí
    // provocaría un bucle de renders.
    () => leerCarrito().some((elemento) => elemento.id === producto.id),
    // En el servidor y durante la hidratación no hay carrito que consultar.
    () => false,
  );

  if (producto.disponibilidad !== "disponible") {
    return (
      <p className="rounded-sm bg-surface-sunken px-4 py-3 font-semibold text-ink-soft">
        {producto.disponibilidad === "vendido"
          ? "Este producto ya se ha vendido."
          : "Este producto no está disponible ahora mismo."}
      </p>
    );
  }

  function anadir() {
    const carrito = leerCarrito();

    if (carrito.some((elemento) => elemento.id === producto.id)) {
      anunciar(`${producto.titulo} ya estaba en el carrito.`);
      return;
    }

    carrito.push({
      id: producto.id,
      titulo: producto.titulo,
      precio: producto.precio,
      imagen: producto.imagenes[0] ?? "",
      qty: 1,
      vendedor: producto.vendedor.nombre,
      vendedorId: producto.vendedor.id ?? "",
      telefono: producto.vendedor.telefono ?? "",
      ubicacion: producto.ubicacion,
    });

    try {
      window.localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
    } catch {
      anunciar(
        "No se ha podido guardar el carrito. Revisa los permisos de almacenamiento del navegador.",
        "assertive",
      );
      return;
    }

    window.dispatchEvent(new Event(EVENTO_CARRITO));
    anunciar(`${producto.titulo} añadido al carrito. ${carrito.length} artículos en total.`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={anadir} tamano="lg">
        {enCarrito ? "Añadir otra vez" : "Añadir al carrito"}
      </Button>

      {enCarrito ? (
        <a
          href="/caritodecompras.html"
          className="inline-flex items-center px-2 font-semibold text-brand-deep"
        >
          Ver el carrito
        </a>
      ) : null}
    </div>
  );
}
