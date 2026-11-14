import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Field } from "./Field";
import { Select } from "./Select";

const tipos = [
  { value: "apartamento", label: "Apartamento" },
  { value: "casa", label: "Casa" },
  { value: "cobertura", label: "Cobertura" },
  { value: "terreno", label: "Terreno", disabled: true },
];

const meta = {
  title: "Átomos/Select",
  component: Select,
  args: { options: tipos, "aria-label": "Tipo de imóvel" },
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;
const wrap = [
  (S: () => React.JSX.Element) => (
    <div className="max-w-xs p-6">
      <S />
    </div>
  ),
];

export const Padrao: Story = { name: "Padrão", args: { placeholder: "Tipo de imóvel" }, decorators: wrap };
export const ComValor: Story = { name: "Com valor", args: { defaultValue: "casa" }, decorators: wrap };
export const Grupos: Story = {
  args: {
    options: [
      {
        label: "Residencial",
        options: [
          { value: "apartamento", label: "Apartamento" },
          { value: "casa", label: "Casa" },
        ],
      },
      {
        label: "Comercial",
        options: [
          { value: "sala", label: "Sala comercial" },
          { value: "galpao", label: "Galpão", disabled: true },
        ],
      },
    ],
  },
  decorators: wrap,
};
export const Desabilitado: Story = { args: { disabled: true, defaultValue: "casa" }, decorators: wrap };
export const ComErro: Story = {
  name: "Com erro",
  render: () => (
    <div className="max-w-xs p-6">
      <Field label="Tipo de imóvel" error="Selecione o tipo do imóvel">
        <Select options={tipos} />
      </Field>
    </div>
  ),
};
export const TextoLongo: Story = {
  name: "Texto longo",
  args: {
    options: [{ value: "x", label: "Apartamento duplex com cobertura e terraço descoberto em condomínio fechado" }],
    defaultValue: "x",
  },
  decorators: wrap,
};
