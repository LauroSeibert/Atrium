import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ColorsReference } from "./ColorsReference";

const meta = {
  title: "Design system/Cores",
  component: ColorsReference,
  tags: ["!autodocs"],
} satisfies Meta<typeof ColorsReference>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A mesma página da rota /design-system/colors. Troque o tema na barra do Storybook. */
export const Cores: Story = {};

export const CoresEscuro: Story = { name: "Cores (escuro)", globals: { theme: "dark" } };
