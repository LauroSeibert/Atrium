import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Mail, Search } from "lucide-react";
import { Field } from "./Field";
import { Input } from "./Input";

const meta = {
  title: "Átomos/Input",
  component: Input,
  args: { "aria-label": "Valor do aluguel" },
  argTypes: { size: { control: "inline-radio", options: ["md", "lg"] } },
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "Padrão", args: { placeholder: "Buscar por endereço" } };
export const Tamanhos: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-4 p-6">
      <Input aria-label="Médio" placeholder="md · 40 px" />
      <Input aria-label="Grande" size="lg" placeholder="lg · 44 px" />
    </div>
  ),
};
export const ComIcones: Story = {
  name: "Com ícones",
  render: () => (
    <div className="flex max-w-sm flex-col gap-4 p-6">
      <Input aria-label="Busca" leadingIcon={Search} placeholder="Buscar imóvel ou lead" />
      <Input aria-label="E-mail" trailingIcon={Mail} defaultValue="marina@exemplo.com.br" />
    </div>
  ),
};
export const PrefixoSufixo: Story = {
  name: "Prefixo e sufixo",
  render: () => (
    <div className="flex max-w-sm flex-col gap-4 p-6">
      <Input aria-label="Valor de venda" prefix="R$" defaultValue="850.000" inputMode="numeric" />
      <Input aria-label="Área útil" suffix="m²" defaultValue="112" inputMode="numeric" />
    </div>
  ),
};
export const Estados: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-4 p-6">
      <Input aria-label="Desabilitado" disabled defaultValue="Contrato assinado" />
      <Field label="Telefone" error="Informe DDD e número, ex.: (11) 91234-5678">
        <Input defaultValue="1234" />
      </Field>
    </div>
  ),
};
export const TextoLongo: Story = {
  name: "Texto longo",
  args: {
    defaultValue: "Cobertura duplex com terraço gourmet, piscina privativa e vista permanente para o Parque Ibirapuera",
  },
};
