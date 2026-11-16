import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { CartaoLinha, CartaoLinhaSkeleton } from "./CartaoLinha";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

const meta = {
  title: "Padrões/CartaoLinha",
  component: CartaoLinha,
  args: {
    titulo: "CT-2026-0012",
    subtitulo: "Apto 52 Solar das Palmeiras",
    selo: (
      <Badge tone="danger" dot>
        Atrasado
      </Badge>
    ),
    acao: <Button variant="secondary">Abrir</Button>,
    children: <p className="text-sm text-text-muted">Corpo do cartão.</p>,
  },
  decorators: [
    (Story) => (
      <div className="max-w-md p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CartaoLinha>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Carregando: Story = { render: () => <CartaoLinhaSkeleton /> };
export const Vazio: Story = {
  render: () => <EmptyState tamanho="compacto" ilustracao="semResultados" titulo="Nenhum item" />,
};
export const Erro: Story = { render: () => <ErrorState tamanho="compacto" onTentarNovamente={() => {}} /> };
export const DadosExtremos: Story = {
  args: {
    titulo: "TITULO-MUITO-LONGO-SEM-ESPACOS-".repeat(5),
    subtitulo: "Subtítulo longo ".repeat(20),
  },
};
