import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { calcularDashboard, type Kpi } from "@/domain";
import { AGORA_HISTORIAS, BASE_HISTORIAS } from "@/mocks/data/historias";
import type { Recurso } from "@/lib/recurso";
import { StatCard, StatGroup, type DadosStat } from "./StatCard";

const dash = calcularDashboard(BASE_HISTORIAS, "mesAtual", AGORA_HISTORIAS);
const ok = (k: DadosStat): Recurso<DadosStat> => ({ fase: "success", dados: k });

// RF-44: inadimplência % (fração) com o período anterior; subir é ruim. Série ilustrativa de 6 meses.
const inadimplencia: Kpi = { valor: 0.0448, anterior: 0.031, tendencia: [0.02, 0.025, 0.028, 0.03, 0.031, 0.0448] };

const meta = {
  title: "Padrões/StatCard",
  component: StatCard,
  args: {
    rotulo: "Receita do mês",
    formato: "moeda",
    estado: ok(dash.kpis.receita),
    onTentarNovamente: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-72 max-w-full p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** RF-10: queda de receita vs. mês anterior (▼ em cor de erro, com texto). */
export const Normal: Story = {};
export const Carregando: Story = { args: { estado: { fase: "loading" } } };
export const Vazio: Story = { args: { estado: ok({ valor: 0, anterior: 0, tendencia: [0, 0, 0, 0, 0, 0] }) } };
export const Erro: Story = { args: { estado: { fase: "error", erro: new Error("Falha de rede") } } };
export const Atualizando: Story = { args: { estado: { fase: "loading", dados: dash.kpis.receita } } };
export const AltaBoa: Story = {
  args: {
    rotulo: "Leads novos",
    formato: "numero",
    estado: ok({ valor: 18, anterior: 12, tendencia: [4, 6, 5, 9, 12, 18] }),
  },
};
export const VariacaoZero: Story = {
  args: {
    rotulo: "Visitas agendadas",
    formato: "numero",
    estado: ok({ valor: 7, anterior: 7, tendencia: [5, 7, 6, 8, 7, 7] }),
  },
};
/** Sem `anterior`: só rótulo e valor, sem variação nem tendência (RF-42, RF-44). */
export const SemVariacao: Story = {
  args: { rotulo: "A receber", formato: "moedaCompleta", estado: ok({ valor: 1_845_000 }) },
};
export const SemVariacaoAlerta: Story = {
  args: { rotulo: "Atrasado", formato: "moedaCompleta", estado: ok({ valor: 420_000, tom: "alerta" }) },
};
export const AnteriorZero: Story = {
  args: {
    rotulo: "Leads novos",
    formato: "numero",
    estado: ok({ valor: 5, anterior: 0, tendencia: [0, 0, 0, 1, 2, 5] }),
  },
};
/** RF-44: `menorMelhor`, subir a inadimplência é ruim (cor de erro). */
export const Inadimplencia: Story = {
  args: { rotulo: "Inadimplência", formato: "percentual", sentido: "menorMelhor", estado: ok(inadimplencia) },
};
export const InadimplenciaMelhorando: Story = {
  args: {
    rotulo: "Inadimplência",
    formato: "percentual",
    sentido: "menorMelhor",
    estado: ok({ valor: 0.02, anterior: 0.04, tendencia: [0.05, 0.045, 0.04, 0.03, 0.04, 0.02] }),
  },
};

/** Valor gigante, variação de 900 % e tendência toda zero, lado a lado. */
export const DadosExtremos: Story = {
  render: (args) => (
    <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-3">
      <StatCard
        {...args}
        rotulo="Receita acumulada de todos os contratos de locação e venda da carteira"
        estado={ok({
          valor: 98_765_432_100_000_000,
          anterior: 98_000_000_000_000_000,
          tendencia: [1, 5, 2, 9e15, 98_765_432_100_000_000],
        })}
      />
      <StatCard
        {...args}
        rotulo="Leads novos"
        formato="numero"
        estado={ok({ valor: 1000, anterior: 100, tendencia: [100, 100, 200, 500, 1000] })}
      />
      <StatCard
        {...args}
        rotulo="Visitas"
        formato="numero"
        estado={ok({ valor: 0, anterior: 0, tendencia: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3] })}
      />
    </div>
  ),
  decorators: [],
};

/** RF-10: os 4 KPIs do dashboard, mais inadimplência (RF-44), cada um com estado próprio. */
export const GradeDeKpis: Story = {
  render: () => (
    <div className="grid w-full max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard rotulo="Imóveis ativos" formato="numero" estado={ok(dash.kpis.imoveisAtivos)} />
      <StatCard rotulo="Leads novos no mês" formato="numero" estado={ok(dash.kpis.leadsNovos)} />
      <StatCard
        rotulo="Visitas nos próximos 7 dias"
        formato="numero"
        comparacao="vs. 7 dias anteriores"
        estado={ok(dash.kpis.visitasProximas)}
      />
      <StatCard rotulo="Receita do mês" formato="moeda" estado={ok(dash.kpis.receita)} />
      <StatCard rotulo="Inadimplência" formato="percentual" sentido="menorMelhor" estado={ok(inadimplencia)} />
    </div>
  ),
  decorators: [],
};

/** Faixa de KPIs do dashboard: um painel, divisórias de 1 px, 2 colunas até 1024 px (RF-10). */
export const Faixa: Story = {
  decorators: [
    (Story) => (
      <div className="w-full p-6">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <StatGroup aria-label="Indicadores">
      <StatCard variante="celula" rotulo="Imóveis ativos" estado={ok(dash.kpis.imoveisAtivos)} />
      <StatCard variante="celula" rotulo="Leads novos" estado={ok(dash.kpis.leadsNovos)} />
      <StatCard
        variante="celula"
        rotulo="Visitas em 7 dias"
        comparacao="vs. 7 dias anteriores"
        estado={ok(dash.kpis.visitasProximas)}
      />
      <StatCard variante="celula" rotulo="Receita" formato="moeda" estado={ok(dash.kpis.receita)} />
    </StatGroup>
  ),
};

/** Faixa com número ímpar de KPIs (contrato): a última célula ocupa a linha no celular. */
export const FaixaImpar: Story = {
  decorators: Faixa.decorators,
  render: () => (
    <StatGroup aria-label="Indicadores do contrato" colunas={3}>
      <StatCard variante="celula" rotulo="Pago" formato="moedaCompleta" estado={ok({ valor: 123456700 })} />
      <StatCard variante="celula" rotulo="A receber" formato="moedaCompleta" estado={ok({ valor: 98765400 })} />
      <StatCard
        variante="celula"
        rotulo="Atrasado"
        formato="moedaCompleta"
        estado={ok({ valor: 1200000, tom: "alerta" })}
      />
    </StatGroup>
  ),
};
