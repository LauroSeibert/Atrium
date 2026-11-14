import type { Decorator, Preview } from "@storybook/nextjs-vite";
import { ThemeProvider } from "next-themes";
import { inter } from "../src/styles/fonts";
import "../src/styles/globals.css";

// Os tokens resolvem --font-inter no :root; a classe precisa estar no <html>, como no app.
document.documentElement.classList.add(inter.variable);

/** Um único dono do tema: next-themes, forçado pelo seletor da barra do Storybook. */
const withTheme: Decorator = (Story, context) => (
  <ThemeProvider attribute="class" forcedTheme={context.globals.theme as string} enableSystem={false}>
    <div className="min-h-dvh bg-bg font-sans text-text">
      <Story />
    </div>
  </ThemeProvider>
);

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Tema",
      toolbar: {
        title: "Tema",
        icon: "mirror",
        items: [
          { value: "light", title: "Claro" },
          { value: "dark", title: "Escuro" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "light" },
  parameters: {
    layout: "fullscreen",
    // Painel de acessibilidade mostra violações; a verificação automatizada é o axe no Playwright (Fase 4 adiciona o test-runner).
    a11y: { test: "todo" },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    nextjs: { appDirectory: true },
  },
  decorators: [withTheme],
  tags: ["autodocs"],
};

export default preview;
