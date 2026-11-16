"use client";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { useId, type ReactNode } from "react";
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

export type FormatoKpi = "moeda" | "moedaCompleta" | "numero" | "percentual";

/**
 * Dados do card. Sem `anterior` não há variação nem tendência (números sem série histórica:
 * a receber, saldo do contrato). O `Kpi` do domínio é atribuível a este tipo.
 */
export type DadosStat = {
  valor: number;
  anterior?: number;
  tendencia?: number[];
  /** `alerta` pinta o valor com a cor de erro (o rótulo diz o que é; cor não é o único sinal). */
  tom?: "neutro" | "alerta";
};
export type SentidoKpi = "maiorMelhor" | "menorMelhor";

const formatadores: Record<FormatoKpi, (n: number) => string> = {
  moeda: (n) => formatMoeda(n, { compacto: true }),
  moedaCompleta: (n) => formatMoeda(n),
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
export const kpiVazio = (k: DadosStat) =>
  k.anterior !== undefined && k.valor === 0 && k.anterior === 0 && (k.tendencia ?? []).every((t) => t === 0);

type Leitura = {
  tom: "bom" | "ruim" | "neutro";
  icone: typeof ArrowUp;
  texto: string;
  /** Parte destacada (ex.: "8,0%"); vazia quando não há número. */
  quanto: string;
  /** Comparação em texto discreto (ex.: "vs. mês anterior"). */
  contexto: string;
  leitor: string;
};

function lerVariacao(v: VariacaoKpi, sentido: SentidoKpi, comparacao: string, pontos = false): Leitura {
  if (v.tipo === "igual")
    return {
      tom: "neutro",
      icone: Minus,
      texto: `sem variação ${comparacao}`,
      quanto: "",
      contexto: `sem variação ${comparacao}`,
      leitor: `Sem variação ${comparacao}`,
    };
  const subiu = v.tipo === "nova" ? v.subiu : v.tipo === "alta";
  const bom = sentido === "maiorMelhor" ? subiu : !subiu;
  const nova = v.tipo === "nova";
  const quanto = nova ? "" : pontos ? `${formatNumero(v.fracao, 1)} p.p.` : formatPercentual(v.fracao);
  return {
    tom: bom ? "bom" : "ruim",
    icone: subiu ? ArrowUp : ArrowDown,
    texto: nova ? `novo ${comparacao}` : `${quanto} ${comparacao}`,
    quanto: nova ? "novo" : quanto,
    contexto: comparacao,
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
      className={cn("h-8 w-full overflow-visible", className)}
    >
      <polyline
        points={pontos}
        fill="none"
        className="stroke-chart-1"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export type StatCardProps = {
  rotulo: string;
  estado: Recurso<DadosStat>;
  onTentarNovamente?: () => void;
  formato?: FormatoKpi;
  /** Inadimplência: `menorMelhor` (subir é ruim, fica em cor de erro). */
  sentido?: SentidoKpi;
  /** Texto da comparação. Padrão: "vs. mês anterior". */
  comparacao?: string;
  /** Mostra a mini tendência. Padrão: sim. */
  tendencia?: boolean;
  /**
   * `card` (padrão): painel próprio com borda. `celula`: sem caixa, para viver dentro de um
   * `StatGroup` (faixa única com divisórias), que é como o dashboard e o financeiro mostram KPIs.
   */
  variante?: "card" | "celula";
  className?: string;
};

/**
 * Faixa de KPIs: um único painel com divisórias finas entre as células (2 colunas no celular/tablet,
 * N a partir de 1024 px). Os filhos são `StatCard variante="celula"`.
 */
export function StatGroup({
  children,
  colunas = 4,
  className,
  "aria-label": rotulo,
}: {
  children: ReactNode;
  colunas?: 2 | 3 | 4;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      role="group"
      aria-label={rotulo}
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border",
        colunas === 3 && "lg:grid-cols-3",
        colunas === 4 && "lg:grid-cols-4",
        "[&>*]:bg-surface",
        // número ímpar de KPIs no grid de 2 colunas: a última célula ocupa a linha toda (sem "buraco")
        "[&>*:last-child:nth-child(odd)]:col-span-2",
        colunas !== 2 && "lg:[&>*:last-child:nth-child(odd)]:col-span-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCardSkeleton({
  className,
  variante = "card",
}: {
  className?: string;
  variante?: "card" | "celula";
}) {
  const Caixa = variante === "card" ? Card : "div";
  return (
    <Caixa aria-busy="true" className={cn("flex flex-col gap-3 p-4 sm:p-5", className)}>
      <span className="sr-only" role="status">
        Carregando indicador
      </span>
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-full" />
    </Caixa>
  );
}

function Corpo({
  rotulo,
  kpi,
  formato,
  sentido,
  comparacao,
  tendencia,
  variante,
}: Required<Pick<StatCardProps, "rotulo" | "formato" | "sentido" | "comparacao" | "tendencia" | "variante">> & {
  kpi: DadosStat;
}) {
  const id = useId();
  const formatar = formatadores[formato];
  const vazio = kpiVazio(kpi);
  const pontos = formato === "percentual";
  const leitura =
    kpi.anterior === undefined
      ? null
      : lerVariacao(
          pontos ? variacaoPontos(kpi.valor, kpi.anterior) : variacaoKpi(kpi.valor, kpi.anterior),
          sentido,
          comparacao,
          pontos,
        );
  const serie = kpi.tendencia ?? [];
  const Caixa = variante === "card" ? Card : "div";
  return (
    <Caixa className="flex h-full min-w-0 flex-col gap-1 p-4 sm:p-5" role="group" aria-labelledby={`${id}-r`}>
      <p id={`${id}-r`} className="text-sm text-text-muted">
        {rotulo}
      </p>
      <div className="flex items-end justify-between gap-3">
        <p
          className={cn(
            "tnum min-w-0 leading-heading font-semibold tracking-tight [overflow-wrap:anywhere]",
            formato === "moedaCompleta" ? "text-lg sm:text-2xl" : "text-xl sm:text-2xl",
            kpi.tom === "alerta" ? "text-danger" : "text-text",
          )}
        >
          {formatar(kpi.valor)}
        </p>
        {leitura !== null && !vazio && tendencia && serie.length > 1 ? (
          <div className="mb-1 shrink-0 sm:w-20">
            <Sparkline valores={serie} className="hidden h-6 sm:block" />
            <span className="sr-only">{resumoTendencia(serie, formatar)}</span>
          </div>
        ) : null}
      </div>
      {leitura === null ? null : vazio ? (
        <p className="mt-auto pt-1 text-xs text-text-muted">Sem dados no período</p>
      ) : (
        <p className="mt-auto flex min-w-0 flex-wrap items-center gap-x-1 pt-1 text-xs text-text-muted">
          <span className={cn("inline-flex shrink-0 items-center gap-0.5 font-medium", COR_TOM[leitura.tom])}>
            <Icon icon={leitura.icone} size={16} />
            <span aria-hidden="true" className="tnum">
              {leitura.quanto}
            </span>
          </span>
          <span aria-hidden="true">{leitura.contexto}</span>
          <span className="sr-only">{leitura.leitor}</span>
        </p>
      )}
    </Caixa>
  );
}

/** Card de KPI (RF-10, RF-42, RF-44): valor; variação e tendência só quando há `anterior`. */
export function StatCard({
  rotulo,
  estado,
  onTentarNovamente,
  formato = "numero",
  sentido = "maiorMelhor",
  comparacao = "vs. mês anterior",
  tendencia = true,
  variante = "card",
  className,
}: StatCardProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <EstadoRecurso
        estado={estado}
        carregando={<StatCardSkeleton variante={variante} className="h-full" />}
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
            variante={variante}
          />
        )}
      </EstadoRecurso>
    </div>
  );
}
