import type { ReactNode } from "react";

/**
 * Transição curta de entrada ao trocar de módulo (usada no `template.tsx` do grupo `(dashboard)`, que remonta só quando o primeiro segmento muda):
 * fade + 8 px para cima, só `opacity`/`transform`, `--dur-slow`. Com `prefers-reduced-motion`, 1 ms.
 */
export function TransicaoDeRota({ children }: { children: ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
