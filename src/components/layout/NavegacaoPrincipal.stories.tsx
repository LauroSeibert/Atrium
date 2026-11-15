import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { NavegacaoPrincipal } from "./NavegacaoPrincipal";
import { NAV_PRINCIPAL } from "./navegacao";
import { comTooltips, CONTADORES } from "./historias-shell";

const meta = {
  title: "Shell/NavegacaoPrincipal",
  component: NavegacaoPrincipal,
  decorators: [
    comTooltips,
    (Story) => (
      <nav aria-label="Módulos" className="w-64 bg-bg-subtle p-3">
        <Story />
      </nav>
    ),
  ],
  args: { itens: NAV_PRINCIPAL, pathname: "/leads", contadores: CONTADORES, onNavegar: fn() },
  parameters: { nextjs: { navigation: { pathname: "/leads" } } },
} satisfies Meta<typeof NavegacaoPrincipal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Recolhida: Story = {
  decorators: [
    (Story) => (
      <div className="w-16">
        <Story />
      </div>
    ),
  ],
  args: { recolhida: true },
};
export const Toque: Story = {
  name: "Toque (44 px)",
  args: { tamanho: "toque" },
};
