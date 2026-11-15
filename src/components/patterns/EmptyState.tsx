import type { ReactNode } from "react";
import { SvgVazio, type VazioVariante } from "@/assets/svg/vazios/SvgVazio";
import { cn } from "@/lib/cn";
import { Empty, type EmptyProps } from "../ui/Empty";

export type EmptyStateProps = Omit<EmptyProps, "icon" | "title"> & {
  /** Ilustração SVG (decorativa: o título já descreve o estado). */
  ilustracao?: VazioVariante;
  titulo: ReactNode;
  descricao?: ReactNode;
  /** Ação clara para sair do vazio (ex.: `<Button>Novo imóvel</Button>`, "Limpar filtros"). */
  acao?: ReactNode;
  /** `compacto` para caber em cards e linhas de tabela. */
  tamanho?: "padrao" | "compacto";
};

/** Estado vazio com ilustração e ação (Fase 6, item 12; RNF-09). */
export function EmptyState({
  ilustracao = "semResultados",
  titulo,
  descricao,
  acao,
  tamanho = "padrao",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <SvgVazio
        variant={ilustracao}
        decorativa
        className={cn("h-auto", tamanho === "compacto" ? "w-32" : "w-48 max-w-full sm:w-60")}
      />
      <Empty
        title={titulo}
        description={descricao}
        action={acao}
        className={tamanho === "compacto" ? "py-4" : "pt-4 pb-12"}
        {...props}
      />
    </div>
  );
}
