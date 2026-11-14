import type { SVGProps } from "react";

/**
 * Marca Atrium: o átrio da domus romana visto de cima.
 * - Ladrilho = a casa (domus).
 * - Quadrado externo + diagonais = o telhado compluviado, com as quatro águas
 *   caindo para o centro.
 * - Quadrado central = o impluvium (o espelho d'água que recebe a chuva),
 *   com o reflexo do céu aberto (compluvium).
 *
 * Cores vêm só dos tokens: no claro, ladrilho Hunter Green e traço Polar Snow;
 * no escuro, ladrilho Soft Beige e traço Hunter Green (via --primary/--on-primary).
 */
export function AtriumMark({ title = "Atrium", ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label={title} {...props}>
      <rect width="32" height="32" rx="8" fill="var(--primary)" />
      <g fill="none" stroke="var(--on-primary)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        <rect x="6" y="6" width="20" height="20" rx="1.5" />
        <path d="M6.6 6.6 12 12M25.4 6.6 20 12M6.6 25.4 12 20M25.4 25.4 20 20" />
      </g>
      <rect x="12" y="12" width="8" height="8" rx="1" fill="var(--on-primary)" />
      <rect x="14.25" y="14.25" width="3.5" height="3.5" rx="0.5" fill="none" stroke="var(--primary)" strokeWidth="1" />
    </svg>
  );
}

export function AtriumLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 128 32" role="img" aria-label="Atrium" className={className} {...props}>
      <AtriumMark x="0" y="0" width="32" height="32" aria-hidden="true" title="" role="presentation" />
      <text
        x="42"
        y="23"
        fill="var(--text)"
        fontFamily="var(--font-sans)"
        fontSize="21"
        fontWeight="600"
        letterSpacing="-0.4"
      >
        Atrium
      </text>
    </svg>
  );
}
