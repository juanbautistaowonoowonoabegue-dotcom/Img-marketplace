import { readFile, writeFile } from "node:fs/promises";
import { minify } from "terser";

const targets = [
  "public/js/api.js",
  "public/js/config.js",
  "public/js/ia.js",
];

for (const path of targets) {
  const source = await readFile(path, "utf8");
  const result = await minify(source, {
    ecma: 2020,
    module: true,
    compress: {
      passes: 2,
      drop_console: false,
      drop_debugger: true,
    },
    mangle: {
      toplevel: false,
    },
    format: {
      comments: false,
    },
  });

  if (!result.code) {
    throw new Error(`No se pudo procesar ${path}`);
  }

  await writeFile(path, result.code, "utf8");
  console.log(`Ofuscado/minificado: ${path}`);
}

console.log("Completado: los archivos se sobrescribieron en su ruta original.");
