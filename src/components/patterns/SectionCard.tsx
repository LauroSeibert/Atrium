import { useId, type ReactNode } from "react";
import { Card } from "../ui/Card";
import { Heading } from "../ui/Typography";

export type SectionCardProps = {
  titulo: string;
  /** 2 nas telas; 3 dentro de drawer/diálogo (abaixo do título dele). */
  headingLevel?: 2 | 3;
  /** Ações à direita do título (botão `ghost`/`secondary`, link "Ver todos"). */
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Seção de tela em card (Fase 8): título + conteúdo, com o mesmo respiro dos cards de gráfico.
 * Único card de seção das telas (Gate 8: nada de cópias com espaçamentos diferentes).
 */
export function SectionCard({ titulo, headingLevel = 2, acoes, children, className }: SectionCardProps) {
  const id = useId();
  return (
    <Card asChild className={className}>
      <section aria-labelledby={id} className="flex min-w-0 flex-col gap-4 p-4 sm:p-6">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <Heading id={id} level={headingLevel} size="lg" className="min-w-0 break-words">
            {titulo}
          </Heading>
          {acoes ? <div className="flex shrink-0 items-center gap-2">{acoes}</div> : null}
        </div>
        {children}
      </section>
    </Card>
  );
}
