import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,

  // El repositorio tiene otro package-lock.json en la raíz, para Capacitor y
  // Firebase. Sin esta línea, Next infiere esa raíz como la del workspace y
  // resuelve mal los ficheros de este paquete.
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },

  // Las imágenes de producto viven en Cloud Storage. `next/image` exige `alt`,
  // que es la mitad del hallazgo 1.1.1 de la auditoría resuelto por el compilador.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      // Los productos publicados antes de la migración guardan la URL de sus
      // fotos en raw.githubusercontent.com, porque `index-vendedor.html` las
      // sube contra la API de GitHub. Sin esta entrada, esos productos se ven
      // sin imagen. Se retira cuando esas fotos migren a Storage.
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/juanbautistaowonoowonoabegue-dotcom/**",
      },
    ],
  },

  typescript: {
    // Un error de tipos detiene el build. Nunca poner esto en true.
    ignoreBuildErrors: false,
  },

  // Next 16 retiró la integración de ESLint en el build: el linter se ejecuta
  // como paso propio (`npm run lint`), y en CI antes de llegar al build.
};

export default config;
