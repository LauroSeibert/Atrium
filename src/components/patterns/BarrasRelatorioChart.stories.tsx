import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import type { Recurso } from "@/lib/recurso";
import { BarrasRelatorioChart, barrasVazias, type CategoriaBarras } from "./BarrasRelatorioChart";
import { ChartCard } from "./ChartCard";

const meses = ["jun/26", "jul/26", "ago/26", "set/26", "out/26", "nov/26"];
const categorias: CategoriaBarras[] = meses.map((rotulo, i) => ({
  rotulo,
  valores: [(i + 2) * 40_000_00, (6 - i) * 15_000_00],
}));
const series = [
  { rotulo: "Vendas", formato: "moeda" as const },
  { rotulo: "Locações", formato: "moeda" as const },
];
const sucesso = (d: CategoriaBarras[]): Recurso<CategoriaBarras[]> => ({ fase: "success", dados: d });

const meta = {
  title: "Padrões/BarrasRelatorioChart",
  component: ChartCard<CategoriaBarras[]>,
  args: {
    titulo: "Receita por período",
    estado: sucesso(categorias),
    onTentarNovamente: fn(),
    estaVazio: barrasVazias,
    resumo: (d: CategoriaBarras[]) => `${d.length} períodos.`,
    tabela: (d: CategoriaBarras[]) => ({
      rotulo: "Receita por período",
      colunas: [{ rotulo: "Período" }, ...series.map((s) => ({ rotulo: s.rotulo, alinhar: "right" as const }))],
      linhas: d.map((c) => [c.rotulo, ...c.valores.map(String)]),
    }),
    grafico: (d: CategoriaBarras[]) => <BarrasRelatorioChart categorias={d} series={series} />,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-3xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChartCard<CategoriaBarras[]>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Carregando: Story = { args: { estado: { fase: "loading" } } };
export const Vazio: Story = { args: { estado: sucesso(categorias.map((c) => ({ ...c, valores: [0, 0] }))) } };
export const Erro: Story = { args: { estado: { fase: "error", erro: new Error("Falha de rede") } } };
export const Horizontal: Story = {
  args: {
    grafico: (d: CategoriaBarras[]) => <BarrasRelatorioChart categorias={d} series={series} horizontal empilhado />,
  },
};
export const DadosExtremos: Story = {
  args: {
    estado: sucesso(
      Array.from({ length: 12 }, (_, i) => ({
        rotulo: `Corretor com nome muito longo número ${i + 1}`,
        valores: [i === 3 ? 900_000_000_000 : 1_00, 0],
      })),
    ),
    grafico: (d: CategoriaBarras[]) => <BarrasRelatorioChart categorias={d} series={series} horizontal />,
  },
};
