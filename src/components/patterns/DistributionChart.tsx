"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/cn";
import { formatNumero, formatPercentual } from "@/lib/format";
import type { Recurso } from "@/lib/recurso";
import { ChartCard, type TabelaGrafico } from "./ChartCard";
import { classeCorSerie, corSerie, TooltipBox, useMovimentoReduzido } from "./ChartParts";

/** Distribuição (donut) por categoria, ex.: imóveis por tipo (RNF-17: tabela e resumo no ChartCard). */

export type ItemDistribuicao = { rotulo: string; valor: number };

const total = (d: ItemDistribuicao[]) => d.reduce((s, i) => s + i.valor, 0);
export const distribuicaoVazia = (d: ItemDistribuicao[]) => total(d) === 0;
const pct = (i: ItemDistribuicao, t: number) => (t ? formatPercentual(i.valor / t) : "—");

export function resumoDistribuicao(d: ItemDistribuicao[], unidade = "imóveis"): string {
  const t = total(d);
  if (t === 0) return `Nenhum item em ${unidade}.`;
  const maior = d.reduce((a, b) => (b.valor > a.valor ? b : a));
  return `${formatNumero(t)} ${unidade} no total. Maior fatia: ${maior.rotulo}, com ${formatNumero(maior.valor)} (${pct(maior, t)}).`;
}

export function tabelaDistribuicao(d: ItemDistribuicao[], rotuloCategoria = "Tipo"): TabelaGrafico {
  const t = total(d);
  return {
    rotulo: `Distribuição por ${rotuloCategoria.toLowerCase()}`,
    colunas: [
      { rotulo: rotuloCategoria },
      { rotulo: "Quantidade", alinhar: "right" },
      { rotulo: "Participação", alinhar: "right" },
    ],
    linhas: d.map((i) => [i.rotulo, formatNumero(i.valor), pct(i, t)]),
  };
}

/** Donut com o total no centro e legenda com rótulo + valor + %. */
export function DistributionChart({ dados, unidade = "imóveis" }: { dados: ItemDistribuicao[]; unidade?: string }) {
  const reduzido = useMovimentoReduzido();
  const t = total(dados);
  const positivos = dados.filter((i) => i.valor > 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
      <div className="relative h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 224, height: 224 }}>
          <PieChart>
            <Tooltip
              isAnimationActive={false}
              content={({ active, payload }) => {
                const i = (payload as unknown as { payload?: ItemDistribuicao }[] | undefined)?.[0]?.payload;
                if (!active || !i) return null;
                const idx = dados.indexOf(i);
                return (
                  <TooltipBox
                    titulo={i.rotulo}
                    linhas={[{ cor: corSerie(idx), rotulo: formatNumero(i.valor), valor: pct(i, t) }]}
                  />
                );
              }}
            />
            <Pie
              data={positivos}
              dataKey="valor"
              nameKey="rotulo"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={positivos.length > 1 ? 2 : 0}
              stroke="var(--surface)"
              isAnimationActive={!reduzido}
            >
              {positivos.map((i) => (
                <Cell key={i.rotulo} fill={corSerie(dados.indexOf(i))} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="tnum text-2xl font-semibold text-text">{formatNumero(t)}</span>
          <span className="text-xs text-text-muted">{unidade}</span>
        </div>
      </div>
      <ul className="flex w-full min-w-0 flex-col gap-2 text-sm">
        {dados.map((i, idx) => (
          <li key={i.rotulo} className="flex items-center gap-2">
            <span aria-hidden="true" className={cn("size-3 shrink-0 rounded-sm", classeCorSerie(idx))} />
            <span className="min-w-0 flex-1 break-words text-text">{i.rotulo}</span>
            <span className="tnum font-medium text-text">{formatNumero(i.valor)}</span>
            <span className="tnum w-14 text-right text-text-muted">{pct(i, t)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type DistributionChartCardProps = {
  estado: Recurso<ItemDistribuicao[]>;
  onTentarNovamente?: () => void;
  titulo?: string;
  descricao?: string;
  unidade?: string;
  rotuloCategoria?: string;
  className?: string;
};

/** Card do donut por tipo de imóvel (distribuição do portfólio). */
export function DistributionChartCard({
  estado,
  onTentarNovamente,
  titulo = "Imóveis por tipo",
  descricao,
  unidade = "imóveis",
  rotuloCategoria = "Tipo",
  className,
}: DistributionChartCardProps) {
  return (
    <ChartCard
      titulo={titulo}
      descricao={descricao}
      estado={estado}
      onTentarNovamente={onTentarNovamente}
      estaVazio={distribuicaoVazia}
      tituloVazio="Nenhum imóvel cadastrado"
      descricaoVazio="Cadastre imóveis para ver a distribuição por tipo."
      resumo={(d) => resumoDistribuicao(d, unidade)}
      tabela={(d) => tabelaDistribuicao(d, rotuloCategoria)}
      grafico={(d) => <DistributionChart dados={d} unidade={unidade} />}
      className={className}
    />
  );
}
