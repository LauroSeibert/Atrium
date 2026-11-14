import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Pencil } from "lucide-react";
import { Button } from "./Button";
import { Tooltip, TooltipProvider } from "./Tooltip";

const meta = {
  title: "Átomos/Tooltip",
  component: Tooltip,
  args: { content: "Editar imóvel", children: <span /> },
  // Em produção o TooltipProvider fica uma única vez no layout da aplicação.
  decorators: [
    (S) => (
      <TooltipProvider>
        <S />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  name: "Padrão",
  render: (args) => (
    <div className="flex justify-center p-16">
      <Tooltip {...args} defaultOpen>
        <Button variant="ghost" icon={Pencil} aria-label="Editar imóvel" />
      </Tooltip>
    </div>
  ),
};

export const Lados: Story = {
  render: () => (
    <div className="flex flex-wrap justify-center gap-16 p-24">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip key={side} side={side} content={`Lado: ${side}`} defaultOpen>
          <Button variant="secondary">{side}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const TextoLongo: Story = {
  name: "Texto longo",
  render: () => (
    <div className="flex justify-center p-24">
      <Tooltip
        defaultOpen
        content="Cobertura 3 quartos, 2 vagas, vista para o mar, condomínio com piscina aquecida e salão de festas"
      >
        <Button variant="secondary">Cobertura Vista Mar, Barra da Tijuca</Button>
      </Tooltip>
    </div>
  ),
};
