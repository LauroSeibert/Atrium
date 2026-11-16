import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
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

export const ComFinanceiroAberto: Story = {
  name: "Financeiro aberto (rota dentro)",
  args: { pathname: "/financeiro/receitas" },
};

export const FinanceiroExpande: Story = {
  name: "Financeiro expande no lugar",
  play: async ({ canvasElement }) => {
    const botao = within(canvasElement).getByRole("button", { name: "Financeiro" });
    await expect(botao).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(botao);
    await expect(botao).toHaveAttribute("aria-expanded", "true");
    await expect(within(canvasElement).getByRole("link", { name: "Repasses" })).toBeVisible();
  },
};

export const RecolhidaComPainelAberto: Story = {
  name: "Recolhida com painel do Financeiro aberto",
  decorators: Recolhida.decorators,
  args: { recolhida: true, pathname: "/financeiro/despesas" },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Financeiro" }));
    const painel = await screen.findByRole("dialog", { name: "Financeiro" });
    await expect(within(painel).getByRole("link", { name: "Despesas" })).toHaveAttribute("aria-current", "page");
  },
};

export const PainelFechaComEsc: Story = {
  name: "Painel fecha com Esc e devolve o foco",
  decorators: Recolhida.decorators,
  args: { recolhida: true },
  play: async ({ canvasElement }) => {
    const gatilho = within(canvasElement).getByRole("button", { name: "Financeiro" });
    await userEvent.click(gatilho);
    await screen.findByRole("dialog", { name: "Financeiro" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(gatilho).toHaveFocus();
  },
};

export const GruposRecolhiveis: Story = {
  name: "Grupos recolhíveis (toque)",
  args: { tamanho: "toque", gruposRecolhiveis: true, pathname: "/imoveis" },
};
