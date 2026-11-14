import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Combobox } from "./Combobox";
import { Field } from "./Field";

const bairros = [
  "Pinheiros",
  "Vila Madalena",
  "Moema",
  "Itaim Bibi",
  "Perdizes",
  "Jardim Paulista",
  "Brooklin",
  "Tatuapé",
  "Santana",
  "Lapa",
  "Higienópolis",
  "Vila Mariana",
  "Butantã",
  "Consolação",
  "Campo Belo",
].map((nome) => ({ value: nome.toLowerCase().replace(/\s+/g, "-"), label: nome }));

const meta = {
  title: "Átomos/Combobox",
  component: Combobox,
  args: { options: bairros, "aria-label": "Bairro" },
} satisfies Meta<typeof Combobox>;
export default meta;
type Story = StoryObj<typeof meta>;
const wrap = [
  (S: () => React.JSX.Element) => (
    <div className="max-w-xs p-6">
      <S />
    </div>
  ),
];

export const Padrao: Story = { name: "Padrão", args: { placeholder: "Selecione o bairro" }, decorators: wrap };
export const ComValor: Story = { name: "Com valor", args: { defaultValue: "moema" }, decorators: wrap };
export const Desabilitado: Story = { args: { disabled: true }, decorators: wrap };
export const ComItemDesabilitado: Story = {
  name: "Com item desabilitado",
  args: { options: [...bairros.slice(0, 3), { value: "morumbi", label: "Morumbi (sem cobertura)", disabled: true }] },
  decorators: wrap,
};
export const ComErro: Story = {
  name: "Com erro",
  render: () => (
    <div className="max-w-xs p-6">
      <Field label="Bairro" error="Selecione o bairro do imóvel">
        <Combobox options={bairros} placeholder="Selecione o bairro" />
      </Field>
    </div>
  ),
};
export const TextoLongo: Story = {
  name: "Texto longo",
  args: {
    options: [{ value: "x", label: "Jardim Europa — loteamento fechado com acesso controlado e área verde" }],
    defaultValue: "x",
  },
  decorators: wrap,
};
