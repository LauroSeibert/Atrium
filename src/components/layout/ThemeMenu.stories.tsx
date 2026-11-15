import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { emMain } from "./historias-shell";
import { ThemeMenu } from "./ThemeMenu";

const meta = {
  title: "Shell/ThemeMenu",
  component: ThemeMenu,
  decorators: [emMain()],
  args: { tema: "light", temaResolvido: "light", onTemaChange: fn() },
} satisfies Meta<typeof ThemeMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Claro: Story = {};
export const Escuro: Story = { args: { tema: "dark", temaResolvido: "dark" } };
export const Sistema: Story = { args: { tema: "system", temaResolvido: "dark" } };
export const AntesDeMontar: Story = {
  name: "Antes de montar (tema indefinido)",
  args: { tema: undefined, temaResolvido: undefined },
};
export const MenuAberto: Story = {
  name: "Menu aberto (play)",
  args: { modal: false },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Tema: Claro" }));
    const item = await within(canvasElement.ownerDocument.body).findByRole("menuitemradio", { name: "Escuro" });
    await expect(item).toBeVisible();
    await expect(args.onTemaChange).not.toHaveBeenCalled();
  },
};
