"use client";

import { cn } from "@/lib/cn";
import { formatNumero } from "@/lib/format";

export type AbaDeStatus<Id extends string> = {
  id: Id;
  rotulo: string;
  /** `undefined` enquanto carrega. */
  contagem?: number;
  /** Contagem de risco (ex.: inadimplentes) em `--danger` quando maior que zero. */
  risco?: boolean;
};

export type AbasDeStatusProps<Id extends string> = {
  /** Nome do grupo para leitor de tela (ex.: "Status do contrato"). */
  "aria-label": string;
  abas: readonly AbaDeStatus<Id>[];
  /** Aba ativa; `null` quando o filtro atual não corresponde a nenhuma aba. */
  ativa: Id | null;
  onChange: (id: Id) => void;
  className?: string;
};

/**
 * Abas de status = indicadores (DESIGN.md, padrão de listagem densa): contagem em serifa de 30 px e rótulo
 * em Geist 14 px na mesma linha de base; a ativa tem sublinhado de 2 px em tinta. Clicar filtra a lista.
 * Só exibe: as contagens e o filtro vêm de quem chama.
 */
export function AbasDeStatus<Id extends string>({
  "aria-label": ariaLabel,
  abas,
  ativa,
  onChange,
  className,
}: AbasDeStatusProps<Id>) {
  return (
    <div className={cn("-mx-1 overflow-x-auto border-b border-border px-1", className)}>
      <div role="group" aria-label={ariaLabel} className="flex w-max gap-8">
        {abas.map((a) => {
          const on = a.id === ativa;
          const alerta = a.risco && (a.contagem ?? 0) > 0;
          return (
            <button
              key={a.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(a.id)}
              className={cn(
                "-mb-px inline-flex h-15 cursor-pointer items-baseline gap-2.5 border-b-2 px-1 pt-3.5 text-sm whitespace-nowrap",
                "transition-colors duration-(--dur-fast) ease-standard",
                "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                on ? "border-text text-text" : "border-transparent text-text-muted hover:text-text",
              )}
            >
              <span
                className={cn(
                  "display min-w-4 text-2xl leading-none",
                  alerta ? "text-danger" : "text-text",
                  a.contagem === undefined && "text-text-muted",
                )}
              >
                {a.contagem === undefined ? "–" : formatNumero(a.contagem)}
              </span>{" "}
              {a.rotulo}
            </button>
          );
        })}
      </div>
    </div>
  );
}
