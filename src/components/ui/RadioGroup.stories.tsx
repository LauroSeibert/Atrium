import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Field } from "./Field";
import { RadioGroup, RadioGroupItem } from "./RadioGroup";

const meta = { title: "Átomos/RadioGroup", component: RadioGroup } satisfies Meta<typeof RadioGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  name: "Padrão",
  render: () => (
    <div className="p-6">
      <Field label="Finalidade">
        <RadioGroup defaultValue="venda">
          <RadioGroupItem value="venda" label="Venda" />
          <RadioGroupItem value="locacao" label="Locação" />
          <RadioGroupItem value="temporada" label="Temporada" disabled />
        </RadioGroup>
      </Field>
    </div>
  ),
};
export const Desabilitado: Story = {
  render: () => (
    <div className="p-6">
      <Field label="Finalidade">
        <RadioGroup defaultValue="venda" disabled>
          <RadioGroupItem value="venda" label="Venda" />
          <RadioGroupItem value="locacao" label="Locação" />
        </RadioGroup>
      </Field>
    </div>
  ),
};
export const ComErroMarcado: Story = {
  name: "Com erro (opção marcada)",
  render: () => (
    <div className="p-6">
      <Field label="Tipo de contrato" error="Contrato aberto exige comissão compartilhada">
        <RadioGroup defaultValue="aberto">
          <RadioGroupItem value="exclusivo" label="Exclusivo" />
          <RadioGroupItem value="aberto" label="Aberto" />
        </RadioGroup>
      </Field>
    </div>
  ),
};
export const ComErro: Story = {
  name: "Com erro",
  render: () => (
    <div className="max-w-xs p-6">
      <Field label="Tipo de contrato" error="Escolha o tipo de contrato">
        <RadioGroup>
          <RadioGroupItem value="exclusivo" label="Exclusivo" />
          <RadioGroupItem value="aberto" label="Aberto, com comissão compartilhada entre as imobiliárias parceiras" />
        </RadioGroup>
      </Field>
    </div>
  ),
};
