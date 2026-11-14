import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Kbd } from "./Kbd";

const meta = { title: "Átomos/Kbd", component: Kbd, args: { children: "⌘K" } } satisfies Meta<typeof Kbd>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "Padrão" };

export const Combinacao: Story = {
  name: "Combinação",
  render: () => (
    <p className="flex items-center gap-1 p-6 text-sm text-text-muted">
      Buscar imóveis, leads e contratos: <Kbd>Ctrl</Kbd>+<Kbd>K</Kbd>
    </p>
  ),
};
