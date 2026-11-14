import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ColorsReference } from "./ColorsReference";

const meta = {
  title: "Design system/Cores",
  component: ColorsReference,
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
  tags: ["!autodocs"],
} satisfies Meta<typeof ColorsReference>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A mesma página da rota /design-system/colors. Use o seletor de tema da barra do Storybook. */
export const Cores: Story = {};
