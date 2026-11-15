import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageSkeleton } from "./PageSkeleton";

const meta = {
  title: "Shell/PageSkeleton",
  component: PageSkeleton,
  decorators: [
    (Story) => (
      <main className="max-w-6xl p-6">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof PageSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Lista: Story = { args: { variante: "lista" } };
export const Painel: Story = { args: { variante: "painel" } };
export const Detalhe: Story = { args: { variante: "detalhe" } };
