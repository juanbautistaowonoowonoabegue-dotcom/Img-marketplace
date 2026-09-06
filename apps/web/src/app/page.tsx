import type { Metadata } from "next";

import { DemostracionFormulario } from "./demostracion-formulario";

export const metadata: Metadata = {
  title: "Base del proyecto",
  description:
    "Punto de partida de la migración: layout accesible, sistema de tokens y componentes verificados.",
};

/**
 * Página de arranque. No es la portada definitiva: existe para que la base
 * tenga contenido real sobre el que ejecutar axe en integración continua.
 * La sustituye la primera ruta migrada — ficha de producto, según el plan.
 */
export default function Page() {
  return (
    <>
      <h1 className="text-3xl font-extrabold">Base del proyecto</h1>

      <p className="mt-3 text-ink-soft">
        Punto de partida de la migración descrita en{" "}
        <code>docs/ARQUITECTURA.md</code>. El layout, los tokens y los
        componentes de esta página son los que heredan el resto de rutas.
      </p>

      <section aria-labelledby="titulo-garantias" className="mt-10">
        <h2 id="titulo-garantias" className="text-xl font-bold">
          Garantías de la base
        </h2>

        <ul className="mt-4 flex list-disc flex-col gap-2 ps-5 text-ink-soft">
          <li>Anillo de foco único, imposible de desactivar por hoja de estilo.</li>
          <li>Enlace de salto, landmarks y un solo h1 por ruta.</li>
          <li>Región de anuncios compartida para carrito, chat y avisos.</li>
          <li>Campos de formulario con etiqueta obligatoria en el tipo.</li>
          <li>axe ejecutándose en cada push sobre estas mismas rutas.</li>
        </ul>
      </section>

      <section aria-labelledby="titulo-formulario" className="mt-10 max-w-md">
        <h2 id="titulo-formulario" className="text-xl font-bold">
          Componentes en uso
        </h2>
        <p className="mt-2 text-ink-soft">
          El envío no persiste nada: comprueba la validación compartida y el
          anuncio del resultado.
        </p>

        <DemostracionFormulario />
      </section>
    </>
  );
}
