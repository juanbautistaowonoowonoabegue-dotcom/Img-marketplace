"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Región de anuncios única para toda la aplicación (WCAG 2.2 · 4.1.3).
 *
 * En el código heredado había un solo `aria-live` en 33 páginas: añadir al
 * carrito, recibir un mensaje o mostrar un aviso no se anunciaba. Aquí las dos
 * regiones se montan una vez en el layout raíz y cualquier componente publica
 * en ellas con `useAnnounce()`.
 *
 * Las regiones existen en el DOM desde el primer render y vacías: un
 * `aria-live` que se inserta ya con contenido no lo anuncia.
 */

type Urgencia = "polite" | "assertive";

interface ContextoAnuncios {
  anunciar: (mensaje: string, urgencia?: Urgencia) => void;
}

const Contexto = createContext<ContextoAnuncios | null>(null);

export function ProveedorAnuncios({ children }: { children: ReactNode }) {
  const [cortes, setCortes] = useState("");
  const [avisos, setAvisos] = useState("");
  // Un mensaje idéntico al anterior no dispara un nuevo anuncio. Alternar un
  // espacio de ancho cero fuerza el cambio de contenido sin alterar el texto.
  const alternador = useRef(false);

  const anunciar = useCallback((mensaje: string, urgencia: Urgencia = "polite") => {
    alternador.current = !alternador.current;
    const texto = alternador.current ? `${mensaje}​` : mensaje;
    if (urgencia === "assertive") setCortes(texto);
    else setAvisos(texto);
  }, []);

  const valor = useMemo(() => ({ anunciar }), [anunciar]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="region-polite"
      >
        {avisos}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        data-testid="region-assertive"
      >
        {cortes}
      </div>
    </Contexto.Provider>
  );
}

export function useAnnounce(): ContextoAnuncios["anunciar"] {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error("useAnnounce debe usarse dentro de <ProveedorAnuncios>");
  }
  return contexto.anunciar;
}
