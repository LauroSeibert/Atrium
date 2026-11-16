"use client";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MetricaMensal } from "@/domain";
import { formatMoeda } from "@/lib/format";
import type { Recurso } from "@/lib/recurso";
import { ChartCard, type TabelaGrafico } from "./ChartCard";
import {
  BARRA_MAX,
  CURSOR,
  EIXO,
  GRADE,
  Legenda,
  raioBarra,
  rotuloMes,
  TICK,
  TickPeriodo,
  TooltipBox,
  useMovimentoReduzido,
} from "./ChartParts";

/** Receita 12 meses, vendas × locações (RF-11; alternativa textual: RNF-17). Valores em centavos. */

/** Só o período atual ganha o acento; os demais meses ficam em pedra (DESIGN_SYSTEM §5, Gráficos). */
const VENDAS = "var(--chart-1)";
const VENDAS_PASSADO = "var(--chart-4)";
const LOCACOES = "var(--chart-2)";

/** Rótulo do período atual: valor compacto num chip acima da barra (só nele; nada em toda barra). */
function RotuloAtual(props: { x?: number | string; y?: number | string; width?: number | string; value?: unknown }) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const largura = Number(props.width ?? 0);
  if (typeof props.value !== "number") return null;
  const texto = formatMoeda(props.value, { compacto: true });
  const w = texto.length * 6.6 + 14;
  return (
    <g aria-hidden="true">
      <rect x={x + largura / 2 - w / 2} y={y - 28} width={w} height={20} rx={6} fill="var(--surface-muted)" />
      <text
        x={x + largura / 2}
        y={y - 14}
        textAnchor="middle"
        fontSize={TICK.fontSize}
        fontFamily={TICK.fontFamily}
        fill="var(--text)"
      >
        {texto}
      </text>
    </g>
  );
}

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
  const raio = raioBarra();
  const ultimo = dados.length - 1;
  const atual = dados[ultimo]?.mes ?? "";
  const comTotal = dados.map((m, i) => ({ ...m, rotuloAtual: i === ultimo ? receitaTotal(m) : undefined }));
  return (
    <div className="flex flex-col gap-4">
      <div className="h-60 w-full min-w-0 sm:h-64 xl:h-100">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 288 }}>
          <BarChart data={comTotal} margin={{ top: 32, right: 24, bottom: 0, left: 0 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} {...GRADE} />
            <XAxis
              dataKey="mes"
              tick={<TickPeriodo atual={atual} formatar={(v) => rotuloMes(v).split("/")[0]!} />}
              tickLine={false}
              axisLine={EIXO}
              interval="preserveStartEnd"
              minTickGap={4}
            />
            <YAxis
              tickFormatter={(v: number) => formatMoeda(v, { compacto: true })}
              tick={TICK}
              tickLine={false}
              axisLine={false}
              tickCount={4}
              width={56}
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
            <Bar
              dataKey="receitaVendas"
              name="Vendas"
              stackId="receita"
              maxBarSize={BARRA_MAX}
              isAnimationActive={!reduzido}
            >
              {comTotal.map((m, i) => (
                <Cell key={m.mes} fill={i === ultimo ? VENDAS : VENDAS_PASSADO} />
              ))}
            </Bar>
            <Bar
              dataKey="receitaLocacoes"
              name="Locações"
              stackId="receita"
              fill={LOCACOES}
              maxBarSize={BARRA_MAX}
              radius={[raio, raio, 0, 0]}
              isAnimationActive={!reduzido}
            >
              <LabelList dataKey="rotuloAtual" content={<RotuloAtual />} />
            </Bar>
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
      estado={estado}
      onTentarNovamente={onTentarNovamente}
      estaVazio={receitaVazia}
      tituloVazio="Nenhuma receita no período"
      resumo={resumoReceita}
      tabela={tabelaReceita}
      grafico={(d) => <RevenueChart dados={d} />}
      className={className}
    />
  );
}
