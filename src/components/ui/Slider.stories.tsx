import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Field } from "./Field";
import { FaixaPreco, Slider } from "./Slider";

const meta = {
  title: "Átomos/Slider",
  component: Slider,
  args: { thumbLabels: ["Área"], defaultValue: [80], max: 300, step: 5 },
} satisfies Meta<typeof Slider>;
export default meta;
type Story = StoryObj<typeof meta>;
const wrap = [
  (S: () => React.JSX.Element) => (
    <div className="max-w-sm p-6">
      <S />
    </div>
  ),
];

export const Simples: Story = { args: { formatValue: (v: number) => `${v} m²` }, decorators: wrap };
export const Desabilitado: Story = { args: { disabled: true }, decorators: wrap };
export const FaixaDePreco: Story = {
  name: "Faixa de preço",
  render: () => (
    <div className="max-w-sm p-6">
      <Field label="Faixa de preço" description="Imóveis de R$ 200 mil a R$ 3 milhões.">
        <FaixaPreco min={200000} max={3000000} step={50000} defaultValue={[450000, 1200000]} />
      </Field>
    </div>
  ),
};
export const FaixaComErro: Story = {
  name: "Faixa com erro",
  render: () => (
    <div className="max-w-sm p-6">
      <Field label="Faixa de preço" error="A faixa precisa ter ao menos R$ 100 mil de diferença">
        <FaixaPreco
          min={200000}
          max={3000000}
          step={50000}
          defaultValue={[1000000, 1000000]}
          minStepsBetweenThumbs={0}
        />
      </Field>
    </div>
  ),
};
