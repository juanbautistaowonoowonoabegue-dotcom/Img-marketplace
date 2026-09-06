import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ProveedorAnuncios, useAnnounce } from "@/components/a11y/announcer";

function Disparador() {
  const anunciar = useAnnounce();
  return (
    <>
      <button type="button" onClick={() => anunciar("Producto añadido al carrito")}>
        Añadir
      </button>
      <button type="button" onClick={() => anunciar("Se ha perdido la conexión", "assertive")}>
        Fallar
      </button>
    </>
  );
}

describe("ProveedorAnuncios", () => {
  it("monta las dos regiones vacías desde el primer render", () => {
    // Una región aria-live que aparece ya con contenido no se anuncia: tiene
    // que existir vacía y cambiar después.
    render(
      <ProveedorAnuncios>
        <span />
      </ProveedorAnuncios>,
    );

    expect(screen.getByTestId("region-polite")).toBeEmptyDOMElement();
    expect(screen.getByTestId("region-assertive")).toBeEmptyDOMElement();
  });

  it("expone la región cortés con role=status y aria-live=polite", () => {
    render(
      <ProveedorAnuncios>
        <span />
      </ProveedorAnuncios>,
    );

    const region = screen.getByTestId("region-polite");
    expect(region).toHaveAttribute("role", "status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
  });

  it("publica los avisos normales en la región cortés", async () => {
    const usuario = userEvent.setup();
    render(
      <ProveedorAnuncios>
        <Disparador />
      </ProveedorAnuncios>,
    );

    await usuario.click(screen.getByRole("button", { name: "Añadir" }));

    expect(screen.getByTestId("region-polite")).toHaveTextContent(
      "Producto añadido al carrito",
    );
    expect(screen.getByTestId("region-assertive")).toBeEmptyDOMElement();
  });

  it("reserva la región asertiva para lo que interrumpe", async () => {
    const usuario = userEvent.setup();
    render(
      <ProveedorAnuncios>
        <Disparador />
      </ProveedorAnuncios>,
    );

    await usuario.click(screen.getByRole("button", { name: "Fallar" }));

    expect(screen.getByTestId("region-assertive")).toHaveTextContent(
      "Se ha perdido la conexión",
    );
  });

  it("vuelve a anunciar un mensaje idéntico consecutivo", async () => {
    // Sin el alternador, añadir dos veces el mismo producto solo se anunciaría
    // la primera vez: el contenido de la región no cambia y nada lo dispara.
    const usuario = userEvent.setup();
    render(
      <ProveedorAnuncios>
        <Disparador />
      </ProveedorAnuncios>,
    );

    const boton = screen.getByRole("button", { name: "Añadir" });
    await usuario.click(boton);
    const primero = screen.getByTestId("region-polite").textContent;

    await usuario.click(boton);
    const segundo = screen.getByTestId("region-polite").textContent;

    expect(segundo).not.toBe(primero);
    expect(screen.getByTestId("region-polite")).toHaveTextContent(
      "Producto añadido al carrito",
    );
  });

  it("falla de forma explícita si se usa fuera del proveedor", () => {
    expect(() => render(<Disparador />)).toThrow(/dentro de <ProveedorAnuncios>/);
  });
});
