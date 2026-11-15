import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PropertyImage } from "./PropertyImage";

const meta = {
  title: "Padrões/PropertyImage",
  component: PropertyImage,
  args: { tipo: "casa" },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PropertyImage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Casa: Story = {};
export const Apartamento: Story = { args: { tipo: "apartamento" } };
export const Cobertura: Story = { args: { tipo: "cobertura" } };
export const Terreno: Story = { args: { tipo: "terreno" } };
export const Comercial: Story = { args: { tipo: "comercial" } };
export const FachadaEscolhida: Story = { args: { tipo: "casa", fachada: "sobrado" } };
export const ComComodo: Story = { args: { tipo: "apartamento", comodo: "cozinha" } };
export const SemIlustracao: Story = { args: { tipo: "casa", fachada: null } };
export const Decorativa: Story = { args: { tipo: "casa", decorativa: true } };
