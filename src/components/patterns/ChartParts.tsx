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

export const TICK = { fill: "var(--text-muted)", fontSize: 12 } as const;
export const EIXO = { stroke: "var(--border)" } as const;
export const GRADE = { stroke: "var(--border)" } as const;
export const CURSOR = { fill: "var(--bg-subtle)" } as const;

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
            <span className="tnum font-medium">{l.valor}</span>
          </li>
        ))}
      </ul>
      {rodape ? <p className="tnum mt-2 border-t border-border pt-2 font-medium">{rodape}</p> : null}
    </div>
  );
}

export type ItemLegenda = { rotulo: string; cor: string; detalhe?: ReactNode };

/** Legenda em HTML (rótulo + detalhe opcional), alinhada ao tema. */
export function Legenda({ itens, className }: { itens: ItemLegenda[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted", className)}>
      {itens.map((i) => (
        <li key={i.rotulo} className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: i.cor }} />
          <span className="min-w-0 break-words">{i.rotulo}</span>
          {i.detalhe ? <span className="tnum text-text">{i.detalhe}</span> : null}
        </li>
      ))}
    </ul>
  );
}
