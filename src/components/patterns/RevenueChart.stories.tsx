import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { calcularDashboard } from "@/domain";
import { AGORA_HISTORIAS, BASE_HISTORIAS } from "@/mocks/data/historias";
import type { Recurso } from "@/lib/recurso";
import type { MetricaMensal } from "@/domain";
import { RevenueChartCard } from "./RevenueChart";

const dados = calcularDashboard(BASE_HISTORIAS, "mesAtual", AGORA_HISTORIAS).receita12m;
const sucesso = (d: MetricaMensal[]): Recurso<MetricaMensal[]> => ({ fase: "success", dados: d });

const meta = {
  title: "Padrões/RevenueChart",
  component: RevenueChartCard,
  args: { estado: sucesso(dados), onTentarNovamente: fn() },
  decorators: [
    (Story) => (
      <div className="w-full max-w-3xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RevenueChartCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** RF-11: receita 12 meses, vendas × locações, com resumo e tabela alternativa (RNF-17). */
export const Normal: Story = {};
export const Carregando: Story = { args: { estado: { fase: "loading" } } };
export const Vazio: Story = {
  args: { estado: sucesso(dados.map((m) => ({ ...m, receitaVendas: 0, receitaLocacoes: 0 }))) },
};
export const Erro: Story = { args: { estado: { fase: "error", erro: new Error("Falha de rede") } } };
/** Um mês com valor 1000× maior que os demais. */
export const DadosExtremos: Story = {
  args: {
    estado: sucesso(
      dados.map((m, i) => (i === 6 ? { ...m, receitaVendas: 500_000_000_000, receitaLocacoes: 8_000_000 } : m)),
    ),
  },
};
