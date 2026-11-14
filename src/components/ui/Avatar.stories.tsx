import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Avatar, AvatarGroup } from "./Avatar";

const meta = {
  title: "Átomos/Avatar",
  component: Avatar,
  args: { name: "Mariana Costa Ferreira" },
  argTypes: { size: { control: "inline-radio", options: [24, 32, 40, 48] } },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Iniciais: Story = {};

export const Tamanhos: Story = {
  render: () => (
    <div className="flex items-center gap-4 p-6">
      {([24, 32, 40, 48] as const).map((s) => (
        <Avatar key={s} name="Rafael Almeida" size={s} />
      ))}
    </div>
  ),
};

export const ImagemQuebradaCaiNasIniciais: Story = {
  name: "Imagem inválida (fallback)",
  args: { name: "Beatriz Nogueira", src: "/nao-existe.jpg" },
};

export const NomeLongo: Story = {
  name: "Nome longo (caso extremo)",
  args: { name: "Maria Eduarda de Albuquerque e Souza Pimentel" },
};

export const Grupo: Story = {
  name: "Grupo (corretores do imóvel)",
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <AvatarGroup
        aria-label="Corretores responsáveis"
        people={[{ name: "Mariana Costa" }, { name: "Rafael Almeida" }, { name: "Beatriz Nogueira" }]}
      />
      <AvatarGroup
        aria-label="Equipe de vendas"
        max={3}
        size={40}
        people={[
          { name: "Mariana Costa" },
          { name: "Rafael Almeida" },
          { name: "Beatriz Nogueira" },
          { name: "Carlos Duarte" },
          { name: "Juliana Prado" },
          { name: "Tiago Moreira" },
        ]}
      />
    </div>
  ),
};
