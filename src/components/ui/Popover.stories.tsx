import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./Button";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

const meta = { title: "Átomos/Popover", component: Popover } satisfies Meta<typeof Popover>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  name: "Padrão",
  render: () => (
    <div className="p-8">
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="secondary">Resumo do lead</Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <p className="font-medium">Marina Albuquerque</p>
          <p className="text-text-muted">Interesse: apartamento 2 quartos em Pinheiros, até R$ 850.000.</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

export const ComBotaoFechar: Story = {
  name: "Com botão Fechar",
  render: () => (
    <div className="p-8">
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="secondary">Condições do contrato</Button>
        </PopoverTrigger>
        <PopoverContent align="start" showClose>
          <p className="pr-8 font-medium">Contrato CT-2026-0012</p>
          <p className="text-text-muted">
            Locação residencial de 30 meses, reajuste anual pelo IGP-M, caução de três aluguéis (R$ 14.400,00) e multa
            proporcional por rescisão antecipada.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};
