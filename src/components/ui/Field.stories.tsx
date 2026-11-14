import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Field } from "./Field";
import { Input } from "./Input";

const meta = {
  title: "Átomos/Field",
  component: Field,
  args: { label: "Título do anúncio", children: null },
} satisfies Meta<typeof Field>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  name: "Padrão",
  render: (args) => (
    <div className="max-w-sm p-6">
      <Field {...args}>
        <Input placeholder="Ex.: Apartamento 3 quartos em Pinheiros" />
      </Field>
    </div>
  ),
};

export const ComDescricao: Story = {
  name: "Com descrição e obrigatório",
  render: () => (
    <div className="max-w-sm p-6">
      <Field label="Código do imóvel" requirement="required" description="Usado em contratos e na vitrine do site.">
        <Input defaultValue="AP-1042" />
      </Field>
    </div>
  ),
};

export const ComErro: Story = {
  name: "Com erro",
  render: () => (
    <div className="max-w-sm p-6">
      <Field label="CPF do proprietário" error="CPF deve ter 11 dígitos">
        <Input defaultValue="123.456" />
      </Field>
    </div>
  ),
};

export const RenderProp: Story = {
  name: "Render prop",
  render: () => (
    <div className="max-w-sm p-6">
      <Field label="Observação do corretor" requirement="optional" description="Visível só para a equipe.">
        {(control) => (
          <input {...control} className="h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm" />
        )}
      </Field>
    </div>
  ),
};

export const TextoLongo: Story = {
  name: "Texto longo",
  render: () => (
    <div className="max-w-xs p-6">
      <Field
        label="Condições especiais de pagamento negociadas com o proprietário para financiamento bancário"
        error="O valor de entrada informado excede o limite previsto no contrato de exclusividade assinado em janeiro"
      >
        <Input defaultValue="R$ 1.250.000" />
      </Field>
    </div>
  ),
};
