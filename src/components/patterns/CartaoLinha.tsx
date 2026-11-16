import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";

export type CartaoLinhaProps = {
  /** Linha principal (`h3`: a lista que o contém traz o `h2`). */
  titulo: string;
  /** Nome acessível do grupo (padrão: o título). */
  rotuloAcessivel?: string;
  /** Linha secundária. */
  subtitulo?: string;
  /** Selo à direita do título (ex.: `Badge`). */
  selo?: ReactNode;
  /** Corpo do cartão (campos, contatos…). */
  children?: ReactNode;
  /** Ações do rodapé. */
  acao?: ReactNode;
  className?: string;
};

/** Cartão base de uma linha de lista para telas estreitas (título, selo, corpo e ação). */
export function CartaoLinha({ titulo, rotuloAcessivel, subtitulo, selo, children, acao, className }: CartaoLinhaProps) {
  return (
    <Card
      variant="base"
      role="group"
      aria-label={rotuloAcessivel ?? titulo}
      className={cn("flex flex-col gap-3 p-4", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-medium break-words text-text">{titulo}</h3>
          {subtitulo ? <p className="text-sm break-words text-text-muted">{subtitulo}</p> : null}
        </div>
        {selo}
      </div>
      {children}
      {acao ? <div className="flex justify-end">{acao}</div> : null}
    </Card>
  );
}

/** Esqueleto com a forma final do `CartaoLinha`. */
export function CartaoLinhaSkeleton({ className }: { className?: string }) {
  return (
    <Card
      variant="base"
      role="group"
      aria-busy="true"
      aria-label="Carregando"
      className={cn("flex flex-col gap-3 p-4", className)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex w-1/2 flex-col gap-2">
          <Skeleton className="h-5" />
          <Skeleton className="w-3/4" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
      </div>
    </Card>
  );
}
