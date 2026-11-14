import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Card, CardContent } from "./Card";
import { Skeleton } from "./Skeleton";

const meta = { title: "Átomos/Skeleton", component: Skeleton } satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Formas: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-4 p-6">
      <Skeleton shape="text" />
      <Skeleton shape="circle" />
      <Skeleton shape="rect" />
    </div>
  ),
};

export const CardDeImovelCarregando: Story = {
  name: "Card de imóvel carregando",
  render: () => (
    <div className="w-80 p-6" aria-busy="true">
      <Card>
        <CardContent className="flex flex-col gap-3">
          <Skeleton shape="rect" className="h-40" />
          <Skeleton className="w-3/4" />
          <Skeleton className="w-1/2" />
        </CardContent>
      </Card>
    </div>
  ),
};
