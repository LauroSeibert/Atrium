import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Divider } from "./Divider";

const meta = { title: "Átomos/Divider", component: Divider } satisfies Meta<typeof Divider>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-80 p-6 text-sm">
      <p>Dados do imóvel</p>
      <Divider className="my-3" />
      <p>Dados do proprietário</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-6 items-center gap-3 p-6 text-sm">
      <span>3 quartos</span>
      <Divider orientation="vertical" />
      <span>98 m²</span>
      <Divider orientation="vertical" />
      <span>2 vagas</span>
    </div>
  ),
};
