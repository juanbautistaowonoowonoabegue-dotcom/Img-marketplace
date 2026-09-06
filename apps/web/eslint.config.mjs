import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";
import jsxA11y from "eslint-plugin-jsx-a11y";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

/**
 * La accesibilidad no es una revisión manual: es una regla de linter que
 * rompe el build. `jsx-a11y` en modo estricto cubre en tiempo de escritura la
 * mayoría de los hallazgos de la auditoría — controles sin rol, imágenes sin
 * texto alternativo, manejadores de click sin equivalente de teclado.
 */
const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  jsxA11y.flatConfigs.strict,
  {
    rules: {
      // Los errores que la auditoría encontró ~300 veces en el código heredado.
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/label-has-associated-control": [
        "error",
        { assert: "either", depth: 3 },
      ],
      // `autoFocus` roba el foco y desorienta al lector de pantalla.
      "jsx-a11y/no-autofocus": "error",
      // Un tabIndex positivo rompe el orden natural de tabulación (2.4.3).
      "jsx-a11y/tabindex-no-positive": "error",

      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "playwright-report/**", "test-results/**"],
  },
];

export default config;
