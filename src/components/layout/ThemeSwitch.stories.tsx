import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { emMain } from "./historias-shell";
import { ThemeSwitch } from "./ThemeSwitch";

const meta = {
  title: "Shell/ThemeSwitch",
  component: ThemeSwitch,
  decorators: [emMain()],
  args: { temaResolvido: "light", onAlternar: fn() },
} satisfies Meta<typeof ThemeSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Claro: Story = {};
export const Escuro: Story = { args: { temaResolvido: "dark" } };
export const AntesDeMontar: Story = { name: "Antes de montar (tema indefinido)", args: { temaResolvido: undefined } };
export const Alternar: Story = {
  name: "Alternar (play)",
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("switch", { name: "Tema escuro" }));
    await expect(args.onAlternar).toHaveBeenCalledOnce();
  },
};
