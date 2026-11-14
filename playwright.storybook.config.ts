import { defineConfig, devices } from "@playwright/test";

const PORT = 6007;
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

/** Roda o axe em todas as histórias do Storybook já buildado (storybook-static), nos dois temas. */
export default defineConfig({
  testDir: "./e2e-stories",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never", outputFolder: "playwright-report-stories" }]]
    : "list",
  use: { baseURL: `http://localhost:${PORT}`, locale: "pt-BR", trace: "off" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions: { executablePath } } }],
  webServer: {
    command: `npx http-server storybook-static -p ${PORT} -s -c-1`,
    url: `http://localhost:${PORT}/index.json`,
    reuseExistingServer: !process.env.CI,
  },
});
