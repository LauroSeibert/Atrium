import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { SectionCard } from "./SectionCard";

const meta = {
  title: "Padrões/SectionCard",
  component: SectionCard,
  args: { titulo: "Partes", children: <p className="text-sm text-text">Comprador: Ana Souza</p> },
} satisfies Meta<typeof SectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const ComAcoes: Story = {
  args: {
    acoes: (
      <Button variant="secondary" size="sm">
        Editar
      </Button>
    ),
  },
};
export const Carregando: Story = { args: { children: <Skeleton className="h-24 w-full" /> } };
export const Vazio: Story = {
  args: { children: <EmptyState tamanho="compacto" ilustracao="semResultados" titulo="Nada por aqui" /> },
};
export const Erro: Story = { args: { children: <ErrorState tamanho="compacto" onTentarNovamente={() => {}} /> } };
export const DadosExtremos: Story = {
  args: {
    titulo: "Maria Aparecida Fernanda de Albuquerque Cavalcanti Montenegro Bittencourt dos Santos",
    acoes: (
      <Button variant="secondary" size="sm">
        Editar
      </Button>
    ),
    children: <p className="text-sm break-words text-text">{"Texto longo ".repeat(40)}</p>,
  },
};

/** Seção aberta (sem caixa): título + divisória, para listas como agenda e atividades. */
export const Aberta: Story = { args: { variante: "aberta" } };
