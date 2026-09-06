import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Producto no encontrado",
  robots: { index: false, follow: true },
};

export default function NoEncontrado() {
  return (
    <>
      <h1 className="text-3xl font-extrabold">No encontramos ese producto</h1>
      <p className="mt-3 text-ink-soft">
        Puede que se haya retirado o que el enlace esté incompleto.
      </p>
      <p className="mt-6">
        <Link href="/" className="inline-flex items-center font-semibold text-brand-deep">
          Volver al inicio
        </Link>
      </p>
    </>
  );
}
