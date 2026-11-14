import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bath, BedDouble, Car, House, Ruler } from "lucide-react";
import { Icon } from "./Icon";

const meta = { title: "Átomos/Icon", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Tamanhos: Story = {
  render: () => (
    <div className="flex items-end gap-6 text-text">
      <Icon icon={House} size={16} />
      <Icon icon={House} size={20} />
      <Icon icon={House} size={24} />
    </div>
  ),
};

export const ComRotulo: Story = {
  name: "Com rótulo acessível",
  render: () => (
    <div className="flex items-center gap-4 text-text-muted">
      <Icon icon={BedDouble} label="Quartos" />
      <Icon icon={Bath} label="Banheiros" />
      <Icon icon={Car} label="Vagas" />
      <Icon icon={Ruler} label="Área" />
    </div>
  ),
};
