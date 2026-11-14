import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { Button } from "./Button";

const meta = {
  title: "Átomos/Button",
  component: Button,
  args: { children: "Salvar imóvel" },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "ghost", "destructive", "link"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primario: Story = { name: "Primário" };
export const Secundario: Story = { name: "Secundário", args: { variant: "secondary", children: "Cancelar" } };
export const Fantasma: Story = { args: { variant: "ghost", children: "Ver detalhes" } };
export const Destrutivo: Story = { args: { variant: "destructive", children: "Cancelar contrato" } };
export const Link: Story = { args: { variant: "link", children: "Ver todos os leads" } };

export const Tamanhos: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4 p-6">
      <Button size="sm">Pequeno 32</Button>
      <Button size="md">Médio 40</Button>
      <Button size="lg">Grande 44</Button>
    </div>
  ),
};

export const ComIcones: Story = {
  name: "Com ícones",
  render: () => (
    <div className="flex flex-wrap items-center gap-4 p-6">
      <Button leadingIcon={Plus}>Novo imóvel</Button>
      <Button variant="secondary" trailingIcon={ArrowRight}>
        Próxima etapa
      </Button>
      <Button icon={Plus} aria-label="Adicionar lead" />
      <Button variant="ghost" icon={Trash2} aria-label="Excluir nota" />
    </div>
  ),
};

export const Estados: Story = {
  render: () => (
    <div className="grid gap-4 p-6 sm:grid-cols-5">
      {(["primary", "secondary", "ghost", "destructive", "link"] as const).map((variant) => (
        <div key={variant} className="flex flex-col items-start gap-2">
          <Button variant={variant}>Padrão</Button>
          <Button variant={variant} disabled>
            Desabilitado
          </Button>
          <Button variant={variant} loading>
            Carregando
          </Button>
        </div>
      ))}
    </div>
  ),
};

export const Carregando: Story = { args: { loading: true, children: "Salvando…" } };
export const Desabilitado: Story = { args: { disabled: true } };
