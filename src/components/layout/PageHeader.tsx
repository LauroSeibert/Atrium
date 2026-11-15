import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { MobileActionBar } from "./MobileActionBar";

export type PageHeaderProps = {
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

/** Cabeçalho de página (RF-61): título (h1), descrição e ações. */
export function PageHeader({ titulo, descricao, acoes, acaoPrimaria, children, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-4 pb-6 md:pb-8", className)}>
      <div className="flex flex-col gap-3 md:min-h-10 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-balance text-text md:text-2xl">{titulo}</h1>
          {descricao ? <p className="max-w-prose text-sm text-text-muted">{descricao}</p> : null}
        </div>
        {acoes || acaoPrimaria ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
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
