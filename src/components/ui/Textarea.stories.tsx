import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Field } from "./Field";
import { Textarea } from "./Textarea";

const meta = { title: "Átomos/Textarea", component: Textarea, args: { "aria-label": "Descrição" } } satisfies Meta<
  typeof Textarea
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  name: "Padrão",
  args: { placeholder: "Descreva o imóvel" },
  decorators: [
    (S) => (
      <div className="max-w-md p-6">
        <S />
      </div>
    ),
  ],
};
export const ComContador: Story = {
  name: "Com contador",
  render: () => (
    <div className="max-w-md p-6">
      <Field label="Descrição do anúncio" description="Aparece nos portais.">
        <Textarea
          maxLength={300}
          showCounter
          defaultValue="Apartamento reformado, 3 quartos, varanda gourmet e 2 vagas."
        />
      </Field>
    </div>
  ),
};
export const ComErro: Story = {
  name: "Com erro",
  render: () => (
    <div className="max-w-md p-6">
      <Field label="Motivo do cancelamento" error="Explique o motivo com pelo menos 20 caracteres">
        <Textarea defaultValue="Desistiu" />
      </Field>
    </div>
  ),
};
export const Desabilitado: Story = {
  args: { disabled: true, defaultValue: "Texto bloqueado após assinatura do contrato." },
  decorators: [
    (S) => (
      <div className="max-w-md p-6">
        <S />
      </div>
    ),
  ],
};
