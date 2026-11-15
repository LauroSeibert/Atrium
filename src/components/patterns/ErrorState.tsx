import { RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { SvgVazio } from "@/assets/svg/vazios/SvgVazio";
import { cn } from "@/lib/cn";
import { Button } from "../ui/Button";
import { Empty } from "../ui/Empty";

export type ErrorStateProps = {
  titulo?: ReactNode;
  /** O que houve e o que fazer (WCAG 3.3.3). Padrão: mensagem genérica de falha de carregamento. */
  descricao?: ReactNode;
  /** Mostra "Tentar de novo" (error → loading, ESTADOS §3.6). */
  onTentarNovamente?: () => void;
  /** Ação extra (ex.: voltar para a lista). */
  acao?: ReactNode;
  tamanho?: "padrao" | "compacto";
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  className?: string;
};

/**
 * Estado de erro com ilustração e ação clara (Fase 6, item 12; RNF-09).
 * `role="alert"` anuncia a falha sem mover o foco (WCAG 4.1.3).
 */
export function ErrorState({
  titulo = "Não foi possível carregar",
  descricao = "Verifique a conexão e tente de novo. Se o problema continuar, recarregue a página.",
  onTentarNovamente,
  acao,
  tamanho = "padrao",
  headingLevel,
  className,
}: ErrorStateProps) {
  const acoes =
    onTentarNovamente || acao ? (
      <div className="flex flex-wrap items-center justify-center gap-2">
        {onTentarNovamente ? (
          <Button variant="secondary" leadingIcon={RotateCw} onClick={onTentarNovamente}>
            Tentar de novo
          </Button>
        ) : null}
        {acao}
      </div>
    ) : undefined;
  return (
    <div role="alert" className={cn("flex flex-col items-center", className)}>
      <SvgVazio
        variant="erro"
        decorativa
        className={cn("h-auto", tamanho === "compacto" ? "w-32" : "w-48 max-w-full sm:w-60")}
      />
      <Empty
        title={titulo}
        description={descricao}
        action={acoes}
        headingLevel={headingLevel}
        className={tamanho === "compacto" ? "py-4" : "pt-4 pb-12"}
      />
    </div>
  );
}
