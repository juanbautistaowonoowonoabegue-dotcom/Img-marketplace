/**
 * Enlace de salto al contenido principal (WCAG 2.2 · 2.4.1).
 *
 * Primer elemento enfocable del documento. Invisible hasta recibir foco, y
 * entonces visible con el mismo anillo que el resto de la aplicación.
 */
export function SkipLink({ href = "#contenido" }: { href?: string }) {
  return (
    <a
      href={href}
      className="sr-only-focusable absolute start-4 top-4 z-50 inline-flex items-center rounded-xs bg-brand-deep px-4 py-3 font-semibold text-white"
    >
      Saltar al contenido principal
    </a>
  );
}
