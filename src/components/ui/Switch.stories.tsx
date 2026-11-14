import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Field } from "./Field";
import { Switch } from "./Switch";

const meta = { title: "Átomos/Switch", component: Switch, args: { label: "Aceita financiamento" } } satisfies Meta<
  typeof Switch
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Desligado: Story = {};
export const Ligado: Story = { args: { defaultChecked: true } };
export const Desabilitado: Story = { args: { disabled: true, defaultChecked: true } };
export const ComErro: Story = {
  name: "Com erro",
  render: () => (
    <div className="p-6">
      <Field label="Divulgação" error="Ative para publicar nos portais parceiros">
        <Switch label="Publicar nos portais parceiros" />
      </Field>
    </div>
  ),
};
export const ComErroLigado: Story = {
  name: "Com erro (ligado)",
  render: () => <Switch invalid defaultChecked label="Aceita financiamento" />,
};
export const TextoLongo: Story = {
  name: "Texto longo",
  decorators: [
    (S) => (
      <div className="max-w-xs p-6">
        <S />
      </div>
    ),
  ],
  args: { label: "Publicar automaticamente nos portais parceiros assim que a documentação for aprovada" },
};
