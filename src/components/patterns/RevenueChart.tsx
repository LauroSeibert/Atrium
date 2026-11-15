"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MetricaMensal } from "@/domain";
import { formatMoeda } from "@/lib/format";
import type { Recurso } from "@/lib/recurso";
import { ChartCard, type TabelaGrafico } from "./ChartCard";
import { CURSOR, EIXO, GRADE, Legenda, rotuloMes, TICK, TooltipBox, useMovimentoReduzido } from "./ChartParts";

/** Receita 12 meses, vendas × locações (RF-11; alternativa textual: RNF-17). Valores em centavos. */

const VENDAS = "var(--chart-1)";
const LOCACOES = "var(--chart-2)";

export const receitaTotal = (m: MetricaMensal) => m.receitaVendas + m.receitaLocacoes;
export const receitaVazia = (dados: MetricaMensal[]) => dados.every((m) => receitaTotal(m) === 0);

export function resumoReceita(dados: MetricaMensal[]): string {
  if (dados.length === 0) return "Sem meses para mostrar.";
  const vendas = dados.reduce((s, m) => s + m.receitaVendas, 0);
  const locacoes = dados.reduce((s, m) => s + m.receitaLocacoes, 0);
  const periodo = `${rotuloMes(dados[0]!.mes, true)} a ${rotuloMes(dados[dados.length - 1]!.mes, true)}`;
  if (vendas + locacoes === 0) return `Sem receita registrada de ${periodo}.`;
  const melhor = dados.reduce((a, b) => (receitaTotal(b) > receitaTotal(a) ? b : a));
  return (
    `Receita de ${periodo}: ${formatMoeda(vendas + locacoes, { semCentavos: true })} no total, ` +
    `sendo ${formatMoeda(vendas, { semCentavos: true })} em vendas e ${formatMoeda(locacoes, { semCentavos: true })} em locações. ` +
    `Melhor mês: ${rotuloMes(melhor.mes, true)}, com ${formatMoeda(receitaTotal(melhor), { semCentavos: true })}.`
  );
}

export function tabelaReceita(dados: MetricaMensal[]): TabelaGrafico {
  return {
    rotulo: "Receita por mês, vendas e locações",
    colunas: [
      { rotulo: "Mês" },
      { rotulo: "Vendas", alinhar: "right" },
      { rotulo: "Locações", alinhar: "right" },
      { rotulo: "Total", alinhar: "right" },
    ],
    linhas: dados.map((m) => [
      rotuloMes(m.mes, true),
      formatMoeda(m.receitaVendas, { semCentavos: true }),
      formatMoeda(m.receitaLocacoes, { semCentavos: true }),
      formatMoeda(receitaTotal(m), { semCentavos: true }),
    ]),
  };
}

type PayloadItem = { payload?: MetricaMensal };

/** Barras empilhadas por mês. Decorativo para leitores de tela: o ChartCard fornece resumo e tabela. */
export function RevenueChart({ dados }: { dados: MetricaMensal[] }) {
  const reduzido = useMovimentoReduzido();
  return (
    <div className="flex flex-col gap-3">
      <div className="h-64 w-full min-w-0 sm:h-72">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 288 }}>
          <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} {...GRADE} />
            <XAxis
              dataKey="mes"
              tickFormatter={(v: string) => rotuloMes(v)}
              tick={TICK}
              tickLine={false}
              axisLine={EIXO}
              interval="preserveStartEnd"
              minTickGap={8}
            />
            <YAxis
              tickFormatter={(v: number) => formatMoeda(v, { compacto: true })}
              tick={TICK}
              tickLine={false}
              axisLine={false}
              width={84}
            />
            <Tooltip
              cursor={CURSOR}
              isAnimationActive={false}
              content={({ active, payload }) => {
                const m = (payload as unknown as PayloadItem[] | undefined)?.[0]?.payload;
                if (!active || !m) return null;
                return (
                  <TooltipBox
                    titulo={rotuloMes(m.mes, true)}
                    linhas={[
                      { cor: VENDAS, rotulo: "Vendas", valor: formatMoeda(m.receitaVendas, { semCentavos: true }) },
                      {
                        cor: LOCACOES,
                        rotulo: "Locações",
                        valor: formatMoeda(m.receitaLocacoes, { semCentavos: true }),
                      },
                    ]}
                    rodape={`Total: ${formatMoeda(receitaTotal(m), { semCentavos: true })}`}
                  />
                );
              }}
            />
            <Bar dataKey="receitaVendas" name="Vendas" stackId="receita" fill={VENDAS} isAnimationActive={!reduzido} />
            <Bar
              dataKey="receitaLocacoes"
              name="Locações"
              stackId="receita"
              fill={LOCACOES}
              radius={[4, 4, 0, 0]}
              isAnimationActive={!reduzido}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legenda
        itens={[
          { rotulo: "Vendas", cor: VENDAS },
          { rotulo: "Locações", cor: LOCACOES },
        ]}
      />
    </div>
  );
}

export type RevenueChartCardProps = {
  estado: Recurso<MetricaMensal[]>;
  onTentarNovamente?: () => void;
  className?: string;
};

/** Card do gráfico de receita (RF-11). */
export function RevenueChartCard({ estado, onTentarNovamente, className }: RevenueChartCardProps) {
  return (
    <ChartCard
      titulo="Receita dos últimos 12 meses"
      descricao="Vendas e locações recebidas por mês."
      estado={estado}
      onTentarNovamente={onTentarNovamente}
      estaVazio={receitaVazia}
      tituloVazio="Nenhuma receita no período"
      descricaoVazio="Os pagamentos recebidos de vendas e locações aparecem aqui."
      resumo={resumoReceita}
      tabela={tabelaReceita}
      grafico={(d) => <RevenueChart dados={d} />}
      className={className}
    />
  );
}
