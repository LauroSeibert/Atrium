import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FACHADA_VARIANTES, SvgFachada } from "./SvgFachada";

const meta = {
  title: "Ilustrações/Fachadas",
  component: SvgFachada,
  args: { variant: "terrea" },
  argTypes: {
    variant: { control: "select", options: FACHADA_VARIANTES.map((v) => v.variante) },
  },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SvgFachada>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Todas: Story = {
  render: () => (
    <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
      {FACHADA_VARIANTES.map(({ variante, rotulo }) => (
        <figure key={variante} className="m-0 rounded-lg border border-border bg-surface p-3">
          <SvgFachada variant={variante} decorativa />
          <figcaption className="mt-2 text-sm text-text-muted">{rotulo}</figcaption>
        </figure>
      ))}
    </div>
  ),
  decorators: [(Story) => <Story />],
};

export const Terrea: Story = { name: "Casa térrea", args: { variant: "terrea" } };
export const Sobrado: Story = { args: { variant: "sobrado" } };
export const Moderna: Story = { name: "Casa moderna", args: { variant: "moderna" } };
export const Predio: Story = { name: "Prédio", args: { variant: "predio" } };
export const Cobertura: Story = { args: { variant: "cobertura" } };
export const Campo: Story = { name: "Casa de campo", args: { variant: "campo" } };
export const Comercial: Story = { name: "Sala comercial", args: { variant: "comercial" } };
export const Terreno: Story = { args: { variant: "terreno" } };
