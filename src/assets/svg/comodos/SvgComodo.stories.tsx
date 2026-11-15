import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { COMODO_VARIANTES, SvgComodo } from "./SvgComodo";

const meta = {
  title: "Ilustrações/Cômodos",
  component: SvgComodo,
  args: { variant: "sala" },
  argTypes: { variant: { control: "select", options: COMODO_VARIANTES.map((v) => v.variante) } },
  decorators: [
    (Story, { name }) =>
      name === "Todas" ? (
        <Story />
      ) : (
        <div className="max-w-md p-6">
          <Story />
        </div>
      ),
  ],
} satisfies Meta<typeof SvgComodo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Todas: Story = {
  render: () => (
    <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
      {COMODO_VARIANTES.map(({ variante, rotulo }) => (
        <figure key={variante} className="rounded-lg border border-border bg-surface p-3">
          <SvgComodo variant={variante} />
          <figcaption className="mt-2 text-sm text-text-muted">{rotulo}</figcaption>
        </figure>
      ))}
    </div>
  ),
};

export const Sala: Story = { args: { variant: "sala" } };
export const Cozinha: Story = { args: { variant: "cozinha" } };
export const Quarto: Story = { args: { variant: "quarto" } };
export const Banheiro: Story = { args: { variant: "banheiro" } };
export const Varanda: Story = { args: { variant: "varanda" } };
export const Garagem: Story = { args: { variant: "garagem" } };
export const AreaGourmet: Story = { name: "Área gourmet", args: { variant: "areaGourmet" } };
export const Escritorio: Story = { name: "Escritório", args: { variant: "escritorio" } };
