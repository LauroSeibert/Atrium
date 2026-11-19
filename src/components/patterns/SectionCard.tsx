import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "../ui/Card";
import { Heading } from "../ui/Typography";

export type SectionCardProps = {
  titulo: string;
  /** 2 nas telas; 3 dentro de drawer/diálogo (abaixo do título dele). */
  headingLevel?: 2 | 3;
  /** Ações à direita do título (botão `ghost`/`secondary`, link "Ver todos"). */
  acoes?: ReactNode;
  /**
   * `painel` (padrão): agrupa um objeto (gráfico, formulário, resumo) num painel com borda.
   * `aberta`: lista ou texto corrido; só título e divisória, sem caixa (nem tudo é card).
   */
  variante?: "painel" | "aberta";
  children: ReactNode;
  className?: string;
};

/**
 * Seção de tela: título + conteúdo. Único componente de seção das telas (nada de cópias com
 * espaçamentos diferentes); `variante` escolhe entre painel com borda e seção aberta.
 */
export function SectionCard({
  titulo,
  headingLevel = 2,
  acoes,
  variante = "painel",
  children,
  className,
}: SectionCardProps) {
  const id = useId();
  const cabecalho = (
    <div
      className={cn(
        "flex min-h-8 min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-2",
        variante === "aberta" && "border-b border-border pb-4",
      )}
    >
      <Heading id={id} level={headingLevel} size={headingLevel === 2 ? "2xl" : "xl"} className="min-w-0 break-words">
        {titulo}
      </Heading>
      {acoes ? <div className="flex shrink-0 items-center gap-2">{acoes}</div> : null}
    </div>
  );
  if (variante === "aberta")
    return (
      <section aria-labelledby={id} className={cn("flex min-w-0 flex-col gap-5", className)}>
        {cabecalho}
        {children}
      </section>
    );
  return (
    <Card asChild className={className}>
      <section aria-labelledby={id} className="flex min-w-0 flex-col gap-5 p-5 sm:px-8 sm:pt-7.5 sm:pb-7">
        {cabecalho}
        {children}
      </section>
    </Card>
  );
}
