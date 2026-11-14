import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StatusDot } from "./StatusDot";

const meta = {
  title: "Átomos/StatusDot",
  component: StatusDot,
  args: { tone: "success", children: "Disponível" },
} satisfies Meta<typeof StatusDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "Padrão" };

export const Todos: Story = {
  name: "Status do imóvel",
  render: () => (
    <div className="flex flex-col gap-2 p-6">
      <StatusDot tone="success">Disponível</StatusDot>
      <StatusDot tone="warning">Reservado</StatusDot>
      <StatusDot tone="primary">Vendido</StatusDot>
      <StatusDot tone="info">Alugado</StatusDot>
      <StatusDot tone="neutral">Inativo</StatusDot>
      <StatusDot tone="danger">Parcela atrasada</StatusDot>
    </div>
  ),
};

export const TextoLongo: Story = {
  name: "Texto longo (caso extremo)",
  render: () => (
    <div className="w-56 p-6">
      <StatusDot tone="warning">Reservado até a conclusão da análise de crédito do comprador</StatusDot>
    </div>
  ),
};
