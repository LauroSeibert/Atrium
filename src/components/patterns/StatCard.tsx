"use client";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { useId } from "react";
import type { Kpi } from "@/domain";
import { cn } from "@/lib/cn";
import { formatMoeda, formatNumero, formatPercentual } from "@/lib/format";
import type { Recurso } from "@/lib/recurso";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";
import { Skeleton } from "../ui/Skeleton";
import { EstadoRecurso } from "./EstadoRecurso";

/**
 * KPI do dashboard (RF-10) e indicadores financeiros (RF-44): rótulo, valor, variação vs. período
 * anterior (▲▼ com cor + ícone + texto) e mini tendência com resumo textual.
 *
 * Decisão: o StatCard recebe `estado: Recurso<Kpi>` (como os demais compostos de painel) e renderiza
 * os cinco estados com `EstadoRecurso` + `StatCardSkeleton`. Assim a grade de KPIs carrega e falha
 * por card, e quem chama não monta skeleton nem erro.
 */

export type FormatoKpi = "moeda" | "numero" | "percentual";
export type SentidoKpi = "maiorMelhor" | "menorMelhor";

const formatadores: Record<FormatoKpi, (n: number) => string> = {
  moeda: (n) => formatMoeda(n, { compacto: true }),
  numero: (n) => formatNumero(n),
  percentual: (n) => formatPercentual(n),
};

/** Variação do KPI como valor discriminado; `anterior === 0` não divide (ESTADOS: sem divisão por zero). */
export type VariacaoKpi =
  | { tipo: "igual" }
  | { tipo: "nova"; subiu: boolean }
  | { tipo: "alta"; fracao: number }
  | { tipo: "queda"; fracao: number };

export function variacaoKpi(valor: number, anterior: number): VariacaoKpi {
  if (valor === anterior) return { tipo: "igual" };
  if (anterior === 0) return { tipo: "nova", subiu: valor > 0 };
  const fracao = Math.abs(valor - anterior) / Math.abs(anterior);
  if (Math.round(fracao * 1000) === 0) return { tipo: "igual" };
  return valor > anterior ? { tipo: "alta", fracao } : { tipo: "queda", fracao };
}

/**
 * Variação de um KPI em fração (percentual): é a diferença em pontos percentuais (p.p.), não relativa.
 * `fracao` guarda os pontos como número (1,4 = 1,4 p.p.).
 */
export function variacaoPontos(valor: number, anterior: number): VariacaoKpi {
  const pontos = (valor - anterior) * 100;
  if (Math.round(Math.abs(pontos) * 10) === 0) return { tipo: "igual" };
  return pontos > 0 ? { tipo: "alta", fracao: pontos } : { tipo: "queda", fracao: -pontos };
}

/** Sem nenhum dado: valor, anterior e tendência todos zero. */
export const kpiVazio = (k: Kpi) => k.valor === 0 && k.anterior === 0 && k.tendencia.every((t) => t === 0);

type Leitura = { tom: "bom" | "ruim" | "neutro"; icone: typeof ArrowUp; texto: string; leitor: string };

function lerVariacao(v: VariacaoKpi, sentido: SentidoKpi, comparacao: string, pontos = false): Leitura {
  if (v.tipo === "igual")
    return { tom: "neutro", icone: Minus, texto: `sem variação ${comparacao}`, leitor: `Sem variação ${comparacao}` };
  const subiu = v.tipo === "nova" ? v.subiu : v.tipo === "alta";
  const bom = sentido === "maiorMelhor" ? subiu : !subiu;
  const nova = v.tipo === "nova";
  const quanto = nova ? "" : pontos ? `${formatNumero(v.fracao, 1)} p.p.` : formatPercentual(v.fracao);
  return {
    tom: bom ? "bom" : "ruim",
    icone: subiu ? ArrowUp : ArrowDown,
    texto: nova ? `novo ${comparacao}` : `${quanto} ${comparacao}`,
    leitor: nova
      ? `${subiu ? "Alta" : "Queda"}: sem valor no período anterior para calcular o percentual`
      : `${subiu ? "Alta" : "Queda"} de ${quanto} ${comparacao}`,
  };
}

const COR_TOM = { bom: "text-success", ruim: "text-danger", neutro: "text-text-muted" } as const;

/** Resumo textual da tendência (alternativa à mini-linha, que é decorativa). */
export function resumoTendencia(tendencia: number[], formatar: (n: number) => string): string {
  if (tendencia.length === 0) return "Sem série de tendência.";
  const primeiro = tendencia[0]!;
  const ultimo = tendencia[tendencia.length - 1]!;
  if (tendencia.every((t) => t === primeiro))
    return `Tendência dos últimos ${tendencia.length} períodos: estável em ${formatar(primeiro)}.`;
  const max = Math.max(...tendencia);
  const min = Math.min(...tendencia);
  const direcao = ultimo > primeiro ? "em alta" : ultimo < primeiro ? "em queda" : "estável";
  return `Tendência dos últimos ${tendencia.length} períodos: ${direcao}, de ${formatar(primeiro)} a ${formatar(ultimo)} (mínimo ${formatar(min)}, máximo ${formatar(max)}).`;
}

const LARGURA = 100;
const ALTURA = 32;

/** Mini linha de tendência em SVG próprio, decorativa (`aria-hidden`). Série constante vira linha reta. */
export function Sparkline({ valores, className }: { valores: number[]; className?: string }) {
  if (valores.length < 2) return null;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const amplitude = max - min;
  const pontos = valores
    .map((v, i) => {
      const x = (i / (valores.length - 1)) * LARGURA;
      const y = amplitude === 0 ? ALTURA / 2 : ALTURA - 2 - ((v - min) / amplitude) * (ALTURA - 4);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      preserveAspectRatio="none"
      className={cn("h-8 w-full", className)}
    >
      <polyline
        points={pontos}
        fill="none"
        className="stroke-chart-1"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export type StatCardProps = {
  rotulo: string;
  estado: Recurso<Kpi>;
  onTentarNovamente?: () => void;
  formato?: FormatoKpi;
  /** Inadimplência: `menorMelhor` (subir é ruim, fica em cor de erro). */
  sentido?: SentidoKpi;
  /** Texto da comparação. Padrão: "vs. mês anterior". */
  comparacao?: string;
  /** Mostra a mini tendência. Padrão: sim. */
  tendencia?: boolean;
  className?: string;
};

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card aria-busy="true" className={cn("flex flex-col gap-3 p-4 sm:p-6", className)}>
      <span className="sr-only" role="status">
        Carregando indicador
      </span>
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-full" />
    </Card>
  );
}

function Corpo({
  rotulo,
  kpi,
  formato,
  sentido,
  comparacao,
  tendencia,
}: Required<Pick<StatCardProps, "rotulo" | "formato" | "sentido" | "comparacao" | "tendencia">> & { kpi: Kpi }) {
  const id = useId();
  const formatar = formatadores[formato];
  const vazio = kpiVazio(kpi);
  const pontos = formato === "percentual";
  const leitura = lerVariacao(
    pontos ? variacaoPontos(kpi.valor, kpi.anterior) : variacaoKpi(kpi.valor, kpi.anterior),
    sentido,
    comparacao,
    pontos,
  );
  return (
    <Card className="flex min-w-0 flex-col gap-2 p-4 sm:p-6" role="group" aria-labelledby={`${id}-r`}>
      <p id={`${id}-r`} className="text-sm font-medium text-text-muted">
        {rotulo}
      </p>
      <p className="tnum text-2xl font-semibold [overflow-wrap:anywhere] text-text">{formatar(kpi.valor)}</p>
      {vazio ? (
        <p className="text-sm text-text-muted">Sem dados no período</p>
      ) : (
        <>
          <p className={cn("flex items-start gap-1 text-sm font-medium", COR_TOM[leitura.tom])}>
            <Icon icon={leitura.icone} size={16} className="mt-0.5" />
            <span>
              <span className="sr-only">{leitura.leitor}</span>
              <span aria-hidden="true" className="tnum">
                {leitura.texto}
              </span>
            </span>
          </p>
          {tendencia && kpi.tendencia.length > 1 ? (
            <div className="mt-1">
              <Sparkline valores={kpi.tendencia} />
              <span className="sr-only">{resumoTendencia(kpi.tendencia, formatar)}</span>
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
}

/** Card de KPI com variação e tendência (RF-10, RF-44). */
export function StatCard({
  rotulo,
  estado,
  onTentarNovamente,
  formato = "numero",
  sentido = "maiorMelhor",
  comparacao = "vs. mês anterior",
  tendencia = true,
  className,
}: StatCardProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <EstadoRecurso
        estado={estado}
        carregando={<StatCardSkeleton />}
        erro={{ titulo: `Não foi possível carregar ${rotulo.toLowerCase()}` }}
        onTentarNovamente={onTentarNovamente}
      >
        {(kpi) => (
          <Corpo
            rotulo={rotulo}
            kpi={kpi}
            formato={formato}
            sentido={sentido}
            comparacao={comparacao}
            tendencia={tendencia}
          />
        )}
      </EstadoRecurso>
    </div>
  );
}
