import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Progress } from "./Progress";

const meta = {
  title: "Átomos/Progress",
  component: Progress,
  args: { value: 45, label: "Parcelas pagas" },
  argTypes: { tone: { control: "inline-radio", options: ["primary", "success", "warning", "danger"] } },
  decorators: [
    (Story) => (
      <div className="w-80 p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "Padrão" };

export const Tons: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4 p-6">
      <Progress value={45} label="Parcelas pagas (18 de 40)" />
      <Progress tone="success" value={100} label="Documentação completa" />
      <Progress tone="warning" value={70} label="Meta de visitas do mês" />
      <Progress tone="danger" value={15} label="Parcelas em atraso" />
    </div>
  ),
};

export const SemValor: Story = { args: { hideValue: true, value: 30 } };

export const TextoLongo: Story = {
  name: "Rótulo longo (caso extremo)",
  args: {
    label: "Preenchimento do cadastro do imóvel: fotos, documentos, matrícula e dados do proprietário",
    value: 62,
  },
};
