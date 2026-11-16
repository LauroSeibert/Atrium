import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { MobileActionBar } from "./MobileActionBar";

export type PageHeaderProps = {
  /** Rótulo em caixa alta acima do título: "<Seção> · <contexto>" (ex.: "Financeiro · visão geral"). */
  eyebrow?: ReactNode;
  titulo: ReactNode;
  descricao?: ReactNode;
  /** Ações secundárias (botões `secondary`/`ghost`), à direita do título. */
  acoes?: ReactNode;
  /**
   * A ação primária da tela (um `<Button>` primário, Von Restorff). No desktop fica no cabeçalho;
   * abaixo de 768 px vai para a barra inferior (RF-63). É montada duas vezes (uma oculta por CSS), então
   * precisa ser **sem estado próprio**: um link ou um botão com callback; diálogos ficam fora, controlados por quem chama.
   */
  acaoPrimaria?: ReactNode;
  /** Conteúdo abaixo do título (abas, filtros, indicadores). */
  children?: ReactNode;
  className?: string;
};

/**
 * Cabeçalho editorial de página (RF-61): eyebrow, título em Instrument Serif (h1), uma linha de resumo
 * opcional e ações à direita (no máximo um botão primário).
 */
export function PageHeader({
  eyebrow,
  titulo,
  descricao,
  acoes,
  acaoPrimaria,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-6 pb-9 md:pb-11", className)}>
      <div className="flex flex-col gap-5 md:flex-row md:flex-wrap md:items-end md:justify-between">
        <div className="flex min-w-0 flex-col">
          {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
          <h1 className="display text-5xl text-balance text-text">{titulo}</h1>
          {descricao ? <p className="mt-4 max-w-140 text-base text-text-2">{descricao}</p> : null}
        </div>
        {acoes || acaoPrimaria ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            {acoes}
            {acaoPrimaria ? <div className="hidden md:contents">{acaoPrimaria}</div> : null}
          </div>
        ) : null}
      </div>
      {children}
      {acaoPrimaria ? <MobileActionBar>{acaoPrimaria}</MobileActionBar> : null}
    </header>
  );
}
