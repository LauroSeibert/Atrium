import type { ComponentProps, SVGProps } from "react";
import { cn } from "@/lib/cn";

/**
 * Monograma Atrium: um "A" de traço serifado (haste fina à esquerda, grossa à direita, pés de serifa)
 * num quadrado de cantos suaves, em tinta, com fio de latão. Desenhado em traço (não texto) para não
 * depender da webfont nem virar texto visível para leitores de tela. É a marca da sidebar recolhida.
 * Cores só por tokens: --sidebar, --accent e --on-ink-strong.
 */
export function AtriumMark({ title = "Atrium", ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label={title || undefined} {...props}>
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="var(--sidebar)" stroke="var(--accent)" />
      <g fill="none" stroke="var(--on-ink-strong)" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8 10.2 23.5" strokeWidth="1.1" />
        <path d="M16 8 21.8 23.5" strokeWidth="2" />
        <path d="M12.3 18.4h7.6" strokeWidth="1.1" />
        <path d="M8.6 23.6h3.4M19.9 23.6h3.6" strokeWidth="1.1" />
      </g>
    </svg>
  );
}

/** Marca completa: monograma + "Atrium" em Instrument Serif (texto real, cor --text). */
export function AtriumLogo({ className, ...props }: ComponentProps<"span">) {
  return (
    <span className={cn("inline-flex items-center gap-3 text-text", className)} {...props}>
      <AtriumMark className="size-8 shrink-0" aria-hidden="true" title="" />
      <span className="display text-2xl leading-display">Atrium</span>
    </span>
  );
}
