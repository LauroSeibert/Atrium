import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { MobileNav } from "./MobileNav";
import { CONTADORES, VIEWPORT_360, VIEWPORTS_SHELL } from "./historias-shell";

const meta = {
  title: "Shell/MobileNav",
  component: MobileNav,
  args: { aberto: true, onAbertoChange: fn(), pathname: "/leads" },
  parameters: {
    nextjs: { navigation: { pathname: "/leads" } },
    viewport: { options: VIEWPORTS_SHELL },
  },
  globals: { viewport: VIEWPORT_360 },
} satisfies Meta<typeof MobileNav>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Drawer à esquerda (< 1024 px), em viewport de 360 px. */
export const Aberto: Story = {};
export const ComBadges: Story = { args: { contadores: CONTADORES } };
export const Fechado: Story = { args: { aberto: false } };
