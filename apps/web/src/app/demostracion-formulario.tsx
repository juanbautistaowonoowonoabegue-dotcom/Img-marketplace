"use client";

import { useState, type FormEvent } from "react";

import { useAnnounce } from "@/components/a11y/announcer";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { esquemaProductoFormulario } from "@/lib/schemas/producto";

/**
 * Muestra el circuito completo: validación con el esquema compartido, error
 * asociado al campo y resultado anunciado en la región en vivo.
 *
 * Al fallar, el foco vuelve al primer campo con error (WCAG 2.2 · 3.3.1): sin
 * eso, quien navega con lector de pantalla no sabe que el envío se ha
 * rechazado ni dónde está el problema.
 */
export function DemostracionFormulario() {
  const anunciar = useAnnounce();
  const [errores, setErrores] = useState<Record<string, string>>({});

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);

    const resultado = esquemaProductoFormulario
      .pick({ titulo: true, precio: true })
      .safeParse({
        titulo: datos.get("titulo"),
        precio: Number(datos.get("precio")),
      });

    if (!resultado.success) {
      const mapa: Record<string, string> = {};
      for (const incidencia of resultado.error.issues) {
        const campo = String(incidencia.path[0]);
        mapa[campo] ??= incidencia.message;
      }
      setErrores(mapa);

      const total = Object.keys(mapa).length;
      anunciar(
        `El formulario tiene ${total} ${total === 1 ? "error" : "errores"}. Revisa los campos marcados.`,
        "assertive",
      );

      const primero = Object.keys(mapa)[0];
      if (primero) {
        evento.currentTarget.querySelector<HTMLInputElement>(`[name="${primero}"]`)?.focus();
      }
      return;
    }

    setErrores({});
    anunciar(`Producto "${resultado.data.titulo}" validado correctamente.`);
  }

  return (
    <form onSubmit={enviar} noValidate className="mt-6 flex flex-col gap-5">
      <TextField
        name="titulo"
        etiqueta="Título del producto"
        descripcion="Entre 3 y 120 caracteres."
        error={errores.titulo}
      />

      {/* `type="text"` con `inputMode="numeric"` y no `type="number"`: el campo
          numérico nativo cambia de valor con la rueda del ratón, se lee mal en
          varios lectores de pantalla y rechaza en silencio lo que se pega. El
          teclado móvil sigue siendo el numérico. */}
      <TextField
        name="precio"
        inputMode="numeric"
        etiqueta="Precio en FCFA"
        descripcion="Número entero, sin decimales ni separadores."
        error={errores.precio}
      />

      <Button type="submit" className="self-start">
        Validar producto
      </Button>
    </form>
  );
}
