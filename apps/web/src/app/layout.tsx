import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Syne } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";

import { ProveedorAnuncios } from "@/components/a11y/announcer";
import { SkipLink } from "@/components/a11y/skip-link";

import "./globals.css";

/**
 * Las fuentes se sirven desde el propio dominio en lugar de fonts.googleapis.com:
 * elimina una conexión de terceros, evita el salto de maquetación al cargar y
 * quita dos orígenes de la Content-Security-Policy.
 */
const cuerpo = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body-loaded",
  display: "swap",
});

const titulos = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Compra Ya — El mercado digital de Guinea Ecuatorial",
    template: "%s · Compra Ya",
  },
  description:
    "Compra, vende y accede a servicios en Guinea Ecuatorial. Teléfonos, moda, hogar, vehículos y más.",
};

export const viewport: Viewport = {
  themeColor: "#0b1f3b",
  // Sin `maximumScale`: limitar el zoom incumple WCAG 2.2 · 1.4.4.
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${cuerpo.variable} ${titulos.variable}`}>
      <body className="bg-surface text-ink">
        <ProveedorAnuncios>
          <SkipLink />

          <header className="border-b border-border">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
              <Link
                href="/"
                className="font-display text-xl font-extrabold text-brand-deep"
              >
                Compra Ya
              </Link>

              {/* `aria-label` distingue esta navegación de cualquier otra de la
                  página, requisito cuando hay más de un landmark del mismo tipo. */}
              <nav aria-label="Principal">
                <ul className="flex list-none items-center gap-2 p-0">
                  <li>
                    <Link href="/" className="inline-flex items-center px-3 py-2">
                      Inicio
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </header>

          {/* Destino del enlace de salto. `tabIndex={-1}` permite que reciba el
              foco al saltar sin entrar en el orden de tabulación. */}
          <main id="contenido" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-10">
            {children}
          </main>

          <footer className="border-t border-border px-4 py-8 text-sm text-ink-soft">
            <div className="mx-auto max-w-6xl">
              Compra Ya · Malabo y Bata, Guinea Ecuatorial
            </div>
          </footer>
        </ProveedorAnuncios>
      </body>
    </html>
  );
}
