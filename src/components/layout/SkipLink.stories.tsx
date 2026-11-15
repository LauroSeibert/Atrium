import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent } from "storybook/test";
import { SkipLink } from "./SkipLink";

const meta = {
  title: "Shell/SkipLink",
  component: SkipLink,
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
        <main id="conteudo" tabIndex={-1} className="pt-16 text-text outline-none">
          <h1 className="text-2xl font-semibold">Conteúdo principal</h1>
          <p className="text-text-muted">Pressione Tab para revelar o link.</p>
        </main>
      </div>
    ),
  ],
} satisfies Meta<typeof SkipLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Invisível até receber foco (WCAG 2.4.1). */
export const Oculto: Story = {};
export const Focado: Story = {
  play: async () => {
    await userEvent.tab();
  },
};
