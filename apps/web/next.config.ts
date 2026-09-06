import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,

  // Las imágenes de producto viven en Cloud Storage. `next/image` exige `alt`,
  // que es la mitad del hallazgo 1.1.1 de la auditoría resuelto por el compilador.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },

  typescript: {
    // Un error de tipos detiene el build. Nunca poner esto en true.
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default config;
