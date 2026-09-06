import next from "eslint-config-next/core-web-vitals";
import jsxA11y from "eslint-plugin-jsx-a11y";

/**
 * La accesibilidad no es una revisión manual: es una regla de linter que rompe
 * el build. `jsx-a11y` cubre en tiempo de escritura la mayoría de los hallazgos
 * de la auditoría — controles sin rol, imágenes sin texto alternativo,
 * manejadores de click sin equivalente de teclado.
 *
 * `eslint-config-next/core-web-vitals` ya trae configuración plana nativa e
 * incluye `next/typescript`. De ahí las dos particularidades de este fichero:
 * de jsx-a11y se toman solo las reglas (el plugin ya está registrado, y
 * redefinirlo aborta la configuración), y las reglas de `@typescript-eslint`
 * van en un bloque limitado a ficheros TypeScript, que es donde Next registra
 * ese plugin.
 */
const config = [
  ...next,

  {
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,

      // Los errores que la auditoría encontró unas 300 veces en el código heredado.
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/label-has-associated-control": ["error", { assert: "either", depth: 3 }],
      // `autoFocus` roba el foco y desorienta al lector de pantalla.
      "jsx-a11y/no-autofocus": "error",
      // Un tabIndex positivo rompe el orden natural de tabulación (2.4.3).
      "jsx-a11y/tabindex-no-positive": "error",

      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },

  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
];

export default config;
