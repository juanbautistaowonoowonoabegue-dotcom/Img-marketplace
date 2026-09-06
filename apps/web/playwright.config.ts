import { defineConfig, devices } from "@playwright/test";

/**
 * Suite de accesibilidad. Corre contra el build de produccion, no contra el
 * servidor de desarrollo: la diferencia importa porque el HTML que ve el
 * usuario es el del build.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    // La mayoria del trafico es movil: el recorrido se verifica en ambos.
    { name: "movil", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
