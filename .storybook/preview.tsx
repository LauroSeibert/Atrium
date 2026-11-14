import type { Preview } from "@storybook/nextjs-vite";
import { withThemeByClassName } from "@storybook/addon-themes";
import { inter } from "../src/styles/fonts";
import "../src/styles/globals.css";

// Os tokens resolvem --font-inter no :root; a classe precisa estar no <html>, como no app.
document.documentElement.classList.add(inter.variable);

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    nextjs: { appDirectory: true },
  },
  decorators: [
    withThemeByClassName({ themes: { Claro: "light", Escuro: "dark" }, defaultTheme: "Claro" }),
    (Story) => (
      <div className="min-h-dvh bg-bg font-sans text-text">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
};

export default preview;
