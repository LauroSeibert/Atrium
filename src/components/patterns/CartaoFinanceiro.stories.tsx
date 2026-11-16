import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "../ui/Button";
import { CartaoFinanceiro, CartaoFinanceiroSkeleton } from "./CartaoFinanceiro";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

const meta = {
  title: "Padrões/CartaoFinanceiro",
  component: CartaoFinanceiro,
  args: {
    titulo: "CT-2026-0012",
    subtitulo: "Apto 52 Solar das Palmeiras",
    status: { rotulo: "Atrasado", tom: "danger" },
    campos: [
      { rotulo: "Vencimento", valor: "10/11/2026" },
      { rotulo: "Valor", valor: "R$ 3.500,00" },
    ],
    acao: <Button variant="secondary">Registrar pagamento</Button>,
  },
  decorators: [
    (Story) => (
      <div className="max-w-md p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CartaoFinanceiro>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Carregando: Story = { render: () => <CartaoFinanceiroSkeleton /> };
export const Vazio: Story = {
  render: () => <EmptyState tamanho="compacto" ilustracao="semResultados" titulo="Nenhum lançamento" />,
};
export const Erro: Story = { render: () => <ErrorState tamanho="compacto" onTentarNovamente={() => {}} /> };
export const DadosExtremos: Story = {
  args: {
    titulo: "CT-2026-0012-ADITIVO-COM-NUMERO-MUITO-LONGO-PARA-TESTAR-QUEBRA-DE-LINHA",
    subtitulo: "Cobertura duplex com vista panorâmica e terraço gourmet no Jardim Europa ".repeat(3),
    campos: [
      { rotulo: "Vencimento", valor: "10/11/2026" },
      { rotulo: "Valor", valor: "R$ 99.999.999,99" },
      { rotulo: "Corretor", valor: "Maria Aparecida Fernanda de Albuquerque Cavalcanti Montenegro" },
    ],
  },
};
