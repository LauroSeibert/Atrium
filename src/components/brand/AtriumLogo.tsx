import type { ComponentProps, SVGProps } from "react";
import { cn } from "@/lib/cn";

/**
 * Monograma Atrium: o átrio da casa romana visto de cima. Quatro águas do telhado descem para a
 * abertura central (compluvium) e, no meio do pátio, o espelho d'água (impluvium) em latão. As águas
 * horizontais claras e as laterais em meio-tom dão o volume. Tudo em formas (nada de texto), num
 * quadrado de cantos suaves em tinta com fio de latão. É a marca da sidebar recolhida e o favicon.
 * Cores só por tokens: --sidebar, --accent, --on-ink-strong e --on-ink-muted.
 */
export function AtriumMark({ title = "Atrium", ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label={title || undefined} {...props}>
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="var(--sidebar)" stroke="var(--accent)" />
      <path
        d="M7 7h18l-6 6h-6z M7 25h18l-6-6h-6z"
        fill="var(--on-ink-strong)"
        stroke="var(--sidebar)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path
        d="M7 7l6 6v6l-6 6z M25 7l-6 6v6l6 6z"
        fill="var(--on-ink-muted)"
        stroke="var(--sidebar)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <rect x="14.5" y="14.5" width="3" height="3" fill="var(--accent)" />
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
