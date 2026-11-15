import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { calcularDashboard, type MetricaMensal } from "@/domain";
import { AGORA_HISTORIAS, BASE_HISTORIAS } from "@/mocks/data/historias";
import type { Recurso } from "@/lib/recurso";
import { Button } from "../ui/Button";
import { ChartCard } from "./ChartCard";
import { RevenueChart, receitaVazia, resumoReceita, tabelaReceita } from "./RevenueChart";

const dados = calcularDashboard(BASE_HISTORIAS, "mesAtual", AGORA_HISTORIAS).receita12m;
const sucesso = (d: MetricaMensal[]): Recurso<MetricaMensal[]> => ({ fase: "success", dados: d });

const meta = {
  title: "Padrões/ChartCard",
  component: ChartCard<MetricaMensal[]>,
  args: {
    titulo: "Receita dos últimos 12 meses",
    descricao: "Vendas e locações recebidas por mês.",
    estado: sucesso(dados),
    onTentarNovamente: fn(),
    estaVazio: receitaVazia,
    resumo: resumoReceita,
    tabela: tabelaReceita,
    grafico: (d: MetricaMensal[]) => <RevenueChart dados={d} />,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-3xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChartCard<MetricaMensal[]>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const ComAcao: Story = { args: { acao: <Button variant="secondary">Exportar</Button> } };
export const Carregando: Story = { args: { estado: { fase: "loading" } } };
export const Vazio: Story = {
  args: { estado: sucesso(dados.map((m) => ({ ...m, receitaVendas: 0, receitaLocacoes: 0 }))) },
};
export const Erro: Story = { args: { estado: { fase: "error", erro: new Error("Falha de rede") } } };
export const Atualizando: Story = { args: { estado: { fase: "loading", dados } } };
export const DadosExtremos: Story = {
  args: {
    titulo: "Receita consolidada de todas as unidades, contratos de venda e locação, nos últimos doze meses fechados",
    estado: sucesso(dados.map((m, i) => (i === 3 ? { ...m, receitaVendas: 900_000_000_000 } : m))),
  },
};
export const VisaoTabela: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("radio", { name: "Tabela" }));
    await expect(c.getByRole("region", { name: "Receita por mês, vendas e locações" })).toBeVisible();
  },
};
