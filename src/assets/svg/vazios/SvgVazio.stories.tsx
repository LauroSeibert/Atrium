import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SvgVazio, VAZIO_VARIANTES } from "./SvgVazio";

const meta = {
  title: "Ilustrações/Estados vazios",
  component: SvgVazio,
  args: { variant: "semResultados" },
  argTypes: { variant: { control: "select", options: VAZIO_VARIANTES.map((v) => v.variant) } },
} satisfies Meta<typeof SvgVazio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  name: "Padrão",
  render: (args) => (
    <div className="max-w-xs">
      <SvgVazio {...args} />
    </div>
  ),
};

export const Todos: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {VAZIO_VARIANTES.map(({ variant, rotulo }) => (
        <figure key={variant} className="rounded-lg border border-border bg-surface p-3">
          <SvgVazio variant={variant} />
          <figcaption className="mt-2 text-sm text-text-muted">{rotulo}</figcaption>
        </figure>
      ))}
    </div>
  ),
};
