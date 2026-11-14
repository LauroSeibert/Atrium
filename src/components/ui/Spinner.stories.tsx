import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Spinner } from "./Spinner";

const meta = { title: "Átomos/Spinner", component: Spinner } satisfies Meta<typeof Spinner>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "Padrão", args: { label: "Carregando imóveis" } };
export const Tamanhos: Story = {
  render: () => (
    <div className="flex items-center gap-4 p-6 text-primary">
      <Spinner size={16} label="Carregando (pequeno)" />
      <Spinner size={20} label="Carregando (médio)" />
      <Spinner size={24} label="Carregando (grande)" />
    </div>
  ),
};
export const ComTexto: Story = {
  name: "Ao lado de texto",
  render: () => (
    <p className="flex items-center gap-2 p-6 text-sm text-text-muted">
      <Spinner size={16} /> Buscando leads da última semana…
    </p>
  ),
};
