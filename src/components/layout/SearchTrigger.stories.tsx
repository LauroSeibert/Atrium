import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { emMain } from "./historias-shell";
import { SearchTrigger } from "./SearchTrigger";

const meta = {
  title: "Shell/SearchTrigger",
  component: SearchTrigger,
  decorators: [emMain("p-6")],
  args: { onAbrir: fn() },
} satisfies Meta<typeof SearchTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Campo falso com atalho a partir de 768 px; botão de ícone abaixo disso. */
export const Normal: Story = {};
