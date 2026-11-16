"use client";
import { useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Peças compartilhadas pelos gráficos (RF-11, RF-12, RNF-17): movimento reduzido, tooltip e
 * legenda no tema, rótulos de mês e propriedades de eixo/grade só com tokens.
 */

const CONSULTA = "(prefers-reduced-motion: reduce)";

function assinar(aviso: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener?.("change", aviso);
  return () => mq.removeEventListener?.("change", aviso);
}

const lerPreferencia = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(CONSULTA).matches;

/** `true` quando o usuário pediu menos movimento: desligue `isAnimationActive` dos gráficos. */
export function useMovimentoReduzido(): boolean {
  return useSyncExternalStore(assinar, lerPreferencia, () => false);
}

/** Cores de série: `chart-1` … `chart-5`, em ciclo. */
export const corSerie = (indice: number) => `var(--chart-${(indice % 5) + 1})`;
export const classeCorSerie = (indice: number) =>
  (["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"] as const)[indice % 5]!;

/**
 * Raio da ponta das barras (Recharts só aceita número): lido do token `--corner-sm` (em px);
 * sem DOM (servidor) devolve 0 e o gráfico, que só desenha no cliente, usa o valor do token.
 */
export function raioBarra(): number {
  if (typeof document === "undefined") return 0;
  const px = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--corner-sm"));
  return Number.isFinite(px) ? px / 2 : 0;
}

/** Tick do eixo X que destaca o período atual (último) em tinta; os demais em text-muted. */
export function TickPeriodo({
  x,
  y,
  payload,
  atual,
  formatar,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  atual: string;
  formatar: (v: string) => string;
}) {
  if (x === undefined || y === undefined || !payload) return null;
  const ehAtual = payload.value === atual;
  return (
    <text
      x={x}
      y={y + 14}
      textAnchor="middle"
      fontSize={TICK.fontSize}
      fontFamily={TICK.fontFamily}
      fill={ehAtual ? "var(--text)" : TICK.fill}
    >
      {formatar(payload.value)}
    </text>
  );
}

/** Eixos em Geist Mono 11 px (text-muted); linha de base em tinta; grade tracejada no fio claro. */
export const TICK = { fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-family-mono)" } as const;
export const EIXO = { stroke: "var(--text)" } as const;
export const GRADE = { stroke: "var(--border)", strokeDasharray: "3 4" } as const;
export const CURSOR = { fill: "var(--surface-muted)" } as const;
/** Largura máxima das barras (DESIGN_SYSTEM §5: 30–40 px). */
export const BARRA_MAX = 36;

const MESES = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });
const MES_LONGO = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

/** "2026-11" → "nov/26" (curto) ou "novembro de 2026" (longo). */
export function rotuloMes(mes: string, longo = false): string {
  const [a, m] = mes.split("-").map(Number);
  if (!a || !m) return mes;
  const d = new Date(Date.UTC(a, m - 1, 15));
  if (longo) return MES_LONGO.format(d);
  return `${MESES.format(d).replace(".", "")}/${String(a).slice(-2)}`;
}

export type LinhaTooltip = { cor: string; rotulo: string; valor: string };

/** Tooltip no tema: fundo `surface-raised`, texto do tema, legenda em texto (cor nunca é o único sinal). */
export function TooltipBox({
  titulo,
  linhas,
  rodape,
}: {
  titulo?: ReactNode;
  linhas: LinhaTooltip[];
  rodape?: ReactNode;
}) {
  return (
    <div className="max-w-64 min-w-44 rounded-md border border-border bg-surface-raised px-3 py-2.5 text-sm text-text shadow-2">
      {titulo ? (
        <p className="mb-2 text-xs font-medium break-words text-text-muted first-letter:uppercase">{titulo}</p>
      ) : null}
      <ul className="flex flex-col gap-1">
        {linhas.map((l) => (
          <li key={l.rotulo} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: l.cor }} />
              {l.rotulo}
            </span>
            <span className="num">{l.valor}</span>
          </li>
        ))}
      </ul>
      {rodape ? <p className="num mt-2 border-t border-border pt-2">{rodape}</p> : null}
    </div>
  );
}

export type ItemLegenda = { rotulo: string; cor: string; detalhe?: ReactNode };

/** Legenda em HTML (rótulo + detalhe opcional), alinhada ao tema. */
export function Legenda({ itens, className }: { itens: ItemLegenda[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1 text-caption text-text-2", className)}>
      {itens.map((i) => (
        <li key={i.rotulo} className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="size-2.5 shrink-0 rounded-xs" style={{ background: i.cor }} />
          <span className="min-w-0 break-words">{i.rotulo}</span>
          {i.detalhe ? <span className="num text-text">{i.detalhe}</span> : null}
        </li>
      ))}
    </ul>
  );
}
